import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export class CreateUserDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(2, 80, { message: 'Los nombres deben tener entre 2 y 80 caracteres.' })
  firstName: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(2, 80, { message: 'Los apellidos deben tener entre 2 y 80 caracteres.' })
  lastName: string;

  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Escriba un correo válido.' })
  @MaxLength(160)
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @Matches(/^[0-9A-Za-z-]{4,20}$/, { message: 'El documento admite de 4 a 20 letras, números o guiones.' })
  documentNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @Matches(/^\+?[0-9 ]{7,20}$/, { message: 'El teléfono admite de 7 a 20 dígitos.' })
  phone?: string | null;

  @ApiProperty()
  @IsUUID('4', { message: 'Seleccione un rol.' })
  roleId: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserStatusDto {
  @ApiProperty()
  @IsBoolean()
  active: boolean;
}

export class ListUsersQuery {
  @ApiPropertyOptional({ description: 'Busca en nombres, apellidos, correo y documento' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  roleId?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: 'true' | 'false';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
