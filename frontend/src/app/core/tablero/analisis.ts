import { NIVELES, puntajeTexto } from '../../compartido/norma';
import { ResumenTablero } from './resumen';

/** Lectura del tablero: un resumen, lo que se observa y qué conviene hacer. */
export interface AnalisisTablero {
  origen: 'IA' | 'REGLAS';
  modelo: string | null;
  resumen: string;
  observaciones: string[];
  acciones: string[];
}

export const INSTRUCCIONES_ANALISIS = `Eres un analista de bienestar animal del ICA (Instituto Colombiano Agropecuario).
Recibes las cifras agregadas de las evaluaciones de bienestar de bovinos y búfalos hechas con la metodología del ICA (versión 2.0, 2023): número de evaluaciones, puntaje promedio de 0 a 5, distribución por nivel (Bajo < 3,0; Medio 3,0-3,9; Alto 4,0-4,5; Excelente 4,6-5,0), promedio por libertad y criterios con hallazgos más frecuentes.

Escribe para el coordinador de los evaluadores:
- Español de Colombia, claro y profesional, sin tecnicismos innecesarios.
- "resumen": dos o tres frases con el estado general y lo más importante.
- "observaciones": de dos a cuatro hallazgos concretos que se desprenden de las cifras (por ejemplo, la libertad más baja o el criterio que más se repite). Usa solo los números que recibes; no inventes cifras ni normas.
- "acciones": de dos a cuatro acciones para los evaluadores y los productores, ordenadas de la más urgente a la menos urgente.
- Si hay pocas evaluaciones, dilo: las conclusiones son preliminares.`;

export const ESQUEMA_ANALISIS = {
  type: 'object',
  required: ['resumen', 'observaciones', 'acciones'],
  properties: {
    resumen: { type: 'string' },
    observaciones: { type: 'array', items: { type: 'string' } },
    acciones: { type: 'array', items: { type: 'string' } },
  },
};

const nivel = (c: string | null) => NIVELES.find((n) => n.codigo === c)?.nombre ?? 'sin dato';

/** Cifras para el modelo: solo agregados, sin nombres de predios, propietarios ni evaluadores. */
export function datosAnalisis(r: ResumenTablero) {
  return {
    evaluaciones_finalizadas: r.evaluaciones,
    predios_registrados: r.predios,
    predios_evaluados: r.prediosEvaluados,
    puntaje_promedio: r.puntajePromedio,
    nivel_promedio: nivel(r.nivelPromedio),
    porcentaje_alto_o_excelente: r.buenasPracticas,
    por_nivel: Object.fromEntries(r.porNivel.map((n) => [n.nombre, n.cantidad])),
    promedio_por_libertad: r.porLibertad.map((l) => ({ libertad: l.nombre, peso: `${l.peso} %`, promedio: l.promedio })),
    tendencia_mensual: r.porMes.map((m) => ({ mes: m.etiqueta, evaluaciones: m.cantidad, promedio: m.promedio })),
    criterios_con_mas_hallazgos: r.hallazgosFrecuentes.map((h) => ({ criterio: h.nombre, evaluaciones: h.veces, criticos: h.criticos })),
  };
}

const textoValido = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** Acepta la respuesta del modelo solo si cumple el esquema y los límites; si no, null. */
export function validarAnalisis(x: unknown): Omit<AnalisisTablero, 'origen' | 'modelo'> | null {
  const o = x as Record<string, unknown> | null;
  if (!o || !textoValido(o['resumen'], 600)) return null;
  const lista = (v: unknown) =>
    Array.isArray(v) && v.length >= 1 && v.length <= 5 && v.every((t) => textoValido(t, 300)) ? (v as string[]).map((t) => t.trim()) : null;
  const observaciones = lista(o['observaciones']);
  const acciones = lista(o['acciones']);
  if (!observaciones || !acciones) return null;
  return { resumen: (o['resumen'] as string).trim(), observaciones, acciones };
}

/** Análisis sin IA, con las mismas cifras: se usa cuando el modelo no está disponible. */
export function analisisPorReglas(r: ResumenTablero): AnalisisTablero {
  if (!r.evaluaciones) {
    return {
      origen: 'REGLAS', modelo: null,
      resumen: 'Aún no hay evaluaciones finalizadas en este periodo, así que no hay cifras que analizar.',
      observaciones: [`Hay ${r.predios} predios registrados y ${r.borradores} evaluaciones en curso.`],
      acciones: ['Finalizar las evaluaciones en curso para obtener el primer diagnóstico.'],
    };
  }
  const conDatos = r.porLibertad.filter((l) => l.promedio !== null);
  const baja = [...conDatos].sort((a, b) => a.promedio! - b.promedio!)[0];
  const top = r.hallazgosFrecuentes[0];
  const bajos = r.porNivel.find((n) => n.codigo === 'BAJO')!.cantidad;
  const observaciones = [
    baja ? `La libertad con el promedio más bajo es ${baja.nombre} (${puntajeTexto(baja.promedio!)} de 5), que pesa el ${baja.peso} % de la calificación.` : null,
    top ? `El criterio con hallazgos más frecuente es ${top.nombre}: aparece en ${top.veces} de ${r.evaluaciones} evaluaciones.` : null,
    bajos ? `${bajos} ${bajos === 1 ? 'evaluación quedó' : 'evaluaciones quedaron'} en nivel bajo y requieren seguimiento prioritario.` : null,
    r.evaluaciones < 5 ? 'Con menos de cinco evaluaciones, estas conclusiones son preliminares.' : null,
  ].filter((t): t is string => !!t);
  const acciones = [
    bajos ? 'Programar una visita de seguimiento a los predios en nivel bajo y acordar un plan de mejora con el propietario.' : null,
    top ? `Reforzar con los productores las prácticas del criterio ${top.nombre}.` : null,
    baja ? `Revisar en las próximas visitas los indicadores de ${baja.nombre}.` : null,
    'Finalizar las evaluaciones en curso para ampliar la muestra.',
  ].filter((t): t is string => !!t).slice(0, 4);
  return {
    origen: 'REGLAS', modelo: null,
    resumen: `Se analizaron ${r.evaluaciones} evaluaciones de ${r.prediosEvaluados} predios. El puntaje promedio es ${puntajeTexto(r.puntajePromedio!)} de 5 (nivel ${nivel(r.nivelPromedio).toLowerCase()}) y el ${r.buenasPracticas} % alcanzó nivel alto o excelente.`,
    observaciones,
    acciones,
  };
}
