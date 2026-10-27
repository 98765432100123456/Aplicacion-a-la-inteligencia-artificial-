import { FIREBASE_PRODUCCION } from './firebase.config';

/**
 * Modo demostración (`npm run demo`): la interfaz funciona sin conexión a Firebase.
 * Las respuestas se simulan en el navegador con datos de prueba (core/demo/).
 */
export const environment = {
  production: false,
  apiUrl: '/api',
  demo: true,
  firebase: { ...FIREBASE_PRODUCCION, proveedores: [], modeloIA: null },
};
