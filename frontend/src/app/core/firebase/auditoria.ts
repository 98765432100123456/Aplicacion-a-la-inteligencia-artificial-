import type { WriteBatch } from 'firebase/firestore';
import { Firebase } from './conexion';

/** Agrega al lote un registro de la bitácora `auditoria`; se guarda junto con el cambio que describe. */
export function auditar(fb: Firebase, lote: WriteBatch, actorId: string, accion: string, entidad: string, entidadId: string, detalle: Record<string, unknown> = {}) {
  lote.set(fb.fs.doc(fb.fs.collection(fb.db, 'auditoria')), {
    actorId, accion, entidad, entidadId, detalle, creadoEn: fb.fs.serverTimestamp(),
  });
}
