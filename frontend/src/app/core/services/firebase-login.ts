import { AuthConfig } from '../models/predios';

export type Proveedor = 'google' | 'facebook' | 'microsoft';

export const NOMBRE_PROVEEDOR: Record<Proveedor, string> = { google: 'Google', facebook: 'Facebook', microsoft: 'Microsoft' };

/**
 * Abre la ventana del proveedor con Firebase Authentication y devuelve el token
 * de identidad que verifica el servidor. Firebase se descarga solo al usarlo.
 */
export async function tokenDeProveedor(config: NonNullable<AuthConfig['firebase']>, proveedor: Proveedor): Promise<string> {
  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth, signInWithPopup, signOut, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } = await import('firebase/auth');
  const app = getApps()[0] ?? initializeApp({ apiKey: config.apiKey, authDomain: config.authDomain, projectId: config.projectId });
  const auth = getAuth(app);
  const proveedores = {
    google: () => new GoogleAuthProvider(),
    facebook: () => new FacebookAuthProvider().addScope('email'),
    microsoft: () => new OAuthProvider('microsoft.com').addScope('email'),
  };
  const credencial = await signInWithPopup(auth, proveedores[proveedor]());
  const token = await credencial.user.getIdToken();
  // La sesión de la plataforma la maneja el servidor; la de Firebase no se conserva.
  await signOut(auth);
  return token;
}

/** Mensaje en español para los errores más comunes de la ventana del proveedor. */
export function mensajeFirebase(error: unknown): string | null {
  const codigo = (error as { code?: string })?.code ?? '';
  if (codigo === 'auth/popup-closed-by-user' || codigo === 'auth/cancelled-popup-request') return null;
  if (codigo === 'auth/popup-blocked') return 'El navegador bloqueó la ventana de ingreso. Permita las ventanas emergentes e intente de nuevo.';
  if (codigo === 'auth/account-exists-with-different-credential') return 'Ese correo ya ingresó con otro proveedor. Use el mismo con el que ingresó antes.';
  if (codigo.startsWith('auth/')) return 'No se pudo ingresar con el proveedor. Intente de nuevo o use su correo y contraseña.';
  return null;
}
