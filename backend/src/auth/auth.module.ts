import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/configuration';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { ExternalAuthService } from './external-auth.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, Role, PasswordResetToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const jwt = config.get('jwt', { infer: true });
        return { secret: jwt.secret, signOptions: { expiresIn: jwt.expiresIn as never } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ExternalAuthService, JwtStrategy, PasswordResetService],
  exports: [PasswordResetService],
})
export class AuthModule {}
