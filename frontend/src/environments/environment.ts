/**
 * Producción: la API se sirve en el mismo dominio bajo /api
 * (Firebase Hosting reescribe /api/** hacia el servicio de Cloud Run).
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  /** Modo demostración: simula la API en el navegador (ver core/demo-api.interceptor.ts). */
  demo: false,
};
