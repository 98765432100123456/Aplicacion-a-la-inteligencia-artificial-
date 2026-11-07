// ARCHIVO GENERADO desde compartido/calificacion.ts. No lo edite aquí: edite el original y ejecute node scripts/compartido.mjs

import { Arbol, arbolesDe, recorrerArbol, RutaArbol } from './escenarios';
import { Indicador, Respuesta, VALOR_RESPUESTA } from './lista-chequeo';
import { CodigoLibertad, CodigoNivel, LIBERTADES, NIVELES, nivelDePuntaje } from './norma';

export interface ResultadoLibertad {
  codigo: CodigoLibertad;
  nombre: string;
  peso: number;
  /** De 0 a 5; null si todos sus indicadores se marcaron "No aplica". */
  puntaje: number | null;
  nivel: CodigoNivel | null;
}

export interface Hallazgo {
  codigo: string;
  criterio: string;
  nombreCriterio: string;
  libertad: CodigoLibertad;
  texto: string;
  respuesta: Respuesta;
  critico: boolean;
  observacion: string | null;
}

/** Resultado de un criterio calificado con su árbol de escenarios. */
export interface ResultadoArbol {
  arbol: string;
  criterio: string;
  libertad: CodigoLibertad;
  diagrama: number;
  titulo: string;
  puntos: number;
  maximo: number;
  /** null cuando el diagrama lo marca como "No aplica". */
  nivel: CodigoNivel | null;
  /** Preguntas y respuestas del recorrido, con los puntos de cada una. */
  pasos: { pregunta: string; respuesta: string; puntos: number }[];
  observacion: string | null;
}

export interface Resultado {
  puntaje: number;
  nivel: CodigoNivel;
  libertades: ResultadoLibertad[];
  /** Libertades en nivel bajo: exigen acciones correctivas urgentes. */
  libertadesBajas: CodigoLibertad[];
  /** Indicadores que no se cumplen o se cumplen en parte, primero los críticos. */
  hallazgos: Hallazgo[];
  /** Criterios calificados con árbol de escenarios (no existe en evaluaciones anteriores). */
  escenarios?: ResultadoArbol[];
}

export interface RespuestaIndicador {
  respuesta: Respuesta;
  observacion?: string | null;
}

export type RespuestasArboles = Record<string, RutaArbol | undefined>;

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Un criterio con diagrama se califica con su árbol. Se exceptúan las evaluaciones
 * anteriores que ya respondieron todos sus indicadores y no empezaron el árbol.
 */
export function usaArboles(criterio: string, lista: Pick<Indicador, 'codigo' | 'criterio'>[], respuestas: Record<string, RespuestaIndicador | undefined>, escenarios: RespuestasArboles): boolean {
  const arboles = arbolesDe(criterio);
  if (!arboles.length) return false;
  if (arboles.some((a) => Object.keys(escenarios[a.id]?.ruta ?? {}).length)) return true;
  const indicadores = lista.filter((i) => i.criterio === criterio);
  return !indicadores.every((i) => respuestas[i.codigo]);
}

/** Criterios de la lista que se califican con árbol de escenarios, en el orden de la lista. */
export function arbolesPara(lista: Pick<Indicador, 'codigo' | 'criterio'>[], respuestas: Record<string, RespuestaIndicador | undefined> = {}, escenarios: RespuestasArboles = {}): Arbol[] {
  const criterios = [...new Set(lista.map((i) => i.criterio))];
  return criterios.filter((c) => usaArboles(c, lista, respuestas, escenarios)).flatMap(arbolesDe);
}

/** Indicadores sin responder; la evaluación no se puede finalizar mientras existan. */
export function pendientes(lista: Indicador[], respuestas: Record<string, RespuestaIndicador | undefined>, escenarios: RespuestasArboles = {}): Indicador[] {
  return lista.filter((i) => !usaArboles(i.criterio, lista, respuestas, escenarios) && !respuestas[i.codigo]);
}

/** Árboles de escenarios sin terminar de recorrer. */
export function arbolesPendientes(lista: Indicador[], respuestas: Record<string, RespuestaIndicador | undefined>, escenarios: RespuestasArboles = {}): Arbol[] {
  return arbolesPara(lista, respuestas, escenarios).filter((a) => !recorrerArbol(a, escenarios[a.id]?.ruta).completo);
}

/**
 * Calcula el puntaje de 0 a 5: cada libertad promedia sus indicadores según su peso,
 * y el total pondera las libertades con los porcentajes de la norma (20, 50, 15 y 15).
 * Las libertades sin indicadores aplicables se excluyen y su peso se reparte entre las demás.
 */
