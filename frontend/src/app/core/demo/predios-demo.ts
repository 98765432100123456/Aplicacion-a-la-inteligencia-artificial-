import { calificar, RespuestaIndicador, Resultado } from '../../compartido/calificacion';
import { listaPara, Respuesta } from '../../compartido/lista-chequeo';
import { Sistema } from '../../compartido/norma';
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
  productionSystem: Sistema | null;
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
  /** Sistema productivo del predio al iniciar la evaluación: define los criterios que aplican. */
  sistema: Sistema | null;
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
  const lista = listaPara('BOVINO', farm.productionSystem, s.calves + s.young + s.adults);
  const answers: Answer[] = lista.map((i) => ({
    indicatorCode: i.codigo,
    answer: excepciones[i.codigo]?.[0] ?? 'CUMPLE',
    observation: excepciones[i.codigo]?.[1] ?? null,
  }));
  const respuestas: Record<string, RespuestaIndicador> = Object.fromEntries(answers.map((a) => [a.indicatorCode, { respuesta: a.answer, observacion: a.observation }]));
  const results = calificar(lista, respuestas);
  const cuando = haceDias(dias).toISOString();
  return {
    id, farmId: farm.id, speciesId: s.speciesId, evaluatorId: 'u-1', status: 'FINALIZADA', sistema: farm.productionSystem, visitDate: fecha(haceDias(dias)),
    calves: s.calves, young: s.young, adults: s.adults, generalObservation: observacion, answers, results,
    recommendation: { ...recomendacionesPorReglas(results, lista), createdAt: cuando },
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
      latitude: 5.3091, longitude: -73.8162, areaHectares: 48, productionSystem: 'LECHERIA',
      notes: 'Ordeño mecánico a las 4:00 a. m. y 2:00 p. m. Acceso por la vía a Carmen de Carupa, km 3.',
      species: [{ speciesId: 'esp-bov', calves: 18, young: 34, adults: 68 }],
    },
    {
      ...base, id: 'p-2', name: 'El Recreo', ownerName: 'Luz Marina Ortega Díaz', ownerPhone: '3157781122', ownerEmail: null,
      department: 'Córdoba', municipality: 'Montería', vereda: 'Martinica', areaHectares: 320, productionSystem: 'DOBLE_PROPOSITO',
      species: [{ speciesId: 'esp-bov', calves: 40, young: 90, adults: 230 }, { speciesId: 'esp-buf', calves: 6, young: 10, adults: 24 }],
    },
    {
      ...base, id: 'p-3', name: 'Villa Luz', ownerName: 'José Gregorio Moreno', ownerPhone: '3209945510', ownerEmail: null,
      department: 'Cundinamarca', municipality: 'Guasca', vereda: 'La Concepción', productionSystem: 'LECHERIA',
      species: [{ speciesId: 'esp-bov', calves: 4, young: 8, adults: 20 }],
    },
  ];
  const evaluations = [
    evaluacionFinalizada('ev-1', farms[0], 34, {
      '3.1': ['NO_CUMPLE', '6 de 30 animales con condición corporal baja, todos en el lote de levante.'],
      '16.2': ['NO_CUMPLE', 'No se lleva registro de tratamientos.'],
      '18.1': ['PARCIAL', 'Barro acumulado en la entrada de la sala de ordeño.'],
      '20.1': ['NO_APLICA', 'Los animales están en pastoreo.'],
    }, 'Predio ordenado, con buen manejo del ordeño. Pendiente mejorar registros sanitarios.'),
    evaluacionFinalizada('ev-2', farms[1], 12, {
      '10.1': ['NO_CUMPLE', '7 de 30 animales con cojera visible.'],
      '8.2': ['PARCIAL', 'Heridas en cuello por comederos.'],
      '4.4': ['NO_CUMPLE', 'Descorne con hierro caliente sin anestesia.'],
      '16.1': ['NO_CUMPLE'],
      '19.1': ['PARCIAL', 'Potreros del sur sin sombra.'],
      '22.1': ['PARCIAL', 'Uso de perros en el arreo.'],
      '20.1': ['NO_APLICA'],
    }, 'Hato grande con problemas de salud que requieren atención urgente.'),
  ];
  return { species: SPECIES, farms, evaluations };
}
