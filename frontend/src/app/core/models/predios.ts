import { Resultado } from '../../compartido/calificacion';
import { Indicador, Respuesta } from '../../compartido/lista-chequeo';
import { CodigoNivel, Productor, Sistema } from '../../compartido/norma';
import { Recomendaciones } from '../../compartido/recomendaciones';

/** Tipos que intercambian la interfaz y la API para predios, evaluaciones e informes. */

export interface Species {
  id: string;
  code: string;
  name: string;
}

export interface FarmSpeciesItem {
  speciesId: string;
  code: string;
  name: string;
  calves: number;
  young: number;
  adults: number;
  total: number;
  producerType: Productor;
  sampleSize: number | null;
}

export interface FarmItem {
  id: string;
  name: string;
  owner: { name: string; document: string | null; phone: string; email: string | null; hasAccount: boolean };
  department: string;
  municipality: string;
  vereda: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  areaHectares: number | null;
  productionSystem: Sistema | null;
  notes: string | null;
  species: FarmSpeciesItem[];
  totalAnimals: number;
  lastEvaluation: { id: string; speciesName: string; finishedAt: string; score: number | null; level: CodigoNivel | null } | null;
  updatedAt: string;
}

export interface FarmInput {
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
}

export type ReportKind = 'TECNICO' | 'PROPIETARIO';

export interface ReportMeta {
  id: string;
  kind: ReportKind;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Answer {
  indicatorCode: string;
  answer: Respuesta;
  observation: string | null;
}

export interface EvaluationSummary {
  id: string;
  code: string;
  status: 'BORRADOR' | 'FINALIZADA';
  farm: { id: string; name: string; ownerName: string; location: string; ownerEmail?: string | null };
  species: Species;
  evaluator: { id: string; name: string };
  visitDate: string;
  inventory: { calves: number; young: number; adults: number; total: number };
  producerType: Productor;
  productionSystem: Sistema | null;
  sampleSize: number | null;
  sampleByGroup: number[] | null;
  checklistVersion: string;
  generalObservation: string | null;
  score: number | null;
  level: CodigoNivel | null;
  results: Resultado | null;
  lastSavedAt: string;
  finishedAt: string | null;
  recommendation: (Recomendaciones & { createdAt: string }) | null;
  reports: ReportMeta[];
}

export interface EvaluationDetail extends EvaluationSummary {
  checklist: Omit<Indicador, 'propietario'>[];
  answers: Answer[];
}

export interface SaveEvaluationInput {
  visitDate?: string;
  generalObservation?: string | null;
  answers?: Answer[];
}

export type Proveedor = 'google' | 'facebook' | 'microsoft';

/** Opciones de ingreso disponibles: registro de propietarios y proveedores externos. */
export interface AuthConfig {
  registration: boolean;
  providers: Proveedor[];
}
