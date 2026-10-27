import { SessionUser } from '../../models/models';
import { Proveedor } from '../../models/predios';

/** Operaciones de sesión; las implementan Firebase (uso real) y la API simulada (modo demostración). */
export interface ProveedorSesion {
  /** Token de la API simulada; Firebase maneja el suyo internamente. */
  readonly token: string | null;
  restaurar(): Promise<SessionUser | null>;
  ingresar(correo: string, clave: string): Promise<SessionUser>;
  ingresarConProveedor(proveedor: Proveedor): Promise<SessionUser>;
  registrar(nombres: string, apellidos: string, correo: string, clave: string): Promise<string>;
  cambiarClave(actual: string, nueva: string): Promise<SessionUser | null>;
  olvideClave(correo: string): Promise<string>;
  validarEnlace(codigo: string): Promise<{ valid: boolean; email?: string }>;
  restablecerClave(codigo: string, clave: string): Promise<string>;
  salir(): Promise<void>;
  /** Avisa cuando cambian el usuario o su rol (p. ej. lo inactivan); null si perdió el acceso. */
  observar(alCambiar: (usuario: SessionUser | null) => void): void;
}

/** Correo con la parte local oculta, para confirmar a quién pertenece un enlace. */
export function enmascarar(correo: string): string {
  const [local, dominio] = correo.split('@');
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(3, local.length - 2))}@${dominio}`;
}
