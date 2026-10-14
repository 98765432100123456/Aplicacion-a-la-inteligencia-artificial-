import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { databaseOptions, loadConfig } from './config/configuration';
import { HealthController } from './health/health.controller';
import { MailModule } from './mail/mail.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadConfig], cache: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...databaseOptions(), migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true' }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 300 }],
      // Las pruebas e2e hacen muchos ingresos seguidos.
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    AuditModule,
    MailModule,
    AuthModule,
    RolesModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    // Orden: límite de peticiones, autenticación, permisos.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
