import { tipoProductor } from '../../../compartido/norma';
import { DatosTablero, FilaTablero } from '../../models/tablero';
import { estado, ok, Peticion, prohibido, puede, Respuesta } from '../almacen-demo';
import { DemoUser } from '../datos-demo';
import { prediosVisibles, veTodos } from './predios';

/** Simula PrediosEvaluacionesFirebase.dashboard(): predios visibles y evaluaciones finalizadas. */
export function rutasDeTablero({ metodo, ruta }: Peticion, yo: DemoUser): Respuesta {
  if (ruta !== '/dashboard' || metodo !== 'GET') return null;
  if (!puede(yo, 'fincas.ver', 'fincas.gestionar', 'evaluaciones.ver', 'reportes.ver', 'predios.propios')) return prohibido();
  const predios = prediosVisibles(yo) ?? [];
  const ids = new Set(predios.map((f) => f.id));
  const especies = estado.datos.species;
  const evaluaciones: FilaTablero[] = estado.datos.evaluations
    .filter((e) => e.status === 'FINALIZADA' && ids.has(e.farmId) && e.results)
    .map((e) => {
      const f = predios.find((x) => x.id === e.farmId)!;
      const u = estado.datos.users.find((x) => x.id === e.evaluatorId);
      const total = e.calves + e.young + e.adults;
      return {
        id: e.id, codigo: `EV-${e.id.replace(/\D/g, '').padStart(8, '0').slice(-8)}`,
        predio: f.name, departamento: f.department, municipio: f.municipality,
        especie: especies.find((s) => s.id === e.speciesId)?.name ?? e.speciesId,
        sistema: e.sistema, productor: tipoProductor(total), animales: total,
        evaluador: u ? `${u.firstName} ${u.lastName}` : 'Evaluador', fechaVisita: e.visitDate, finalizada: e.finishedAt!,
        puntaje: e.results!.puntaje, nivel: e.results!.nivel,
        libertades: e.results!.libertades.map((l) => ({ codigo: l.codigo, puntaje: l.puntaje })),
        hallazgos: e.results!.hallazgos.map((h) => ({ criterio: h.criterio, nombre: h.nombreCriterio, critico: h.critico })),
        origenRecomendaciones: e.recommendation?.origen ?? null,
      };
    });
  const datos: DatosTablero = {
    predios: predios.length,
    borradores: veTodos(yo) ? estado.datos.evaluations.filter((e) => e.status === 'BORRADOR' && ids.has(e.farmId)).length : 0,
    evaluaciones,
  };
  return ok(datos);
}
