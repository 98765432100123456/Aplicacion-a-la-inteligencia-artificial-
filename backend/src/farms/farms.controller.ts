import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { AuthUser } from '../common/interfaces/auth-user';
import { PERMISSIONS } from '../roles/constants/permissions';
import { CreateFarmDto, ListFarmsQuery, UpdateFarmDto } from './dto/farm.dto';
import { FarmsService } from './farms.service';

const CONSULTAR = [PERMISSIONS.FINCAS_VER, PERMISSIONS.FINCAS_GESTIONAR, PERMISSIONS.PREDIOS_PROPIOS] as const;

@ApiTags('Predios')
@ApiBearerAuth()
@Controller()
export class FarmsController {
  constructor(private readonly farms: FarmsService) {}

  @Get('species')
  species() {
    return this.farms.listSpecies();
  }

  @RequirePermissions(...CONSULTAR)
  @Get('farms')
  findAll(@Query() query: ListFarmsQuery, @CurrentUser() user: AuthUser) {
    return this.farms.findAll(query, user);
  }

  @RequirePermissions(...CONSULTAR)
  @Get('farms/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.farms.findOne(id, user);
  }

  @RequirePermissions(PERMISSIONS.FINCAS_GESTIONAR)
  @Post('farms')
  create(@Body() dto: CreateFarmDto, @CurrentUser() user: AuthUser) {
    return this.farms.create(dto, user);
  }

  @RequirePermissions(PERMISSIONS.FINCAS_GESTIONAR)
  @Patch('farms/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFarmDto, @CurrentUser() user: AuthUser) {
    return this.farms.update(id, dto, user);
  }
}
