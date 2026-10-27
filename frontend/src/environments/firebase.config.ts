/**
 * Proyecto de Firebase de ICA Bienestar Animal (app web "App Bienestar Animal ICA").
 * Estos datos identifican el proyecto y son públicos por diseño: la protección de los
 * datos está en las reglas de Firestore (firebase/firestore.rules), no en ocultarlos.
 */
export const PROYECTO_ICA = {
  apiKey: 'AIzaSyAbkHTAYpKwOTXX0sMbJq93D5GizIb18Do',
  authDomain: 'bienestar-animal-ica.firebaseapp.com',
  projectId: 'bienestar-animal-ica',
  storageBucket: 'bienestar-animal-ica.firebasestorage.app',
  messagingSenderId: '544803483795',
  appId: '1:544803483795:web:a60e7172372fb62a7e1d66',
};

/** Ajustes de la aplicación sobre Firebase. */
export interface AjustesFirebase {
  config: typeof PROYECTO_ICA;
  /** Botones de ingreso externo; cada proveedor debe estar habilitado en Authentication. */
  proveedores: ('google' | 'facebook' | 'microsoft')[];
  /** Usa los emuladores locales de Auth y Firestore (pruebas y desarrollo sin tocar el proyecto real). */
  emuladores: boolean;
  /** Modelo de Firebase AI Logic para las recomendaciones; null las genera solo con reglas. */
  modeloIA: string | null;
}

export const FIREBASE_PRODUCCION: AjustesFirebase = {
  config: PROYECTO_ICA,
  proveedores: ['google', 'facebook', 'microsoft'],
  emuladores: false,
  modeloIA: 'gemini-2.5-flash',
};
