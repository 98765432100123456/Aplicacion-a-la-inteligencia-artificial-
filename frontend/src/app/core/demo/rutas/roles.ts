import { RoleItem } from '../../models/models';
import { estado, fallo, guardar, limpiar, ok, Peticion, prohibido, puede, Respuesta, vistaRol } from '../almacen-demo';
import { CATALOGO, DemoUser, TODOS_LOS_PERMISOS } from '../datos-demo';

/** Simula /roles con las mismas reglas de backend/src/roles/roles.service.ts. */
export function rutasDeRoles({ metodo, ruta, cuerpo }: Peticion, yo: DemoUser): Respuesta {
  const datos = estado.datos;

  if (ruta === '/roles' && metodo === 'GET') {
    if (!puede(yo, 'roles.ver', 'usuarios.gestionar')) return prohibido();
    const orden = [...datos.roles].sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name));
    return ok(orden.map(vistaRol));
  }
  if (ruta === '/roles/permissions' && metodo === 'GET') return puede(yo, 'roles.ver') ? ok(CATALOGO) : prohibido();

  if (ruta === '/roles' && metodo === 'POST') {
    if (!puede(yo, 'roles.gestionar')) return prohibido();
    const code = limpiar(cuerpo['code']).toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(code)) {
      return fallo(400, ['El código usa mayúsculas, números o guion bajo, empieza por letra y tiene de 2 a 40 caracteres.']);
    }
    if (datos.roles.some((r) => r.code === code)) return fallo(409, `Ya existe un rol con el código ${code}.`);
    const r: RoleItem = {
      id: `r-${Date.now()}`, code, name: limpiar(cuerpo['name']), description: limpiar(cuerpo['description']) || null,
      permissions: (cuerpo['permissions'] as string[]) ?? [], isSystem: false, active: true, userCount: 0,
      updatedAt: new Date().toISOString(),
    };
    datos.roles.push(r);
    guardar();
    return ok(vistaRol(r), 201);
  }

  const coincide = ruta.match(/^\/roles\/([^/]+)(\/status)?$/);
  if (!coincide) return null;
  const r = datos.roles.find((x) => x.id === coincide[1]);
  if (!r) return fallo(404, 'El rol no existe.');
  if (metodo === 'GET' && !coincide[2]) return puede(yo, 'roles.ver') ? ok(vistaRol(r)) : prohibido();
  if (!puede(yo, 'roles.gestionar')) return prohibido();

  if (metodo === 'PATCH' && !coincide[2]) {
    const permisos = cuerpo['permissions'] as string[] | undefined;
    if (permisos && r.code === 'ADMIN' && TODOS_LOS_PERMISOS.some((p) => !permisos.includes(p))) {
      return fallo(400, 'El rol Administrador debe conservar todos los permisos.');
    }
    if (cuerpo['name'] !== undefined) r.name = limpiar(cuerpo['name']);
    if (cuerpo['description'] !== undefined) r.description = limpiar(cuerpo['description']) || null;
    if (permisos) r.permissions = permisos;
    r.updatedAt = new Date().toISOString();
    datos.users.filter((u) => u.role.id === r.id).forEach((u) => (u.role = { id: r.id, code: r.code, name: r.name }));
    guardar();
    return ok(vistaRol(r));
  }
  if (metodo === 'PATCH' && coincide[2]) {
    const activo = cuerpo['active'] === true;
    if (r.isSystem && !activo) return fallo(400, 'Los roles base del sistema no se pueden inactivar.');
    const asignados = datos.users.filter((u) => u.role.id === r.id && u.active).length;
    if (!activo && asignados > 0) {
      return fallo(400, `No se puede inactivar: ${asignados} usuario(s) activos tienen este rol. Cámbieles el rol primero.`);
    }
    r.active = activo;
    r.updatedAt = new Date().toISOString();
    guardar();
    return ok(vistaRol(r));
  }
  return null;
}
