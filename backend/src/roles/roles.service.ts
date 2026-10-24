import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/interfaces/auth-user';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { ALL_PERMISSIONS, BASE_ROLES } from './constants/permissions';
import { Role } from './entities/role.entity';

export interface RoleView {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  active: boolean;
  userCount: number;
  updatedAt: Date;
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly audit: AuditService,
  ) {}

  async findAll(): Promise<RoleView[]> {
    const rows = await this.roles
      .createQueryBuilder('r')
      .loadRelationCountAndMap('r.userCount', 'r.users')
      .orderBy('r.isSystem', 'DESC')
      .addOrderBy('r.name', 'ASC')
      .getMany();
    return rows.map((r) => this.toView(r as Role & { userCount: number }));
  }

  async findOne(id: string): Promise<RoleView> {
    const role = await this.roles
      .createQueryBuilder('r')
      .loadRelationCountAndMap('r.userCount', 'r.users')
      .where('r.id = :id', { id })
      .getOne();
    if (!role) throw new NotFoundException('El rol no existe.');
    return this.toView(role as Role & { userCount: number });
  }

  async create(dto: CreateRoleDto, actor: AuthUser): Promise<RoleView> {
    if (await this.roles.exist({ where: { code: dto.code } })) {
      throw new ConflictException(`Ya existe un rol con el código ${dto.code}.`);
    }
    const role = await this.roles.save(
      this.roles.create({
        code: dto.code,
        name: dto.name,
        description: dto.description || null,
        permissions: dto.permissions,
      }),
    );
    await this.audit.record({ actorId: actor.id, action: 'role.created', entity: 'role', entityId: role.id, detail: { ...dto } });
    return this.findOne(role.id);
  }

  async update(id: string, dto: UpdateRoleDto, actor: AuthUser): Promise<RoleView> {
    const role = await this.roles.findOne({ where: { id } });
    if (!role) throw new NotFoundException('El rol no existe.');

    if (dto.permissions && role.code === BASE_ROLES.ADMIN) {
      const missing = ALL_PERMISSIONS.filter((p) => !dto.permissions!.includes(p));
      if (missing.length) {
        throw new BadRequestException('El rol Administrador debe conservar todos los permisos.');
      }
    }

    const before = { name: role.name, description: role.description, permissions: role.permissions };
    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description || null;
    if (dto.permissions !== undefined) role.permissions = dto.permissions;
    await this.roles.save(role);
    await this.audit.record({
      actorId: actor.id,
      action: 'role.updated',
      entity: 'role',
      entityId: id,
      detail: { before, after: { name: role.name, description: role.description, permissions: role.permissions } },
    });
    return this.findOne(id);
  }

  async setStatus(id: string, active: boolean, actor: AuthUser): Promise<RoleView> {
    const role = await this.roles.findOne({ where: { id } });
    if (!role) throw new NotFoundException('El rol no existe.');
    if (role.isSystem && !active) {
      throw new BadRequestException('Los roles base del sistema no se pueden inactivar.');
    }
    if (!active) {
      const assigned = await this.users.count({ where: { roleId: id, active: true } });
      if (assigned > 0) {
        throw new BadRequestException(
          `No se puede inactivar: ${assigned} usuario(s) activos tienen este rol. Cámbieles el rol primero.`,
        );
      }
    }
    role.active = active;
    await this.roles.save(role);
    await this.audit.record({
      actorId: actor.id,
      action: active ? 'role.activated' : 'role.deactivated',
      entity: 'role',
      entityId: id,
    });
    return this.findOne(id);
  }

  private toView(role: Role & { userCount: number }): RoleView {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isSystem: role.isSystem,
      active: role.active,
      userCount: role.userCount ?? 0,
      updatedAt: role.updatedAt,
    };
  }
}
