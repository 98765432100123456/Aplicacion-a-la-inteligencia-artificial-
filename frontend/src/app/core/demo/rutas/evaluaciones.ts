import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { from, map } from 'rxjs';
import { calificar, pendientes, RespuestaIndicador } from '../../../compartido/calificacion';
import { DatosInforme, DocumentoPdf, informePropietario, informeTecnico } from '../../../compartido/informes';
import { LISTAS_POR_ESPECIE } from '../../../compartido/lista-chequeo';
import { NOMBRE_PRODUCTOR, muestraMinima, repartir, tipoProductor } from '../../../compartido/norma';
import { recomendacionesPorReglas } from '../../../compartido/recomendaciones';
import { Answer, EvaluationDetail, ReportMeta } from '../../models/predios';
import { DemoUser } from '../datos-demo';
import { estado, fallo, guardar, ok, Peticion, prohibido, puede, Respuesta } from '../almacen-demo';
import { DemoEvaluation, DemoFarm } from '../predios-demo';
import { prediosVisibles, veTodos } from './predios';

/** Simula las evaluaciones y los informes PDF de backend/src/evaluations; los PDF se arman en el navegador. */

const CONSULTAR = ['evaluaciones.ver', 'evaluaciones.diligenciar', 'reportes.ver', 'predios.propios'];
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const codigo = (e: DemoEvaluation) => `EV-${e.id.replace(/\D/g, '').padStart(8, '0').slice(-8)}`;
const lista = (e: DemoEvaluation) => LISTAS_POR_ESPECIE[especie(e).code] ?? [];
const especie = (e: DemoEvaluation) => estado.datos.species.find((s) => s.id === e.speciesId)!;
const ubicacion = (f: DemoFarm) => [f.address, f.vereda && `vereda ${f.vereda}`, f.municipality, f.department].filter(Boolean).join(', ');
const evaluador = (e: DemoEvaluation) => {
  const u = estado.datos.users.find((x) => x.id === e.evaluatorId);
  return u ? `${u.firstName} ${u.lastName}` : 'Evaluador';
};
const respuestas = (e: DemoEvaluation): Record<string, RespuestaIndicador> =>
  Object.fromEntries(e.answers.map((a) => [a.indicatorCode, { respuesta: a.answer, observacion: a.observation }]));

function informes(e: DemoEvaluation): ReportMeta[] {
  if (e.status !== 'FINALIZADA') return [];
  return (['TECNICO', 'PROPIETARIO'] as const).map((kind) => ({
    id: `${e.id}-${kind}`, kind, sizeBytes: 0,
    fileName: `${kind === 'TECNICO' ? 'informe-tecnico' : 'recomendaciones-propietario'}-${e.visitDate}-${e.id}.pdf`,
    createdAt: kind === 'PROPIETARIO' ? e.recommendation!.createdAt : e.finishedAt!,
  }));
}

function vista(e: DemoEvaluation, f: DemoFarm): EvaluationDetail {
  const total = e.calves + e.young + e.adults;
  const muestra = muestraMinima(total);
  return {
    id: e.id, code: codigo(e), status: e.status,
    farm: { id: f.id, name: f.name, ownerName: f.ownerName, location: ubicacion(f) },
    species: especie(e), evaluator: { id: e.evaluatorId, name: evaluador(e) }, visitDate: e.visitDate,
    inventory: { calves: e.calves, young: e.young, adults: e.adults, total }, producerType: tipoProductor(total),
    sampleSize: muestra, sampleByGroup: muestra === null ? null : repartir(muestra, [e.calves, e.young, e.adults]),
    checklistVersion: 'REF-2026.1', checklist: lista(e).map(({ propietario: _paraElPropietario, ...i }) => i), answers: e.answers,
    generalObservation: e.generalObservation, score: e.results?.puntaje ?? null, level: e.results?.nivel ?? null, results: e.results,
    lastSavedAt: e.lastSavedAt, finishedAt: e.finishedAt, recommendation: e.recommendation, reports: informes(e),
  };
}

