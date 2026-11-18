import { CodigoLibertad, CodigoNivel, Productor, Sistema } from '../../compartido/norma';

/** Una evaluación finalizada, con lo que el tablero necesita para resumir y exportar. */
export interface FilaTablero {
  id: string;
  codigo: string;
  predio: string;
  departamento: string;
  municipio: string;
  especie: string;
  sistema: Sistema | null;
  productor: Productor;
  animales: number;
  evaluador: string;
  fechaVisita: string;
  finalizada: string;
  puntaje: number;
  nivel: CodigoNivel;
  libertades: { codigo: CodigoLibertad; puntaje: number | null }[];
  hallazgos: { criterio: string; nombre: string; critico: boolean }[];
  origenRecomendaciones: 'IA' | 'REGLAS' | null;
}

/** Datos que entrega la API (Firestore o la demostración) para el tablero. */
export interface DatosTablero {
  predios: number;
  borradores: number;
  evaluaciones: FilaTablero[];
}
