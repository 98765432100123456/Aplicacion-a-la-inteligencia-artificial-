import { PROYECTO_ICA } from './firebase.config';

/**
 * Emuladores locales (`npm run start:emuladores`): Auth y Firestore corren en el equipo
 * con `npm run emuladores` en la carpeta firebase/. Sirve para probar sin tocar datos reales.
 */
export const environment = {
  production: false,
  apiUrl: '/api',
  demo: false,
  firebase: {
    config: { ...PROYECTO_ICA, apiKey: 'clave-del-emulador', projectId: 'demo-ica' },
    proveedores: ['google' as const],
    emuladores: true,
    modeloIA: null,
  },
};
