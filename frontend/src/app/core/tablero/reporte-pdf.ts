import { NIVELES, puntajeTexto } from '../../compartido/norma';
import { AVISO_RECOMENDACIONES } from '../../compartido/recomendaciones';
import { AnalisisTablero } from './analisis';
import { NOMBRE_PERIODO, ResumenTablero } from './resumen';

/** Reporte del tablero en PDF (pdfmake), con las mismas cifras de la pantalla y el análisis, si se generó. */

const VERDE = '#1d6b40';
const SUAVE = '#59625c';
const LINEA = '#dde1dc';
const COLOR_NIVEL: Record<string, string> = { BAJO: '#b42318', MEDIO: '#8a5a00', ALTO: '#1d6b40', EXCELENTE: '#14502f' };
const decimal = (n: number | null) => (n === null ? '—' : puntajeTexto(n));
const nombreNivel = (c: string | null) => NIVELES.find((n) => n.codigo === c)?.nombre ?? '—';
const lineas = { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => LINEA, paddingTop: () => 5, paddingBottom: () => 5 };
const enc = (t: string) => ({ text: t, bold: true, fontSize: 8, color: SUAVE });

/** Barra de 0 a 5 dibujada con un rectángulo, para leer el promedio de cada libertad de un vistazo. */
function barra(valor: number | null, ancho = 150) {
  const lleno = valor === null ? 0 : (valor / 5) * ancho;
  return {
    canvas: [
      { type: 'rect', x: 0, y: 2, w: ancho, h: 7, r: 3, color: '#eef1ed' },
      ...(lleno ? [{ type: 'rect', x: 0, y: 2, w: lleno, h: 7, r: 3, color: VERDE }] : []),
    ],
  };
}

export function reporteTablero(r: ResumenTablero, analisis: AnalisisTablero | null, generado: string, quien: string): Record<string, unknown> {
  const tarjetas = [
    ['Evaluaciones finalizadas', String(r.evaluaciones)],
    ['Predios evaluados', `${r.prediosEvaluados} de ${r.predios}`],
    ['Puntaje promedio', r.puntajePromedio === null ? '—' : `${decimal(r.puntajePromedio)} · ${nombreNivel(r.nivelPromedio)}`],
    ['Nivel alto o excelente', r.buenasPracticas === null ? '—' : `${r.buenasPracticas} %`],
  ];

  const contenido: unknown[] = [
    { text: 'ICA BIENESTAR ANIMAL', fontSize: 9, bold: true, color: VERDE },
    { text: 'Reporte del tablero', fontSize: 20, bold: true, margin: [0, 6, 0, 2] },
    { text: `Periodo: ${NOMBRE_PERIODO[r.periodo]} · Generado por ${quien} el ${generado}`, fontSize: 10, color: SUAVE, margin: [0, 0, 0, 14] },
    {
      columns: tarjetas.map(([k, v]) => ({
        stack: [{ text: k, fontSize: 8, color: SUAVE }, { text: v, fontSize: 15, bold: true, margin: [0, 2, 0, 0] }],
      })),
      columnGap: 12,
      margin: [0, 0, 0, 6],
    },
    { text: 'Evaluaciones por nivel', fontSize: 13, bold: true, margin: [0, 16, 0, 8] },
    {
      table: {
        widths: ['*', 80, 80],
        body: [
          [enc('Nivel'), enc('Evaluaciones'), enc('Porcentaje')],
          ...r.porNivel.map((n) => [
            { text: n.nombre, bold: true, color: COLOR_NIVEL[n.codigo] },
            String(n.cantidad),
            r.evaluaciones ? `${Math.round((n.cantidad / r.evaluaciones) * 100)} %` : '—',
          ]),
        ],
      },
      layout: lineas,
    },
    { text: 'Promedio por libertad (0 a 5)', fontSize: 13, bold: true, margin: [0, 16, 0, 8] },
    {
      table: {
        widths: ['*', 50, 160, 50],
        body: [
          [enc('Libertad'), enc('Peso'), enc(''), enc('Promedio')],
          ...r.porLibertad.map((l) => [l.nombre, `${l.peso} %`, barra(l.promedio), { text: decimal(l.promedio), bold: true }]),
        ],
      },
      layout: lineas,
    },
    { text: 'Criterios con más hallazgos', fontSize: 13, bold: true, margin: [0, 16, 0, 8] },
    r.hallazgosFrecuentes.length
      ? {
          table: {
            widths: ['*', 80, 80],
            body: [
              [enc('Criterio'), enc('Evaluaciones'), enc('Críticos')],
              ...r.hallazgosFrecuentes.map((h) => [h.nombre, String(h.veces), String(h.criticos)]),
            ],
          },
          layout: lineas,
        }
      : { text: 'Sin hallazgos en el periodo.', color: SUAVE },
  ];

  if (analisis) {
    contenido.push(
      { text: analisis.origen === 'IA' ? `Análisis con inteligencia artificial (${analisis.modelo})` : 'Análisis por reglas', fontSize: 13, bold: true, margin: [0, 16, 0, 8] },
      { text: analisis.resumen, margin: [0, 0, 0, 6] },
      { text: 'Lo que muestran las cifras', bold: true, margin: [0, 4, 0, 2] },
      { ul: analisis.observaciones },
      { text: 'Acciones sugeridas', bold: true, margin: [0, 8, 0, 2] },
      { ol: analisis.acciones },
      { text: AVISO_RECOMENDACIONES, fontSize: 8, color: SUAVE, margin: [0, 8, 0, 0] },
    );
  }

  contenido.push(
    { text: 'Evaluaciones más recientes', fontSize: 13, bold: true, margin: [0, 16, 0, 8], pageBreak: analisis ? 'before' : undefined },
    {
      table: {
        headerRows: 1,
        widths: [62, '*', '*', 54, 44, 58],
        body: [
          [enc('Código'), enc('Predio'), enc('Municipio'), enc('Finalizada'), enc('Puntaje'), enc('Nivel')],
          ...r.recientes.map((f) => [
            f.codigo, f.predio, `${f.municipio}, ${f.departamento}`, f.finalizada.slice(0, 10), decimal(f.puntaje),
            { text: nombreNivel(f.nivel), bold: true, color: COLOR_NIVEL[f.nivel] },
          ]),
        ],
      },
      layout: lineas,
      fontSize: 9,
    },
  );

  return {
    pageSize: 'LETTER',
    pageMargins: [48, 56, 48, 56],
    info: { title: 'Reporte del tablero', author: 'ICA Bienestar Animal' },
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#1a1f1c', lineHeight: 1.25 },
    footer: (pagina: number, total: number) => ({
      columns: [
        { text: `Reporte del tablero · ${generado}`, fontSize: 8, color: SUAVE },
        { text: `Página ${pagina} de ${total}`, fontSize: 8, color: SUAVE, alignment: 'right' },
      ],
      margin: [48, 16, 48, 0],
    }),
    content: contenido,
  };
}

/** Genera el PDF con pdfmake, que se descarga solo cuando se pide. */
export async function pdfTablero(doc: Record<string, unknown>): Promise<Blob> {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  pdfMake.addVirtualFileSystem((await import('pdfmake/build/vfs_fonts')).default);
  return pdfMake.createPdf(doc as never).getBlob();
}
