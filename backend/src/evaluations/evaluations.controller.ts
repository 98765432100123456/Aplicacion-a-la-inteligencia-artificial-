import { Body, Controller, Get, HttpCode, Param, ParseEnumPipe, ParseUUIDPipe, Post, Put, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { AuthUser } from '../common/interfaces/auth-user';
import { PERMISSIONS } from '../roles/constants/permissions';
import { SaveEvaluationDto, StartEvaluationDto } from './dto/evaluation.dto';
import { EvaluationsService } from './evaluations.service';

const CONSULTAR = [
  PERMISSIONS.EVALUACIONES_VER,
  PERMISSIONS.EVALUACIONES_DILIGENCIAR,
  PERMISSIONS.REPORTES_VER,
  PERMISSIONS.PREDIOS_PROPIOS,
] as const;

enum TipoInforme {
  tecnico = 'TECNICO',
  propietario = 'PROPIETARIO',
}

@ApiTags('Evaluaciones')
@ApiBearerAuth()
@Controller()
export class EvaluationsController {
  constructor(private readonly evaluations: EvaluationsService) {}

  @RequirePermissions(...CONSULTAR)
  @Get('farms/:farmId/evaluations')
  history(@Param('farmId', ParseUUIDPipe) farmId: string, @CurrentUser() user: AuthUser) {
    return this.evaluations.history(farmId, user);
  }

  @RequirePermissions(PERMISSIONS.EVALUACIONES_DILIGENCIAR)
  @Post('farms/:farmId/evaluations')
  start(@Param('farmId', ParseUUIDPipe) farmId: string, @Body() dto: StartEvaluationDto, @CurrentUser() user: AuthUser) {
    return this.evaluations.start(farmId, dto, user);
  }

  @RequirePermissions(...CONSULTAR)
  @Get('evaluations/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.evaluations.findOne(id, user);
  }

  @RequirePermissions(PERMISSIONS.EVALUACIONES_DILIGENCIAR)
  @Put('evaluations/:id')
  save(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveEvaluationDto, @CurrentUser() user: AuthUser) {
    return this.evaluations.save(id, dto, user);
  }

  @RequirePermissions(PERMISSIONS.EVALUACIONES_DILIGENCIAR)
  @Post('evaluations/:id/finalize')
  @HttpCode(200)
  finalize(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.evaluations.finalize(id, user);
  }

  @RequirePermissions(PERMISSIONS.EVALUACIONES_DILIGENCIAR)
  @Post('evaluations/:id/recommendations')
  @HttpCode(200)
  regenerate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.evaluations.regenerate(id, user);
  }

  /** Descarga el PDF: /evaluations/:id/reports/tecnico o /evaluations/:id/reports/propietario. */
  @RequirePermissions(...CONSULTAR)
  @Get('evaluations/:id/reports/:kind')
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('kind', new ParseEnumPipe(['tecnico', 'propietario'])) kind: keyof typeof TipoInforme,
    @CurrentUser() user: AuthUser,
  ) {
    const r = await this.evaluations.report(id, TipoInforme[kind], user);
    return new StreamableFile(r.content, { type: 'application/pdf', disposition: `attachment; filename="${r.fileName}"`, length: r.sizeBytes });
  }
}
