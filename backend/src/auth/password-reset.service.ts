import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { AppConfig } from '../config/configuration';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

export const INVITATION_TTL_HOURS = 72;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Emite enlaces de un solo uso para recuperar o definir contraseña (RF04). */
@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetToken) private readonly tokens: Repository<PasswordResetToken>,
    private readonly mail: MailService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private async issue(user: User, ttlMinutes: number): Promise<string> {
    // Un enlace nuevo invalida los anteriores que sigan sin usar.
    await this.tokens.update({ userId: user.id, usedAt: IsNull() }, { usedAt: new Date() });
    const token = randomBytes(32).toString('base64url');
    await this.tokens.insert({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
    });
    const base = this.config.get('frontendUrl', { infer: true }).replace(/\/$/, '');
    return `${base}/restablecer-contrasena?token=${encodeURIComponent(token)}`;
  }

  async sendReset(user: User): Promise<void> {
    const minutes = this.config.get('resetTokenTtlMinutes', { infer: true });
    const link = await this.issue(user, minutes);
    await this.mail.send(this.mail.passwordReset(user.email, user.firstName, link, minutes));
  }

  async sendInvitation(user: User, roleName: string): Promise<void> {
    const link = await this.issue(user, INVITATION_TTL_HOURS * 60);
    await this.mail.send(this.mail.invitation(user.email, user.firstName, roleName, link, INVITATION_TTL_HOURS));
  }
}