function datosInforme(e: DemoEvaluation, f: DemoFarm): DatosInforme {
  const porCodigo = new Map(lista(e).map((i) => [i.codigo, i]));
  const total = e.calves + e.young + e.adults;
  const larga = (d: string) => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
  return {
    predio: { nombre: f.name, propietario: f.ownerName, telefono: f.ownerPhone, ubicacion: ubicacion(f) },
    especie: especie(e).name, inventario: { crias: e.calves, jovenes: e.young, adultos: e.adults },
    productor: NOMBRE_PRODUCTOR[tipoProductor(total)], muestra: muestraMinima(total),
    evaluacion: { codigo: codigo(e), fecha: larga(e.visitDate), evaluador: evaluador(e), observacionGeneral: e.generalObservation, version: 'REF-2026.1' },
    resultado: e.results!,
    respuestas: e.answers
      .filter((a) => porCodigo.has(a.indicatorCode))
      .map((a) => {
        const i = porCodigo.get(a.indicatorCode)!;
        return { codigo: i.codigo, libertad: i.libertad, texto: i.texto, tipo: i.tipo, metodo: i.metodo, respuesta: a.answer, observacion: a.observation };
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true })),
    recomendaciones: e.recommendation!,
    generado: new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date()),
  };
}

/** Genera el PDF con pdfmake en el navegador; la librería se carga solo cuando se pide un informe. */
async function pdf(doc: DocumentoPdf): Promise<Blob> {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  pdfMake.addVirtualFileSystem((await import('pdfmake/build/vfs_fonts')).default);
  return pdfMake.createPdf(doc).getBlob();
}

/** Evaluación visible para el usuario; el propietario solo ve las finalizadas. */
function buscar(id: string, yo: DemoUser) {
  const e = estado.datos.evaluations.find((x) => x.id === id);
  const f = e && prediosVisibles(yo)?.find((x) => x.id === e.farmId);
  if (!e || !f || (!veTodos(yo) && e.status !== 'FINALIZADA')) return null;
  return { e, f };
}

