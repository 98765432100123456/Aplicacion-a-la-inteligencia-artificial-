import { LIBERTADES, NIVELES, NOMBRE_PRODUCTOR, NOMBRE_SISTEMA, CodigoNivel } from '../../compartido/norma';
import { AVISO_RECOMENDACIONES } from '../../compartido/recomendaciones';
import { FilaTablero } from '../models/tablero';
import { AnalisisTablero } from './analisis';
import { ResumenTablero } from './resumen';

/**
 * Libro de Excel del tablero. Parte de la plantilla public/plantillas/tablero.xlsx (generada por
 * scripts/plantilla-excel/generar.py), que ya trae el diseño, las fotos, los gráficos nativos y las
 * tablas con filtros. Aquí solo se reemplazan los marcadores {{clave}} por los valores y se repiten
 * las filas modelo ({{f.*}} por evaluación, {{h.*}} por hallazgo). Todo ocurre en el navegador:
 * el archivo no pasa por ningún servidor.
 *
 * Los valores se escriben como texto o número, nunca como fórmula, así que un nombre que empiece
 * por "=" no se ejecuta en Excel (sin inyección de fórmulas).
 */

export type ValorCelda = string | number | null;

export interface OpcionesExcel {
  generado: string;
  quien: string;
  /** Periodo y filtros aplicados, en texto. */
  alcance: string;
}

/** Filas fijas de la plantilla (hoja Datos) cuyos gráficos se ajustan a la cantidad real. */
export const FILAS_HALLAZGOS = { desde: 34, hasta: 38 };
export const FILAS_DEPARTAMENTOS = { desde: 42, hasta: 49 };

const nombreNivel = (c: CodigoNivel | null) => NIVELES.find((n) => n.codigo === c)?.nombre ?? '';
const decimal = (n: number) => n.toFixed(2).replace('.', ',');
const flecha = (n: number) => (n > 0 ? '▲' : n < 0 ? '▼' : '=');

