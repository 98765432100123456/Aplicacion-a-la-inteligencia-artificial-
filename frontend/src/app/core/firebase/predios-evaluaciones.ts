import type { DocumentData, DocumentSnapshot, Query } from 'firebase/firestore';
import { calificar, pendientes, RespuestaIndicador } from '../../compartido/calificacion';
import { listaPara, Respuesta, VERSION_LISTA } from '../../compartido/lista-chequeo';
import { muestraMinima, NOMBRE_PRODUCTOR, repartir, Sistema, tipoProductor } from '../../compartido/norma';
import { recomendacionesPorReglas, Recomendaciones } from '../../compartido/recomendaciones';
import { generarInforme, guardarArchivo, nombreInforme, TipoInforme } from '../informes/informes';
import { EvaluationDetail, EvaluationSummary, FarmInput, FarmItem, ReportMeta, SaveEvaluationInput, Species } from '../models/predios';
import { ErrorVisible } from '../utils/http-error';
import { auditar } from './auditoria';
import { firebase, Firebase, iso } from './conexion';
import { recomendarConIA } from './ia';

/** Quién consulta: el personal ve todos los predios; el propietario, solo los registrados con su correo. */
export interface Alcance {
  uid: string;
  correo: string;
  nombre: string;
  /** fincas.ver o fincas.gestionar. */
  todosLosPredios: boolean;
  /** evaluaciones.ver, evaluaciones.diligenciar o reportes.ver. */
  personal: boolean;
}

type Doc = DocumentSnapshot<DocumentData>;

const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
/** Firestore no guarda `undefined`: se limpia con una copia JSON. */
const limpio = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const SIN_VERIFICAR = 'Confirme su correo con el enlace que le enviamos para consultar sus predios. Si ya lo hizo, cierre sesión e ingrese de nuevo.';

/** Predios, evaluaciones, recomendaciones e informes sobre Firestore. */
export class PrediosEvaluacionesFirebase {
  private especiesCache: Promise<Species[]> | null = null;

  constructor(private readonly alcance: () => Alcance) {}

