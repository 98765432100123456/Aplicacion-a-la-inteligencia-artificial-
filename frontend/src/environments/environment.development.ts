import { FIREBASE_PRODUCCION } from './firebase.config';

/** Desarrollo (`npm start`): la interfaz local trabaja con el proyecto real de Firebase. */
export const environment = {
  production: false,
  apiUrl: '/api',
  demo: false,
  firebase: FIREBASE_PRODUCCION,
};
