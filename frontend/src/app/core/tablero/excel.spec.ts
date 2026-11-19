import JSZip from 'jszip';
import { FilaTablero } from '../models/tablero';
import { analisisPorReglas } from './analisis';
import { ajustarRango, excelTablero, rellenarCeldas, repetirFila, serieFecha, textoXml, valoresEvaluacion, valoresHallazgos, valoresTablero } from './excel';
import { resumirTablero } from './resumen';

const HOY = new Date('2026-11-18T12:00:00Z');
const fila = (id: string, predio: string, puntaje: number, nivel: FilaTablero['nivel'], hallazgos: FilaTablero['hallazgos'] = []): FilaTablero => ({
  id, codigo: `EV-${id}`, predio, departamento: 'Boyacá', municipio: 'Paipa', especie: 'Bovinos', sistema: 'LECHERIA', productor: 'MEDIANO',
  animales: 120, evaluador: 'Eva Luna', fechaVisita: '2026-11-01', finalizada: `2026-11-0${id}T10:00:00Z`, puntaje, nivel,
  libertades: [{ codigo: 'NUTRICION', puntaje: 5 }, { codigo: 'SALUD', puntaje }, { codigo: 'CONFORT', puntaje: 4 }, { codigo: 'COMPORTAMIENTO', puntaje: null }],
  hallazgos, origenRecomendaciones: 'REGLAS',
});
const FILAS = [
  fila('2', '=HIPERVINCULO("x") & <b>', 2.4, 'BAJO', [
    { criterio: 'c3', nombre: 'Condición corporal', critico: false },
    { criterio: 'c3', nombre: 'Condición corporal', critico: true },
  ]),
  fila('1', 'La Esperanza', 4.8, 'EXCELENTE'),
];
const DATOS = { predios: 3, borradores: 1, evaluaciones: FILAS };
const OPC = { generado: '18 de noviembre de 2026', quien: 'Ana', alcance: 'todo' };

