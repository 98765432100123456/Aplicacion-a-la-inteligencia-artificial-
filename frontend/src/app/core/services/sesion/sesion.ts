import { SessionUser } from '../../models/models';
import { Proveedor } from '../../models/predios';

/** Segundo paso del ingreso: un código de 6 dígitos enviado al correo de la cuenta. */
export interface DesafioCodigo {
  /** Correo de destino con la parte local oculta. */
  correo: string;
  /** Minutos que dura el código. */
  minutos: number;
  /** Solo en la demostración y en los emuladores, donde no se envían correos. */
  codigoPrueba?: string;
}

/** Tras la contraseña o el proveedor: la sesión abierta, o el código que falta verificar. */
export type ResultadoIngreso = { usuario: SessionUser } | { desafio: DesafioCodigo };

/** Operaciones de sesión; las implementan Firebase (uso real) y la API simulada (modo demostración). */
export interface ProveedorSesion {
  /** Token de la API simulada; Firebase maneja el suyo internamente. */
  readonly token: string | null;
  restaurar(): Promise<SessionUser | null>;
  ingresar(correo: string, clave: string): Promise<ResultadoIngreso>;
  ingresarConProveedor(proveedor: Proveedor): Promise<ResultadoIngreso>;
  /** Envía otro código al correo para el ingreso en curso. */
  reenviarCodigo(): Promise<DesafioCodigo>;
  /** Comprueba el código del correo y abre la sesión. */
  verificarCodigo(codigo: string): Promise<SessionUser>;
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
