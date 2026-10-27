/**
 * Producción: la API se sirve en el mismo dominio bajo /api
 * (en el servidor, nginx reenvía /api al servicio de aplicación).
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  /** Modo demostración: simula la API en el navegador (ver core/demo-api.interceptor.ts). */
  demo: false,
};
