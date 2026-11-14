import { environment } from '../../../environments/environment';
import type { PreguntaFrecuente } from '../../features/asistente/preguntas';
import { firebase } from './conexion';

const ESPERA_MAXIMA_MS = 20_000;
const LARGO_MAXIMO = 900;

/** Turno anterior de la conversación, para que el modelo entienda preguntas de seguimiento. */
export interface Turno {
  autor: 'persona' | 'asistente';
  texto: string;
}

function instrucciones(base: PreguntaFrecuente[]) {
  return `Eres Clara, la asistente de la aplicación web "ICA Bienestar Animal", que evalúa el bienestar animal
en predios de bovinos y búfalos de Colombia con la metodología del ICA (Instituto Colombiano Agropecuario).

Reglas:
- Responde en español de Colombia, con "usted", en máximo 90 palabras y en texto plano (sin Markdown, sin listas con asteriscos).
- Responde solo sobre el uso de esta aplicación y sobre bienestar animal en ganadería bovina y bufalina.
  Si te preguntan otra cosa, di con amabilidad que solo puedes ayudar con esos temas.
- Usa únicamente la información de la base de conocimiento. No inventes cifras, normas, pantallas ni botones.
  Si no sabes algo, dilo y sugiere consultar al evaluador o al administrador del sistema.
- Nunca pidas contraseñas, códigos de verificación ni datos personales.
- No des diagnósticos veterinarios: para animales enfermos o heridos, recomienda llamar al médico veterinario.

Base de conocimiento:
${base.map((p) => `P: ${p.pregunta}\nR: ${p.respuesta.join(' ')}`).join('\n\n')}`;
}

/**
 * Respuesta libre con Firebase AI Logic (Gemini), limitada a la base de conocimiento del asistente.
 * Devuelve null si el modelo no está configurado, falla o tarda demasiado: la interfaz usa
 * entonces las respuestas establecidas.
 */
export async function responderConIA(pregunta: string, historial: Turno[], base: PreguntaFrecuente[]): Promise<string | null> {
  const modelo = environment.firebase.modeloIA;
  if (environment.demo || !modelo) return null;
  try {
    const { app } = await firebase();
    const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai');
    const generador = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      model: modelo,
      systemInstruction: instrucciones(base),
      generationConfig: { maxOutputTokens: 400, temperature: 0.3 },
    });
    const contenido = [
      ...historial.slice(-6).map((t) => ({ role: (t.autor === 'persona' ? 'user' : 'model') as 'user' | 'model', parts: [{ type: 'text' as const, text: t.texto }] })),
      { role: 'user' as const, parts: [{ type: 'text' as const, text: pregunta.slice(0, 500) }] },
    ];
    const espera = new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new Error('tiempo agotado')), ESPERA_MAXIMA_MS));
    const respuesta = await Promise.race([generador.generateContent({ contents: contenido }), espera]);
    const texto = respuesta.response.text().replace(/[*#_`]/g, '').trim();
    return texto ? texto.slice(0, LARGO_MAXIMO) : null;
  } catch (e) {
    console.warn('El asistente con IA no está disponible; se usan las respuestas establecidas.', e);
    return null;
  }
}
