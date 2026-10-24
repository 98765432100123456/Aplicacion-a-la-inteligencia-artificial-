/**
 * Contenido de referencia de la metodología del ICA para evaluar el bienestar
 * animal en bovinos y bufalinos (versión 2.0, 2023), según el análisis
 * "Análisis de la Norma ICA para la Evaluación del Bienestar Animal en Bovinos
 * y Bufalinos" (A. C. Patiño Hernández, octubre de 2026).
 *
 * Los pesos, niveles, tamaños de productor y muestras son los de la norma.
 * Los cuidados son prácticas de manejo asociadas a lo que evalúa cada libertad.
 */

export interface Libertad {
  id: string;
  nombre: string;
  corto: string;
  peso: number;
  evalua: string[];
  cuidados: string[];
  alerta: string;
}

export const LIBERTADES: Libertad[] = [
  {
    id: 'hambre',
    nombre: 'Libre de hambre, sed y desnutrición',
    corto: 'Alimento y agua',
    peso: 20,
    evalua: [
      'Condición corporal de los animales',
      'Disponibilidad, limpieza y acceso al agua',
      'Cantidad y calidad del alimento y los forrajes',
    ],
    cuidados: [
      'Agua limpia disponible todo el día, con bebederos suficientes para que los animales no compitan.',
      'Lavar bebederos y comederos con frecuencia y revisar que no haya fugas ni agua estancada.',
      'Ajustar la ración y la suplementación a la etapa del animal: crías, levante, gestación o producción.',
      'Revisar la condición corporal y apartar los animales flacos para darles manejo y alimento adicional.',
      'Planear la rotación de potreros para tener forraje en las épocas secas.',
    ],
    alerta: 'Animales flacos, bebederos secos o sucios y potreros sin forraje.',
  },
  {
    id: 'salud',
    nombre: 'Libre de dolor, lesión y enfermedad',
    corto: 'Salud',
    peso: 50,
    evalua: [
      'Cojeras, heridas, lesiones y signos de enfermedad',
      'Plan sanitario, registros de tratamientos y vacunación',
      'Uso de anestesia y analgesia en procedimientos dolorosos',
    ],
    cuidados: [
      'Cumplir los ciclos de vacunación obligatorios del ICA y llevar el registro de cada animal.',
      'Tener un plan sanitario con asistencia de un médico veterinario.',
      'Revisar a diario cojeras, heridas, diarreas o animales decaídos, y tratarlos a tiempo.',
      'Registrar cada tratamiento con el producto, la dosis, la fecha y el tiempo de retiro.',
      'Hacer descorne, castración y otros procedimientos dolorosos con anestesia y analgesia.',
      'Separar y atender los animales enfermos o lesionados en un corral de enfermería.',
    ],
    alerta: 'Cojeras sin atender, heridas abiertas o procedimientos dolorosos sin anestesia.',
  },
  {
    id: 'confort',
    nombre: 'Libre de molestias físicas y térmicas',
    corto: 'Confort',
    peso: 15,
    evalua: [
      'Sombra y protección frente al sol, la lluvia y el frío',
      'Estado de pisos, corrales, cercas e instalaciones',
      'Áreas de descanso secas y espacio suficiente',
    ],
    cuidados: [
      'Garantizar sombra natural o artificial en los potreros y en los corrales de espera.',
      'Mantener pisos firmes, secos y antideslizantes, sin barro acumulado.',
      'Revisar cercas, mangas y corrales para que no tengan puntas, clavos ni salientes.',
      'Dar a cada lote espacio suficiente para echarse y moverse sin amontonarse.',
    ],
    alerta: 'Animales sin sombra, echados en barro o con lesiones causadas por las instalaciones.',
  },
  {
    id: 'comportamiento',
    nombre: 'Libre de temor y angustia, y de manifestar su comportamiento natural',
    corto: 'Comportamiento',
    peso: 15,
    evalua: [
      'Reacción de los animales ante las personas',
      'Forma de manejo en potreros, mangas y embarque',
      'Capacitación del personal en bienestar animal',
    ],
    cuidados: [
      'Arrear con calma, sin golpes, gritos ni perros que muerdan.',
      'Capacitar al personal en manejo y bienestar animal, y dejar registro de la capacitación.',
      'Mantener mangas, bretes y embarcaderos en buen estado para que los animales no se lastimen ni se asusten.',
      'Evitar aislar a los animales: el ganado es gregario y se estresa cuando se separa del grupo.',
      'Permitir el pastoreo, el descanso y la interacción del grupo.',
    ],
    alerta: 'Animales que huyen o se agitan cuando ven personas, golpes o uso de la fuerza en el manejo.',
  },
];

export interface Nivel {
  nombre: string;
  desde: number;
  hasta: number;
  rango: string;
  tono: 'bajo' | 'medio' | 'alto' | 'excelente';
}

/** Escala de referencia de 0 a 5 que cita la norma (software "Más Bienestar" de Agrosavia). */
export const NIVELES: Nivel[] = [
  { nombre: 'Bajo', desde: 0, hasta: 3, rango: 'Menos de 3,0', tono: 'bajo' },
  { nombre: 'Medio', desde: 3, hasta: 4, rango: '3,0 a 3,9', tono: 'medio' },
  { nombre: 'Alto', desde: 4, hasta: 4.55, rango: '4,0 a 4,5', tono: 'alto' },
  { nombre: 'Excelente', desde: 4.55, hasta: 5, rango: '4,6 a 5,0', tono: 'excelente' },
];

export const TIPOS_INDICADOR = [
  { nombre: 'Basados en el animal', ejemplo: 'Se observa directamente el ejemplar: condición corporal, cojeras, lesiones.' },
  { nombre: 'Basados en los recursos', ejemplo: 'Se revisa el entorno: agua, alimento, sombra e instalaciones.' },
  { nombre: 'Basados en la gestión', ejemplo: 'Se revisan registros, uso de anestesia y capacitación del personal.' },
];

export const METODOS = ['Revisión documental', 'Inspección visual sin muestreo', 'Inspección visual con muestreo'];

export type Productor = 'pequeño' | 'mediano' | 'grande';

/** Tamaño del productor según el número de animales del predio. */
export function tipoProductor(total: number): Productor {
  if (total <= 50) return 'pequeño';
  if (total <= 500) return 'mediano';
  return 'grande';
}

/**
 * Muestra mínima cuando la evaluación se hace por inspección visual con muestreo.
 * La norma no fija muestra para 50 animales o menos (capítulo de pequeño productor).
 */
export function muestraMinima(total: number): number | null {
  if (total <= 50) return null;
  if (total <= 99) return Math.min(20, total);
  if (total <= 499) return 30;
  if (total <= 999) return 40;
  return Math.ceil(total * 0.05);
}

/** Reparte la muestra entre grupos etarios en proporción al inventario (método del mayor residuo). */
export function repartir(muestra: number, grupos: number[]): number[] {
  const total = grupos.reduce((a, b) => a + b, 0);
  if (!total) return grupos.map(() => 0);
  const exactos = grupos.map((g) => (muestra * g) / total);
  const base = exactos.map(Math.floor);
  let faltan = muestra - base.reduce((a, b) => a + b, 0);
  const orden = exactos.map((e, i) => ({ i, r: e - Math.floor(e) })).sort((a, b) => b.r - a.r);
  for (const { i } of orden) {
    if (faltan <= 0) break;
    if (base[i] < grupos[i]) {
      base[i]++;
      faltan--;
    }
  }
  return base;
}