describe('Excel del tablero', () => {
  it('convierte fechas a número de serie de Excel', () => {
    expect(serieFecha('1900-01-01')).toBe(2);
    expect(serieFecha('2026-11-18T23:00:00Z')).toBe(46344);
    expect(serieFecha('')).toBeNull();
  });

  it('escapa el texto para XML y quita caracteres de control', () => {
    expect(textoXml('a<b>&"c"\u0001')).toBe('a&lt;b&gt;&amp;&quot;c&quot;');
  });

  it('reemplaza marcadores conservando el estilo y el tipo del valor', () => {
    const xml =
      '<c r="B2" s="3" t="inlineStr"><is><t>{{n}}</t></is></c>' +
      '<c r="C2" s="4" t="inlineStr"><is><t>Hola {{nombre}}</t></is></c>' +
      '<c r="D2" s="5" t="inlineStr"><is><t>{{vacio}}</t></is></c>' +
      '<c r="E2" s="6" t="inlineStr"><is><t>Fijo</t></is></c>';
    const r = rellenarCeldas(xml, (k) => ({ n: 4.25, nombre: '=1+1 <x>', vacio: null })[k]);
    expect(r).toContain('<c r="B2" s="3"><v>4.25</v></c>');
    // El texto que empieza por "=" queda como texto, no como fórmula.
    expect(r).toContain('<c r="C2" s="4" t="inlineStr"><is><t xml:space="preserve">Hola =1+1 &lt;x&gt;</t></is></c>');
    expect(r).toContain('<c r="D2" s="5"/>');
    expect(r).toContain('<t>Fijo</t>');
    expect(r).not.toContain('<f>');
  });

  it('repite la fila modelo una vez por registro', () => {
    const xml = '<sheetData><row r="6"><c r="B6" t="inlineStr"><is><t>Código</t></is></c></row>' +
      '<row r="7" ht="22"><c r="B7" s="1" t="inlineStr"><is><t>{{f.codigo}}</t></is></c><c r="C7" s="2" t="inlineStr"><is><t>{{f.n}}</t></is></c></row></sheetData>';
    const { xml: r, ultima } = repetirFila(xml, 'f', [{ 'f.codigo': 'A', 'f.n': 1 }, { 'f.codigo': 'B', 'f.n': 2 }], {});
    expect(ultima).toBe(8);
    expect(r).toContain('<row r="7" ht="22"><c r="B7" s="1" t="inlineStr"><is><t xml:space="preserve">A</t></is></c><c r="C7" s="2"><v>1</v></c></row>');
    expect(r).toContain('<row r="8" ht="22"><c r="B8" s="1" t="inlineStr"><is><t xml:space="preserve">B</t></is></c><c r="C8" s="2"><v>2</v></c></row>');
    expect(r).toContain('Código');
  });

  it('ajusta el rango de los gráficos a las filas con datos', () => {
    const xml = "<c:f>'Datos'!$A$34:$A$38</c:f><c:f>'Datos'!$B$34:$B$38</c:f>";
    expect(ajustarRango(xml, { desde: 34, hasta: 38 }, 2)).toBe("<c:f>'Datos'!$A$34:$A$35</c:f><c:f>'Datos'!$B$34:$B$35</c:f>");
    expect(ajustarRango(xml, { desde: 34, hasta: 38 }, 0)).toContain('$A$34:$A$34');
  });

  it('arma los valores del tablero, las evaluaciones y los hallazgos', () => {
    const r = resumirTablero(DATOS, 'todo', HOY);
    const v = valoresTablero(r, analisisPorReglas(r), OPC);
    expect(v['k.evaluaciones']).toBe(2);
    expect(v['k.predios']).toBe('2 de 3');
    expect(v['k.buenas']).toBe(0.5);
    expect(v['niv.0.nombre']).toBe('Bajo');
    expect(v['lib.1.peso']).toBe(0.5);
    expect(v['at.0.predio']).toBe('=HIPERVINCULO("x") & <b>');
    expect(v['an.titulo']).toBe('Análisis por reglas de la norma');

    const e = valoresEvaluacion(FILAS[0]);
    expect(e['f.criterios']).toBe(1);
    expect(e['f.criticos']).toBe(1);
    expect(e['f.lib3']).toBeNull();
    expect(e['f.sistema']).toBe('Lechería');

    const h = valoresHallazgos(FILAS);
    expect(h.length).toBe(1);
    expect(h[0]['h.critico']).toBe('Sí');
  });

  it('genera el libro desde la plantilla sin marcadores pendientes', async () => {
    const plantilla = await (await fetch('/plantillas/tablero.xlsx')).arrayBuffer();
    const r = resumirTablero(DATOS, 'todo', HOY);
    const blob = await excelTablero(r, FILAS, analisisPorReglas(r), OPC, plantilla);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const archivos = Object.keys(zip.files);
    expect(archivos.filter((a) => /^xl\/charts\/chart\d+\.xml$/.test(a)).length).toBe(5);
    expect(archivos.some((a) => a.startsWith('xl/media/'))).toBeTrue();
    for (const a of archivos.filter((x) => /^xl\/(worksheets|tables)\/[^/]+\.xml$/.test(x))) {
      expect(await zip.file(a)!.async('string')).withContext(a).not.toContain('{{');
    }
    const evaluaciones = await zip.file('xl/worksheets/sheet2.xml')!.async('string');
    expect(evaluaciones).toContain('<row r="8"');
    expect(evaluaciones).toContain('=HIPERVINCULO(&quot;x&quot;) &amp; &lt;b&gt;');
    expect(evaluaciones).not.toContain('<f>');
    const tablas = await Promise.all(archivos.filter((a) => /^xl\/tables\/table\d+\.xml$/.test(a)).map((a) => zip.file(a)!.async('string')));
    expect(tablas.some((t) => t.includes('ref="B6:V8"'))).toBeTrue();
  });
});