/** Fecha ISO (AAAA-MM-DD…) como número de serie de Excel, para que se pueda filtrar y ordenar. */
export function serieFecha(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  return (Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86_400_000;
}

/** Valores de las celdas fijas: portada, indicadores, datos de los gráficos, análisis y metodología. */
export function valoresTablero(r: ResumenTablero, analisis: AnalisisTablero, o: OpcionesExcel): Record<string, ValorCelda> {
  const v: Record<string, ValorCelda> = {
    alcance: `Alcance: ${o.alcance || 'todas las evaluaciones'}`,
    quien: o.quien,
    generado: o.generado,
  };

  const va = r.variacion;
  v['k.evaluaciones'] = r.evaluaciones;
  v['k.evaluaciones.detalle'] = va.evaluaciones !== null
    ? `${flecha(va.evaluaciones)} ${Math.abs(va.evaluaciones)} frente al periodo anterior`
    : `${r.borradores} ${r.borradores === 1 ? 'evaluación en curso' : 'evaluaciones en curso'}`;
  v['k.predios'] = `${r.prediosEvaluados} de ${r.predios}`;
  v['k.predios.detalle'] = r.predios ? `${Math.round((r.prediosEvaluados / r.predios) * 100)} % de los predios registrados` : 'Sin predios registrados';
  v['k.puntaje'] = r.puntajePromedio;
  v['k.puntaje.detalle'] = r.puntajePromedio === null
    ? 'Sin evaluaciones en el periodo'
    : va.puntaje !== null
      ? `${flecha(va.puntaje)} ${decimal(Math.abs(va.puntaje))} · nivel ${nombreNivel(r.nivelPromedio).toLowerCase()}`
      : `Nivel ${nombreNivel(r.nivelPromedio).toLowerCase()} en la escala del ICA`;
  v['k.buenas'] = r.buenasPracticas === null ? null : r.buenasPracticas / 100;
  const buenas = r.porNivel.filter((n) => n.codigo === 'ALTO' || n.codigo === 'EXCELENTE').reduce((s, n) => s + n.cantidad, 0);
  v['k.buenas.detalle'] = va.buenasPracticas !== null
    ? `${flecha(va.buenasPracticas)} ${Math.abs(va.buenasPracticas)} puntos porcentuales`
    : `${buenas} de ${r.evaluaciones} evaluaciones`;

  r.porNivel.forEach((n, i) => {
    v[`niv.${i}.nombre`] = n.nombre;
    v[`niv.${i}.cantidad`] = n.cantidad;
    v[`niv.${i}.pct`] = r.evaluaciones ? n.cantidad / r.evaluaciones : 0;
  });
  r.porLibertad.forEach((l, i) => {
    v[`lib.${i}.nombre`] = l.nombre;
    v[`lib.${i}.peso`] = l.peso / 100;
    v[`lib.${i}.promedio`] = l.promedio;
    v[`lib.${i}.meta`] = 4;
    v[`lib.${i}.encabezado`] = `${l.nombre} (${l.peso} %)`;
  });
  r.porMes.forEach((m, i) => {
    v[`mes.${i}.etiqueta`] = m.etiqueta;
    v[`mes.${i}.cantidad`] = m.cantidad;
    v[`mes.${i}.promedio`] = m.promedio;
  });
  r.hallazgosFrecuentes.slice(0, 5).forEach((h, i) => {
    v[`hal.${i}.nombre`] = h.nombre;
    v[`hal.${i}.veces`] = h.veces;
    v[`hal.${i}.criticos`] = h.criticos;
  });
  r.porDepartamento.slice(0, 8).forEach((d, i) => {
    v[`dep.${i}.nombre`] = d.departamento;
    v[`dep.${i}.evaluaciones`] = d.evaluaciones;
    v[`dep.${i}.promedio`] = d.promedio;
    v[`dep.${i}.nivel`] = nombreNivel(d.nivel);
  });

  r.requierenAtencion.slice(0, 5).forEach((f, i) => {
    v[`at.${i}.predio`] = f.predio;
    v[`at.${i}.municipio`] = `${f.municipio}, ${f.departamento}`;
    v[`at.${i}.fecha`] = serieFecha(f.finalizada);
    v[`at.${i}.puntaje`] = f.puntaje;
    v[`at.${i}.nivel`] = nombreNivel(f.nivel);
  });
  const extra = r.requierenAtencion.length - 5;
  v['at.nota'] = !r.requierenAtencion.length
    ? 'Ningún predio requiere atención: la última evaluación de cada uno está en nivel alto o excelente.'
    : extra > 0 ? `Y ${extra} ${extra === 1 ? 'predio más' : 'predios más'}: ver la hoja Evaluaciones.` : null;

  const titulo = analisis.origen === 'IA' ? `Análisis con inteligencia artificial${analisis.modelo ? ` (${analisis.modelo})` : ''}` : 'Análisis por reglas de la norma';
  v['an.titulo'] = titulo;
  v['an.origen'] = analisis.origen === 'IA'
    ? `${titulo}: Gemini leyó solo las cifras agregadas del tablero.`
    : `${titulo}: se generó con las mismas cifras, sin inteligencia artificial.`;
  v['an.resumen'] = analisis.resumen;
  for (let i = 0; i < 5; i++) {
    v[`an.obs.${i}`] = analisis.observaciones[i] ?? null;
    v[`an.obs.${i}.n`] = analisis.observaciones[i] ? '●' : null;
    v[`an.acc.${i}`] = analisis.acciones[i] ?? null;
    v[`an.acc.${i}.n`] = analisis.acciones[i] ? i + 1 : null;
  }
  v['an.aviso'] = AVISO_RECOMENDACIONES;

  LIBERTADES.forEach((l, i) => {
    v[`met.lib.${i}.nombre`] = l.nombre;
    v[`met.lib.${i}.peso`] = l.peso / 100;
    v[`met.lib.${i}.corto`] = l.corto;
  });
  NIVELES.forEach((n, i) => {
    v[`met.niv.${i}.nombre`] = n.nombre;
    v[`met.niv.${i}.rango`] = n.rango;
  });
  return v;
}

/** Una fila de la hoja Evaluaciones. */
export function valoresEvaluacion(f: FilaTablero): Record<string, ValorCelda> {
  const criterios = [...new Map(f.hallazgos.map((h) => [h.criterio, h.nombre])).entries()];
  const v: Record<string, ValorCelda> = {
    'f.codigo': f.codigo,
    'f.predio': f.predio,
    'f.departamento': f.departamento,
    'f.municipio': f.municipio,
    'f.especie': f.especie,
    'f.sistema': f.sistema ? NOMBRE_SISTEMA[f.sistema] : null,
    'f.productor': NOMBRE_PRODUCTOR[f.productor] ?? null,
    'f.animales': f.animales,
    'f.evaluador': f.evaluador,
    'f.visita': serieFecha(f.fechaVisita),
    'f.finalizada': serieFecha(f.finalizada),
    'f.puntaje': f.puntaje,
    'f.nivel': nombreNivel(f.nivel),
    'f.criterios': criterios.length,
    'f.criticos': f.hallazgos.filter((h) => h.critico).length,
    'f.lista': criterios.map(([, n]) => n).join(' · ') || null,
    'f.origen': f.origenRecomendaciones === 'IA' ? 'Inteligencia artificial' : f.origenRecomendaciones === 'REGLAS' ? 'Reglas de la norma' : null,
  };
  LIBERTADES.forEach((l, i) => (v[`f.lib${i}`] = f.libertades.find((x) => x.codigo === l.codigo)?.puntaje ?? null));
  return v;
}

/** Filas de la hoja Hallazgos: un criterio por evaluación, crítico si alguno de sus indicadores lo es. */
export function valoresHallazgos(filas: FilaTablero[]): Record<string, ValorCelda>[] {
  return filas.flatMap((f) => {
    const porCriterio = new Map<string, { nombre: string; critico: boolean }>();
    for (const h of f.hallazgos) {
      const c = porCriterio.get(h.criterio);
      porCriterio.set(h.criterio, { nombre: h.nombre, critico: (c?.critico ?? false) || h.critico });
    }
    return [...porCriterio].map(([criterio, h]) => ({
      'h.codigo': f.codigo,
      'h.predio': f.predio,
      'h.departamento': f.departamento,
      'h.finalizada': serieFecha(f.finalizada),
      'h.criterio': criterio,
      'h.nombre': h.nombre,
      'h.critico': h.critico ? 'Sí' : 'No',
      'h.nivel': nombreNivel(f.nivel),
    }));
  });
}

// ---------- Relleno del XML de la plantilla ----------

/** Escapa texto para XML y quita caracteres de control que Excel rechaza. */
export function textoXml(t: string): string {
  return t
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const desescapar = (t: string) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const CELDA = /<c r="([A-Z]+)(\d+)"((?: s="\d+")?) t="inlineStr"><is><t[^>]*>([^<]*)<\/t><\/is><\/c>/g;
const MARCADOR = /\{\{([^}]+)\}\}/g;

function celda(ref: string, estilo: string, valor: ValorCelda | undefined): string {
  if (valor === null || valor === undefined || valor === '' || (typeof valor === 'number' && !Number.isFinite(valor))) return `<c r="${ref}"${estilo}/>`;
  if (typeof valor === 'number') return `<c r="${ref}"${estilo}><v>${valor}</v></c>`;
  return `<c r="${ref}"${estilo} t="inlineStr"><is><t xml:space="preserve">${textoXml(valor)}</t></is></c>`;
}

/** Reemplaza los marcadores de las celdas; una celda que es solo un marcador toma el tipo del valor. */
export function rellenarCeldas(xml: string, valores: (clave: string) => ValorCelda | undefined, fila?: number): string {
  return xml.replace(CELDA, (original, col: string, numero: string, estilo: string, crudo: string) => {
    const t = desescapar(crudo);
    const ref = `${col}${fila ?? numero}`;
    if (!t.includes('{{')) return fila ? original.replace(`r="${col}${numero}"`, `r="${ref}"`) : original;
    const solo = /^\{\{([^}]+)\}\}$/.exec(t);
    if (solo) return celda(ref, estilo, valores(solo[1]));
    return celda(ref, estilo, t.replace(MARCADOR, (_, k: string) => String(valores(k) ?? '')));
  });
}

