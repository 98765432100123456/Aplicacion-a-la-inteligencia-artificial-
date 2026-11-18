import { environment } from '../../../environments/environment';
import { AnalisisTablero, datosAnalisis, ESQUEMA_ANALISIS, INSTRUCCIONES_ANALISIS, validarAnalisis } from '../tablero/analisis';
import { ResumenTablero } from '../tablero/resumen';
import { firebase } from './conexion';

const ESPERA_MAXIMA_MS = 45_000;

/**
 * Análisis del tablero con Firebase AI Logic (Gemini). Recibe solo cifras agregadas y responde
 * con un JSON que se valida; si el modelo no está disponible, falla o responde algo inválido,
 * devuelve null y el tablero usa el análisis por reglas.
 */
export async function analizarTableroConIA(r: ResumenTablero): Promise<AnalisisTablero | null> {
  const modelo = environment.firebase.modeloIA;
  if (environment.demo || !modelo || !r.evaluaciones) return null;
  try {
    const { app } = await firebase();
    const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai');
    const generador = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      model: modelo,
      systemInstruction: INSTRUCCIONES_ANALISIS,
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: ESQUEMA_ANALISIS, temperature: 0.3 },
    });
    const espera = new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new Error('tiempo agotado')), ESPERA_MAXIMA_MS));
    const respuesta = await Promise.race([generador.generateContent(JSON.stringify(datosAnalisis(r), null, 2)), espera]);
    const salida = validarAnalisis(JSON.parse(respuesta.response.text()));
    return salida && { origen: 'IA', modelo, ...salida };
  } catch (e) {
    console.warn('Análisis del tablero con IA no disponible; se usan las reglas.', e);
    return null;
  }
}
