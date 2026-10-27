import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppConfig } from './config/configuration';

/** Configuración común de la app; la usan main.ts y las pruebas e2e. */
export function setupApp(app: INestApplication): void {
  const config = app.get(ConfigService<AppConfig, true>);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({ origin: config.get('corsOrigins', { infer: true }), credentials: false, exposedHeaders: ['Content-Disposition'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
}
