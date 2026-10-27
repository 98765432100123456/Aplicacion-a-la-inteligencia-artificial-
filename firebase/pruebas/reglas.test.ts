import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { DEFINICION_ROLES_BASE } from '../compartido/permisos';

let env: RulesTestEnvironment;

const usuario = (rol: string, correo: string, activo = true) => ({
  nombres: 'Prueba', apellidos: rol, correo, documento: null, telefono: null, rol, activo, ultimoIngreso: null,
});
const predio = (correo: string | null, creadoPor = 'eva') => ({
  nombre: 'La Esperanza', departamento: 'Cundinamarca', municipio: 'Ubaté', vereda: null, direccion: null,
  propietario: { nombre: 'Pedro Pérez', documento: null, telefono: '3104567890', correo },
  propietarioCorreo: correo, sistema: 'LECHERIA', especies: [{ especieId: 'bovino', crias: 18, jovenes: 34, adultos: 68 }],
  creadoPor, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(),
});
const borrador = (correo: string | null) => ({
  predioId: 'p1', propietarioCorreo: correo, especieId: 'bovino', evaluadorId: 'eva', estado: 'borrador',
  versionLista: 'ICA-2023.1', inventario: { crias: 18, jovenes: 34, adultos: 68 }, respuestas: {}, creadoEn: serverTimestamp(),
});

// Contextos autenticados: el token lleva el correo y si está verificado.
const como = (uid: string, correo: string, verificado = true) =>
  env.authenticatedContext(uid, { email: correo, email_verified: verificado }).firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-ica',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const r of DEFINICION_ROLES_BASE) {
      await setDoc(doc(db, 'roles', r.id), { nombre: r.nombre, descripcion: r.descripcion, permisos: r.permisos, sistema: true, activo: true });
    }
    await setDoc(doc(db, 'usuarios', 'admin'), usuario('administrador', 'admin@ica.co'));
    await setDoc(doc(db, 'usuarios', 'eva'), usuario('evaluador', 'eva@ica.co'));
    await setDoc(doc(db, 'usuarios', 'dueno'), usuario('propietario', 'dueno@ica.co'));
    await setDoc(doc(db, 'usuarios', 'otro'), usuario('propietario', 'otro@ica.co'));
    await setDoc(doc(db, 'usuarios', 'inactivo'), usuario('evaluador', 'inactivo@ica.co', false));
    await setDoc(doc(db, 'especies', 'bovino'), { nombre: 'Bovinos', activa: true });
    await setDoc(doc(db, 'predios', 'p1'), predio('dueno@ica.co'));
    await setDoc(doc(db, 'predios', 'p2'), predio('nadie@ica.co'));
  });
});

describe('autenticación y usuarios', () => {
  it('sin sesión no se lee nada', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'predios', 'p1')));
    await assertFails(getDoc(doc(db, 'especies', 'bovino')));
  });

  it('una persona se registra solo como propietario y con su propio correo', async () => {
    const db = como('nuevo', 'Nuevo@ICA.co');
    await assertFails(setDoc(doc(db, 'usuarios', 'nuevo'), usuario('administrador', 'nuevo@ica.co')));
    await assertFails(setDoc(doc(db, 'usuarios', 'nuevo'), usuario('propietario', 'otro@ica.co')));
    await assertSucceeds(setDoc(doc(db, 'usuarios', 'nuevo'), usuario('propietario', 'nuevo@ica.co')));
  });

  it('nadie cambia su propio rol; solo puede registrar su último ingreso', async () => {
    const eva = como('eva', 'eva@ica.co');
    await assertFails(updateDoc(doc(eva, 'usuarios', 'eva'), { rol: 'administrador' }));
    await assertSucceeds(updateDoc(doc(eva, 'usuarios', 'eva'), { ultimoIngreso: serverTimestamp() }));
    const admin = como('admin', 'admin@ica.co');
    await assertFails(updateDoc(doc(admin, 'usuarios', 'admin'), { activo: false }));
    await assertSucceeds(updateDoc(doc(admin, 'usuarios', 'eva'), { rol: 'consultor' }));
  });

  it('un usuario inactivo pierde el acceso aunque tenga sesión', async () => {
    await assertFails(getDocs(collection(como('inactivo', 'inactivo@ica.co'), 'predios')));
  });
});

