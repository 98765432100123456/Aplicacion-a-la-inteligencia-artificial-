import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginResponse, SessionUser } from '../../models/models';
import { ProveedorSesion } from './sesion';

const CLAVE_TOKEN = 'ica.token';

/** Sesión del modo demostración: llama a la API que simula core/demo en el navegador. */
export class SesionDemo implements ProveedorSesion {
  private readonly api = environment.apiUrl;
  token: string | null = leer();

  constructor(private readonly http: HttpClient) {}

  async restaurar() {
    if (!this.token) return null;
    try {
      return await firstValueFrom(this.http.get<SessionUser>(`${this.api}/auth/me`));
    } catch {
      this.guardar(null);
      return null;
    }
  }

  async ingresar(email: string, password: string) {
    return this.abrir(await firstValueFrom(this.http.post<LoginResponse>(`${this.api}/auth/login`, { email, password })));
  }

  ingresarConProveedor(): Promise<SessionUser> {
    return Promise.reject(new Error('El modo demostración no tiene proveedores externos.'));
  }

  async registrar(firstName: string, lastName: string, email: string) {
    return (await firstValueFrom(this.http.post<{ message: string }>(`${this.api}/auth/register`, { firstName, lastName, email }))).message;
  }

  async cambiarClave(currentPassword: string, newPassword: string) {
    return this.abrir(await firstValueFrom(this.http.post<LoginResponse>(`${this.api}/auth/change-password`, { currentPassword, newPassword })));
  }

  async olvideClave(email: string) {
    return (await firstValueFrom(this.http.post<{ message: string }>(`${this.api}/auth/forgot-password`, { email }))).message;
  }

  validarEnlace(token: string) {
    return firstValueFrom(this.http.get<{ valid: boolean; email?: string }>(`${this.api}/auth/reset-password/validate`, { params: { token } }));
  }

  async restablecerClave(token: string, password: string) {
    return (await firstValueFrom(this.http.post<{ message: string }>(`${this.api}/auth/reset-password`, { token, password }))).message;
  }

  async salir() {
    this.guardar(null);
  }

  observar() {
    // La API simulada no avisa cambios; el interceptor cierra la sesión si el token deja de valer.
  }

  private abrir(res: LoginResponse) {
    this.guardar(res.accessToken);
    return res.user;
  }

  private guardar(token: string | null) {
    this.token = token;
    try {
      if (token) sessionStorage.setItem(CLAVE_TOKEN, token);
      else sessionStorage.removeItem(CLAVE_TOKEN);
    } catch {
      // Sin almacenamiento disponible la sesión dura lo que la pestaña.
    }
  }
}

function leer(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}
