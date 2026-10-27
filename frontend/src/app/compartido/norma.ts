// ARCHIVO GENERADO desde compartido/norma.ts. No lo edite aquí: edite el original y ejecute node scripts/compartido.mjs

/**
 * Reglas de la Metodología del ICA para evaluar el bienestar animal en las
 * especies bovina y bufalina (versión 2.0, 2023): peso de cada libertad,
 * escala de niveles, tamaño del productor y muestra mínima.
 */

export type CodigoLibertad = 'NUTRICION' | 'SALUD' | 'CONFORT' | 'COMPORTAMIENTO';

export interface Libertad {
  codigo: CodigoLibertad;
  nombre: string;
  corto: string;
  /** Porcentaje de la calificación total del predio. */
  peso: number;
}

/** Las cinco libertades agrupadas en los cuatro bloques que pondera la norma. */
export const LIBERTADES: Libertad[] = [
  { codigo: 'NUTRICION', nombre: 'Libre de hambre, sed y desnutrición', corto: 'Alimento y agua', peso: 20 },
  { codigo: 'SALUD', nombre: 'Libre de dolor, lesión y enfermedad', corto: 'Salud', peso: 50 },
  { codigo: 'CONFORT', nombre: 'Libre de molestias físicas y térmicas', corto: 'Confort', peso: 15 },
  {
    codigo: 'COMPORTAMIENTO',
    nombre: 'Libre de temor y angustia, y de manifestar su comportamiento natural',
    corto: 'Comportamiento',
    peso: 15,
  },
];

export type CodigoNivel = 'BAJO' | 'MEDIO' | 'ALTO' | 'EXCELENTE';

export interface Nivel {
  codigo: CodigoNivel;
  nombre: string;
  /** Límite inferior en la escala de 0 a 5. */
  desde: number;
  rango: string;
}

/** Escala de referencia de 0 a 5 que cita la norma (software "Más Bienestar" de Agrosavia). */
export const NIVELES: Nivel[] = [
  { codigo: 'BAJO', nombre: 'Bajo', desde: 0, rango: 'Menos de 3,0' },
  { codigo: 'MEDIO', nombre: 'Medio', desde: 3, rango: '3,0 a 3,9' },
  { codigo: 'ALTO', nombre: 'Alto', desde: 4, rango: '4,0 a 4,5' },
  { codigo: 'EXCELENTE', nombre: 'Excelente', desde: 4.6, rango: '4,6 a 5,0' },
];

/** Nivel que corresponde a un puntaje de 0 a 5 redondeado a un decimal, como lo expresa la norma. */
export function nivelDePuntaje(puntaje: number): Nivel {
  const redondeado = Math.round(puntaje * 10) / 10;
  return [...NIVELES].reverse().find((n) => redondeado >= n.desde) ?? NIVELES[0];
}

export type Productor = 'PEQUENO' | 'MEDIANO' | 'GRANDE';

export const NOMBRE_PRODUCTOR: Record<Productor, string> = {
  PEQUENO: 'Pequeño productor',
  MEDIANO: 'Mediano productor',
  GRANDE: 'Gran productor',
};

/** Tamaño del productor según el número de animales del predio. */
export function tipoProductor(total: number): Productor {
  if (total <= 50) return 'PEQUENO';
  if (total <= 500) return 'MEDIANO';
  return 'GRANDE';
}

/**
 * Muestra mínima cuando la evaluación se hace por inspección visual con muestreo.
 * La norma no fija muestra para 50 animales o menos (capítulo de pequeño productor),
 * y para 1.000 animales o más se toma el 5 % del total.
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
