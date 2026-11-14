import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionUser } from '../models/models';
import { AuthService, PROVEEDOR_SESION } from './auth.service';
import { ProveedorSesion } from './sesion/sesion';

const eva: SessionUser = {
  id: 'u1',
  email: 'eva@prueba.co',
  firstName: 'Eva',
  lastName: 'Luna',
  role: { id: 'evaluador', code: 'EVALUADOR', name: 'Evaluador' },
  permissions: ['evaluaciones.diligenciar'],
};

/** Sesión falsa: permite simular lo que Firebase avisa (p. ej. que inactivaron al usuario). */
function sesionFalsa(restaurar: SessionUser | null = null) {
  let avisar: (u: SessionUser | null) => void = () => undefined;
  const sesion = {
    token: null,
    restaurar: jasmine.createSpy().and.resolveTo(restaurar),
    ingresar: jasmine.createSpy().and.resolveTo({ usuario: eva }),
    salir: jasmine.createSpy().and.resolveTo(undefined),
    observar: (f: (u: SessionUser | null) => void) => (avisar = f),
  } as unknown as ProveedorSesion;
  return { sesion, avisar: (u: SessionUser | null) => avisar(u) };
}

describe('AuthService', () => {
  function crear(restaurar: SessionUser | null = null) {
    const falsa = sesionFalsa(restaurar);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([{ path: 'ingresar', children: [] }]), { provide: PROVEEDOR_SESION, useValue: falsa.sesion }],
    });
    return { service: TestBed.inject(AuthService), ...falsa };
  }

  it('abre la sesión al ingresar y evalúa permisos', async () => {
    const { service } = crear();
    await service.login('eva@prueba.co', 'Clave2026xx');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.fullName()).toBe('Eva Luna');
    expect(service.can('evaluaciones.diligenciar')).toBeTrue();
    expect(service.can('usuarios.gestionar')).toBeFalse();
  });

  it('aplica de inmediato un cambio de permisos y cierra la sesión si el usuario pierde el acceso', async () => {
    const { service, sesion, avisar } = crear();
    await service.login('eva@prueba.co', 'Clave2026xx');
    avisar({ ...eva, permissions: ['usuarios.gestionar'] });
    expect(service.can('usuarios.gestionar')).toBeTrue();
    avisar(null);
    expect(service.isAuthenticated()).toBeFalse();
    expect(sesion.salir).toHaveBeenCalled();
  });

  it('restaura la sesión una sola vez aunque varias guardas pregunten a la vez', async () => {
    const { service, sesion } = crear(eva);
    const [a, b] = await Promise.all([service.restore(), service.restore()]);
    expect(a && b).toBeTrue();
    expect(sesion.restaurar).toHaveBeenCalledTimes(1);
  });

  it('no restaura la sesión si no hay usuario', async () => {
    const { service } = crear(null);
    expect(await service.restore()).toBeFalse();
  });

  it('con verificación en dos pasos no abre la sesión hasta que el código es correcto', async () => {
    const { service, sesion } = crear();
    const desafio = { correo: 'ev•••@prueba.co', minutos: 10 };
    (sesion.ingresar as jasmine.Spy).and.resolveTo({ desafio });
    (sesion as unknown as Record<string, unknown>)['verificarCodigo'] = jasmine.createSpy().and.resolveTo(eva);
    expect(await service.login('eva@prueba.co', 'Clave2026xx')).toBeFalse();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.desafio()).toEqual(desafio);
    await service.verificarCodigo('123456');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.desafio()).toBeNull();
  });

  it('cancelar la verificación cierra el ingreso a medio camino', async () => {
    const { service, sesion } = crear();
    (sesion.ingresar as jasmine.Spy).and.resolveTo({ desafio: { correo: 'x', minutos: 10 } });
    await service.login('eva@prueba.co', 'Clave2026xx');
    service.cancelarVerificacion();
    expect(service.desafio()).toBeNull();
    expect(sesion.salir).toHaveBeenCalled();
  });
});
