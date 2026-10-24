import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { AuthUser, JwtPayload } from '../../common/interfaces/auth-user';
import { AppConfig } from '../../config/configuration';
import { User } from '../../users/entities/user.entity';

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: { id: user.role.id, code: user.role.code, name: user.role.name },
    permissions: user.role.permissions,
  };
}

/**
 * Valida el token y vuelve a leer el usuario en cada petición: si fue
 * inactivado, cambió su rol o su contraseña, el cambio aplica de inmediato.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<AppConfig, true>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt', { infer: true }).secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.active || !user.role.active) {
      throw new UnauthorizedException('Su sesión ya no es válida. Ingrese de nuevo.');
    }
    // iat está en segundos: se rechazan tokens emitidos antes del último cambio.
    if (payload.iat && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      throw new UnauthorizedException('Su sesión ya no es válida. Ingrese de nuevo.');
    }
    return toAuthUser(user);
  }
}
