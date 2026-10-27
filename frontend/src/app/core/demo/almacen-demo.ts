import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { RoleItem, UserItem } from '../models/models';
import { datosIniciales, DemoData, DemoUser } from './datos-demo';

/** Estado del modo demostración guardado en el navegador y utilidades comunes de las rutas simuladas. */

const CLAVE = 'ica.demo.datos.v4';
const LATENCIA_MS = 250;

export const PATRON_CONTRASENA = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])(?=.*\d).{10,72}$/;
export { MENSAJE_CONTRASENA } from '../utils/mensajes';

function cargar(): DemoData {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return JSON.parse(guardado) as DemoData;
  } catch {
    /* sin almacenamiento: se usan los datos iniciales */
  }
  return datosIniciales();
}

/** Datos vigentes; las rutas los modifican y luego llaman a guardar(). */
export const estado = { datos: cargar() };

export function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado.datos));
  } catch {
    /* los cambios duran mientras la pestaña esté abierta */
  }
}

/** Restablece los datos de prueba (enlace del aviso de demostración). */
export function resetDemoData() {
  estado.datos = datosIniciales();
  guardar();
}

export function ok<T>(body: T, status = 200): Observable<HttpResponse<T>> {
  return of(new HttpResponse({ status, body })).pipe(delay(LATENCIA_MS));
}

export function fallo(status: number, message: string | string[]): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, error: { statusCode: status, message } })).pipe(delay(LATENCIA_MS));
}

export const prohibido = () => fallo(403, 'Su rol no tiene permiso para esta acción.');

/** Usuario sin la contraseña, como lo entrega la API. */
export function vistaUsuario(u: DemoUser): UserItem {
  const { password: _omitida, ...resto } = u;
  return resto;
}

export function vistaRol(r: RoleItem): RoleItem {
  return { ...r, userCount: estado.datos.users.filter((u) => u.role.id === r.id).length };
}

export function sesion(u: DemoUser) {
  const r = estado.datos.roles.find((x) => x.id === u.role.id)!;
  return {
    id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
    role: { id: r.id, code: r.code, name: r.name }, permissions: r.permissions,
  };
}

/** Usuario dueño del token "demo-<id>", siempre que él y su rol sigan activos. */
export function usuarioActual(req: HttpRequest<unknown>): DemoUser | null {
  const id = (req.headers.get('Authorization') ?? '').replace('Bearer demo-', '');
  const u = estado.datos.users.find((x) => x.id === id);
  const r = u && estado.datos.roles.find((x) => x.id === u.role.id);
  return u && u.active && r?.active ? u : null;
}

export function puede(u: DemoUser, ...permisos: string[]) {
  const r = estado.datos.roles.find((x) => x.id === u.role.id)!;
  return permisos.some((p) => r.permissions.includes(p));
}

export const esCorreo = (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const limpiar = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Datos de una petición simulada que reciben las rutas. */
export interface Peticion {
  req: HttpRequest<unknown>;
  metodo: string;
  ruta: string;
  cuerpo: Record<string, unknown>;
}

/** Una ruta devuelve su respuesta o null si la petición no le corresponde. */
export type Respuesta = Observable<HttpResponse<unknown>> | null;
