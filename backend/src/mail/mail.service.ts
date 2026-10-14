import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { AppConfig } from '../config/configuration';

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Envío de correo por SMTP. Sin SMTP_HOST (desarrollo) el mensaje se escribe en
 * el log para poder copiar el enlace. En producción SMTP es obligatorio.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  /** Último correo "enviado"; lo usan las pruebas e2e. */
  lastMessage: OutgoingMail | null = null;

  constructor(config: ConfigService<AppConfig, true>) {
    const mail = config.get('mail', { infer: true });
    this.from = mail.from;
    if (mail.host) {
      this.transporter = nodemailer.createTransport({
        host: mail.host,
        port: mail.port,
        secure: mail.secure,
        auth: mail.user ? { user: mail.user, pass: mail.password } : undefined,
      });
    } else {
      if (config.get('env', { infer: true }) === 'production') {
        throw new Error('SMTP_HOST es obligatorio en producción.');
      }
      this.transporter = null;
    }
  }

  async send(message: OutgoingMail): Promise<void> {
    this.lastMessage = message;
    if (!this.transporter) {
      this.logger.log(`Correo (modo desarrollo) para ${message.to}: ${message.subject}\n${message.text}`);
      return;
    }
    await this.transporter.sendMail({ from: this.from, ...message });
  }

  passwordReset(to: string, name: string, link: string, minutes: number): OutgoingMail {
    return {
      to,
      subject: 'Restablecer su contraseña – ICA Bienestar Animal',
      text:
        `Hola, ${name}.\n\nRecibimos una solicitud para restablecer su contraseña. ` +
        `Abra este enlace en los próximos ${minutes} minutos:\n\n${link}\n\n` +
        'Si no hizo la solicitud, ignore este correo; su contraseña no cambia.',
      html: layout(
        `<p>Hola, ${escapeHtml(name)}.</p>
         <p>Recibimos una solicitud para restablecer su contraseña. El enlace vence en ${minutes} minutos.</p>
         <p><a href="${link}" style="${buttonStyle}">Crear nueva contraseña</a></p>
         <p style="color:#5b6157">Si no hizo la solicitud, ignore este correo; su contraseña no cambia.</p>`,
      ),
    };
  }

  invitation(to: string, name: string, roleName: string, link: string, hours: number): OutgoingMail {
    return {
      to,
      subject: 'Su cuenta en ICA Bienestar Animal',
      text:
        `Hola, ${name}.\n\nSe creó su cuenta con el rol ${roleName}. ` +
        `Para entrar, defina su contraseña en las próximas ${hours} horas:\n\n${link}`,
      html: layout(
        `<p>Hola, ${escapeHtml(name)}.</p>
         <p>Se creó su cuenta con el rol <strong>${escapeHtml(roleName)}</strong>.
            Para entrar, defina su contraseña. El enlace vence en ${hours} horas.</p>
         <p><a href="${link}" style="${buttonStyle}">Definir contraseña</a></p>`,
      ),
    };
  }
}

const buttonStyle =
  'display:inline-block;padding:12px 20px;background:#1f5135;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600';

function layout(body: string): string {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1c211d;max-width:520px">
    <p style="font-weight:700;color:#1f5135;margin-bottom:24px">ICA Bienestar Animal</p>${body}</div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
