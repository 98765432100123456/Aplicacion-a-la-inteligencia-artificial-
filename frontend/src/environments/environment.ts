import { FIREBASE_PRODUCCION } from './firebase.config';

/** Producción: la aplicación usa el proyecto de Firebase bienestar-animal-ica. */
export const environment = {
  production: true,
  /** Solo lo usa el modo demostración, que simula la API en el navegador. */
  apiUrl: '/api',
  demo: false,
  firebase: FIREBASE_PRODUCCION,
};