export function rutasDeEvaluaciones({ metodo, ruta, cuerpo }: Peticion, yo: DemoUser): Respuesta {
  const delPredio = ruta.match(/^\/farms\/([^/]+)\/evaluations$/);
  if (delPredio) {
    const f = prediosVisibles(yo)?.find((x) => x.id === delPredio[1]);
    if (metodo === 'GET') {
      if (!puede(yo, ...CONSULTAR)) return prohibido();
      if (!f) return fallo(404, 'El predio no existe.');
      const historial = estado.datos.evaluations
        .filter((e) => e.farmId === f.id && (veTodos(yo) || e.status === 'FINALIZADA'))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((e) => {
          const { checklist: _lista, answers: _respuestas, ...resumen } = vista(e, f);
          return resumen;
        });
      return ok(historial);
    }
    if (metodo === 'POST') {
      if (!puede(yo, 'evaluaciones.diligenciar')) return prohibido();
      if (!f) return fallo(404, 'El predio no existe.');
      const s = f.species.find((x) => x.speciesId === cuerpo['speciesId']);
      if (!s) return fallo(400, 'Esa especie no está registrada en el predio.');
      const borrador = estado.datos.evaluations.find((e) => e.farmId === f.id && e.speciesId === s.speciesId && e.status === 'BORRADOR');
      if (borrador) return ok(vista(borrador, f), 201);
      const ahora = new Date().toISOString();
      const e: DemoEvaluation = {
        id: `ev-${Date.now()}`, farmId: f.id, speciesId: s.speciesId, evaluatorId: yo.id, status: 'BORRADOR',
        visitDate: (cuerpo['visitDate'] as string) ?? hoy(), calves: s.calves, young: s.young, adults: s.adults,
        generalObservation: null, answers: [], results: null, recommendation: null, lastSavedAt: ahora, finishedAt: null, createdAt: ahora,
      };
      estado.datos.evaluations.push(e);
      guardar();
      return ok(vista(e, f), 201);
    }
    return null;
  }

  const coincide = ruta.match(/^\/evaluations\/([^/]+)(?:\/(finalize|recommendations|reports\/[^/]+))?$/);
  if (!coincide) return null;
  const [, id, accion] = coincide;
  const consulta = metodo === 'GET';
  if (!puede(yo, ...(consulta ? CONSULTAR : ['evaluaciones.diligenciar']))) return prohibido();
  const hallada = buscar(id, yo);
  if (!hallada) return fallo(404, 'La evaluación no existe.');
  const { e, f } = hallada;

  if (consulta && !accion) return ok(vista(e, f));
  if (consulta && accion.startsWith('reports/')) {
    const tipo = accion.slice('reports/'.length);
    if (tipo !== 'tecnico' && tipo !== 'propietario') return fallo(400, 'El tipo de informe no es válido.');
    if (e.status !== 'FINALIZADA') return fallo(404, 'Este informe aún no se ha generado.');
    const meta = informes(e).find((r) => r.kind === tipo.toUpperCase())!;
    const datos = datosInforme(e, f);
    return from(pdf(tipo === 'tecnico' ? informeTecnico(datos) : informePropietario(datos))).pipe(
      map((body) => new HttpResponse({ status: 200, body, headers: new HttpHeaders({ 'Content-Disposition': `attachment; filename="${meta.fileName}"` }) })),
    );
  }
  if (metodo === 'PUT' && !accion) {
    if (e.status !== 'BORRADOR') return fallo(409, 'La evaluación ya está finalizada y no se puede modificar.');
    const porCodigo = new Map(lista(e).map((i) => [i.codigo, i]));
    for (const a of (cuerpo['answers'] as Answer[] | undefined) ?? []) {
      const i = porCodigo.get(a.indicatorCode);
      if (!i) return fallo(400, `El indicador ${a.indicatorCode} no pertenece a esta lista de chequeo.`);
      if (i.respuesta === 'SI_NO' && a.answer === 'PARCIAL') return fallo(400, `El indicador ${a.indicatorCode} solo admite cumple o no cumple.`);
      const nueva = { indicatorCode: a.indicatorCode, answer: a.answer, observation: a.observation ?? null };
      const pos = e.answers.findIndex((x) => x.indicatorCode === a.indicatorCode);
      if (pos >= 0) e.answers[pos] = nueva;
      else e.answers.push(nueva);
    }
    if (cuerpo['visitDate'] !== undefined) e.visitDate = cuerpo['visitDate'] as string;
    if (cuerpo['generalObservation'] !== undefined) e.generalObservation = (cuerpo['generalObservation'] as string | null) || null;
    e.lastSavedAt = new Date().toISOString();
    guardar();
    return ok(vista(e, f));
  }
  if (metodo === 'POST' && accion === 'finalize') {
    if (e.status !== 'BORRADOR') return fallo(409, 'La evaluación ya está finalizada y no se puede modificar.');
    const faltan = pendientes(lista(e), respuestas(e));
    if (faltan.length) {
      return fallo(400, `Faltan ${faltan.length} ${faltan.length === 1 ? 'indicador' : 'indicadores'} por responder: ${faltan.map((i) => i.codigo).join(', ')}.`);
    }
    const ahora = new Date().toISOString();
    e.results = calificar(lista(e), respuestas(e));
    e.recommendation = { ...recomendacionesPorReglas(e.results, lista(e)), createdAt: ahora };
    Object.assign(e, { status: 'FINALIZADA', finishedAt: ahora, lastSavedAt: ahora });
    guardar();
    return ok(vista(e, f));
  }
  if (metodo === 'POST' && accion === 'recommendations') {
    if (e.status !== 'FINALIZADA') return fallo(409, 'La evaluación aún no está finalizada.');
    e.recommendation = { ...recomendacionesPorReglas(e.results!, lista(e)), createdAt: new Date().toISOString() };
    guardar();
    return ok(vista(e, f));
  }
  return null;
}
