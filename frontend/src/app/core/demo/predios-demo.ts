import { calificar, RespuestaIndicador, Resultado } from '../../compartido/calificacion';
import { LISTA_BOVINOS, Respuesta } from '../../compartido/lista-chequeo';
import { recomendacionesPorReglas, Recomendaciones } from '../../compartido/recomendaciones';
import { Answer, Species } from '../models/predios';

export type { Species };

/** Predios y evaluaciones de ejemplo del modo demostración, calculados con las reglas reales. */

export interface DemoFarm {
  id: string;
  name: string;
  ownerName: string;
  ownerDocument: string | null;
  ownerPhone: string;
  ownerEmail: string | null;
  department: string;
  municipality: string;
  vereda: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  areaHectares: number | null;
  productionSystem: string | null;
  notes: string | null;
  species: { speciesId: string; calves: number; young: number; adults: number }[];
  updatedAt: string;
}

export interface DemoEvaluation {
  id: string;
  farmId: string;
  speciesId: string;
  evaluatorId: string;
  status: 'BORRADOR' | 'FINALIZADA';
  visitDate: string;
  calves: number;
  young: number;
  adults: number;
  generalObservation: string | null;
  answers: Answer[];
  results: Resultado | null;
  recommendation: (Recomendaciones & { createdAt: string }) | null;
  lastSavedAt: string;
  finishedAt: string | null;
  createdAt: string;
}

const SPECIES: Species[] = [
  { id: 'esp-bov', code: 'BOVINO', name: 'Bovinos' },
  { id: 'esp-buf', code: 'BUFALINO', name: 'Búfalos' },
];

const haceDias = (dias: number) => new Date(Date.now() - dias * 86_400_000);
const fecha = (d: Date) => d.toISOString().slice(0, 10);

/** Evaluación finalizada: todo cumple salvo las excepciones indicadas. */
function evaluacionFinalizada(
  id: string,
  farm: DemoFarm,
  dias: number,
  excepciones: Record<string, [Respuesta, string?]>,
  observacion: string,
): DemoEvaluation {
  const s = farm.species[0];
  const answers: Answer[] = LISTA_BOVINOS.map((i) => ({
    indicatorCode: i.codigo,
    answer: excepciones[i.codigo]?.[0] ?? 'CUMPLE',
    observation: excepciones[i.codigo]?.[1] ?? null,
  }));
  const respuestas: Record<string, RespuestaIndicador> = Object.fromEntries(answers.map((a) => [a.indicatorCode, { respuesta: a.answer, observacion: a.observation }]));
  const results = calificar(LISTA_BOVINOS, respuestas);
  const cuando = haceDias(dias).toISOString();
  return {
    id, farmId: farm.id, speciesId: s.speciesId, evaluatorId: 'u-1', status: 'FINALIZADA', visitDate: fecha(haceDias(dias)),
    calves: s.calves, young: s.young, adults: s.adults, generalObservation: observacion, answers, results,
    recommendation: { ...recomendacionesPorReglas(results, LISTA_BOVINOS), createdAt: cuando },
    lastSavedAt: cuando, finishedAt: cuando, createdAt: cuando,
  };
}

export function prediosIniciales() {
  const ahora = new Date().toISOString();
  const base = { ownerDocument: null, address: null, latitude: null, longitude: null, areaHectares: null, notes: null, updatedAt: ahora };
  const farms: DemoFarm[] = [
    {
      ...base, id: 'p-1', name: 'La Esperanza', ownerName: 'Pedro Antonio Rojas Salamanca', ownerDocument: '79456123', ownerPhone: '3104567890',
      ownerEmail: 'propietario@ica-bienestar.local', department: 'Cundinamarca', municipality: 'Ubaté', vereda: 'El Volcán',
      latitude: 5.3091, longitude: -73.8162, areaHectares: 48, productionSystem: 'Leche',
      notes: 'Ordeño mecánico a las 4:00 a. m. y 2:00 p. m. Acceso por la vía a Carmen de Carupa, km 3.',
      species: [{ speciesId: 'esp-bov', calves: 18, young: 34, adults: 68 }],
    },
    {
      ...base, id: 'p-2', name: 'El Recreo', ownerName: 'Luz Marina Ortega Díaz', ownerPhone: '3157781122', ownerEmail: null,
      department: 'Córdoba', municipality: 'Montería', vereda: 'Martinica', areaHectares: 320, productionSystem: 'Doble propósito',
      species: [{ speciesId: 'esp-bov', calves: 40, young: 90, adults: 230 }, { speciesId: 'esp-buf', calves: 6, young: 10, adults: 24 }],
    },
    {
      ...base, id: 'p-3', name: 'Villa Luz', ownerName: 'José Gregorio Moreno', ownerPhone: '3209945510', ownerEmail: null,
      department: 'Cundinamarca', municipality: 'Guasca', vereda: 'La Concepción', productionSystem: 'Leche',
      species: [{ speciesId: 'esp-bov', calves: 4, young: 8, adults: 20 }],
    },
  ];
  const evaluations = [
    evaluacionFinalizada('ev-1', farms[0], 34, {
      N1: ['NO_CUMPLE', '6 de 30 animales con condición corporal baja, todos en el lote de levante.'],
      S5: ['NO_CUMPLE', 'No se lleva registro de tratamientos.'],
      C2: ['PARCIAL', 'Barro acumulado en la entrada de la sala de ordeño.'],
    }, 'Predio ordenado, con buen manejo del ordeño. Pendiente mejorar registros sanitarios.'),
    evaluacionFinalizada('ev-2', farms[1], 12, {
      S1: ['NO_CUMPLE', '7 de 30 animales con cojera visible.'],
      S2: ['PARCIAL', 'Heridas en cuello por comederos.'],
      S6: ['NO_CUMPLE', 'Descorne con hierro caliente sin anestesia.'],
      S4: ['NO_CUMPLE'],
      C1: ['PARCIAL', 'Potreros del sur sin sombra.'],
      K2: ['PARCIAL', 'Uso de perros en el arreo.'],
    }, 'Hato grande con problemas de salud que requieren atención urgente.'),
  ];
  return { species: SPECIES, farms, evaluations };
}
