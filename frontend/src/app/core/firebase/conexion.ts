import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { ErrorVisible } from '../utils/http-error';

/** Módulos del SDK de Firebase; se descargan la primera vez que se usan, nunca en el modo demostración. */
export interface Firebase {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  fa: typeof import('firebase/auth');
  fs: typeof import('firebase/firestore');
}

let conexion: Promise<Firebase> | null = null;

export function firebase(): Promise<Firebase> {
  conexion ??= conectar();
  return conexion;
}

async function conectar(): Promise<Firebase> {
  const [{ initializeApp }, fa, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
  const ajustes = environment.firebase;
  const app = initializeApp(ajustes.config);
  // La sesión se cierra al cerrar el navegador, como corresponde a equipos compartidos en campo.
  const auth = fa.initializeAuth(app, { persistence: fa.browserSessionPersistence, popupRedirectResolver: fa.browserPopupRedirectResolver });
  auth.languageCode = 'es';
  const db = fs.getFirestore(app);
  if (ajustes.emuladores) {
    fa.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  return { app, auth, db, fa, fs };
}

let funcionesEnEmulador = false;

/** Errores que las Cloud Functions devuelven con un mensaje en español para la persona. */
const ERRORES_CON_MENSAJE = ['resource-exhausted', 'invalid-argument', 'failed-precondition', 'unavailable', 'unauthenticated'];

/** Llama una Cloud Function (código de verificación en dos pasos); el SDK se descarga al primer uso. */
export async function llamarFuncion<E, S = unknown>(nombre: string, datos: E): Promise<S> {
  const { app } = await firebase();
  const f = await import('firebase/functions');
  const funciones = f.getFunctions(app, 'us-central1');
  if (environment.firebase.emuladores && !funcionesEnEmulador) {
    f.connectFunctionsEmulator(funciones, '127.0.0.1', 5001);
    funcionesEnEmulador = true;
  }
  try {
    return (await f.httpsCallable<E, S>(funciones, nombre)(datos)).data;
  } catch (e) {
    const codigo = String((e as { code?: string }).code ?? '').replace('functions/', '');
    // El SDK agrega el estado HTTP al final del mensaje ("… [400]"); a la persona no le sirve.
    const mensaje = e instanceof Error ? e.message.replace(/\s*\[\d{3}\]$/, '') : '';
    if (ERRORES_CON_MENSAJE.includes(codigo) && mensaje) throw new ErrorVisible(mensaje);
    console.error(`Cloud Function ${nombre}`, e);
    throw new ErrorVisible('No se pudo completar la verificación en dos pasos. Intente de nuevo en unos minutos.');
  }
}

/** Segunda instancia de Firebase para crear cuentas sin cerrar la sesión del administrador. */
export async function authSecundaria() {
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const { fa } = await firebase();
  const nombre = 'creacion-de-usuarios';
  // En memoria: la cuenta recién creada no queda guardada en el navegador.
  const auth = getApps().some((a) => a.name === nombre)
    ? fa.getAuth(getApp(nombre))
    : fa.initializeAuth(initializeApp(environment.firebase.config, nombre), { persistence: fa.inMemoryPersistence });
  if (environment.firebase.emuladores && !auth.emulatorConfig) {
    fa.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  return auth;
}

/** Fecha de Firestore (Timestamp) o null, como texto ISO para los modelos de la interfaz. */
export function iso(valor: unknown): string | null {
  const t = valor as { toDate?: () => Date } | null | undefined;
  return t?.toDate ? t.toDate().toISOString() : typeof valor === 'string' ? valor : null;
}