/** Repite la fila modelo que tiene marcadores con el prefijo dado, una vez por registro. */
export function repetirFila(xml: string, prefijo: string, registros: Record<string, ValorCelda>[], globales: Record<string, ValorCelda>): { xml: string; ultima: number } {
  const re = new RegExp(`<row r="(\\d+)"([^>]*)>((?:(?!</row>).)*\\{\\{${prefijo}\\.(?:(?!</row>).)*)</row>`);
  const m = re.exec(xml);
  if (!m) return { xml, ultima: 0 };
  const inicio = Number(m[1]);
  const lista = registros.length ? registros : [{}];
  const filas = lista.map((reg, i) => {
    const n = inicio + i;
    const buscar = (k: string) => (k.startsWith(`${prefijo}.`) ? reg[k] ?? null : globales[k]);
    return `<row r="${n}"${m[2]}>${rellenarCeldas(m[3], buscar, n)}</row>`;
  });
  return { xml: xml.replace(m[0], filas.join('')), ultima: inicio + lista.length - 1 };
}

/** Ajusta el rango de un gráfico a las filas con datos (mínimo una). */
export function ajustarRango(xml: string, rango: { desde: number; hasta: number }, cantidad: number): string {
  const fin = rango.desde + Math.max(1, Math.min(cantidad, rango.hasta - rango.desde + 1)) - 1;
  return xml.replace(new RegExp(`\\$([A-Z]+)\\$${rango.desde}:\\$\\1\\$${rango.hasta}`, 'g'), (_, c: string) => `$${c}$${rango.desde}:$${c}$${fin}`);
}

