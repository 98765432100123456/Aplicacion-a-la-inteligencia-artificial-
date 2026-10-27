import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Número de proxies delante de la API (Caddy y nginx en el servidor): así la IP real
  // del cliente se toma de X-Forwarded-For y el límite de intentos es por persona.
  app.getHttpAdapter().getInstance().set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));
  setupApp(app);

  if (process.env.NODE_ENV !== 'production') {
    const doc = new DocumentBuilder()
      .setTitle('ICA Bienestar Animal – API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API escuchando en http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
