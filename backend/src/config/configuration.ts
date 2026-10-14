import { DataSourceOptions } from 'typeorm';

/** Lee una variable obligatoria; falla al arrancar si no existe. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revise backend/.env.example.`);
  }
  return value;
}

export interface AppConfig {
  env: string;
  port: number;
  corsOrigins: string[];
  frontendUrl: string;
  jwt: { secret: string; expiresIn: string };
  resetTokenTtlMinutes: number;
  mail: {
    host?: string;
    port: number;
    secure: boolean;
    user?: string;
    password?: string;
    from: string;
  };
}

export function loadConfig(): AppConfig {
  const env = process.env.NODE_ENV ?? 'development';
  const jwtSecret = required('JWT_SECRET');
  if (env === 'production' && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');
  }
  return {
    env,
    port: Number(process.env.PORT ?? 3000),
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:4200')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:4200',
    jwt: { secret: jwtSecret, expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' },
    resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES ?? 30),
    mail: {
      host: process.env.SMTP_HOST || undefined,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || undefined,
      password: process.env.SMTP_PASSWORD || undefined,
      from: process.env.MAIL_FROM ?? 'ICA Bienestar Animal <no-responder@ica-bienestar.local>',
    },
  };
}

/**
 * Conexión a PostgreSQL. En Cloud Run se usa el socket Unix del conector de
 * Cloud SQL (DB_SOCKET_PATH); en local, host y puerto.
 */
export function databaseOptions(): DataSourceOptions {
  const socket = process.env.DB_SOCKET_PATH;
  return {
    type: 'postgres',
    host: socket || process.env.DB_HOST || 'localhost',
    port: socket ? undefined : Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'ica',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'ica_bienestar',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
  };
}
