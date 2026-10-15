import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { PermissionDef, RoleItem, UserItem } from './models';

/**
 * Modo demostración (`npm run demo`): responde las llamadas a /api dentro del
 * navegador, sin servicio de aplicación ni base de datos. Reproduce las mismas
 * reglas y mensajes de backend/src para que las pantallas se comporten igual.
 * Los datos se guardan en localStorage del navegador y no se envían correos.
 */

const STORE_KEY = 'ica.demo.datos';
const DEMO_PASSWORD = 'CambiarEsta.2026';
const RESET_TOKEN = 'demo';
const LATENCY_MS = 250;
const PASSWORD_PATTERN = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])(?=.*\d).{10,72}$/;
const PASSWORD_MESSAGE =
  'La contraseña debe tener entre 10 y 72 caracteres e incluir al menos una letra y un número.';

const CATALOG: PermissionDef[] = [
  { key: 'usuarios.ver', module: 'Seguridad', label: 'Consultar usuarios' },
  { key: 'usuarios.gestionar', module: 'Seguridad', label: 'Crear, editar, activar e inactivar usuarios' },
  { key: 'roles.ver', module: 'Seguridad', label: 'Consultar roles' },
  { key: 'roles.gestionar', module: 'Seguridad', label: 'Crear y editar roles y sus permisos' },
  { key: 'fincas.ver', module: 'Fincas', label: 'Consultar fincas' },
  { key: 'fincas.gestionar', module: 'Fincas', label: 'Registrar y editar fincas e inventario' },
  { key: 'parametrizacion.gestionar', module: 'Parametrización', label: 'Configurar especies, criterios y ponderaciones' },
  { key: 'evaluaciones.ver', module: 'Evaluación', label: 'Consultar evaluaciones y resultados' },
  { key: 'evaluaciones.diligenciar', module: 'Evaluación', label: 'Crear y diligenciar evaluaciones' },
  { key: 'evaluaciones.validar', module: 'Evaluación', label: 'Validar y cerrar evaluaciones' },
  { key: 'reportes.ver', module: 'Reportes', label: 'Ver tableros y descargar reportes' },
  { key: 'auditoria.ver', module: 'Administración', label: 'Consultar la bitácora de auditoría' },
];
const ALL = CATALOG.map((p) => p.key);

interface DemoUser extends UserItem {
  password: string;
}

interface DemoData {
  roles: RoleItem[];
  users: DemoUser[];
}

function seed(): DemoData {
  const now = new Date().toISOString();
  const role = (id: string, code: string, name: string, description: string, permissions: string[]): RoleItem => ({
    id, code, name, description, permissions, isSystem: true, active: true, userCount: 0, updatedAt: now,
  });
  const roles = [
    role('r-admin', 'ADMIN', 'Administrador', 'Gestiona usuarios, roles, catálogos y parametrización de especies.', ALL),
    role('r-eval', 'EVALUADOR', 'Evaluador', 'Registra fincas y diligencia evaluaciones de bienestar animal.', [
      'fincas.ver', 'fincas.gestionar', 'evaluaciones.ver', 'evaluaciones.diligenciar', 'reportes.ver',
    ]),
    role('r-cons', 'CONSULTOR', 'Consultor externo', 'Consulta fincas, evaluaciones y reportes sin modificarlos.', [
      'fincas.ver', 'evaluaciones.ver', 'reportes.ver',
    ]),
  ];
  const user = (id: string, firstName: string, lastName: string, email: string, roleId: string, extra: Partial<DemoUser> = {}): DemoUser => {
    const r = roles.find((x) => x.id === roleId)!;
    return {
      id, firstName, lastName, email, documentNumber: null, phone: null,
      role: { id: r.id, code: r.code, name: r.name }, active: true, locked: false,
      lastLoginAt: null, createdAt: now, password: DEMO_PASSWORD, ...extra,
    };
  };
  return {
    roles,
    users: [
      user('u-admin', 'Administrador', 'del sistema', 'admin@ica-bienestar.local', 'r-admin'),
      user('u-1', 'Usuario', 'Evaluador de prueba', 'evaluador@ica-bienestar.local', 'r-eval', { documentNumber: '1000000001' }),
      user('u-2', 'Usuario', 'Consultor de prueba', 'consultor@ica-bienestar.local', 'r-cons'),
      user('u-3', 'Usuario', 'Inactivo de prueba', 'inactivo@ica-bienestar.local', 'r-eval', { active: false }),
    ],
  };
}