export function calificar(
  lista: Indicador[],
  respuestas: Record<string, RespuestaIndicador | undefined>,
  escenarios: RespuestasArboles = {},
): Resultado {
  const conArbol = new Set(arbolesPara(lista, respuestas, escenarios).map((a) => a.criterio));
  const escenariosResultado: ResultadoArbol[] = [...conArbol].flatMap((criterio) =>
    arbolesDe(criterio).map((a) => {
      const e = recorrerArbol(a, escenarios[a.id]?.ruta);
      return {
        arbol: a.id, criterio, libertad: lista.find((i) => i.criterio === criterio)!.libertad, diagrama: a.diagrama, titulo: a.titulo,
        puntos: e.puntos, maximo: e.maximo, nivel: e.nivel,
        pasos: e.pasos.map((x) => ({ pregunta: x.pregunta.texto, respuesta: x.opcion.texto, puntos: x.opcion.puntos })),
        observacion: escenarios[a.id]?.observacion?.trim() || null,
      };
    }),
  );

  const libertades: ResultadoLibertad[] = LIBERTADES.map((l) => {
    let suma = 0;
    let pesos = 0;
    for (const i of lista.filter((x) => x.libertad === l.codigo && !conArbol.has(x.criterio))) {
      const valor = VALOR_RESPUESTA[respuestas[i.codigo]?.respuesta ?? 'NO_APLICA'];
      if (valor === null) continue;
      suma += valor * i.peso;
      pesos += i.peso;
    }
    // Cada árbol vale lo que pesaban los indicadores de su criterio, repartido entre sus árboles.
    for (const r of escenariosResultado.filter((x) => x.libertad === l.codigo && x.nivel !== null)) {
      const peso = lista.filter((i) => i.criterio === r.criterio).reduce((a, i) => a + i.peso, 0) / arbolesDe(r.criterio).length;
      suma += (r.maximo ? r.puntos / r.maximo : 0) * peso;
      pesos += peso;
    }
    const puntaje = pesos ? redondear((suma / pesos) * 5) : null;
    return { codigo: l.codigo, nombre: l.nombre, peso: l.peso, puntaje, nivel: puntaje === null ? null : nivelDePuntaje(puntaje).codigo };
  });

  const aplicables = libertades.filter((l) => l.puntaje !== null);
  const pesoTotal = aplicables.reduce((a, l) => a + l.peso, 0);
  const puntaje = pesoTotal ? redondear(aplicables.reduce((a, l) => a + (l.puntaje ?? 0) * l.peso, 0) / pesoTotal) : 0;

  const hallazgos: Hallazgo[] = lista
    .filter((i) => ['NO_CUMPLE', 'PARCIAL'].includes(respuestas[i.codigo]?.respuesta ?? ''))
    .map((i) => ({
      codigo: i.codigo,
      criterio: i.criterio,
      nombreCriterio: i.nombreCriterio,
      libertad: i.libertad,
      texto: i.texto,
      respuesta: respuestas[i.codigo]!.respuesta,
      critico: i.critico,
      observacion: respuestas[i.codigo]?.observacion ?? null,
    }))
    .filter((h) => !conArbol.has(h.criterio));

  // Un criterio con árbol en nivel medio o bajo es un hallazgo del criterio completo.
  for (const r of escenariosResultado.filter((x) => x.nivel === 'MEDIO' || x.nivel === 'BAJO')) {
    const indicadores = lista.filter((i) => i.criterio === r.criterio);
    hallazgos.push({
      codigo: indicadores[0].codigo,
      criterio: r.criterio,
      nombreCriterio: indicadores[0].nombreCriterio,
      libertad: r.libertad,
      texto: `${r.titulo}: ${r.puntos} de ${r.maximo} puntos, nivel ${NIVELES.find((n) => n.codigo === r.nivel)!.nombre.toLowerCase()}`,
      respuesta: r.nivel === 'BAJO' ? 'NO_CUMPLE' : 'PARCIAL',
      critico: r.nivel === 'BAJO' && indicadores.some((i) => i.critico),
      observacion: r.observacion,
    });
  }
  hallazgos.sort((a, b) => Number(b.critico) - Number(a.critico) || Number(b.respuesta === 'NO_CUMPLE') - Number(a.respuesta === 'NO_CUMPLE'));

  return {
    puntaje,
    nivel: nivelDePuntaje(puntaje).codigo,
    libertades,
    libertadesBajas: libertades.filter((l) => l.nivel === 'BAJO').map((l) => l.codigo),
    hallazgos,
    escenarios: escenariosResultado,
  };
}

/** Lo que falta por responder, en una frase; null si la evaluación ya se puede finalizar. */
export function faltantes(lista: Indicador[], respuestas: Record<string, RespuestaIndicador | undefined>, escenarios: RespuestasArboles = {}): string | null {
  const arboles = arbolesPendientes(lista, respuestas, escenarios);
  const indicadores = pendientes(lista, respuestas, escenarios);
  const partes: string[] = [];
  if (arboles.length) partes.push(`${arboles.length} ${arboles.length === 1 ? 'criterio' : 'criterios'} por calificar (${arboles.map((a) => a.titulo).join(', ')})`);
  if (indicadores.length) partes.push(`${indicadores.length} ${indicadores.length === 1 ? 'indicador' : 'indicadores'} por responder (${indicadores.map((i) => i.codigo).join(', ')})`);
  return partes.length ? `Faltan ${partes.join(' y ')}.` : null;
}
