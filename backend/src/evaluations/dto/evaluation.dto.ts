import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

const emptyToNull = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || null : value);

export class StartEvaluationDto {
  @ApiProperty()
  @IsUUID('all', { message: 'Seleccione la especie que va a evaluar.' })
  speciesId: string;

  @ApiPropertyOptional({ example: '2026-10-27' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de visita no es válida.' })
  visitDate?: string;
}

export class AnswerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(10)
  indicatorCode: string;

  @ApiProperty({ enum: ['CUMPLE', 'PARCIAL', 'NO_CUMPLE', 'NO_APLICA'] })
  @IsIn(['CUMPLE', 'PARCIAL', 'NO_CUMPLE', 'NO_APLICA'], { message: 'Respuesta no válida.' })
  answer: 'CUMPLE' | 'PARCIAL' | 'NO_CUMPLE' | 'NO_APLICA';

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @MaxLength(1000, { message: 'Cada observación admite hasta 1.000 caracteres.' })
  observation?: string | null;
}

/** Guardado parcial: se envían solo los datos que cambiaron (RF16). */
export class SaveEvaluationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de visita no es válida.' })
  visitDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @MaxLength(4000, { message: 'La observación general admite hasta 4.000 caracteres.' })
  generalObservation?: string | null;

  @ApiPropertyOptional({ type: [AnswerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers?: AnswerDto[];
}