function load(): DemoData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as DemoData;
  } catch {
    /* sin almacenamiento: se usan los datos iniciales */
  }
  return seed();
}

let data = load();

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch {
    /* los cambios duran mientras la pestaña esté abierta */
  }
}

function ok<T>(body: T, status = 200): Observable<HttpResponse<T>> {
  return of(new HttpResponse({ status, body })).pipe(delay(LATENCY_MS));
}

function fail(status: number, message: string | string[]): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, error: { statusCode: status, message } })).pipe(delay(LATENCY_MS));
}

function view(u: DemoUser): UserItem {
  const { password: _omit, ...rest } = u;
  return rest;
}

function roleView(r: RoleItem): RoleItem {
  return { ...r, userCount: data.users.filter((u) => u.role.id === r.id).length };
}

function session(u: DemoUser) {
  const r = data.roles.find((x) => x.id === u.role.id)!;
  return {
    id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
    role: { id: r.id, code: r.code, name: r.name }, permissions: r.permissions,
  };
}

function currentUser(req: HttpRequest<unknown>): DemoUser | null {
  const id = (req.headers.get('Authorization') ?? '').replace('Bearer demo-', '');
  const u = data.users.find((x) => x.id === id);
  const r = u && data.roles.find((x) => x.id === u.role.id);
  return u && u.active && r?.active ? u : null;
}

function can(u: DemoUser, ...perms: string[]) {
  const r = data.roles.find((x) => x.id === u.role.id)!;
  return perms.some((p) => r.permissions.includes(p));
}

