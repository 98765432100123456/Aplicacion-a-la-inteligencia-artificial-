import { esCorreo, estado, fallo, guardar, limpiar, ok, Peticion, prohibido, puede, Respuesta, vistaUsuario } from '../almacen-demo';
import { DEMO_PASSWORD, DemoUser } from '../datos-demo';

const CORREO_REPETIDO = 'Ya existe un usuario con ese correo.';
const UN_ADMIN = 'Debe quedar al menos un administrador activo.';

/** Rol válido para asignar, o el mensaje de error correspondiente. */
function rolAsignable(id: unknown) {
  const r = estado.datos.roles.find((x) => x.id === id);
  if (!r) return 'El rol seleccionado no existe.';
  if (!r.active) return 'El rol seleccionado está inactivo.';
  return r;
}

/** Simula los usuarios con las mismas reglas de core/firebase/usuarios-roles.ts. */
export function rutasDeUsuarios(p: Peticion, yo: DemoUser): Respuesta {
  const { req, metodo, ruta, cuerpo } = p;
  const datos = estado.datos;

  if (ruta === '/users' && metodo === 'GET') {
    if (!puede(yo, 'usuarios.ver', 'usuarios.gestionar')) return prohibido();
    const buscar = limpiar(req.params.get('search')).toLowerCase();
    const rolId = req.params.get('roleId');
    const activo = req.params.get('active');
    const pagina = Number(req.params.get('page') ?? 1);
    const tamano = Number(req.params.get('pageSize') ?? 20);
    const lista = datos.users
      .filter((u) => !buscar || [u.firstName, u.lastName, `${u.firstName} ${u.lastName}`, u.email, u.documentNumber ?? '']
        .some((v) => v.toLowerCase().includes(buscar)))
      .filter((u) => !rolId || u.role.id === rolId)
      .filter((u) => !activo || String(u.active) === activo)
      .sort((a, b) => Number(b.active) - Number(a.active) || a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName));
    const items = lista.slice((pagina - 1) * tamano, pagina * tamano).map(vistaUsuario);
    return ok({ items, total: lista.length, page: pagina, pageSize: tamano });
  }

  if (ruta === '/users' && metodo === 'POST') {
    if (!puede(yo, 'usuarios.gestionar')) return prohibido();
    const email = limpiar(cuerpo['email']).toLowerCase();
    if (!esCorreo(email)) return fallo(400, ['Escriba un correo válido.']);
    if (datos.users.some((u) => u.email === email)) return fallo(409, CORREO_REPETIDO);
    const r = rolAsignable(cuerpo['roleId']);
    if (typeof r === 'string') return fallo(400, r);
    const u: DemoUser = {
      id: `u-${Date.now()}`, firstName: limpiar(cuerpo['firstName']), lastName: limpiar(cuerpo['lastName']), email,
      documentNumber: limpiar(cuerpo['documentNumber']) || null, phone: limpiar(cuerpo['phone']) || null,
      role: { id: r.id, code: r.code, name: r.name }, active: true, locked: false, lastLoginAt: null,
      createdAt: new Date().toISOString(), password: DEMO_PASSWORD,
    };
    datos.users.push(u);
    guardar();
    return ok(vistaUsuario(u), 201);
  }

  const coincide = ruta.match(/^\/users\/([^/]+)(\/status|\/access-link)?$/);
  if (!coincide) return null;
  const u = datos.users.find((x) => x.id === coincide[1]);
  if (!u) return fallo(404, 'El usuario no existe.');
  const accion = coincide[2];
  if (metodo === 'GET' && !accion) return puede(yo, 'usuarios.ver', 'usuarios.gestionar') ? ok(vistaUsuario(u)) : prohibido();
  if (!puede(yo, 'usuarios.gestionar')) return prohibido();
  const otrosAdmins = () => datos.users.filter((x) => x.id !== u.id && x.active && x.role.code === 'ADMINISTRADOR').length;

  if (metodo === 'PATCH' && !accion) {
    const email = cuerpo['email'] !== undefined ? limpiar(cuerpo['email']).toLowerCase() : u.email;
    if (email !== u.email && datos.users.some((x) => x.email === email)) return fallo(409, CORREO_REPETIDO);
    if (cuerpo['roleId'] && cuerpo['roleId'] !== u.role.id) {
      const r = rolAsignable(cuerpo['roleId']);
      if (typeof r === 'string') return fallo(400, r);
      if (u.id === yo.id) return fallo(400, 'No puede cambiar su propio rol. Pídalo a otro administrador.');
      if (u.role.code === 'ADMINISTRADOR' && u.active && otrosAdmins() === 0) return fallo(400, UN_ADMIN);
      u.role = { id: r.id, code: r.code, name: r.name };
    }
    u.email = email;
    if (cuerpo['firstName'] !== undefined) u.firstName = limpiar(cuerpo['firstName']);
    if (cuerpo['lastName'] !== undefined) u.lastName = limpiar(cuerpo['lastName']);
    if (cuerpo['documentNumber'] !== undefined) u.documentNumber = limpiar(cuerpo['documentNumber']) || null;
    if (cuerpo['phone'] !== undefined) u.phone = limpiar(cuerpo['phone']) || null;
    guardar();
    return ok(vistaUsuario(u));
  }
  if (metodo === 'PATCH' && accion === '/status') {
    const activo = cuerpo['active'] === true;
    if (!activo && u.id === yo.id) return fallo(400, 'No puede inactivar su propio usuario.');
    if (!activo && u.role.code === 'ADMINISTRADOR' && otrosAdmins() === 0) return fallo(400, UN_ADMIN);
    u.active = activo;
    guardar();
    return ok(vistaUsuario(u));
  }
  if (metodo === 'POST' && accion === '/access-link') {
    if (!u.active) return fallo(400, 'Active el usuario antes de enviarle un enlace de acceso.');
    return ok({ message: 'Enlace de acceso enviado al correo del usuario.' });
  }
  return null;
}
