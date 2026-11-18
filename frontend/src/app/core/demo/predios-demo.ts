import { calificar, RespuestaIndicador, Resultado } from '../../compartido/calificacion';
import { Indicador, listaPara, Respuesta } from '../../compartido/lista-chequeo';
import { Sistema } from '../../compartido/norma';
import { recomendacionesPorReglas, Recomendaciones } from '../../compartido/recomendaciones';
import { Answer, Species } from '../models/predios';
import { RutaArbol } from '../../compartido/escenarios';

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
  /** Recorridos de los árboles de escenarios; no existe en datos guardados antes de los árboles. */
  scenarios?: Record<string, RutaArbol>;
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
  evaluatorId = 'u-1',
  /** Respuesta de los indicadores sin excepción; por defecto, cumple. */
  predeterminada: (i: Indicador) => Respuesta = () => 'CUMPLE',
): DemoEvaluation {
  const s = farm.species[0];
  const lista = listaPara('BOVINO', farm.productionSystem, s.calves + s.young + s.adults);
  const answers: Answer[] = lista.map((i) => ({
    indicatorCode: i.codigo,
    answer: excepciones[i.codigo]?.[0] ?? predeterminada(i),
    observation: excepciones[i.codigo]?.[1] ?? null,
  }));
  const respuestas: Record<string, RespuestaIndicador> = Object.fromEntries(answers.map((a) => [a.indicatorCode, { respuesta: a.answer, observacion: a.observation }]));
  const results = calificar(lista, respuestas);
  const cuando = haceDias(dias).toISOString();
  return {
    id, farmId: farm.id, speciesId: s.speciesId, evaluatorId, status: 'FINALIZADA', sistema: farm.productionSystem, visitDate: fecha(haceDias(dias)),
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
    {
      ...base, id: 'p-4', name: 'San Isidro', ownerName: 'Gloria Inés Restrepo', ownerPhone: '3116672034', ownerEmail: null,
      department: 'Antioquia', municipality: 'Santa Rosa de Osos', vereda: 'Aragón', areaHectares: 65, productionSystem: 'LECHERIA',
      species: [{ speciesId: 'esp-bov', calves: 15, young: 40, adults: 85 }],
    },
    {
      ...base, id: 'p-5', name: 'Los Guaduales', ownerName: 'Hernán Darío Castro', ownerPhone: '3185520941', ownerEmail: null,
      department: 'Meta', municipality: 'Puerto López', vereda: 'Remolinos', areaHectares: 900, productionSystem: 'CARNE',
      species: [{ speciesId: 'esp-bov', calves: 80, young: 220, adults: 380 }],
    },
    {
      ...base, id: 'p-6', name: 'La Fortuna', ownerName: 'Ana Lucía Pérez', ownerPhone: '3134408812', ownerEmail: null,
      department: 'Boyacá', municipality: 'Paipa', vereda: 'Palermo', areaHectares: 22, productionSystem: 'LECHERIA',
      species: [{ speciesId: 'esp-bov', calves: 6, young: 12, adults: 26 }],
    },
    {
      ...base, id: 'p-7', name: 'El Porvenir', ownerName: 'Carlos Julio Sánchez', ownerPhone: '3002217765', ownerEmail: null,
      department: 'Santander', municipality: 'San Gil', vereda: 'Bejaranas', areaHectares: 140, productionSystem: 'DOBLE_PROPOSITO',
      species: [{ speciesId: 'esp-bov', calves: 20, young: 50, adults: 130 }],
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
      '9.2': ['NO_CUMPLE', 'Sin plan sanitario escrito.'],
      '9.3': ['PARCIAL', 'Vacunación de aftosa sin soporte del último ciclo.'],
      '8.1': ['PARCIAL', 'Animales con heridas sin tratar.'],
      '20.1': ['NO_APLICA'],
    }, 'Hato grande con problemas de salud que requieren atención urgente.'),
    evaluacionFinalizada('ev-3', farms[2], 150, {
      '3.1': ['PARCIAL', '3 vacas con condición corporal 2.'],
      '6.2': ['NO_CUMPLE', 'Bebederos con barro y sin limpieza.'],
      '18.2': ['PARCIAL', 'Charcos en el corral de espera.'],
      '22.2': ['PARCIAL', 'Gritos durante el arreo.'],
    }, 'Predio pequeño con buena disposición; se recomendó limpiar bebederos cada semana.', 'u-2'),
    evaluacionFinalizada('ev-4', farms[3], 120, {
      '16.2': ['PARCIAL', 'Registro de tratamientos incompleto.'],
      '21.2': ['PARCIAL'],
    }, 'Muy buen manejo del hato y de las instalaciones.', 'u-3'),
    evaluacionFinalizada('ev-5', farms[4], 95, {
      '1.1': ['NO_CUMPLE', 'Saladeros vacíos en dos potreros.'],
      '2.1': ['NO_CUMPLE', 'Bebederos secos en el potrero del norte.'],
      '3.1': ['NO_CUMPLE', '12 de 40 animales con condición corporal baja.'],
      '4.4': ['NO_CUMPLE', 'Castración sin anestesia.'],
      '8.2': ['NO_CUMPLE', 'Lesiones por alambre de púas.'],
      '9.4': ['NO_CUMPLE', 'Garrapatas en la mayoría de los animales revisados.'],
      '10.1': ['NO_CUMPLE', '9 de 40 animales con cojera.'],
      '19.1': ['NO_CUMPLE', 'Sin sombra en los potreros de ceba.'],
      '22.1': ['PARCIAL', 'Uso de varas para el arreo.'],
    }, 'Se requiere un plan de mejora urgente en nutrición, sanidad y sombra.', 'u-2', (i) => (i.respuesta === 'SI_NO' ? 'NO_CUMPLE' : 'PARCIAL')),
    evaluacionFinalizada('ev-6', farms[5], 65, {
      '3.1': ['PARCIAL', '4 de 20 animales delgados.'],
      '9.2': ['NO_CUMPLE', 'Sin plan de vacunación escrito.'],
      '10.1': ['PARCIAL', '2 de 20 animales con cojera leve.'],
      '18.1': ['NO_CUMPLE', 'Corral de ordeño con piso resbaloso.'],
      '19.1': ['PARCIAL'],
    }, 'Hay que mejorar el piso del ordeño y el plan sanitario.', 'u-1', (i) => (i.libertad === 'SALUD' && i.respuesta === 'ESCALA' ? 'PARCIAL' : 'CUMPLE')),
    evaluacionFinalizada('ev-7', farms[6], 45, {
      '8.2': ['PARCIAL', 'Algunas heridas por comederos.'],
      '16.2': ['NO_CUMPLE', 'Sin registro de medicamentos.'],
      '22.1': ['PARCIAL'],
    }, 'Buen nivel general; falta organizar los registros.', 'u-3'),
    evaluacionFinalizada('ev-8', farms[0], 8, {
      '16.2': ['PARCIAL', 'Ya se lleva registro, con algunos vacíos.'],
      '20.1': ['NO_APLICA', 'Los animales están en pastoreo.'],
    }, 'Mejoró frente a la visita anterior: se corrigió la condición corporal del lote de levante.'),
  ];
  return { species: SPECIES, farms, evaluations };
}
