import { CodigoLibertad, CodigoNivel, LIBERTADES, NIVELES, NOMBRE_PRODUCTOR, NOMBRE_SISTEMA, nivelDePuntaje } from '../../compartido/norma';
import { DatosTablero, FilaTablero } from '../models/tablero';

/** Periodo que se analiza; las cifras de predios y borradores no dependen de él. */
export type Periodo = 'todo' | '12m' | '90d';

export const NOMBRE_PERIODO: Record<Periodo, string> = { todo: 'Todo', '12m': 'Últimos 12 meses', '90d': 'Últimos 90 días' };

export interface ResumenTablero {
  periodo: Periodo;
  predios: number;
  prediosEvaluados: number;
  borradores: number;
  evaluaciones: number;
  puntajePromedio: number | null;
  nivelPromedio: CodigoNivel | null;
  /** Porcentaje de evaluaciones en nivel alto o excelente. */
  buenasPracticas: number | null;
  porNivel: { codigo: CodigoNivel; nombre: string; cantidad: number }[];
  porLibertad: { codigo: CodigoLibertad; nombre: string; peso: number; promedio: number | null }[];
  porMes: { mes: string; etiqueta: string; cantidad: number; promedio: number | null }[];
  hallazgosFrecuentes: { criterio: string; nombre: string; veces: number; criticos: number }[];
  recientes: FilaTablero[];
}

const redondear = (n: number) => Math.round(n * 100) / 100;
const promedio = (xs: number[]) => (xs.length ? redondear(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Evaluaciones que caen dentro del periodo, según la fecha de finalización. */
export function filtrarPeriodo(filas: FilaTablero[], periodo: Periodo, hoy = new Date()): FilaTablero[] {
  if (periodo === 'todo') return filas;
  const desde = new Date(hoy);
  if (periodo === '12m') desde.setMonth(desde.getMonth() - 12);
  else desde.setDate(desde.getDate() - 90);
  return filas.filter((f) => new Date(f.finalizada) >= desde);
}

/** Cifras del tablero: totales, distribución por nivel y libertad, tendencia mensual y hallazgos más frecuentes. */
export function resumirTablero(datos: DatosTablero, periodo: Periodo = 'todo', hoy = new Date()): ResumenTablero {
  const filas = filtrarPeriodo(datos.evaluaciones, periodo, hoy).sort((a, b) => b.finalizada.localeCompare(a.finalizada));
  const puntajes = filas.map((f) => f.puntaje);
  const general = promedio(puntajes);

  const porNivel = NIVELES.map((n) => ({ codigo: n.codigo, nombre: n.nombre, cantidad: filas.filter((f) => f.nivel === n.codigo).length }));
  const buenas = filas.filter((f) => f.nivel === 'ALTO' || f.nivel === 'EXCELENTE').length;

  const porLibertad = LIBERTADES.map((l) => ({
    codigo: l.codigo,
    nombre: l.corto,
    peso: l.peso,
    promedio: promedio(filas.flatMap((f) => f.libertades.filter((x) => x.codigo === l.codigo && x.puntaje !== null).map((x) => x.puntaje!))),
  }));

  // Los últimos seis meses, incluido el actual, aunque alguno no tenga evaluaciones.
  const porMes = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const delMes = filas.filter((f) => f.finalizada.slice(0, 7) === mes);
    return { mes, etiqueta: `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, cantidad: delMes.length, promedio: promedio(delMes.map((f) => f.puntaje)) };
  });

  const conteo = new Map<string, { criterio: string; nombre: string; veces: number; criticos: number }>();
  for (const f of filas) {
    // Cada criterio cuenta una vez por evaluación, aunque tenga varios indicadores con hallazgo.
    for (const h of new Map(f.hallazgos.map((x) => [x.criterio, x])).values()) {
      const c = conteo.get(h.criterio) ?? { criterio: h.criterio, nombre: h.nombre, veces: 0, criticos: 0 };
      c.veces += 1;
      if (f.hallazgos.some((x) => x.criterio === h.criterio && x.critico)) c.criticos += 1;
      conteo.set(h.criterio, c);
    }
  }
  const hallazgosFrecuentes = [...conteo.values()].sort((a, b) => b.veces - a.veces || b.criticos - a.criticos || a.nombre.localeCompare(b.nombre, 'es')).slice(0, 5);

  return {
    periodo,
    predios: datos.predios,
    prediosEvaluados: new Set(filas.map((f) => f.predio)).size,
    borradores: datos.borradores,
    evaluaciones: filas.length,
    puntajePromedio: general,
    nivelPromedio: general === null ? null : nivelDePuntaje(general).codigo,
    buenasPracticas: filas.length ? Math.round((buenas / filas.length) * 100) : null,
    porNivel,
    porLibertad,
    porMes,
    hallazgosFrecuentes,
    recientes: filas.slice(0, 8),
  };
}

// ---------- Exportación a Excel (CSV) ----------

const decimal = (n: number | null) => (n === null ? '' : n.toFixed(2).replace('.', ','));

/**
 * Celda de CSV segura: entre comillas, con las comillas internas duplicadas, y con un apóstrofo
 * delante de =, +, -, @, tabulación o retorno, para que Excel no la ejecute como fórmula
 * (inyección de fórmulas en CSV).
 */
export function celdaCsv(valor: string | number | null): string {
  let texto = valor === null ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

/** Evaluaciones en CSV para Excel en español: separador punto y coma, coma decimal y BOM UTF-8. */
export function evaluacionesCsv(filas: FilaTablero[]): string {
  const encabezados = [
    'Código', 'Predio', 'Departamento', 'Municipio', 'Especie', 'Sistema productivo', 'Tipo de productor', 'Animales',
    'Evaluador', 'Fecha de visita', 'Fecha de finalización', 'Puntaje (0-5)', 'Nivel',
    ...LIBERTADES.map((l) => `${l.corto} (${l.peso} %)`),
    'Criterios con hallazgos', 'Hallazgos críticos', 'Recomendaciones',
  ];
  const nivel = (c: CodigoNivel) => NIVELES.find((n) => n.codigo === c)!.nombre;
  const lineas = filas.map((f) =>
    [
      f.codigo, f.predio, f.departamento, f.municipio, f.especie, f.sistema ? NOMBRE_SISTEMA[f.sistema] : '', NOMBRE_PRODUCTOR[f.productor], f.animales,
      f.evaluador, f.fechaVisita, f.finalizada.slice(0, 10), decimal(f.puntaje), nivel(f.nivel),
      ...LIBERTADES.map((l) => decimal(f.libertades.find((x) => x.codigo === l.codigo)?.puntaje ?? null)),
      [...new Set(f.hallazgos.map((h) => h.nombre))].join(' | '),
      f.hallazgos.filter((h) => h.critico).length,
      f.origenRecomendaciones === 'IA' ? 'Inteligencia artificial' : f.origenRecomendaciones === 'REGLAS' ? 'Reglas de la norma' : '',
    ]
      .map((v) => celdaCsv(v as string | number | null))
      .join(';'),
  );
  return '﻿' + [encabezados.map(celdaCsv).join(';'), ...lineas].join('\r\n') + '\r\n';
}
