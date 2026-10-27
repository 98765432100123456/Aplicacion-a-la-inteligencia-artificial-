import { Resultado } from './calificacion';
import { Indicador } from './lista-chequeo';
import { LIBERTADES, NIVELES } from './norma';

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
 * Recomendaciones sin IA, armadas con las explicaciones de cada indicador. Se usan
 * cuando el servicio de IA no está configurado o no responde (RNF26).
 */
export function recomendacionesPorReglas(resultado: Resultado, lista: Indicador[]): Recomendaciones {
  const porCodigo = new Map(lista.map((i) => [i.codigo, i]));
  const recomendaciones: Recomendacion[] = resultado.hallazgos.map((h) => {
    const i = porCodigo.get(h.codigo)!;
    const prioridad: Prioridad =
      h.critico || resultado.libertadesBajas.includes(h.libertad) ? 'ALTA' : h.respuesta === 'NO_CUMPLE' ? 'MEDIA' : 'BAJA';
    return {
      prioridad,
      titulo: LIBERTADES.find((l) => l.codigo === h.libertad)!.corto,
      problema: i.propietario.problema,
      porque: i.propietario.porque,
      acciones: i.propietario.acciones,
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
