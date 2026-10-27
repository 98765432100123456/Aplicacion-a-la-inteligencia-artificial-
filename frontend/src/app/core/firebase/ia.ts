import { environment } from '../../../environments/environment';
import { ContextoRecomendacion, datosParaIA, ESQUEMA_IA, INSTRUCCIONES_IA, validarSalidaIA } from '../../compartido/ia';
import { Recomendaciones } from '../../compartido/recomendaciones';
import { firebase } from './conexion';

const ESPERA_MAXIMA_MS = 60_000;

/**
 * Recomendaciones en lenguaje sencillo con Firebase AI Logic (Gemini). La clave del modelo
 * la administra Firebase, no viaja en la aplicación. Si el servicio no está habilitado en el
 * proyecto, falla o responde algo inválido, devuelve null y se usan las reglas (RNF26).
 */
export async function recomendarConIA(ctx: ContextoRecomendacion): Promise<Recomendaciones | null> {
  const modelo = environment.firebase.modeloIA;
  if (!modelo || !ctx.resultado.hallazgos.length) return null;
  try {
    const { app } = await firebase();
    const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai');
    const generador = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      model: modelo,
      systemInstruction: INSTRUCCIONES_IA,
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: ESQUEMA_IA },
    });
    const espera = new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new Error('tiempo agotado')), ESPERA_MAXIMA_MS));
    const respuesta = await Promise.race([generador.generateContent(JSON.stringify(datosParaIA(ctx), null, 2)), espera]);
    const salida = validarSalidaIA(JSON.parse(respuesta.response.text()));
    return salida && { origen: 'IA', modelo, ...salida };
  } catch (e) {
    console.warn('Recomendaciones con IA no disponibles; se usan las reglas.', e);
    return null;
  }
}
