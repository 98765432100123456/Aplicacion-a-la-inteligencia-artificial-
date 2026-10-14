import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

function context(user: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const reflector = new Reflector();
  const guard = new PermissionsGuard(reflector);

  it('deja pasar si la ruta no exige permisos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(context(undefined))).toBe(true);
  });

  it('deja pasar si el usuario tiene alguno de los permisos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['roles.ver', 'usuarios.gestionar']);
    expect(guard.canActivate(context({ permissions: ['usuarios.gestionar'] }))).toBe(true);
  });

  it('niega el acceso si no tiene ninguno', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['roles.gestionar']);
    expect(() => guard.canActivate(context({ permissions: ['reportes.ver'] }))).toThrow(ForbiddenException);
  });
});