describe('roles', () => {
  it('solo quien gestiona roles los cambia, y el Administrador conserva todos los permisos', async () => {
    await assertFails(updateDoc(doc(como('eva', 'eva@ica.co'), 'roles', 'evaluador'), { permisos: ['usuarios.gestionar'] }));
    const admin = como('admin', 'admin@ica.co');
    await assertFails(updateDoc(doc(admin, 'roles', 'administrador'), { permisos: ['usuarios.ver'] }));
    await assertFails(updateDoc(doc(admin, 'roles', 'evaluador'), { activo: false }));
    await assertSucceeds(setDoc(doc(admin, 'roles', 'auditor'), { nombre: 'Auditor', descripcion: null, permisos: ['auditoria.ver'], sistema: false, activo: true }));
  });

  it('los catálogos se leen con sesión y solo los cambia quien parametriza', async () => {
    await assertSucceeds(getDoc(doc(como('dueno', 'dueno@ica.co'), 'especies', 'bovino')));
    await assertFails(setDoc(doc(como('eva', 'eva@ica.co'), 'especies', 'ovino'), { nombre: 'Ovinos', activa: true }));
    await assertSucceeds(setDoc(doc(como('admin', 'admin@ica.co'), 'especies', 'ovino'), { nombre: 'Ovinos', activa: true }));
  });
});

describe('predios', () => {
  it('el propietario solo ve los predios registrados con su correo verificado', async () => {
    const dueno = como('dueno', 'dueno@ica.co');
    await assertSucceeds(getDoc(doc(dueno, 'predios', 'p1')));
    await assertFails(getDoc(doc(dueno, 'predios', 'p2')));
    await assertSucceeds(getDocs(query(collection(dueno, 'predios'), where('propietarioCorreo', '==', 'dueno@ica.co'))));
    await assertFails(getDocs(collection(dueno, 'predios')));
    await assertFails(getDoc(doc(como('dueno', 'dueno@ica.co', false), 'predios', 'p1')));
    await assertFails(getDoc(doc(como('otro', 'otro@ica.co'), 'predios', 'p1')));
  });

  it('el evaluador registra predios válidos y el propietario no puede', async () => {
    const eva = como('eva', 'eva@ica.co');
    await assertSucceeds(setDoc(doc(eva, 'predios', 'p3'), predio('x@ica.co')));
    await assertFails(setDoc(doc(eva, 'predios', 'p4'), { ...predio('x@ica.co'), especies: [] }));
    await assertFails(setDoc(doc(eva, 'predios', 'p5'), { ...predio('X@ica.co'), propietarioCorreo: 'X@ica.co' }));
    await assertFails(setDoc(doc(como('dueno', 'dueno@ica.co'), 'predios', 'p6'), predio('dueno@ica.co', 'dueno')));
  });
});

