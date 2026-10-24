import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginResponse } from '../models/models';

const session: LoginResponse = {
  accessToken: 'token-123',
  user: {
    id: 'u1',
    email: 'eva@prueba.co',
    firstName: 'Eva',
    lastName: 'Luna',
    role: { id: 'r1', code: 'EVALUADOR', name: 'Evaluador' },
    permissions: ['evaluaciones.diligenciar'],
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([{ path: 'ingresar', children: [] }]), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('guarda la sesión al ingresar y evalúa permisos', async () => {
    const done = service.login('eva@prueba.co', 'Clave2026xx');
    http.expectOne('/api/auth/login').flush(session);
    await done;
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.fullName()).toBe('Eva Luna');
    expect(service.accessToken).toBe('token-123');
    expect(service.can('evaluaciones.diligenciar')).toBeTrue();
    expect(service.can('usuarios.gestionar')).toBeFalse();
  });

  it('cierra la sesión y borra el token', async () => {
    const done = service.login('eva@prueba.co', 'Clave2026xx');
    http.expectOne('/api/auth/login').flush(session);
    await done;
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(sessionStorage.getItem('ica.token')).toBeNull();
  });

  it('no restaura la sesión sin token', async () => {
    expect(await service.restore()).toBeFalse();
  });
});
