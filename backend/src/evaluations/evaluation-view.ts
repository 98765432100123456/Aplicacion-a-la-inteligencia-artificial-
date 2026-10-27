import { Resultado } from '../compartido/calificacion';
import { DatosInforme } from '../compartido/informes';
import { LISTAS_POR_ESPECIE, Respuesta } from '../compartido/lista-chequeo';
import { NOMBRE_PRODUCTOR, Productor, repartir } from '../compartido/norma';
import { Recomendaciones } from '../compartido/recomendaciones';
import { Farm } from '../farms/entities/farm.entity';
import { Evaluation } from './entities/evaluation.entity';
import { Recommendation } from './entities/recommendation.entity';
import { Report } from './entities/report.entity';

/** Funciones que traducen las entidades de evaluación a lo que ven la API y los informes. */

const ZONA = 'America/Bogota';
export const fechaLarga = (d: Date | string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: typeof d === 'string' ? 'UTC' : ZONA }).format(
    typeof d === 'string' ? new Date(`${d}T00:00:00Z`) : d,
  );
const fechaHora = (d: Date) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: ZONA }).format(d);

export const codigoEvaluacion = (e: Evaluation) => `EV-${e.id.slice(0, 8).toUpperCase()}`;
export const listaDe = (e: Evaluation) => LISTAS_POR_ESPECIE[e.species.code] ?? [];

export function ubicacion(f: Farm): string {
  return [f.address, f.vereda && `vereda ${f.vereda}`, f.municipality, f.department].filter(Boolean).join(', ');
}

export function recomendacionesDe(r: Recommendation): Recomendaciones {
  return { origen: r.source as Recomendaciones['origen'], modelo: r.model, resumen: r.summary, recomendaciones: r.items };
}

export function datosInforme(e: Evaluation, farm: Farm, resultado: Resultado, rec: Recomendaciones): DatosInforme {
  const porCodigo = new Map(listaDe(e).map((i) => [i.codigo, i]));
  return {
    predio: { nombre: farm.name, propietario: farm.ownerName, telefono: farm.ownerPhone, ubicacion: ubicacion(farm) },
    especie: e.species.name,
    inventario: { crias: e.calves, jovenes: e.young, adultos: e.adults },
    productor: NOMBRE_PRODUCTOR[e.producerType as Productor] ?? e.producerType,
    muestra: e.sampleSize,
    evaluacion: {
      codigo: codigoEvaluacion(e),
      fecha: fechaLarga(e.visitDate),
      evaluador: `${e.evaluator.firstName} ${e.evaluator.lastName}`,
      observacionGeneral: e.generalObservation,
      version: e.checklistVersion,
    },
    resultado,
    respuestas: e.answers
      .filter((a) => porCodigo.has(a.indicatorCode))
      .map((a) => {
        const i = porCodigo.get(a.indicatorCode)!;
        return { codigo: i.codigo, libertad: i.libertad, texto: a.indicatorText, tipo: i.tipo, metodo: i.metodo, respuesta: a.answer as Respuesta, observacion: a.observation };
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true })),
    recomendaciones: rec,
    generado: fechaHora(new Date()),
  };
}

export function vistaEvaluacion(e: Evaluation, farm: Farm, rec: Recommendation | null, reports: Report[]) {
  const total = e.calves + e.young + e.adults;
  return {
    id: e.id,
    code: codigoEvaluacion(e),
    status: e.status,
    farm: { id: farm.id, name: farm.name, ownerName: farm.ownerName, location: ubicacion(farm) },
    species: { id: e.species.id, code: e.species.code, name: e.species.name },
    evaluator: { id: e.evaluatorId, name: `${e.evaluator.firstName} ${e.evaluator.lastName}` },
    visitDate: e.visitDate,
    inventory: { calves: e.calves, young: e.young, adults: e.adults, total },
    producerType: e.producerType,
    sampleSize: e.sampleSize,
    sampleByGroup: e.sampleSize === null ? null : repartir(e.sampleSize, [e.calves, e.young, e.adults]),
    checklistVersion: e.checklistVersion,
    checklist: listaDe(e).map(({ propietario: _paraElPropietario, ...i }) => i),
    answers: (e.answers ?? []).map((a) => ({ indicatorCode: a.indicatorCode, answer: a.answer, observation: a.observation })),
    generalObservation: e.generalObservation,
    score: e.score === null ? null : Number(e.score),
    level: e.level,
    results: e.results,
    lastSavedAt: e.lastSavedAt,
    finishedAt: e.finishedAt,
    recommendation: rec && { ...recomendacionesDe(rec), createdAt: rec.createdAt },
    reports: reports.map((r) => ({ id: r.id, kind: r.kind, fileName: r.fileName, sizeBytes: r.sizeBytes, createdAt: r.createdAt })),
  };
}