const isEmail = (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.demo || !req.url.startsWith(environment.apiUrl)) return next(req);

  const path = req.url.slice(environment.apiUrl.length).split('?')[0];
  const m = req.method;
  const body = (req.body ?? {}) as Record<string, unknown>;

  // ---------- Rutas públicas ----------
  if (m === 'POST' && path === '/auth/login') {
    const u = data.users.find((x) => x.email === clean(body['email']).toLowerCase());
    if (!u || u.password !== body['password']) return fail(401, 'Correo o contraseña incorrectos.');
    if (!u.active) return fail(401, 'Su usuario está inactivo. Contacte al administrador del sistema.');
    u.lastLoginAt = new Date().toISOString();
    save();
    return ok({ accessToken: `demo-${u.id}`, user: session(u) });
  }
  if (m === 'POST' && path === '/auth/forgot-password') {
    return ok({ message: 'Si el correo está registrado y activo, enviamos un enlace para restablecer la contraseña.' });
  }
  if (m === 'GET' && path === '/auth/reset-password/validate') {
    const token = req.params.get('token');
    return ok(token === RESET_TOKEN ? { valid: true, email: 'ad•••••@ica-bienestar.local' } : { valid: false });
  }
  if (m === 'POST' && path === '/auth/reset-password') {
    if (body['token'] !== RESET_TOKEN) return fail(400, 'El enlace venció o ya fue usado. Solicite uno nuevo.');
    if (!PASSWORD_PATTERN.test(String(body['password'] ?? ''))) return fail(400, [PASSWORD_MESSAGE]);
    data.users.find((x) => x.id === 'u-admin')!.password = String(body['password']);
    save();
    return ok({ message: 'Contraseña actualizada. Ya puede ingresar.' });
  }

  // ---------- Rutas con sesión ----------
  const me = currentUser(req);
  if (!me) return fail(401, 'Su sesión ya no es válida. Ingrese de nuevo.');
  const forbidden = () => fail(403, 'Su rol no tiene permiso para esta acción.');

  if (m === 'GET' && path === '/auth/me') return ok(session(me));
  if (m === 'POST' && path === '/auth/change-password') {
    if (body['currentPassword'] !== me.password) return fail(400, 'La contraseña actual no es correcta.');
    if (!PASSWORD_PATTERN.test(String(body['newPassword'] ?? ''))) return fail(400, [PASSWORD_MESSAGE]);
    me.password = String(body['newPassword']);
    save();
    return ok({ accessToken: `demo-${me.id}`, user: session(me) });
  }

  // Usuarios
  if (path === '/users' && m === 'GET') {
    if (!can(me, 'usuarios.ver', 'usuarios.gestionar')) return forbidden();
    const search = clean(req.params.get('search')).toLowerCase();
    const roleId = req.params.get('roleId');
    const active = req.params.get('active');
    const page = Number(req.params.get('page') ?? 1);
    const pageSize = Number(req.params.get('pageSize') ?? 20);
    const list = data.users
      .filter((u) => !search || [u.firstName, u.lastName, `${u.firstName} ${u.lastName}`, u.email, u.documentNumber ?? '']
        .some((v) => v.toLowerCase().includes(search)))
      .filter((u) => !roleId || u.role.id === roleId)
      .filter((u) => !active || String(u.active) === active)
      .sort((a, b) => Number(b.active) - Number(a.active) || a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName));
    return ok({ items: list.slice((page - 1) * pageSize, page * pageSize).map(view), total: list.length, page, pageSize });
  }
  if (path === '/users' && m === 'POST') {
    if (!can(me, 'usuarios.gestionar')) return forbidden();
    const email = clean(body['email']).toLowerCase();
    if (!isEmail(email)) return fail(400, ['Escriba un correo válido.']);
    if (data.users.some((u) => u.email === email)) return fail(409, 'Ya existe un usuario con ese correo.');
    const r = data.roles.find((x) => x.id === body['roleId']);
    if (!r) return fail(400, 'El rol seleccionado no existe.');
    if (!r.active) return fail(400, 'El rol seleccionado está inactivo.');
    const u: DemoUser = {
      id: `u-${Date.now()}`, firstName: clean(body['firstName']), lastName: clean(body['lastName']), email,
      documentNumber: clean(body['documentNumber']) || null, phone: clean(body['phone']) || null,
      role: { id: r.id, code: r.code, name: r.name }, active: true, locked: false, lastLoginAt: null,
      createdAt: new Date().toISOString(), password: DEMO_PASSWORD,
    };
    data.users.push(u);
    save();
    return ok(view(u), 201);
  }
  const userMatch = path.match(/^\/users\/([^/]+)(\/status|\/access-link)?$/);
  if (userMatch) {
    const u = data.users.find((x) => x.id === userMatch[1]);
    if (!u) return fail(404, 'El usuario no existe.');
    const action = userMatch[2];
    if (m === 'GET' && !action) return can(me, 'usuarios.ver', 'usuarios.gestionar') ? ok(view(u)) : forbidden();
    if (!can(me, 'usuarios.gestionar')) return forbidden();
    const otherAdmins = () => data.users.filter((x) => x.id !== u.id && x.active && x.role.code === 'ADMIN').length;

    if (m === 'PATCH' && !action) {
      const email = body['email'] !== undefined ? clean(body['email']).toLowerCase() : u.email;
      if (email !== u.email && data.users.some((x) => x.email === email)) return fail(409, 'Ya existe un usuario con ese correo.');
      if (body['roleId'] && body['roleId'] !== u.role.id) {
        const r = data.roles.find((x) => x.id === body['roleId']);
        if (!r) return fail(400, 'El rol seleccionado no existe.');
        if (!r.active) return fail(400, 'El rol seleccionado está inactivo.');
        if (u.id === me.id) return fail(400, 'No puede cambiar su propio rol. Pídalo a otro administrador.');
        if (u.role.code === 'ADMIN' && u.active && otherAdmins() === 0) return fail(400, 'Debe quedar al menos un administrador activo.');
        u.role = { id: r.id, code: r.code, name: r.name };
      }
      u.email = email;
      if (body['firstName'] !== undefined) u.firstName = clean(body['firstName']);
      if (body['lastName'] !== undefined) u.lastName = clean(body['lastName']);
      if (body['documentNumber'] !== undefined) u.documentNumber = clean(body['documentNumber']) || null;
      if (body['phone'] !== undefined) u.phone = clean(body['phone']) || null;
      save();
      return ok(view(u));
    }
    if (m === 'PATCH' && action === '/status') {
      const active = body['active'] === true;
      if (!active && u.id === me.id) return fail(400, 'No puede inactivar su propio usuario.');
      if (!active && u.role.code === 'ADMIN' && otherAdmins() === 0) return fail(400, 'Debe quedar al menos un administrador activo.');
      u.active = active;
      save();
      return ok(view(u));
    }
    if (m === 'POST' && action === '/access-link') {
      if (!u.active) return fail(400, 'Active el usuario antes de enviarle un enlace de acceso.');
      return ok({ message: 'Enlace de acceso enviado al correo del usuario.' });
    }
  }

  // Roles
  if (path === '/roles' && m === 'GET') {
    if (!can(me, 'roles.ver', 'usuarios.gestionar')) return forbidden();
    return ok([...data.roles].sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name)).map(roleView));
  }
  if (path === '/roles/permissions' && m === 'GET') return can(me, 'roles.ver') ? ok(CATALOG) : forbidden();
  if (path === '/roles' && m === 'POST') {
    if (!can(me, 'roles.gestionar')) return forbidden();
    const code = clean(body['code']).toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(code)) {
      return fail(400, ['El código usa mayúsculas, números o guion bajo, empieza por letra y tiene de 2 a 40 caracteres.']);
    }
    if (data.roles.some((r) => r.code === code)) return fail(409, `Ya existe un rol con el código ${code}.`);
    const r: RoleItem = {
      id: `r-${Date.now()}`, code, name: clean(body['name']), description: clean(body['description']) || null,
      permissions: (body['permissions'] as string[]) ?? [], isSystem: false, active: true, userCount: 0,
      updatedAt: new Date().toISOString(),
    };
    data.roles.push(r);
    save();
    return ok(roleView(r), 201);
  }
  const roleMatch = path.match(/^\/roles\/([^/]+)(\/status)?$/);
  if (roleMatch) {
    const r = data.roles.find((x) => x.id === roleMatch[1]);
    if (!r) return fail(404, 'El rol no existe.');
    if (m === 'GET' && !roleMatch[2]) return can(me, 'roles.ver') ? ok(roleView(r)) : forbidden();
    if (!can(me, 'roles.gestionar')) return forbidden();
    if (m === 'PATCH' && !roleMatch[2]) {
      const perms = body['permissions'] as string[] | undefined;
      if (perms && r.code === 'ADMIN' && ALL.some((p) => !perms.includes(p))) {
        return fail(400, 'El rol Administrador debe conservar todos los permisos.');
      }
      if (body['name'] !== undefined) r.name = clean(body['name']);
      if (body['description'] !== undefined) r.description = clean(body['description']) || null;
      if (perms) r.permissions = perms;
      r.updatedAt = new Date().toISOString();
      data.users.filter((u) => u.role.id === r.id).forEach((u) => (u.role = { id: r.id, code: r.code, name: r.name }));
      save();
      return ok(roleView(r));
    }
    if (m === 'PATCH' && roleMatch[2]) {
      const active = body['active'] === true;
      if (r.isSystem && !active) return fail(400, 'Los roles base del sistema no se pueden inactivar.');
      const assigned = data.users.filter((u) => u.role.id === r.id && u.active).length;
      if (!active && assigned > 0) {
        return fail(400, `No se puede inactivar: ${assigned} usuario(s) activos tienen este rol. Cámbieles el rol primero.`);
      }
      r.active = active;
      r.updatedAt = new Date().toISOString();
      save();
      return ok(roleView(r));
    }
  }

  return fail(404, 'Recurso no disponible en el modo demostración.');
};

/** Restablece los datos de prueba (botón del aviso de demostración). */
export function resetDemoData() {
  data = seed();
  save();
}