  species(): Promise<Species[]> {
    this.especiesCache ??= firebase().then(async (fb) => {
      const docs = (await fb.fs.getDocs(fb.fs.collection(fb.db, 'especies'))).docs;
      return docs
        .filter((d) => d.get('activa') !== false)
        .map((d) => ({ id: d.id, code: d.id.toUpperCase(), name: d.get('nombre') as string }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    });
    return this.especiesCache;
  }

  async listFarms(search = ''): Promise<FarmItem[]> {
    const fb = await firebase();
    const a = this.alcance();
    const { collection, query, where, getDocs } = fb.fs;
    const predios = a.todosLosPredios ? collection(fb.db, 'predios') : query(collection(fb.db, 'predios'), where('propietarioCorreo', '==', a.correo));
    const [docs, ultimas, especies] = await Promise.all([this.leer(predios), this.ultimasEvaluaciones(fb), this.species()]);
    const q = search.trim().toLowerCase();
    return docs
      .map((d) => vistaPredio(d, especies, ultimas.get(d.id) ?? null))
      .filter((f) => !q || [f.name, f.owner.name, f.municipality].some((v) => v.toLowerCase().includes(q)))
      .sort((x, y) => x.name.localeCompare(y.name, 'es'));
  }

  async getFarm(id: string): Promise<FarmItem> {
    const fb = await firebase();
    const [d, ultimas, especies] = await Promise.all([this.predio(fb, id), this.ultimasEvaluaciones(fb, id), this.species()]);
    return vistaPredio(d, especies, ultimas.get(id) ?? null);
  }

  async createFarm(input: FarmInput): Promise<FarmItem> {
    validarPredio(input);
    const fb = await firebase();
    const { doc, collection, writeBatch, serverTimestamp } = fb.fs;
    const ref = doc(collection(fb.db, 'predios'));
    const lote = writeBatch(fb.db);
    lote.set(ref, { ...datosPredio(input), creadoPor: this.alcance().uid, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
    auditar(fb, lote, this.alcance().uid, 'predio.creado', 'predio', ref.id, { nombre: input.name });
    await lote.commit();
    return this.getFarm(ref.id);
  }

  /** Si cambia el correo del propietario, sus evaluaciones y recomendaciones lo copian en el mismo lote. */
  async updateFarm(id: string, input: Partial<FarmInput>): Promise<FarmItem> {
    const fb = await firebase();
    const actual = await this.predio(fb, id);
    const completo = { ...formularioDe(actual), ...input } as FarmInput;
    validarPredio(completo);
    const datos = datosPredio(completo);
    const { doc, collection, query, where, getDocs, writeBatch, serverTimestamp } = fb.fs;
    const lote = writeBatch(fb.db);
    lote.update(doc(fb.db, 'predios', id), { ...datos, actualizadoEn: serverTimestamp() });
    if (datos.propietarioCorreo !== actual.get('propietarioCorreo')) {
      for (const coleccion of ['evaluaciones', 'recomendaciones']) {
        const relacionados = await getDocs(query(collection(fb.db, coleccion), where('predioId', '==', id)));
        relacionados.docs.forEach((r) => lote.update(r.ref, { propietarioCorreo: datos.propietarioCorreo }));
      }
    }
    auditar(fb, lote, this.alcance().uid, 'predio.editado', 'predio', id, { campos: Object.keys(input) });
    await lote.commit();
    return this.getFarm(id);
  }

  /** Historial del predio, del más reciente al más antiguo; el propietario ve solo las finalizadas. */
  async history(farmId: string): Promise<EvaluationSummary[]> {
    const fb = await firebase();
    const a = this.alcance();
    // Quien ve predios pero no evaluaciones no tiene historial que consultar.
    if (!a.personal && a.todosLosPredios) return [];
    const { collection, query, where } = fb.fs;
    const filtros = a.personal
      ? [where('predioId', '==', farmId)]
      : [where('predioId', '==', farmId), where('propietarioCorreo', '==', a.correo), where('estado', '==', 'finalizada')];
    const [predio, docs, especies] = await Promise.all([this.predio(fb, farmId), this.leer(query(collection(fb.db, 'evaluaciones'), ...filtros)), this.species()]);
    return docs
      .map((d) => {
        const { checklist: _lista, answers: _respuestas, ...resumen } = vistaEvaluacion(d, predio, especies);
        return resumen;
      })
      .sort((x, y) => (y.createdAt ?? '').localeCompare(x.createdAt ?? ''))
      .map(({ createdAt: _creada, ...resumen }) => resumen);
  }

  /** Crea la evaluación de una especie, o devuelve la que está en curso (RF13, RF14). */
  async startEvaluation(farmId: string, speciesId: string): Promise<EvaluationDetail> {
    const fb = await firebase();
    const predio = await this.predio(fb, farmId);
    const especie = (predio.get('especies') as EspeciePredio[]).find((s) => s.especieId === speciesId);
    if (!especie) throw new ErrorVisible('Esa especie no está registrada en el predio.');
    const { collection, query, where, limit, getDocs, doc, writeBatch, serverTimestamp } = fb.fs;
    const enCurso = await getDocs(query(collection(fb.db, 'evaluaciones'), where('predioId', '==', farmId), where('especieId', '==', speciesId), where('estado', '==', 'borrador'), limit(1)));
    if (!enCurso.empty) return this.getEvaluation(enCurso.docs[0].id);
    const a = this.alcance();
    const ref = doc(collection(fb.db, 'evaluaciones'));
    const lote = writeBatch(fb.db);
    lote.set(ref, {
      predioId: farmId, propietarioCorreo: predio.get('propietarioCorreo') ?? null, especieId: speciesId,
      evaluadorId: a.uid, evaluadorNombre: a.nombre, estado: 'borrador', versionLista: VERSION_LISTA, fechaVisita: hoy(),
      inventario: { crias: especie.crias, jovenes: especie.jovenes, adultos: especie.adultos }, sistema: predio.get('sistema') ?? null,
      respuestas: {}, observacionGeneral: null, guardadoEn: serverTimestamp(), creadoEn: serverTimestamp(),
    });
    auditar(fb, lote, a.uid, 'evaluacion.creada', 'evaluacion', ref.id, { predioId: farmId });
    await lote.commit();
    return this.getEvaluation(ref.id);
  }

  async getEvaluation(id: string): Promise<EvaluationDetail> {
    const fb = await firebase();
    const d = await fb.fs.getDoc(fb.fs.doc(fb.db, 'evaluaciones', id)).catch(() => null);
    if (!d?.exists()) throw new ErrorVisible('La evaluación no existe.');
    const [predio, especies] = await Promise.all([this.predio(fb, d.get('predioId')), this.species()]);
    const { createdAt: _creada, ...vista } = vistaEvaluacion(d, predio, especies);
    return vista;
  }

  /** Guardado parcial con fecha y hora (RF15, RF16, RF18). */
  async saveEvaluation(id: string, input: SaveEvaluationInput): Promise<EvaluationDetail> {
    const actual = await this.getEvaluation(id);
    if (actual.status !== 'BORRADOR') throw new ErrorVisible('La evaluación ya está finalizada y no se puede modificar.');
    const lista = new Map(actual.checklist.map((i) => [i.codigo, i]));
    const fb = await firebase();
    const { doc, updateDoc, FieldPath, serverTimestamp } = fb.fs;
    const campos: unknown[] = [];
    for (const a of input.answers ?? []) {
      const i = lista.get(a.indicatorCode);
      if (!i) throw new ErrorVisible(`El indicador ${a.indicatorCode} no pertenece a esta lista de chequeo.`);
      if (i.respuesta === 'SI_NO' && a.answer === 'PARCIAL') throw new ErrorVisible(`El indicador ${a.indicatorCode} solo admite cumple o no cumple.`);
      // El código lleva punto (1.2): FieldPath evita que se lea como un campo anidado.
      campos.push(new FieldPath('respuestas', a.indicatorCode), { respuesta: a.answer, observacion: a.observation?.trim() || null });
    }
    if (input.visitDate !== undefined) campos.push('fechaVisita', input.visitDate);
    if (input.generalObservation !== undefined) campos.push('observacionGeneral', input.generalObservation?.trim() || null);
    await (updateDoc as (...args: unknown[]) => Promise<void>)(doc(fb.db, 'evaluaciones', id), 'guardadoEn', serverTimestamp(), ...campos);
    return this.getEvaluation(id);
  }

  /** Valida que todo esté respondido, calcula el resultado y guarda las recomendaciones en un solo lote. */
  async finalize(id: string): Promise<EvaluationDetail> {
    const e = await this.getEvaluation(id);
    if (e.status !== 'BORRADOR') throw new ErrorVisible('La evaluación ya está finalizada y no se puede modificar.');
    const lista = listaDe(e);
    const respuestas = respuestasDe(e);
    const faltan = pendientes(lista, respuestas);
    if (faltan.length) {
      throw new ErrorVisible(`Faltan ${faltan.length} ${faltan.length === 1 ? 'indicador' : 'indicadores'} por responder: ${faltan.map((i) => i.codigo).join(', ')}.`);
    }
    const resultado = calificar(lista, respuestas);
    const rec = await this.recomendaciones(e, resultado);
    const fb = await firebase();
    const { doc, writeBatch, serverTimestamp } = fb.fs;
    const lote = writeBatch(fb.db);
    lote.update(doc(fb.db, 'evaluaciones', id), {
      estado: 'finalizada', puntaje: resultado.puntaje, nivel: resultado.nivel, resultado: limpio(resultado),
      recomendacion: { ...limpio(rec), creadoEn: serverTimestamp() }, finalizadaEn: serverTimestamp(), guardadoEn: serverTimestamp(),
    });
    this.guardarHistorial(fb, lote, e, rec);
    auditar(fb, lote, this.alcance().uid, 'evaluacion.finalizada', 'evaluacion', id, { puntaje: resultado.puntaje, nivel: resultado.nivel, recomendaciones: rec.origen });
    await lote.commit();
    return this.getEvaluation(id);
  }

  /** Vuelve a generar las recomendaciones, por ejemplo si la IA no respondió al finalizar. */
  async regenerateRecommendations(id: string): Promise<EvaluationDetail> {
    const e = await this.getEvaluation(id);
    if (e.status !== 'FINALIZADA' || !e.results) throw new ErrorVisible('La evaluación aún no está finalizada.');
    const rec = await this.recomendaciones(e, e.results);
    const fb = await firebase();
    const { doc, writeBatch, serverTimestamp } = fb.fs;
    const lote = writeBatch(fb.db);
    lote.update(doc(fb.db, 'evaluaciones', id), { recomendacion: { ...limpio(rec), creadoEn: serverTimestamp() } });
    this.guardarHistorial(fb, lote, e, rec);
    auditar(fb, lote, this.alcance().uid, 'evaluacion.recomendaciones_regeneradas', 'evaluacion', id, { origen: rec.origen });
    await lote.commit();
    return this.getEvaluation(id);
  }

  async downloadReport(evaluationId: string, tipo: TipoInforme) {
    const e = await this.getEvaluation(evaluationId);
    if (e.status !== 'FINALIZADA') throw new ErrorVisible('Este informe aún no se ha generado.');
    const fb = await firebase();
    const telefono = (await this.predio(fb, e.farm.id)).get('propietario.telefono') ?? null;
    guardarArchivo(await generarInforme(e, telefono, tipo), nombreInforme(e, tipo));
  }

  private async recomendaciones(e: EvaluationDetail, resultado: ReturnType<typeof calificar>): Promise<Recomendaciones> {
    const lista = listaDe(e);
    const ia = await recomendarConIA({
      especie: e.species.name,
      productor: NOMBRE_PRODUCTOR[e.producerType],
      municipio: e.farm.location.split(', ').slice(-2).join(', '),
      resultado,
      lista,
    });
    return ia ?? recomendacionesPorReglas(resultado, lista);
  }

  private guardarHistorial(fb: Firebase, lote: ReturnType<Firebase['fs']['writeBatch']>, e: EvaluationDetail, rec: Recomendaciones) {
    const { doc, collection, serverTimestamp } = fb.fs;
    lote.set(doc(collection(fb.db, 'recomendaciones')), {
      ...limpio(rec), evaluacionId: e.id, predioId: e.farm.id, propietarioCorreo: e.farm.ownerEmail ?? null,
      creadoPor: this.alcance().uid, creadoEn: serverTimestamp(),
    });
  }

  private async predio(fb: Firebase, id: string): Promise<Doc> {
    const d = await fb.fs.getDoc(fb.fs.doc(fb.db, 'predios', id)).catch((e) => {
      if (e?.code === 'permission-denied' && !this.alcance().todosLosPredios) throw new ErrorVisible('El predio no existe.');
      throw e;
    });
    if (!d.exists()) throw new ErrorVisible('El predio no existe.');
    return d;
  }

  private async leer(q: Query<DocumentData>) {
    const fb = await firebase();
    try {
      return (await fb.fs.getDocs(q)).docs;
    } catch (e) {
      if ((e as { code?: string }).code === 'permission-denied' && !this.alcance().todosLosPredios) throw new ErrorVisible(SIN_VERIFICAR);
      throw e;
    }
  }

  /** Última evaluación finalizada de cada predio (o del indicado), para las fichas de la lista. */
  private async ultimasEvaluaciones(fb: Firebase, predioId?: string) {
    const a = this.alcance();
    const mapa = new Map<string, Doc>();
    if (!a.personal && a.todosLosPredios) return mapa;
    const { collection, query, where } = fb.fs;
    const filtros = [where('estado', '==', 'finalizada')];
    if (!a.personal) filtros.push(where('propietarioCorreo', '==', a.correo));
    if (predioId) filtros.push(where('predioId', '==', predioId));
    const docs = await this.leer(query(collection(fb.db, 'evaluaciones'), ...filtros)).catch(() => []);
    for (const d of docs.sort((x, y) => (iso(y.get('finalizadaEn')) ?? '').localeCompare(iso(x.get('finalizadaEn')) ?? ''))) {
      if (!mapa.has(d.get('predioId'))) mapa.set(d.get('predioId'), d);
    }
    return mapa;
  }
}

interface EspeciePredio {
  especieId: string;
  crias: number;
  jovenes: number;
  adultos: number;
}

function validarPredio(f: FarmInput) {
  if (!f.species?.length) throw new ErrorVisible('Registre al menos una especie con su inventario.');
  if (new Set(f.species.map((s) => s.speciesId)).size !== f.species.length) throw new ErrorVisible('Cada especie se registra una sola vez por predio.');
  if (f.species.some((s) => s.calves + s.young + s.adults === 0)) throw new ErrorVisible('Cada especie debe tener al menos un animal en el inventario.');
}

function datosPredio(f: FarmInput) {
  const correo = f.ownerEmail?.trim().toLowerCase() || null;
  const especies = f.species.map((s) => ({ especieId: s.speciesId, crias: s.calves, jovenes: s.young, adultos: s.adults }));
  return {
    nombre: f.name.trim(),
    propietario: { nombre: f.ownerName.trim(), documento: f.ownerDocument || null, telefono: f.ownerPhone.trim(), correo },
    propietarioCorreo: correo,
    departamento: f.department.trim(), municipio: f.municipality.trim(), vereda: f.vereda || null, direccion: f.address || null,
    latitud: f.latitude ?? null, longitud: f.longitude ?? null, areaHectareas: f.areaHectares ?? null,
    sistema: f.productionSystem ?? null, notas: f.notes || null,
    especies, totalAnimales: especies.reduce((a, s) => a + s.crias + s.jovenes + s.adultos, 0),
  };
}

function formularioDe(d: Doc): FarmInput {
  const p = d.data()!;
  return {
    name: p['nombre'], ownerName: p['propietario']['nombre'], ownerDocument: p['propietario']['documento'] ?? null,
    ownerPhone: p['propietario']['telefono'], ownerEmail: p['propietario']['correo'] ?? null,
    department: p['departamento'], municipality: p['municipio'], vereda: p['vereda'] ?? null, address: p['direccion'] ?? null,
    latitude: p['latitud'] ?? null, longitude: p['longitud'] ?? null, areaHectares: p['areaHectareas'] ?? null,
    productionSystem: p['sistema'] ?? null, notes: p['notas'] ?? null,
    species: (p['especies'] as EspeciePredio[]).map((s) => ({ speciesId: s.especieId, calves: s.crias, young: s.jovenes, adults: s.adultos })),
  };
}

const ubicacion = (p: DocumentData) => [p['direccion'], p['vereda'] && `vereda ${p['vereda']}`, p['municipio'], p['departamento']].filter(Boolean).join(', ');

function vistaPredio(d: Doc, especies: Species[], ultima: Doc | null): FarmItem {
  const f = formularioDe(d);
  const p = d.data()!;
  const species = f.species.map((s) => {
    const e = especies.find((x) => x.id === s.speciesId);
    const total = s.calves + s.young + s.adults;
    return { ...s, code: e?.code ?? s.speciesId.toUpperCase(), name: e?.name ?? s.speciesId, total, producerType: tipoProductor(total), sampleSize: muestraMinima(total) };
  });
  return {
    id: d.id, name: f.name,
    owner: { name: f.ownerName, document: f.ownerDocument, phone: f.ownerPhone, email: f.ownerEmail, hasAccount: false },
    department: f.department, municipality: f.municipality, vereda: f.vereda, address: f.address,
    latitude: f.latitude, longitude: f.longitude, areaHectares: f.areaHectares, productionSystem: f.productionSystem, notes: f.notes,
    species, totalAnimals: species.reduce((a, s) => a + s.total, 0),
    lastEvaluation: ultima
      ? { id: ultima.id, speciesName: especies.find((x) => x.id === ultima.get('especieId'))?.name ?? '', finishedAt: iso(ultima.get('finalizadaEn'))!, score: ultima.get('puntaje') ?? null, level: ultima.get('nivel') ?? null }
      : null,
    updatedAt: iso(p['actualizadoEn']) ?? new Date().toISOString(),
  };
}

function vistaEvaluacion(d: Doc, predio: Doc, especies: Species[]): EvaluationDetail & { createdAt: string | null } {
  const e = d.data()!;
  const p = predio.data()!;
  const inv = e['inventario'] as { crias: number; jovenes: number; adultos: number };
  const total = inv.crias + inv.jovenes + inv.adultos;
  const muestra = muestraMinima(total);
  const especie = especies.find((x) => x.id === e['especieId']) ?? { id: e['especieId'], code: String(e['especieId']).toUpperCase(), name: e['especieId'] };
  const sistema = (e['sistema'] ?? null) as Sistema | null;
  const finalizada = e['estado'] === 'finalizada';
  const rec = e['recomendacion'] as (Recomendaciones & { creadoEn?: unknown }) | undefined;
  const codigo = `EV-${d.id.slice(0, 8).toUpperCase()}`;
  const visitDate = e['fechaVisita'] as string;
  const reports: ReportMeta[] = finalizada
    ? (['TECNICO', 'PROPIETARIO'] as const).map((kind) => ({
        id: `${d.id}-${kind}`, kind, sizeBytes: 0,
        fileName: `${kind === 'TECNICO' ? 'informe-tecnico' : 'recomendaciones-propietario'}-${visitDate}-${codigo.toLowerCase()}.pdf`,
        createdAt: iso(kind === 'PROPIETARIO' ? rec?.creadoEn : e['finalizadaEn']) ?? '',
      }))
    : [];
  return {
    id: d.id, code: codigo, status: finalizada ? 'FINALIZADA' : 'BORRADOR',
    farm: { id: predio.id, name: p['nombre'], ownerName: p['propietario']['nombre'], location: ubicacion(p), ownerEmail: p['propietarioCorreo'] ?? null },
    species: especie,
    evaluator: { id: e['evaluadorId'], name: e['evaluadorNombre'] ?? 'Evaluador' },
    visitDate,
    inventory: { calves: inv.crias, young: inv.jovenes, adults: inv.adultos, total },
    producerType: tipoProductor(total), productionSystem: sistema,
    sampleSize: muestra, sampleByGroup: muestra === null ? null : repartir(muestra, [inv.crias, inv.jovenes, inv.adultos]),
    checklistVersion: e['versionLista'],
    checklist: listaPara(especie.code, sistema, total).map(({ propietario: _paraElPropietario, ...i }) => i),
    answers: Object.entries((e['respuestas'] ?? {}) as Record<string, { respuesta: Respuesta; observacion: string | null }>)
      .map(([indicatorCode, r]) => ({ indicatorCode, answer: r.respuesta, observation: r.observacion ?? null })),
    generalObservation: e['observacionGeneral'] ?? null,
    score: e['puntaje'] ?? null, level: e['nivel'] ?? null, results: e['resultado'] ?? null,
    lastSavedAt: iso(e['guardadoEn']) ?? new Date().toISOString(),
    finishedAt: iso(e['finalizadaEn']),
    recommendation: rec ? { origen: rec.origen, modelo: rec.modelo ?? null, resumen: rec.resumen, recomendaciones: rec.recomendaciones, createdAt: iso(rec.creadoEn) ?? new Date().toISOString() } : null,
    reports,
    createdAt: iso(e['creadoEn']),
  };
}

function listaDe(e: EvaluationDetail) {
  return listaPara(e.species.code, e.productionSystem, e.inventory.total);
}

function respuestasDe(e: EvaluationDetail): Record<string, RespuestaIndicador> {
  return Object.fromEntries(e.answers.map((a) => [a.indicatorCode, { respuesta: a.answer, observacion: a.observation }]));
}
