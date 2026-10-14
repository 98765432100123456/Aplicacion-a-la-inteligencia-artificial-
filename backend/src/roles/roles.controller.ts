import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CreateRoleDto, RoleStatusDto, UpdateRoleDto } from './dto/role.dto';
import { PERMISSION_CATALOG, PERMISSIONS } from './permissions';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  /** Quien gestiona usuarios necesita la lista de roles para asignarlos. */
  @RequirePermissions(PERMISSIONS.ROLES_VER, PERMISSIONS.USUARIOS_GESTIONAR)
  @Get()
  findAll() {
    return this.roles.findAll();
  }

  @RequirePermissions(PERMISSIONS.ROLES_VER)
  @Get('permissions')
  permissions() {
    return PERMISSION_CATALOG;
  }

  @RequirePermissions(PERMISSIONS.ROLES_VER)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles.findOne(id);
  }

  @RequirePermissions(PERMISSIONS.ROLES_GESTIONAR)
  @Post()
  create(@Body() dto: CreateRoleDto, @CurrentUser() actor: AuthUser) {
    return this.roles.create(dto, actor);
  }

  @RequirePermissions(PERMISSIONS.ROLES_GESTIONAR)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto, @CurrentUser() actor: AuthUser) {
    return this.roles.update(id, dto, actor);
  }

  @RequirePermissions(PERMISSIONS.ROLES_GESTIONAR)
  @Patch(':id/status')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RoleStatusDto, @CurrentUser() actor: AuthUser) {
    return this.roles.setStatus(id, dto.active, actor);
  }
}
