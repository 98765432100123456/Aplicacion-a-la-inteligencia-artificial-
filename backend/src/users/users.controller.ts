import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../roles/permissions';
import { CreateUserDto, ListUsersQuery, UpdateUserDto, UserStatusDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @RequirePermissions(PERMISSIONS.USUARIOS_VER, PERMISSIONS.USUARIOS_GESTIONAR)
  @Get()
  findAll(@Query() query: ListUsersQuery) {
    return this.users.findAll(query);
  }

  @RequirePermissions(PERMISSIONS.USUARIOS_VER, PERMISSIONS.USUARIOS_GESTIONAR)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  @RequirePermissions(PERMISSIONS.USUARIOS_GESTIONAR)
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthUser) {
    return this.users.create(dto, actor);
  }

  @RequirePermissions(PERMISSIONS.USUARIOS_GESTIONAR)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: AuthUser) {
    return this.users.update(id, dto, actor);
  }

  @RequirePermissions(PERMISSIONS.USUARIOS_GESTIONAR)
  @Patch(':id/status')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UserStatusDto, @CurrentUser() actor: AuthUser) {
    return this.users.setStatus(id, dto.active, actor);
  }

  @RequirePermissions(PERMISSIONS.USUARIOS_GESTIONAR)
  @Post(':id/access-link')
  @HttpCode(200)
  async sendAccessLink(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser) {
    await this.users.sendAccessLink(id, actor);
    return { message: 'Enlace de acceso enviado al correo del usuario.' };
  }
}
