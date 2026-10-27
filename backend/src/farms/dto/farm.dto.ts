import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsEmail, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToNull = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || null : value);

export class FarmSpeciesDto {
  @ApiProperty()
  @IsUUID('all', { message: 'Seleccione una especie.' })
  speciesId: string;

  @ApiProperty({ description: 'Crías' })
  @IsInt({ message: 'Escriba un número entero de crías.' })
  @Min(0)
  @Max(1_000_000)
  calves: number;

  @ApiProperty({ description: 'Jóvenes' })
  @IsInt({ message: 'Escriba un número entero de jóvenes.' })
  @Min(0)
  @Max(1_000_000)
  young: number;

  @ApiProperty({ description: 'Adultos' })
  @IsInt({ message: 'Escriba un número entero de adultos.' })
  @Min(0)
  @Max(1_000_000)
  adults: number;
}

export class CreateFarmDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(2, 120, { message: 'El nombre del predio debe tener entre 2 y 120 caracteres.' })
  name: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(2, 160, { message: 'El nombre del propietario debe tener entre 2 y 160 caracteres.' })
  ownerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @Matches(/^[0-9A-Za-z-]{4,20}$/, { message: 'El documento admite de 4 a 20 letras, números o guiones.' })
  ownerDocument?: string | null;

  @ApiProperty()
  @Transform(trim)
  @Matches(/^\+?[0-9 ]{7,20}$/, { message: 'El teléfono admite de 7 a 20 dígitos.' })
  ownerPhone: string;

  @ApiPropertyOptional({ description: 'Con este correo el propietario consulta su predio.' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() || null : value))
  @IsEmail({}, { message: 'Escriba un correo válido para el propietario.' })
  @MaxLength(160)
  ownerEmail?: string | null;

  @ApiProperty()
  @Transform(trim)
  @Length(2, 80, { message: 'Escriba el departamento.' })
  department: string;

  @ApiProperty()
  @Transform(trim)
  @Length(2, 80, { message: 'Escriba el municipio.' })
  municipality: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @MaxLength(120)
  vereda?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @MaxLength(200)
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: 'La latitud debe ser un número.' })
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: 'La longitud debe ser un número.' })
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: 'El área debe ser un número.' })
  @Min(0.01, { message: 'El área debe ser mayor que cero.' })
  @Max(10_000_000)
  areaHectares?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @MaxLength(80)
  productionSystem?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @MaxLength(2000, { message: 'La información adicional admite hasta 2.000 caracteres.' })
  notes?: string | null;

  @ApiProperty({ type: [FarmSpeciesDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Registre al menos una especie con su inventario.' })
  @ValidateNested({ each: true })
  @Type(() => FarmSpeciesDto)
  species: FarmSpeciesDto[];
}

export class UpdateFarmDto extends PartialType(CreateFarmDto) {}

export class ListFarmsQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @MaxLength(100)
  search?: string;
}