/** Genera el libro a partir de la plantilla. `plantilla` se puede pasar para pruebas; si no, se descarga del sitio. */
export async function excelTablero(
  r: ResumenTablero,
  filas: FilaTablero[],
  analisis: AnalisisTablero,
  o: OpcionesExcel,
  plantilla?: ArrayBuffer | Uint8Array,
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  if (!plantilla) {
    const respuesta = await fetch(new URL('plantillas/tablero.xlsx', document.baseURI).href);
    if (!respuesta.ok) throw new Error('No se encontró la plantilla del libro de Excel.');
    plantilla = await respuesta.arrayBuffer();
  }
  const zip = await JSZip.loadAsync(plantilla);
  const globales = valoresTablero(r, analisis, o);
  const evaluaciones = filas.map(valoresEvaluacion);
  const hallazgos = valoresHallazgos(filas);
  const filasPorTabla: Record<string, number> = {};

  for (const ruta of Object.keys(zip.files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p))) {
    let xml = await zip.file(ruta)!.async('string');
    let ultima = 0;
    for (const [prefijo, registros, tabla] of [['f', evaluaciones, 'Evaluaciones'], ['h', hallazgos, 'Hallazgos']] as const) {
      const res = repetirFila(xml, prefijo, registros, globales);
      if (res.ultima) {
        xml = res.xml;
        ultima = res.ultima;
        filasPorTabla[tabla] = res.ultima;
      }
    }
    xml = rellenarCeldas(xml, (k) => globales[k]);
    if (ultima) xml = xml.replace(/<dimension ref="([A-Z]+\d+):([A-Z]+)\d+"\/>/, (_, a: string, b: string) => `<dimension ref="${a}:${b}${ultima}"/>`);
    zip.file(ruta, xml);
  }

  // Tablas: encabezados con marcadores y rango hasta la última fila escrita.
  for (const ruta of Object.keys(zip.files).filter((p) => /^xl\/tables\/table\d+\.xml$/.test(p))) {
    let xml = await zip.file(ruta)!.async('string');
    const nombre = /displayName="([^"]+)"/.exec(xml)?.[1] ?? '';
    xml = xml.replace(MARCADOR, (_, k: string) => textoXml(String(globales[k] ?? '')));
    const ultima = filasPorTabla[nombre];
    if (ultima) xml = xml.replace(/ref="([A-Z]+\d+):([A-Z]+)\d+"/g, (_, a: string, b: string) => `ref="${a}:${b}${ultima}"`);
    zip.file(ruta, xml);
  }

  // Gráficos con filas variables: solo las que tienen datos, para no mostrar categorías vacías.
  for (const ruta of Object.keys(zip.files).filter((p) => /^xl\/charts\/chart\d+\.xml$/.test(p))) {
    let xml = await zip.file(ruta)!.async('string');
    xml = ajustarRango(xml, FILAS_HALLAZGOS, Math.min(5, r.hallazgosFrecuentes.length));
    xml = ajustarRango(xml, FILAS_DEPARTAMENTOS, Math.min(8, r.porDepartamento.length));
    zip.file(ruta, xml);
  }

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
  });
}