describe('evaluaciones', () => {
  const finalizada = { estado: 'finalizada', puntaje: 4.73, nivel: 'EXCELENTE', resultado: { puntaje: 4.73 },
    recomendacion: { origen: 'REGLAS' }, finalizadaEn: serverTimestamp() };

  it('se crea en borrador por el evaluador y con el correo del predio', async () => {
    const eva = como('eva', 'eva@ica.co');
    await assertFails(setDoc(doc(eva, 'evaluaciones', 'e0'), borrador('otro@ica.co')));
    await assertFails(setDoc(doc(eva, 'evaluaciones', 'e0'), { ...borrador('dueno@ica.co'), evaluadorId: 'admin' }));
    await assertSucceeds(setDoc(doc(eva, 'evaluaciones', 'e1'), borrador('dueno@ica.co')));
    await assertFails(setDoc(doc(como('otro', 'otro@ica.co'), 'evaluaciones', 'e2'), borrador('dueno@ica.co')));
  });

  it('el propietario no ve borradores; al finalizar, el nivel debe coincidir con el puntaje', async () => {
    const eva = como('eva', 'eva@ica.co');
    await setDoc(doc(eva, 'evaluaciones', 'e1'), borrador('dueno@ica.co'));
    const dueno = como('dueno', 'dueno@ica.co');
    await assertFails(getDoc(doc(dueno, 'evaluaciones', 'e1')));
    await assertFails(updateDoc(doc(eva, 'evaluaciones', 'e1'), { ...finalizada, nivel: 'BAJO' }));
    await assertSucceeds(updateDoc(doc(eva, 'evaluaciones', 'e1'), finalizada));
    await assertSucceeds(getDoc(doc(dueno, 'evaluaciones', 'e1')));
    // Finalizada no cambia, salvo sus recomendaciones.
    await assertFails(updateDoc(doc(eva, 'evaluaciones', 'e1'), { respuestas: { '1.1': { respuesta: 'CUMPLE' } } }));
    await assertFails(updateDoc(doc(eva, 'evaluaciones', 'e1'), { puntaje: 5, nivel: 'EXCELENTE' }));
    await assertSucceeds(updateDoc(doc(eva, 'evaluaciones', 'e1'), { recomendacion: { origen: 'IA' } }));
  });

  it('el historial de recomendaciones solo se crea para evaluaciones finalizadas', async () => {
    const eva = como('eva', 'eva@ica.co');
    await setDoc(doc(eva, 'evaluaciones', 'e1'), borrador('dueno@ica.co'));
    const rec = { evaluacionId: 'e1', predioId: 'p1', propietarioCorreo: 'dueno@ica.co', origen: 'REGLAS', creadoPor: 'eva', creadoEn: serverTimestamp() };
    await assertFails(setDoc(doc(eva, 'recomendaciones', 'r0'), rec));
    const lote = writeBatch(eva);
    lote.update(doc(eva, 'evaluaciones', 'e1'), finalizada);
    lote.set(doc(eva, 'recomendaciones', 'r1'), rec);
    lote.set(doc(eva, 'auditoria', 'a1'), { actorId: 'eva', accion: 'evaluacion.finalizada', entidad: 'evaluacion', entidadId: 'e1', creadoEn: serverTimestamp() });
    await assertSucceeds(lote.commit());
    await assertSucceeds(getDocs(query(collection(como('dueno', 'dueno@ica.co'), 'recomendaciones'), where('propietarioCorreo', '==', 'dueno@ica.co'))));
  });

  it('al cambiar el correo del predio, sus evaluaciones lo copian en el mismo lote', async () => {
    const eva = como('eva', 'eva@ica.co');
    await setDoc(doc(eva, 'evaluaciones', 'e1'), borrador('dueno@ica.co'));
    await updateDoc(doc(eva, 'evaluaciones', 'e1'), finalizada);
    await assertFails(updateDoc(doc(eva, 'evaluaciones', 'e1'), { propietarioCorreo: 'otro@ica.co' }));
    const lote = writeBatch(eva);
    lote.update(doc(eva, 'predios', 'p1'), { propietarioCorreo: 'otro@ica.co', 'propietario.correo': 'otro@ica.co' });
    lote.update(doc(eva, 'evaluaciones', 'e1'), { propietarioCorreo: 'otro@ica.co' });
    await assertSucceeds(lote.commit());
    await assertSucceeds(getDoc(doc(como('otro', 'otro@ica.co'), 'evaluaciones', 'e1')));
  });
});

describe('auditoría', () => {
  it('cada quien registra sus propias acciones y nadie las modifica', async () => {
    const eva = como('eva', 'eva@ica.co');
    await assertFails(setDoc(doc(eva, 'auditoria', 'a0'), { actorId: 'admin', accion: 'x', creadoEn: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(eva, 'auditoria', 'a1'), { actorId: 'eva', accion: 'x', creadoEn: serverTimestamp() }));
    await assertFails(updateDoc(doc(eva, 'auditoria', 'a1'), { accion: 'y' }));
    await assertFails(getDoc(doc(eva, 'auditoria', 'a1')));
    await assertSucceeds(getDoc(doc(como('admin', 'admin@ica.co'), 'auditoria', 'a1')));
  });
});
