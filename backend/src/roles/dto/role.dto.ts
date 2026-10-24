import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { ALL_PERMISSIONS } from '../constants/permissions';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateRoleDto {
  @ApiProperty({ example: 'DOCENTE' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z][A-Z0-9_]{1,39}$/, {
    message: 'El código usa mayúsculas, números o guion bajo, empieza por letra y tiene de 2 a 40 caracteres.',
  })
  code: string;

  @ApiProperty({ example: 'Docente' })
  @Transform(trim)
  @IsString()
  @Length(2, 80, { message: 'El nombre debe tener entre 2 y 80 caracteres.' })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255, { message: 'La descripción admite hasta 255 caracteres.' })
  description?: string | null;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsIn(ALL_PERMISSIONS, { each: true, message: 'Uno de los permisos no existe en el catálogo.' })
  permissions: string[];
}

export class UpdateRoleDto extends PartialType(OmitType(CreateRoleDto, ['code'] as const)) {}

export class RoleStatusDto {
  @ApiProperty()
  @IsBoolean()
  active: boolean;
}
