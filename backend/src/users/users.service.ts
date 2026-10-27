import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Brackets, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { BCRYPT_ROUNDS } from '../auth/auth.service';
import { PasswordResetService } from '../auth/password-reset.service';
import { AuthUser } from '../common/interfaces/auth-user';
import { Page } from '../common/utils/pagination';
import { BASE_ROLES } from '../roles/constants/permissions';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto, ListUsersQuery, UpdateUserDto } from './dto/user.dto';
import { User } from './entities/user.entity';

export interface UserView {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string | null;
  phone: string | null;
  role: { id: string; code: string; name: string };
  active: boolean;
  locked: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly audit: AuditService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  async findAll(query: ListUsersQuery): Promise<Page<UserView>> {
    const qb = this.users.createQueryBuilder('u').leftJoinAndSelect('u.role', 'role');
    if (query.search) {
      const term = `%${query.search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      qb.andWhere(
        new Brackets((w) =>
          w
            // La intercalación utf8mb4_unicode_ci ya ignora mayúsculas y tildes.
            .where('u.first_name LIKE :term', { term })
            .orWhere('u.last_name LIKE :term', { term })
            .orWhere("CONCAT(u.first_name, ' ', u.last_name) LIKE :term", { term })
            .orWhere('u.email LIKE :term', { term })
            .orWhere('u.document_number LIKE :term', { term }),
        ),
      );
    }
    if (query.roleId) qb.andWhere('u.role_id = :roleId', { roleId: query.roleId });
    if (query.active) qb.andWhere('u.active = :active', { active: query.active === 'true' });

    const [rows, total] = await qb
      .orderBy('u.active', 'DESC')
      .addOrderBy('u.firstName', 'ASC')
      .addOrderBy('u.lastName', 'ASC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
    return { items: rows.map(toView), total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string): Promise<UserView> {
    return toView(await this.getOrFail(id));
  }

  /**
   * Crea el usuario sin contraseña utilizable y le envía un enlace para que la
   * defina. El administrador nunca conoce ni transmite la clave.
   */
  async create(dto: CreateUserDto, actor: AuthUser): Promise<UserView> {
    await this.assertEmailFree(dto.email);
    const role = await this.getActiveRole(dto.roleId);
    const unusable = await bcrypt.hash(randomBytes(32).toString('hex'), BCRYPT_ROUNDS);
    const user = await this.users.save(
      this.users.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        documentNumber: dto.documentNumber ?? null,
        phone: dto.phone ?? null,
        roleId: role.id,
        passwordHash: unusable,
      }),
    );
    user.role = role;
    await this.passwordReset.sendInvitation(user, role.name);
    await this.audit.record({
      actorId: actor.id,
      action: 'user.created',
      entity: 'user',
      entityId: user.id,
      detail: { email: user.email, role: role.code },
    });
    return this.findOne(user.id);
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser): Promise<UserView> {
    const user = await this.getOrFail(id);
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (dto.email && dto.email !== user.email) {
      await this.assertEmailFree(dto.email);
      changes.email = { from: user.email, to: dto.email };
      user.email = dto.email;
    }
    if (dto.roleId && dto.roleId !== user.roleId) {
      const role = await this.getActiveRole(dto.roleId);
      if (user.id === actor.id) {
        throw new BadRequestException('No puede cambiar su propio rol. Pídalo a otro administrador.');
      }
      if (user.role.code === BASE_ROLES.ADMIN && user.active) await this.assertNotLastAdmin(user.id);
      changes.role = { from: user.role.code, to: role.code };
      user.role = role;
      user.roleId = role.id;
      // El token vigente lleva el rol anterior: se obliga a ingresar de nuevo.
      user.passwordChangedAt = new Date();
    }
    for (const key of ['firstName', 'lastName', 'documentNumber', 'phone'] as const) {
      if (dto[key] !== undefined && dto[key] !== user[key]) {
        changes[key] = { from: user[key], to: dto[key] };
        (user[key] as string | null) = dto[key] ?? null;
      }
    }

    if (Object.keys(changes).length) {
      await this.users.save(user);
      await this.audit.record({ actorId: actor.id, action: 'user.updated', entity: 'user', entityId: id, detail: changes });
    }
    return this.findOne(id);
  }

  async setStatus(id: string, active: boolean, actor: AuthUser): Promise<UserView> {
    const user = await this.getOrFail(id);
    if (user.active === active) return toView(user);
    if (!active) {
      if (user.id === actor.id) throw new BadRequestException('No puede inactivar su propio usuario.');
      if (user.role.code === BASE_ROLES.ADMIN) await this.assertNotLastAdmin(user.id);
    } else if (!user.role.active) {
      throw new BadRequestException('El rol de este usuario está inactivo. Asígnele otro rol antes de activarlo.');
    }
    await this.users.update(id, {
      active,
      // Al inactivar se cierran sus sesiones abiertas.
      ...(active ? { failedLoginAttempts: 0, lockedUntil: null } : { passwordChangedAt: new Date() }),
    });
    await this.audit.record({
      actorId: actor.id,
      action: active ? 'user.activated' : 'user.deactivated',
      entity: 'user',
      entityId: id,
    });
    return this.findOne(id);
  }

  /** El administrador reenvía el enlace para definir contraseña. */
  async sendAccessLink(id: string, actor: AuthUser): Promise<void> {
    const user = await this.getOrFail(id);
    if (!user.active) throw new BadRequestException('Active el usuario antes de enviarle un enlace de acceso.');
    await this.passwordReset.sendReset(user);
    await this.audit.record({ actorId: actor.id, action: 'user.access_link_sent', entity: 'user', entityId: id });
  }

  private async getOrFail(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('El usuario no existe.');
    return user;
  }

  private async assertEmailFree(email: string): Promise<void> {
    if (await this.users.exist({ where: { email } })) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }
  }

  private async getActiveRole(id: string): Promise<Role> {
    const role = await this.roles.findOne({ where: { id } });
    if (!role) throw new BadRequestException('El rol seleccionado no existe.');
    if (!role.active) throw new BadRequestException('El rol seleccionado está inactivo.');
    return role;
  }

  private async assertNotLastAdmin(excludingId: string): Promise<void> {
    const others = await this.users
      .createQueryBuilder('u')
      .innerJoin('u.role', 'role')
      .where('role.code = :code', { code: BASE_ROLES.ADMIN })
      .andWhere('u.active = true')
      .andWhere('u.id <> :id', { id: excludingId })
      .getCount();
    if (others === 0) {
      throw new BadRequestException('Debe quedar al menos un administrador activo.');
    }
  }
}

function toView(user: User): UserView {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    documentNumber: user.documentNumber,
    phone: user.phone,
    role: { id: user.role.id, code: user.role.code, name: user.role.name },
    active: user.active,
    locked: !!user.lockedUntil && user.lockedUntil > new Date(),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
