/**
 * Carga inicial de Firestore con el SDK de administración: roles base, especies,
 * libertades, niveles y los 23 criterios de la norma, y el primer administrador.
 * Se puede ejecutar varias veces: actualiza lo existente sin duplicar.
 *
 * Contra el proyecto real necesita una cuenta de servicio (ver docs/DESPLIEGUE.md):
 *   GOOGLE_APPLICATION_CREDENTIALS=cuenta-de-servicio.json
 *   SEMILLA_ADMIN_CORREO=... SEMILLA_ADMIN_CLAVE=... npm run semilla
 * Contra los emuladores: npm run semilla:emulador
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { CRITERIOS, LISTA_BOVINOS, VERSION_LISTA } from './compartido/lista-chequeo';
import { LIBERTADES, NIVELES } from './compartido/norma';
import { DEFINICION_ROLES_BASE, ROLES_BASE, TODOS_LOS_PERMISOS } from './compartido/permisos';

const emulador = !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId = process.env.GCLOUD_PROJECT ?? 'bienestar-animal-ica';
initializeApp(emulador ? { projectId } : { projectId, credential: applicationDefault() });
const db = getFirestore();
const auth = getAuth();

const ESPECIES = [
  { id: 'bovino', nombre: 'Bovinos', activa: true },
  { id: 'bufalino', nombre: 'Búfalos', activa: true },
];

async function catalogos() {
  const lote = db.batch();
  for (const r of DEFINICION_ROLES_BASE) {
    const ref = db.collection('roles').doc(r.id);
    const actual = await ref.get();
    // Los roles existentes conservan sus ajustes; el administrador recibe los permisos nuevos.
    const permisos = !actual.exists ? r.permisos
      : r.id === ROLES_BASE.ADMINISTRADOR ? TODOS_LOS_PERMISOS : (actual.get('permisos') as string[]);
    lote.set(ref, {
      nombre: actual.get('nombre') ?? r.nombre,
      descripcion: actual.get('descripcion') ?? r.descripcion,
      permisos, sistema: true, activo: true, actualizadoEn: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  for (const { id, ...e } of ESPECIES) lote.set(db.collection('especies').doc(id), e, { merge: true });
  for (const l of LIBERTADES) {
    lote.set(db.collection('libertades').doc(l.id), { nombre: l.nombre, codigo: l.codigo, peso: l.peso / 100 }, { merge: true });
  }
  NIVELES.forEach((n, i) => {
    const max = NIVELES[i + 1] ? Math.round((NIVELES[i + 1].desde - 0.1) * 10) / 10 : 5;
    lote.set(db.collection('niveles').doc(n.codigo.toLowerCase()), { nombre: n.nombre, min: n.desde, max }, { merge: true });
  });
  // Mismo formato de la carga inicial del equipo, con los indicadores y la versión de la lista.
  for (const c of CRITERIOS) {
    lote.set(db.collection('criterios').doc(c.id), {
      nombre: c.nombre,
      libertad: LIBERTADES.find((l) => l.codigo === c.libertad)!.id,
      sistemas: c.sistemas.map((s) => s.toLowerCase()),
      tamanos: c.tamanos.map((t) => t.toLowerCase()),
      indicadores: LISTA_BOVINOS.filter((i) => i.criterio === c.id).map((i) => i.texto),
      orden: c.orden,
      version: VERSION_LISTA,
    }, { merge: true });
  }
  await lote.commit();
  console.log(`Catálogos: ${DEFINICION_ROLES_BASE.length} roles, ${ESPECIES.length} especies, ${LIBERTADES.length} libertades, ${NIVELES.length} niveles, ${CRITERIOS.length} criterios.`);
}

/** Usuarios creados con el formato anterior ({ nombre, correo, rol }) pasan al formato de la aplicación. */
async function normalizarUsuarios() {
  const usuarios = await db.collection('usuarios').get();
  let n = 0;
  for (const u of usuarios.docs) {
    const d = u.data();
    if (d.nombres) continue;
    const partes = String(d.nombre ?? 'Sin nombre').trim().split(/\s+/);
    await u.ref.set({
      nombres: partes.slice(0, Math.max(1, partes.length - 1)).join(' '),
      apellidos: partes.length > 1 ? partes[partes.length - 1] : '-',
      correo: String(d.correo ?? '').toLowerCase(),
      documento: d.documento ?? null,
      telefono: d.telefono ?? null,
      rol: d.rol ?? ROLES_BASE.CONSULTOR,
      activo: d.activo ?? true,
      ultimoIngreso: null,
      creadoEn: d.creadoEn ?? FieldValue.serverTimestamp(),
      actualizadoEn: FieldValue.serverTimestamp(),
    }, { merge: true });
    n++;
  }
  if (n) console.log(`Usuarios normalizados: ${n}.`);
}

async function administrador() {
  const correo = process.env.SEMILLA_ADMIN_CORREO?.trim().toLowerCase();
  const clave = process.env.SEMILLA_ADMIN_CLAVE;
  if (!correo || !clave) {
    console.log('Sin SEMILLA_ADMIN_CORREO y SEMILLA_ADMIN_CLAVE: no se crea administrador.');
    return;
  }
  const existente = await auth.getUserByEmail(correo).catch(() => null);
  const usuario = existente ?? (await auth.createUser({ email: correo, password: clave, emailVerified: true }));
  const ref = db.collection('usuarios').doc(usuario.uid);
  if ((await ref.get()).exists) {
    console.log(`El administrador ${correo} ya existe.`);
    return;
  }
  await ref.set({
    nombres: 'Administrador', apellidos: 'del sistema', correo, documento: null, telefono: null,
    rol: ROLES_BASE.ADMINISTRADOR, activo: true, ultimoIngreso: null,
    creadoEn: FieldValue.serverTimestamp(), actualizadoEn: FieldValue.serverTimestamp(),
  });
  console.log(`Administrador inicial: ${correo}. Cambie la contraseña al primer ingreso.`);
}

await catalogos();
await normalizarUsuarios();
await administrador();
