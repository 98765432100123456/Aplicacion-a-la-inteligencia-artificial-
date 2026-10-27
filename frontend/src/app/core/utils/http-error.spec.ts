import { HttpErrorResponse } from '@angular/common/http';
import { ErrorVisible, errorMessage } from './http-error';

describe('errorMessage', () => {
  it('usa el mensaje de la API en errores 4xx', () => {
    const e = new HttpErrorResponse({ status: 409, error: { message: 'Ya existe un usuario con ese correo.' } });
    expect(errorMessage(e)).toBe('Ya existe un usuario con ese correo.');
  });

  it('une los mensajes de validación', () => {
    const e = new HttpErrorResponse({ status: 400, error: { message: ['Uno.', 'Dos.'] } });
    expect(errorMessage(e)).toBe('Uno. Dos.');
  });

  it('no expone detalles de errores 5xx', () => {
    const e = new HttpErrorResponse({ status: 500, error: { message: 'stack trace' } });
    expect(errorMessage(e, 'Falló.')).toBe('Falló.');
  });

  it('explica la falta de conexión', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('conexión');
  });

  it('traduce los errores de Firebase y muestra los mensajes de la aplicación', () => {
    expect(errorMessage({ code: 'auth/invalid-credential' })).toBe('Correo o contraseña incorrectos.');
    expect(errorMessage({ code: 'permission-denied' })).toBe('Su rol no tiene permiso para esta acción.');
    expect(errorMessage(new ErrorVisible('Faltan 2 indicadores.'))).toBe('Faltan 2 indicadores.');
    expect(errorMessage({ code: 'desconocido' }, 'Falló.')).toBe('Falló.');
  });
});
