import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/interfaces/auth-user';
import { muestraMinima, tipoProductor } from '../compartido/norma';
import { Evaluation } from '../evaluations/entities/evaluation.entity';
import { User } from '../users/entities/user.entity';
import { CreateFarmDto, FarmSpeciesDto, ListFarmsQuery, UpdateFarmDto } from './dto/farm.dto';
import { limitToUserFarms } from './farm-access';
import { FarmSpecies } from './entities/farm-species.entity';
import { Farm } from './entities/farm.entity';
import { Species } from './entities/species.entity';

const toNumber = (v: string | null) => (v === null ? null : Number(v));

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm) private readonly farms: Repository<Farm>,
    @InjectRepository(Species) private readonly species: Repository<Species>,
    @InjectRepository(Evaluation) private readonly evaluations: Repository<Evaluation>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly audit: AuditService,
  ) {}

  listSpecies() {
    return this.species.find({ where: { active: true }, order: { name: 'ASC' } });
  }

  async findAll(query: ListFarmsQuery, user: AuthUser) {
    const qb = this.farms.createQueryBuilder('f').leftJoinAndSelect('f.species', 'fs').leftJoinAndSelect('fs.species', 's');
    limitToUserFarms(qb, 'f', user);
    if (query.search) {
      const term = `%${query.search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      qb.andWhere(
        new Brackets((w) =>
          w.where('f.name LIKE :term', { term }).orWhere('f.owner_name LIKE :term', { term }).orWhere('f.municipality LIKE :term', { term }),
        ),
      );
    }
    const rows = await qb.orderBy('f.name', 'ASC').getMany();
    const last = await this.lastEvaluations(rows.map((f) => f.id));
    return rows.map((f) => this.toView(f, last.get(f.id) ?? null));
  }

  async findOne(id: string, user: AuthUser) {
    const farm = await this.getVisible(id, user);
    const last = await this.lastEvaluations([farm.id]);
    return this.toView(farm, last.get(farm.id) ?? null);
  }

  /** Predio que el usuario puede ver; 404 si no existe o no le corresponde. */
  async getVisible(id: string, user: AuthUser): Promise<Farm> {
    const qb = this.farms
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.species', 'fs')
      .leftJoinAndSelect('fs.species', 's')
      .where('f.id = :id', { id });
    const farm = await limitToUserFarms(qb, 'f', user).getOne();
    if (!farm) throw new NotFoundException('El predio no existe.');
    return farm;
  }

  async create(dto: CreateFarmDto, actor: AuthUser) {
    const species = await this.validSpecies(dto.species);
    const farm = this.farms.create({
      ...this.columns(dto),
      createdBy: actor.id,
      species: species.map((s) => this.farmSpecies(s)),
    });
    farm.ownerUserId = await this.ownerUserId(farm.ownerEmail);
    const saved = await this.farms.save(farm);
    await this.audit.record({ actorId: actor.id, action: 'farm.created', entity: 'farm', entityId: saved.id, detail: { name: saved.name } });
    return this.findOne(saved.id, actor);
  }

  async update(id: string, dto: UpdateFarmDto, actor: AuthUser) {
    const farm = await this.getVisible(id, actor);
    Object.assign(farm, this.columns(dto));
    if (dto.ownerEmail !== undefined) farm.ownerUserId = await this.ownerUserId(farm.ownerEmail);
    if (dto.species) {
      const species = await this.validSpecies(dto.species);
      // Se conservan los registros existentes para no romper la relación con el historial.
      farm.species = species.map((s) => {
        const existing = farm.species.find((x) => x.speciesId === s.speciesId);
        return Object.assign(existing ?? this.farmSpecies(s), { calves: s.calves, young: s.young, adults: s.adults });
      });
    }
    await this.farms.save(farm);
    await this.audit.record({ actorId: actor.id, action: 'farm.updated', entity: 'farm', entityId: farm.id, detail: { fields: Object.keys(dto) } });
    return this.findOne(farm.id, actor);
  }

  /** Columnas simples del predio presentes en el DTO. */
  private columns(dto: UpdateFarmDto): Partial<Farm> {
    const keys = ['name', 'ownerName', 'ownerDocument', 'ownerPhone', 'ownerEmail', 'department', 'municipality', 'vereda', 'address', 'productionSystem', 'notes'] as const;
    const out: Partial<Farm> = {};
    for (const k of keys) if (dto[k] !== undefined) (out as Record<string, unknown>)[k] = dto[k];
    for (const k of ['latitude', 'longitude', 'areaHectares'] as const) {
      if (dto[k] !== undefined) out[k] = dto[k] === null ? null : String(dto[k]);
    }
    return out;
  }

  private farmSpecies(s: FarmSpeciesDto): FarmSpecies {
    return Object.assign(new FarmSpecies(), { speciesId: s.speciesId, calves: s.calves, young: s.young, adults: s.adults });
  }

  private async validSpecies(list: FarmSpeciesDto[]) {
    const ids = list.map((s) => s.speciesId);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Cada especie se registra una sola vez por predio.');
    if (list.some((s) => s.calves + s.young + s.adults === 0)) {
      throw new BadRequestException('Cada especie debe tener al menos un animal en el inventario.');
    }
    const found = await this.species.countBy({ id: In(ids), active: true });
    if (found !== ids.length) throw new BadRequestException('Una de las especies no existe o está inactiva.');
    return list;
  }

  private async ownerUserId(email: string | null | undefined): Promise<string | null> {
    if (!email) return null;
    return (await this.users.findOne({ where: { email }, select: { id: true } }))?.id ?? null;
  }

  private async lastEvaluations(farmIds: string[]) {
    const map = new Map<string, Evaluation>();
    if (!farmIds.length) return map;
    const rows = await this.evaluations.find({
      where: { farmId: In(farmIds), status: 'FINALIZADA' },
      order: { finishedAt: 'DESC' },
    });
    for (const e of rows) if (!map.has(e.farmId)) map.set(e.farmId, e);
    return map;
  }

  private toView(f: Farm, last: Evaluation | null) {
    const species = f.species.map((s) => {
      const total = s.calves + s.young + s.adults;
      return {
        speciesId: s.speciesId,
        code: s.species.code,
        name: s.species.name,
        calves: s.calves,
        young: s.young,
        adults: s.adults,
        total,
        producerType: tipoProductor(total),
        sampleSize: muestraMinima(total),
      };
    });
    return {
      id: f.id,
      name: f.name,
      owner: { name: f.ownerName, document: f.ownerDocument, phone: f.ownerPhone, email: f.ownerEmail, hasAccount: !!f.ownerUserId },
      department: f.department,
      municipality: f.municipality,
      vereda: f.vereda,
      address: f.address,
      latitude: toNumber(f.latitude),
      longitude: toNumber(f.longitude),
      areaHectares: toNumber(f.areaHectares),
      productionSystem: f.productionSystem,
      notes: f.notes,
      species,
      totalAnimals: species.reduce((a, s) => a + s.total, 0),
      lastEvaluation: last
        ? { id: last.id, speciesName: last.species.name, finishedAt: last.finishedAt, score: toNumber(last.score), level: last.level }
        : null,
      updatedAt: f.updatedAt,
    };
  }
}
