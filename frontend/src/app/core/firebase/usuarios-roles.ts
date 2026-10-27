import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { CATALOGO_PERMISOS, ROLES_BASE } from '../../compartido/permisos';
import { Page, PermissionDef, RoleInput, RoleItem, UserInput, UserItem } from '../models/models';
import { ErrorVisible } from '../utils/http-error';
import { auditar } from './auditoria';
import { authSecundaria, firebase, iso } from './conexion';

export interface UserFilters {
  search?: string;
  roleId?: string;
  active?: 'true' | 'false' | '';
  page?: number;
  pageSize?: number;
}

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Usuarios y roles en Firestore (`usuarios` y `roles`), con las mismas reglas de negocio del sistema. */
export class UsuariosRolesFirebase {
  constructor(private readonly actual: () => string | null) {}

  async listUsers(f: UserFilters): Promise<Page<UserItem>> {
    const [usuarios, roles] = await Promise.all([this.todosLosUsuarios(), this.mapaDeRoles()]);
    const q = normalizar(f.search?.trim() ?? '');
    const lista = usuarios
      .map((d) => vistaUsuario(d, roles))
      .filter((u) => !q || normalizar(`${u.firstName} ${u.lastName} ${u.email} ${u.documentNumber ?? ''}`).includes(q))
      .filter((u) => !f.roleId || u.role.id === f.roleId)
      .filter((u) => !f.active || String(u.active) === f.active)
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'es'));
    const page = f.page ?? 1;
    const pageSize = f.pageSize ?? 20;
    return { items: lista.slice((page - 1) * pageSize, page * pageSize), total: lista.length, page, pageSize };
  }

  /**
   * Crea la cuenta en Firebase Authentication con una contraseña aleatoria desde una instancia
   * aparte (así el administrador no pierde su sesión) y envía el enlace para que la persona
   * defina su propia contraseña. El administrador nunca la conoce.
   */
  async createUser(input: UserInput): Promise<UserItem> {
    const fb = await firebase();
    const correo = input.email.trim().toLowerCase();
    const secundaria = await authSecundaria();
    let uid: string;
    try {
      uid = (await fb.fa.createUserWithEmailAndPassword(secundaria, correo, claveAleatoria())).user.uid;
    } catch (e) {
      if ((e as { code?: string }).code === 'auth/email-already-in-use') throw new ErrorVisible(`Ya existe un usuario con el correo ${correo}.`);
      throw e;
    } finally {
      await fb.fa.signOut(secundaria);
    }
    const { doc, writeBatch, serverTimestamp } = fb.fs;
    const lote = writeBatch(fb.db);
    lote.set(doc(fb.db, 'usuarios', uid), {
      nombres: input.firstName.trim(), apellidos: input.lastName.trim(), correo,
      documento: input.documentNumber || null, telefono: input.phone || null, rol: input.roleId, activo: true,
      ultimoIngreso: null, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(),
    });
    auditar(fb, lote, this.actual()!, 'usuario.creado', 'usuario', uid, { rol: input.roleId });
    await lote.commit();
    await fb.fa.sendPasswordResetEmail(fb.auth, correo, { url: `${location.origin}/ingresar` });
    return this.usuario(uid);
  }

  async updateUser(id: string, input: Partial<UserInput>): Promise<UserItem> {
    const fb = await firebase();
    const { doc, getDoc, writeBatch, serverTimestamp } = fb.fs;
    const antes = await getDoc(doc(fb.db, 'usuarios', id));
    if (input.email !== undefined && input.email.trim().toLowerCase() !== antes.get('correo')) {
      throw new ErrorVisible('El correo de una cuenta no se puede cambiar. Cree un usuario nuevo con el correo correcto.');
    }
    if (input.roleId !== undefined && input.roleId !== antes.get('rol')) {
      if (id === this.actual()) throw new ErrorVisible('No puede cambiar su propio rol.');
      if (antes.get('rol') === ROLES_BASE.ADMINISTRADOR) await this.exigirOtroAdministrador(id);
    }
    const cambios: Record<string, unknown> = { actualizadoEn: serverTimestamp() };
    if (input.firstName !== undefined) cambios['nombres'] = input.firstName.trim();
    if (input.lastName !== undefined) cambios['apellidos'] = input.lastName.trim();
    if (input.documentNumber !== undefined) cambios['documento'] = input.documentNumber || null;
    if (input.phone !== undefined) cambios['telefono'] = input.phone || null;
    if (input.roleId !== undefined) cambios['rol'] = input.roleId;
    const lote = writeBatch(fb.db);
    lote.update(doc(fb.db, 'usuarios', id), cambios);
    auditar(fb, lote, this.actual()!, 'usuario.editado', 'usuario', id, { campos: Object.keys(input) });
    await lote.commit();
    return this.usuario(id);
  }

  async setUserStatus(id: string, active: boolean): Promise<UserItem> {
    if (id === this.actual() && !active) throw new ErrorVisible('No puede inactivar su propia cuenta.');
    const fb = await firebase();
    const { doc, getDoc, writeBatch, serverTimestamp } = fb.fs;
    if (!active && (await getDoc(doc(fb.db, 'usuarios', id))).get('rol') === ROLES_BASE.ADMINISTRADOR) {
      await this.exigirOtroAdministrador(id);
    }
    const lote = writeBatch(fb.db);
    lote.update(doc(fb.db, 'usuarios', id), { activo: active, actualizadoEn: serverTimestamp() });
    auditar(fb, lote, this.actual()!, active ? 'usuario.activado' : 'usuario.inactivado', 'usuario', id);
    await lote.commit();
    return this.usuario(id);
  }

  async sendAccessLink(id: string): Promise<{ message: string }> {
    const fb = await firebase();
    const correo = (await fb.fs.getDoc(fb.fs.doc(fb.db, 'usuarios', id))).get('correo') as string;
    await fb.fa.sendPasswordResetEmail(fb.auth, correo, { url: `${location.origin}/ingresar` });
    return { message: `Enviamos a ${correo} un enlace para crear una nueva contraseña.` };
  }

  async listRoles(): Promise<RoleItem[]> {
    const [roles, usuarios] = await Promise.all([this.rolesConDatos(), this.todosLosUsuarios().catch(() => [])]);
    return roles
      .map((r) => vistaRol(r, usuarios))
      .sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name, 'es'));
  }

  async getRole(id: string): Promise<RoleItem> {
    const rol = (await this.listRoles()).find((r) => r.id === id);
    if (!rol) throw new ErrorVisible('El rol no existe.');
    return rol;
  }

  async permissionCatalog(): Promise<PermissionDef[]> {
    return CATALOGO_PERMISOS;
  }

  async createRole(input: RoleInput): Promise<RoleItem> {
    const codigo = (input.code ?? '').trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(codigo)) {
      throw new ErrorVisible('El código usa mayúsculas, números o guion bajo, empieza por letra y tiene de 2 a 40 caracteres.');
    }
    const fb = await firebase();
    const { doc, runTransaction, serverTimestamp } = fb.fs;
    const id = codigo.toLowerCase();
    await runTransaction(fb.db, async (t) => {
      if ((await t.get(doc(fb.db, 'roles', id))).exists()) throw new ErrorVisible(`Ya existe un rol con el código ${codigo}.`);
      t.set(doc(fb.db, 'roles', id), {
        nombre: input.name.trim(), descripcion: input.description?.trim() || null, permisos: input.permissions,
        sistema: false, activo: true, actualizadoEn: serverTimestamp(),
      });
    });
    return this.getRole(id);
  }

  async updateRole(id: string, input: Partial<RoleInput>): Promise<RoleItem> {
    const fb = await firebase();
    const { doc, writeBatch, serverTimestamp } = fb.fs;
    const cambios: Record<string, unknown> = { actualizadoEn: serverTimestamp() };
    if (input.name !== undefined) cambios['nombre'] = input.name.trim();
    if (input.description !== undefined) cambios['descripcion'] = input.description?.trim() || null;
    if (input.permissions !== undefined) {
      if (id === ROLES_BASE.ADMINISTRADOR && CATALOGO_PERMISOS.some((p) => !input.permissions!.includes(p.key))) {
        throw new ErrorVisible('El rol Administrador debe conservar todos los permisos.');
      }
      cambios['permisos'] = input.permissions;
    }
    const lote = writeBatch(fb.db);
    lote.update(doc(fb.db, 'roles', id), cambios);
    auditar(fb, lote, this.actual()!, 'rol.editado', 'rol', id, { campos: Object.keys(input) });
    await lote.commit();
    return this.getRole(id);
  }

  async setRoleStatus(id: string, active: boolean): Promise<RoleItem> {
    const rol = await this.getRole(id);
    if (rol.isSystem && !active) throw new ErrorVisible('Los roles base del sistema no se pueden inactivar.');
    if (!active) {
      const usuarios = await this.todosLosUsuarios();
      const asignados = usuarios.filter((u) => u.get('rol') === id && u.get('activo')).length;
      if (asignados) throw new ErrorVisible(`No se puede inactivar: ${asignados} usuario(s) activos tienen este rol. Cámbieles el rol primero.`);
    }
    const fb = await firebase();
    const { doc, writeBatch, serverTimestamp } = fb.fs;
    const lote = writeBatch(fb.db);
    lote.update(doc(fb.db, 'roles', id), { activo: active, actualizadoEn: serverTimestamp() });
    auditar(fb, lote, this.actual()!, active ? 'rol.activado' : 'rol.inactivado', 'rol', id);
    await lote.commit();
    return this.getRole(id);
  }

  private async exigirOtroAdministrador(id: string) {
    const otros = (await this.todosLosUsuarios()).filter((u) => u.id !== id && u.get('rol') === ROLES_BASE.ADMINISTRADOR && u.get('activo'));
    if (!otros.length) throw new ErrorVisible('Debe existir al menos un administrador activo.');
  }

  private async usuario(id: string): Promise<UserItem> {
    const fb = await firebase();
    const [d, roles] = await Promise.all([fb.fs.getDoc(fb.fs.doc(fb.db, 'usuarios', id)), this.mapaDeRoles()]);
    return vistaUsuario(d as QueryDocumentSnapshot, roles);
  }

  private async todosLosUsuarios() {
    const fb = await firebase();
    return (await fb.fs.getDocs(fb.fs.collection(fb.db, 'usuarios'))).docs;
  }

  private async rolesConDatos() {
    const fb = await firebase();
    return (await fb.fs.getDocs(fb.fs.collection(fb.db, 'roles'))).docs;
  }

  private async mapaDeRoles() {
    return new Map((await this.rolesConDatos()).map((r) => [r.id, r.get('nombre') as string]));
  }
}

