import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '../../common/password-policy';

const toEmail = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export class LoginDto {
  @ApiProperty({ example: 'admin@ica-bienestar.local' })
  @Transform(toEmail)
  @IsEmail({}, { message: 'Escriba un correo válido.' })
  @MaxLength(160)
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Escriba su contraseña.' })
  @MaxLength(72)
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @Transform(toEmail)
  @IsEmail({}, { message: 'Escriba un correo válido.' })
  @MaxLength(160)
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El enlace no es válido.' })
  @MaxLength(200)
  token: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Escriba su contraseña actual.' })
  @MaxLength(72)
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
