import { Indicador, Respuesta, VALOR_RESPUESTA } from './lista-chequeo';
import { CodigoLibertad, CodigoNivel, LIBERTADES, nivelDePuntaje } from './norma';

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

export interface Resultado {
  puntaje: number;
  nivel: CodigoNivel;
  libertades: ResultadoLibertad[];
  /** Libertades en nivel bajo: exigen acciones correctivas urgentes. */
  libertadesBajas: CodigoLibertad[];
  /** Indicadores que no se cumplen o se cumplen en parte, primero los críticos. */
  hallazgos: Hallazgo[];
}

export interface RespuestaIndicador {
  respuesta: Respuesta;
  observacion?: string | null;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Indicadores sin responder; la evaluación no se puede finalizar mientras existan. */
export function pendientes(lista: Indicador[], respuestas: Record<string, RespuestaIndicador | undefined>): Indicador[] {
  return lista.filter((i) => !respuestas[i.codigo]);
}

/**
 * Calcula el puntaje de 0 a 5: cada libertad promedia sus indicadores según su peso,
 * y el total pondera las libertades con los porcentajes de la norma (20, 50, 15 y 15).
 * Las libertades sin indicadores aplicables se excluyen y su peso se reparte entre las demás.
 */
export function calificar(lista: Indicador[], respuestas: Record<string, RespuestaIndicador | undefined>): Resultado {
  const libertades: ResultadoLibertad[] = LIBERTADES.map((l) => {
    let suma = 0;
    let pesos = 0;
    for (const i of lista.filter((x) => x.libertad === l.codigo)) {
      const valor = VALOR_RESPUESTA[respuestas[i.codigo]?.respuesta ?? 'NO_APLICA'];
      if (valor === null) continue;
      suma += valor * i.peso;
      pesos += i.peso;
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
    .sort((a, b) => Number(b.critico) - Number(a.critico) || Number(b.respuesta === 'NO_CUMPLE') - Number(a.respuesta === 'NO_CUMPLE'));

  return {
    puntaje,
    nivel: nivelDePuntaje(puntaje).codigo,
    libertades,
    libertadesBajas: libertades.filter((l) => l.nivel === 'BAJO').map((l) => l.codigo),
    hallazgos,
  };
}
