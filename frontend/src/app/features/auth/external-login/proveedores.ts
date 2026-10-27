import { Proveedor } from '../../../core/models/predios';

export const NOMBRE_PROVEEDOR: Record<Proveedor, string> = { google: 'Google', facebook: 'Facebook', microsoft: 'Microsoft' };

/** Mensaje para los errores de la ventana del proveedor; null cuando la persona la cerró. */
export function mensajeProveedor(error: unknown): string | null | undefined {
  const codigo = (error as { code?: string })?.code ?? '';
  if (codigo === 'auth/popup-closed-by-user' || codigo === 'auth/cancelled-popup-request') return null;
  if (codigo === 'auth/popup-blocked') return 'El navegador bloqueó la ventana de ingreso. Permita las ventanas emergentes e intente de nuevo.';
  if (codigo === 'auth/account-exists-with-different-credential') return 'Ese correo ya ingresó con otro método. Use el mismo con el que ingresó antes.';
  return undefined;
}
