import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginResponse, SessionUser } from '../../models/models';
import { ErrorVisible } from '../../utils/http-error';
import { DesafioCodigo, enmascarar, ProveedorSesion, ResultadoIngreso } from './sesion';

const CLAVE_TOKEN = 'ica.token';

/** Sesión del modo demostración: llama a la API que simula core/demo en el navegador. */
export class SesionDemo implements ProveedorSesion {
  private readonly api = environment.apiUrl;
  token: string | null = leer();
  /** Ingreso que espera el código; la demostración no envía correos y muestra el código en pantalla. */
  private pendiente: { respuesta: LoginResponse; codigo: string } | null = null;

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

  async ingresar(email: string, password: string): Promise<ResultadoIngreso> {
    const respuesta = await firstValueFrom(this.http.post<LoginResponse>(`${this.api}/auth/login`, { email, password }));
    return { desafio: this.desafio(respuesta) };
  }

  ingresarConProveedor(): Promise<ResultadoIngreso> {
    return Promise.reject(new Error('El modo demostración no tiene proveedores externos.'));
  }

  async reenviarCodigo() {
    if (!this.pendiente) throw new ErrorVisible('Su sesión terminó. Ingrese de nuevo.');
    return this.desafio(this.pendiente.respuesta);
  }

  async verificarCodigo(codigo: string) {
    if (!this.pendiente) throw new ErrorVisible('Su sesión terminó. Ingrese de nuevo.');
    if (codigo.replace(/\D/g, '') !== this.pendiente.codigo) throw new ErrorVisible('El código no es correcto. Revíselo e intente de nuevo.');
    const { respuesta } = this.pendiente;
    this.pendiente = null;
    return this.abrir(respuesta);
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
    this.pendiente = null;
    this.guardar(null);
  }

  observar() {
    // La API simulada no avisa cambios; el interceptor cierra la sesión si el token deja de valer.
  }

  private desafio(respuesta: LoginResponse): DesafioCodigo {
    const codigo = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
    this.pendiente = { respuesta, codigo };
    return { correo: enmascarar(respuesta.user.email), minutos: 10, codigoPrueba: codigo };
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
