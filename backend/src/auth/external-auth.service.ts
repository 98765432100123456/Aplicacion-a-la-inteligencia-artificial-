import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/interfaces/auth-user';
import { AppConfig } from '../config/configuration';
import { BASE_ROLES } from '../roles/constants/permissions';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { BCRYPT_ROUNDS, LoginResult } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import { PasswordResetService } from './password-reset.service';
import { toAuthUser } from './strategies/jwt.strategy';

/** Llaves públicas con que Google firma los tokens de Firebase Authentication. */
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

/**
 * Registro de propietarios e ingreso con Google, Facebook o Microsoft mediante
 * Firebase Authentication. Firebase solo confirma la identidad; los permisos los
 * decide el rol del usuario en esta plataforma.
 */
@Injectable()
export class ExternalAuthService {
  private readonly logger = new Logger(ExternalAuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly passwordReset: PasswordResetService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /** Configuración pública que la interfaz necesita para mostrar los botones de ingreso externo. */
  publicConfig() {
    const f = this.config.get('firebase', { infer: true });
    return { registration: true, firebase: f.projectId && f.apiKey ? { apiKey: f.apiKey, authDomain: f.authDomain, projectId: f.projectId, providers: f.providers } : null };
  }

  /**
   * Registro de propietarios: crea la cuenta y envía un enlace para definir la
   * contraseña, que confirma que el correo es suyo antes de dar acceso a sus predios.
   * Responde igual si el correo ya existe, para no revelar cuentas registradas.
   */
  async register(dto: RegisterDto, ip?: string): Promise<void> {
    if (await this.users.exist({ where: { email: dto.email } })) return;
    const user = await this.createOwner(dto.firstName, dto.lastName, dto.email);
    await this.passwordReset.sendInvitation(user, user.role.name);
    await this.audit.record({ actorId: user.id, action: 'auth.registered', entity: 'user', entityId: user.id, ip });
  }

  /** Verifica el token de Firebase y entrega una sesión de la plataforma. */
  async loginWithFirebase(idToken: string, ip?: string): Promise<LoginResult> {
    const projectId = this.config.get('firebase', { infer: true }).projectId;
    if (!projectId) throw new NotFoundException('El ingreso con proveedores externos no está habilitado.');

    let claims: { email?: string; email_verified?: boolean; name?: string; firebase?: { sign_in_provider?: string } };
    try {
      ({ payload: claims } = await jwtVerify(idToken, FIREBASE_JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      }));
    } catch (error) {
      this.logger.warn(`Token de Firebase rechazado: ${(error as Error).message}`);
      throw new UnauthorizedException('No se pudo verificar su identidad. Intente de nuevo.');
    }
    const email = claims.email?.toLowerCase();
    if (!email || claims.email_verified !== true) {
      throw new BadRequestException('Su cuenta no tiene un correo verificado. Verifíquelo con el proveedor o regístrese con su correo.');
    }

    let user = await this.users.findOne({ where: { email } });
    if (!user) {
      const [firstName, ...rest] = (claims.name ?? email.split('@')[0]).trim().split(/\s+/);
      user = await this.createOwner(firstName, rest.join(' ') || '-', email);
      await this.audit.record({ actorId: user.id, action: 'auth.registered', entity: 'user', entityId: user.id, ip, detail: { provider: claims.firebase?.sign_in_provider } });
    }
    if (!user.active || !user.role.active) {
      throw new UnauthorizedException('Su usuario está inactivo. Contacte al administrador del sistema.');
    }
    await this.users.update(user.id, { lastLoginAt: new Date() });
    await this.audit.record({ actorId: user.id, action: 'auth.login', entity: 'user', entityId: user.id, ip, detail: { provider: claims.firebase?.sign_in_provider } });
    const payload: JwtPayload = { sub: user.id, role: user.role.code };
    return { accessToken: await this.jwt.signAsync(payload), user: toAuthUser(user) };
  }

  /** Cuenta de propietario con una contraseña aleatoria que nadie conoce. */
  private async createOwner(firstName: string, lastName: string, email: string): Promise<User> {
    const role = await this.roles.findOne({ where: { code: BASE_ROLES.PROPIETARIO, active: true } });
    if (!role) throw new BadRequestException('El registro de propietarios no está disponible. Contacte al administrador.');
    const saved = await this.users.save(
      this.users.create({
        firstName: firstName.slice(0, 80),
        lastName: lastName.slice(0, 80),
        email,
        roleId: role.id,
        passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), BCRYPT_ROUNDS),
      }),
    );
    saved.role = role;
    return saved;
  }
}