function vistaUsuario(d: QueryDocumentSnapshot<DocumentData>, roles: Map<string, string>): UserItem {
  const u = d.data();
  return {
    id: d.id,
    // Los usuarios creados con la carga inicial del equipo tienen un solo campo `nombre`.
    firstName: u['nombres'] ?? u['nombre'] ?? '',
    lastName: u['apellidos'] ?? '',
    email: u['correo'],
    documentNumber: u['documento'] ?? null,
    phone: u['telefono'] ?? null,
    role: { id: u['rol'], code: String(u['rol']).toUpperCase(), name: roles.get(u['rol']) ?? u['rol'] },
    active: u['activo'] !== false,
    // Firebase Authentication bloquea por su cuenta los intentos repetidos.
    locked: false,
    lastLoginAt: iso(u['ultimoIngreso']),
    createdAt: iso(u['creadoEn']) ?? new Date().toISOString(),
  };
}

function vistaRol(r: QueryDocumentSnapshot<DocumentData>, usuarios: QueryDocumentSnapshot<DocumentData>[]): RoleItem {
  const d = r.data();
  return {
    id: r.id,
    code: r.id.toUpperCase(),
    name: d['nombre'],
    description: d['descripcion'] ?? null,
    permissions: d['permisos'] ?? [],
    isSystem: d['sistema'] === true,
    active: d['activo'] !== false,
    userCount: usuarios.filter((u) => u.get('rol') === r.id).length,
    updatedAt: iso(d['actualizadoEn']) ?? new Date().toISOString(),
  };
}

/** Contraseña temporal que nadie conoce; la persona define la suya con el enlace del correo. */
function claveAleatoria(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `${btoa(String.fromCharCode(...bytes))}a1`;
}
