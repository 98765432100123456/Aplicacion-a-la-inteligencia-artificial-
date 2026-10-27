// ARCHIVO GENERADO desde compartido/recomendaciones.ts. No lo edite aquí: edite el original y ejecute node scripts/compartido.mjs

import { Resultado } from './calificacion';
import { Indicador } from './lista-chequeo';
import { NIVELES } from './norma';

export type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';

export interface Recomendacion {
  prioridad: Prioridad;
  titulo: string;
  problema: string;
  porque: string;
  acciones: string[];
}

export interface Recomendaciones {
  /** IA: generadas por el modelo de lenguaje. REGLAS: generadas por el sistema sin IA. */
  origen: 'IA' | 'REGLAS';
  modelo: string | null;
  resumen: string;
  recomendaciones: Recomendacion[];
}

/** Aviso que acompaña siempre a las recomendaciones (RNF25). */
export const AVISO_RECOMENDACIONES =
  'Estas recomendaciones son una orientación para mejorar el bienestar de sus animales. No reemplazan el concepto oficial del ICA ni la evaluación del personal autorizado; consulte con su médico veterinario antes de hacer cambios importantes.';

export const NOMBRE_PRIORIDAD: Record<Prioridad, string> = { ALTA: 'Atender ya', MEDIA: 'Atender pronto', BAJA: 'Mejorar cuando pueda' };

/**
 * Recomendaciones sin IA, una por cada criterio con hallazgos, armadas con la
 * explicación del criterio. Se usan cuando el servicio de IA no está configurado
 * o no responde (RNF26).
 */
export function recomendacionesPorReglas(resultado: Resultado, lista: Indicador[]): Recomendaciones {
  const porCodigo = new Map(lista.map((i) => [i.codigo, i]));
  const porCriterio = new Map<string, Resultado['hallazgos']>();
  for (const h of resultado.hallazgos) porCriterio.set(h.criterio, [...(porCriterio.get(h.criterio) ?? []), h]);
  const recomendaciones: Recomendacion[] = [...porCriterio.values()].map((hallazgos) => {
    const h = hallazgos[0];
    const i = porCodigo.get(h.codigo)!;
    const prioridad: Prioridad =
      hallazgos.some((x) => x.critico) || resultado.libertadesBajas.includes(h.libertad)
        ? 'ALTA'
        : hallazgos.some((x) => x.respuesta === 'NO_CUMPLE') ? 'MEDIA' : 'BAJA';
    return {
      prioridad,
      titulo: h.nombreCriterio,
      problema: i.propietario.problema,
      porque: i.propietario.porque,
      acciones: [...i.propietario.acciones],
    };
  });
  const orden: Prioridad[] = ['ALTA', 'MEDIA', 'BAJA'];
  recomendaciones.sort((a, b) => orden.indexOf(a.prioridad) - orden.indexOf(b.prioridad));

  const nivel = NIVELES.find((n) => n.codigo === resultado.nivel)!.nombre.toLowerCase();
  const urgentes = recomendaciones.filter((r) => r.prioridad === 'ALTA').length;
  const resumen = !recomendaciones.length
    ? `Su finca obtuvo un nivel ${nivel} de bienestar animal y cumple todos los puntos revisados. Siga con las buenas prácticas que ya tiene.`
    : `Su finca obtuvo un nivel ${nivel} de bienestar animal. Encontramos ${recomendaciones.length} ${recomendaciones.length === 1 ? 'aspecto' : 'aspectos'} por mejorar` +
      (urgentes ? `; ${urgentes} ${urgentes === 1 ? 'necesita' : 'necesitan'} atención inmediata.` : '.');

  return { origen: 'REGLAS', modelo: null, resumen, recomendaciones };
}
