import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../interfaces/auth-user';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

/** Control de acceso por permisos del rol (RNF07). */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
    if (user && required.some((p) => user.permissions.includes(p))) return true;
    throw new ForbiddenException('Su rol no tiene permiso para esta acción.');
  }
}
