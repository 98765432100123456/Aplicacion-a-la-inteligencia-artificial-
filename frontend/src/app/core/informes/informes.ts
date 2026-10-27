import { DatosInforme, informePropietario, informeTecnico } from '../../compartido/informes';
import { NOMBRE_PRODUCTOR } from '../../compartido/norma';
import { EvaluationDetail } from '../models/predios';

export type TipoInforme = 'tecnico' | 'propietario';

const fechaLarga = (d: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));

/** Datos de los informes a partir de una evaluación finalizada. */
export function datosInforme(e: EvaluationDetail, telefono: string | null): DatosInforme {
  const porCodigo = new Map(e.checklist.map((i) => [i.codigo, i]));
  return {
    predio: { nombre: e.farm.name, propietario: e.farm.ownerName, telefono, ubicacion: e.farm.location },
    especie: e.species.name,
    inventario: { crias: e.inventory.calves, jovenes: e.inventory.young, adultos: e.inventory.adults },
    productor: NOMBRE_PRODUCTOR[e.producerType],
    muestra: e.sampleSize,
    evaluacion: {
      codigo: e.code,
      fecha: fechaLarga(e.visitDate),
      evaluador: e.evaluator.name,
      observacionGeneral: e.generalObservation,
      version: e.checklistVersion,
    },
    resultado: e.results!,
    respuestas: e.answers
      .filter((a) => porCodigo.has(a.indicatorCode))
      .map((a) => {
        const i = porCodigo.get(a.indicatorCode)!;
        return {
          codigo: i.codigo, libertad: i.libertad, texto: `${i.nombreCriterio}: ${i.texto}`, tipo: i.tipo, metodo: i.metodo,
          respuesta: a.answer, observacion: a.observation,
        };
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true })),
    recomendaciones: e.recommendation!,
    generado: new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date()),
  };
}

export function nombreInforme(e: EvaluationDetail, tipo: TipoInforme): string {
  return `${tipo === 'tecnico' ? 'informe-tecnico' : 'recomendaciones-propietario'}-${e.visitDate}-${e.code.toLowerCase()}.pdf`;
}

/** Genera el PDF en el navegador con pdfmake; la librería se descarga solo cuando se pide un informe. */
export async function generarInforme(e: EvaluationDetail, telefono: string | null, tipo: TipoInforme): Promise<Blob> {
  const datos = datosInforme(e, telefono);
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  pdfMake.addVirtualFileSystem((await import('pdfmake/build/vfs_fonts')).default);
  return pdfMake.createPdf(tipo === 'tecnico' ? informeTecnico(datos) : informePropietario(datos)).getBlob();
}

export function guardarArchivo(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const enlace = Object.assign(document.createElement('a'), { href: url, download: nombre });
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
