import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthUser, JwtPayload } from '../common/auth-user';
import { User } from '../users/user.entity';
import { ChangePasswordDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { toAuthUser } from './jwt.strategy';
import { PasswordResetToken } from './password-reset-token.entity';
import { hashToken, PasswordResetService } from './password-reset.service';

export const BCRYPT_ROUNDS = 12;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.';
// Hash fijo para comparar cuando el correo no existe y así no revelar, por
// tiempo de respuesta, qué correos están registrados.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(PasswordResetToken) private readonly tokens: Repository<PasswordResetToken>,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly passwordReset: PasswordResetService,
    private readonly dataSource: DataSource,
  ) {}

  private findWithHash(where: { email: string } | { id: string }): Promise<User | null> {
    return this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .leftJoinAndSelect('u.role', 'role')
      .where(where)
      .getOne();
  }

  async login(dto: LoginDto, ip?: string): Promise<LoginResult> {
    const user = await this.findWithHash({ email: dto.email });
    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new UnauthorizedException(
        `Cuenta bloqueada por varios intentos fallidos. Intente de nuevo en ${minutes} min o recupere su contraseña.`,
      );
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const lock = attempts >= MAX_FAILED_ATTEMPTS;
      await this.users.update(user.id, {
        failedLoginAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      });
      await this.audit.record({
        actorId: user.id,
        action: lock ? 'auth.account_locked' : 'auth.login_failed',
        entity: 'user',
        entityId: user.id,
        ip,
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Solo después de validar la contraseña se informa el estado de la cuenta.
    if (!user.active || !user.role.active) {
      throw new UnauthorizedException('Su usuario está inactivo. Contacte al administrador del sistema.');
    }

    await this.users.update(user.id, { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() });
    await this.audit.record({ actorId: user.id, action: 'auth.login', entity: 'user', entityId: user.id, ip });

    const payload: JwtPayload = { sub: user.id, role: user.role.code };
    return { accessToken: await this.jwt.signAsync(payload), user: toAuthUser(user) };
  }

  /** Responde igual exista o no el correo, para no revelar cuentas registradas. */
  async forgotPassword(email: string, ip?: string): Promise<void> {
    const user = await this.users.findOne({ where: { email } });
    if (!user || !user.active) return;
    await this.passwordReset.sendReset(user);
    await this.audit.record({
      actorId: user.id,
      action: 'auth.password_reset_requested',
      entity: 'user',
      entityId: user.id,
      ip,
    });
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const record = await this.findUsableToken(token);
    if (!record) return { valid: false };
    return { valid: true, email: maskEmail(record.user.email) };
  }

  async resetPassword(dto: ResetPasswordDto, ip?: string): Promise<void> {
    const record = await this.findUsableToken(dto.token);
    if (!record) {
      throw new BadRequestException('El enlace venció o ya fue usado. Solicite uno nuevo.');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, record.userId, {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      await manager.update(PasswordResetToken, record.id, { usedAt: new Date() });
      await this.audit.record(
        { actorId: record.userId, action: 'auth.password_reset', entity: 'user', entityId: record.userId, ip },
        manager,
      );
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto, ip?: string): Promise<LoginResult> {
    const user = await this.findWithHash({ id: userId });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta.');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser distinta de la actual.');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.users.update(user.id, { passwordHash, passwordChangedAt: new Date() });
    await this.audit.record({ actorId: user.id, action: 'auth.password_changed', entity: 'user', entityId: user.id, ip });
    // Las demás sesiones quedan invalidadas; esta recibe un token nuevo.
    const payload: JwtPayload = { sub: user.id, role: user.role.code };
    return { accessToken: await this.jwt.signAsync(payload), user: toAuthUser(user) };
  }

  private findUsableToken(token: string): Promise<PasswordResetToken | null> {
    return this.tokens.findOne({
      where: { tokenHash: hashToken(token), usedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      relations: { user: true },
    });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}
