import { Body, Controller, Get, HttpCode, Ip, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser } from '../common/interfaces/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ChangePasswordDto, FirebaseLoginDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { ExternalAuthService } from './external-auth.service';

const FORGOT_MESSAGE =
  'Si el correo está registrado y activo, enviamos un enlace para restablecer la contraseña. Revise también la carpeta de spam.';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly external: ExternalAuthService,
  ) {}

  /** Opciones de ingreso disponibles: registro y proveedores de Firebase. */
  @Public()
  @Get('config')
  config() {
    return this.external.publicConfig();
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @HttpCode(200)
  async register(@Body() dto: RegisterDto, @Ip() ip: string) {
    await this.external.register(dto, ip);
    return { message: 'Si el correo no tenía cuenta, enviamos un enlace para crear su contraseña. Revise también la carpeta de spam.' };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('firebase')
  @HttpCode(200)
  firebase(@Body() dto: FirebaseLoginDto, @Ip() ip: string) {
    return this.external.loginWithFirebase(dto.idToken, ip);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Ip() ip: string) {
    await this.auth.forgotPassword(dto.email, ip);
    return { message: FORGOT_MESSAGE };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('reset-password/validate')
  validateResetToken(@Query('token') token = '') {
    return this.auth.validateResetToken(token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Ip() ip: string) {
    await this.auth.resetPassword(dto, ip);
    return { message: 'Contraseña actualizada. Ya puede ingresar.' };
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(200)
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto, @Ip() ip: string) {
    return this.auth.changePassword(user.id, dto, ip);
  }
}
