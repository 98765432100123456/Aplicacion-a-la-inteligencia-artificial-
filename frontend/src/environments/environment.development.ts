/** Desarrollo: `npm start` usa proxy.conf.json para enviar /api a localhost:3000. */
export const environment = {
  production: false,
  apiUrl: '/api',
  /** Modo demostración: simula la API en el navegador (ver core/demo-api.interceptor.ts). */
  demo: false,
};
