import { CodigoLibertad, CodigoNivel, LIBERTADES, NIVELES, NOMBRE_PRODUCTOR, NOMBRE_SISTEMA, nivelDePuntaje, Sistema } from '../../compartido/norma';
import { DatosTablero, FilaTablero } from '../models/tablero';

/** Periodo que se analiza; las cifras de predios y borradores no dependen de él. */
export type Periodo = 'todo' | '12m' | '90d';

export const NOMBRE_PERIODO: Record<Periodo, string> = { todo: 'Todo', '12m': 'Últimos 12 meses', '90d': 'Últimos 90 días' };

/** Filtros adicionales del tablero; null o vacío significa todos. */
export interface FiltrosTablero {
  departamento?: string | null;
  sistema?: Sistema | null;
}

/** Cambio frente al periodo anterior de la misma duración; null si no hay con qué comparar. */
export interface Variacion {
  evaluaciones: number | null;
  puntaje: number | null;
  buenasPracticas: number | null;
}

export interface ResumenTablero {
  periodo: Periodo;
  variacion: Variacion;
  porDepartamento: { departamento: string; evaluaciones: number; promedio: number; nivel: CodigoNivel }[];
  /** Última evaluación de cada predio en nivel bajo o medio, la más baja primero. */
  requierenAtencion: FilaTablero[];
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
export function filtrarPeriodo(filas: FilaTablero[], periodo: Periodo, hoy = new Date(), filtros: FiltrosTablero = {}): FilaTablero[] {
  const visibles = filas.filter(
    (f) => (!filtros.departamento || f.departamento === filtros.departamento) && (!filtros.sistema || f.sistema === filtros.sistema),
  );
  if (periodo === 'todo') return visibles;
  const [desde] = ventana(periodo, hoy, 0);
  return visibles.filter((f) => new Date(f.finalizada) >= desde);
}

/** Inicio y fin de la ventana del periodo; desplazamiento 1 es la ventana anterior. */
function ventana(periodo: Exclude<Periodo, 'todo'>, hoy: Date, desplazamiento: number): [Date, Date] {
  const fin = new Date(hoy);
  const inicio = new Date(hoy);
  if (periodo === '12m') {
    fin.setMonth(fin.getMonth() - 12 * desplazamiento);
    inicio.setMonth(inicio.getMonth() - 12 * (desplazamiento + 1));
  } else {
    fin.setDate(fin.getDate() - 90 * desplazamiento);
    inicio.setDate(inicio.getDate() - 90 * (desplazamiento + 1));
  }
  return [inicio, fin];
}

/** Departamentos y sistemas presentes en los datos, para las listas de filtros. */
export function opcionesFiltro(datos: DatosTablero) {
  const departamentos = [...new Set(datos.evaluaciones.map((f) => f.departamento))].sort((a, b) => a.localeCompare(b, 'es'));
  const sistemas = [...new Set(datos.evaluaciones.map((f) => f.sistema).filter((s): s is Sistema => !!s))];
  return { departamentos, sistemas };
}

/** Cifras del tablero: totales, distribución por nivel y libertad, tendencia mensual y hallazgos más frecuentes. */
export function resumirTablero(datos: DatosTablero, periodo: Periodo = 'todo', hoy = new Date(), filtros: FiltrosTablero = {}): ResumenTablero {
  const filas = filtrarPeriodo(datos.evaluaciones, periodo, hoy, filtros).sort((a, b) => b.finalizada.localeCompare(a.finalizada));
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

  // Los últimos doce meses, incluido el actual, aunque alguno no tenga evaluaciones. La tendencia
  // usa todas las evaluaciones filtradas, no solo las del periodo, para que siempre tenga contexto.
  const tendencia = filtrarPeriodo(datos.evaluaciones, 'todo', hoy, filtros);
  const porMes = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const delMes = tendencia.filter((f) => f.finalizada.slice(0, 7) === mes);
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

  // Comparación con la ventana anterior de la misma duración.
  let variacion: Variacion = { evaluaciones: null, puntaje: null, buenasPracticas: null };
  if (periodo !== 'todo') {
    const [inicio, fin] = ventana(periodo, hoy, 1);
    const antes = datos.evaluaciones.filter((f) => {
      const d = new Date(f.finalizada);
      return d >= inicio && d < fin && (!filtros.departamento || f.departamento === filtros.departamento) && (!filtros.sistema || f.sistema === filtros.sistema);
    });
    const promedioAntes = promedio(antes.map((f) => f.puntaje));
    const buenasAntes = antes.length ? Math.round((antes.filter((f) => f.nivel === 'ALTO' || f.nivel === 'EXCELENTE').length / antes.length) * 100) : null;
    const actualBuenas = filas.length ? Math.round((buenas / filas.length) * 100) : null;
    variacion = {
      evaluaciones: filas.length - antes.length,
      puntaje: general !== null && promedioAntes !== null ? redondear(general - promedioAntes) : null,
      buenasPracticas: actualBuenas !== null && buenasAntes !== null ? actualBuenas - buenasAntes : null,
    };
  }

  const departamentos = new Map<string, number[]>();
  for (const f of filas) departamentos.set(f.departamento, [...(departamentos.get(f.departamento) ?? []), f.puntaje]);
  const porDepartamento = [...departamentos].map(([departamento, ps]) => {
    const p = promedio(ps)!;
    return { departamento, evaluaciones: ps.length, promedio: p, nivel: nivelDePuntaje(p).codigo };
  }).sort((a, b) => b.evaluaciones - a.evaluaciones || a.departamento.localeCompare(b.departamento, 'es'));

  // La evaluación más reciente de cada predio decide si requiere atención.
  const ultimaPorPredio = new Map<string, FilaTablero>();
  for (const f of filas) if (!ultimaPorPredio.has(f.predio)) ultimaPorPredio.set(f.predio, f);
  const requierenAtencion = [...ultimaPorPredio.values()].filter((f) => f.nivel === 'BAJO' || f.nivel === 'MEDIO').sort((a, b) => a.puntaje - b.puntaje);

  return {
    periodo,
    variacion,
    porDepartamento,
    requierenAtencion,
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
