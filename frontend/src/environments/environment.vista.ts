import { environment as demo } from './environment.demo';

/**
 * Vista previa publicada en claude.ai (`npm run vista`): el modo demostración con rutas por
 * fragmento (#/predios) y rutas relativas, para que funcione desde un enlace en el celular o la
 * tableta sin instalar ni configurar nada.
 */
export const environment = { ...demo, vista: true };
