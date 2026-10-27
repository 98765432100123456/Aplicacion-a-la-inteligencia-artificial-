import { Resultado } from './calificacion';
import { Indicador, NOMBRE_RESPUESTA } from './lista-chequeo';
import { LIBERTADES, NIVELES } from './norma';
import { Prioridad, Recomendacion } from './recomendaciones';

/**
 * Instrucciones, esquema de salida y validación de las recomendaciones con IA (RF24, RF25).
 * No dependen del proveedor: la interfaz las usa con Firebase AI Logic.
 */

export interface ContextoRecomendacion {
  especie: string;
  productor: string;
  municipio: string;
  resultado: Resultado;
  lista: Indicador[];
}

export const INSTRUCCIONES_IA = `Eres un asesor de bienestar animal que escribe para propietarios de fincas ganaderas en Colombia.
Recibes los resultados de una evaluación hecha con la Metodología para evaluar el bienestar animal en las especies bovina y bufalina del ICA (versión 2.0, 2023) y debes explicar al propietario qué mejorar.

Cómo escribir:
- Español de Colombia, sencillo y respetuoso, de usted. Frases cortas. Sin palabras técnicas; si una es necesaria, explícala en la misma frase.
- Cada recomendación dice el problema encontrado, por qué le importa al propietario (salud de los animales, producción, cumplimiento del ICA) y de dos a cuatro acciones concretas que pueda hacer en su finca.
- Basa las acciones en las orientaciones de referencia que acompañan cada hallazgo. Puedes agregar prácticas de manejo reconocidas, pero no inventes normas, artículos, cifras ni nombres de productos.
- Prioridad ALTA para incumplimientos críticos o de libertades en nivel bajo (la metodología exige corregirlos con urgencia), MEDIA para incumplimientos totales, BAJA para cumplimientos parciales.
- Agrupa los hallazgos del mismo criterio en una sola recomendación y usa el nombre del criterio como título.
- El resumen tiene dos o tres frases: el nivel obtenido, lo más urgente y un mensaje que anime a mejorar.
- No reemplazas al ICA ni al veterinario; cuando una acción requiera un profesional, dilo.`;

export const ESQUEMA_IA = {
  type: 'object',
  required: ['resumen', 'recomendaciones'],
  properties: {
    resumen: { type: 'string' },
    recomendaciones: {
      type: 'array',
      items: {
        type: 'object',
        required: ['prioridad', 'titulo', 'problema', 'porque', 'acciones'],
        properties: {
          prioridad: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'] },
          titulo: { type: 'string' },
          problema: { type: 'string' },
          porque: { type: 'string' },
          acciones: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

/** Datos de la evaluación sin información personal del propietario (RNF27). */
export function datosParaIA({ especie, productor, municipio, resultado, lista }: ContextoRecomendacion) {
  const nivel = (c: string | null) => NIVELES.find((n) => n.codigo === c)?.nombre ?? 'sin dato';
  const corto = (codigo: string) => LIBERTADES.find((x) => x.codigo === codigo)!.corto;
  const porCodigo = new Map(lista.map((i) => [i.codigo, i]));
  return {
    especie,
    tipo_de_productor: productor,
    municipio,
    calificacion: { puntaje_de_0_a_5: resultado.puntaje, nivel: nivel(resultado.nivel) },
    libertades: resultado.libertades.map((l) => ({
      libertad: corto(l.codigo),
      peso_en_la_nota: `${l.peso} %`,
      puntaje: l.puntaje,
      nivel: nivel(l.nivel),
    })),
    hallazgos: resultado.hallazgos.map((h) => ({
      criterio: h.nombreCriterio,
      indicador: h.texto,
      resultado: NOMBRE_RESPUESTA[h.respuesta],
      critico: h.critico,
      libertad: corto(h.libertad),
      libertad_en_nivel_bajo: resultado.libertadesBajas.includes(h.libertad),
      observacion_del_evaluador: h.observacion,
      orientacion_de_referencia: porCodigo.get(h.codigo)!.propietario,
    })),
  };
}

/** Acepta solo una salida completa; si no sirve, la evaluación usa las recomendaciones por reglas. */
export function validarSalidaIA(x: unknown): { resumen: string; recomendaciones: Recomendacion[] } | null {
  const o = x as { resumen?: unknown; recomendaciones?: unknown };
  if (typeof o?.resumen !== 'string' || !o.resumen.trim() || !Array.isArray(o.recomendaciones)) return null;
  const prioridades: Prioridad[] = ['ALTA', 'MEDIA', 'BAJA'];
  const recomendaciones = (o.recomendaciones as Recomendacion[]).filter(
    (r) =>
      prioridades.includes(r?.prioridad) &&
      [r.titulo, r.problema, r.porque].every((t) => typeof t === 'string' && t.trim()) &&
      Array.isArray(r.acciones) && r.acciones.length > 0 && r.acciones.every((a) => typeof a === 'string'),
  );
  if (!recomendaciones.length) return null;
  recomendaciones.sort((a, b) => prioridades.indexOf(a.prioridad) - prioridades.indexOf(b.prioridad));
  return { resumen: o.resumen.trim(), recomendaciones };
}
