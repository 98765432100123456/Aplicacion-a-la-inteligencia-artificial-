/**
 * Catálogo de permisos del sistema. Los roles guardan un subconjunto de estas
 * claves; los guards de la API y las rutas del frontend las consultan.
 * Al agregar un módulo nuevo se agregan aquí sus permisos (RNF30).
 */
export const PERMISSIONS = {
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_GESTIONAR: 'usuarios.gestionar',
  ROLES_VER: 'roles.ver',
  ROLES_GESTIONAR: 'roles.gestionar',
  FINCAS_VER: 'fincas.ver',
  FINCAS_GESTIONAR: 'fincas.gestionar',
  PARAMETRIZACION_GESTIONAR: 'parametrizacion.gestionar',
  EVALUACIONES_VER: 'evaluaciones.ver',
  EVALUACIONES_DILIGENCIAR: 'evaluaciones.diligenciar',
  EVALUACIONES_VALIDAR: 'evaluaciones.validar',
  REPORTES_VER: 'reportes.ver',
  AUDITORIA_VER: 'auditoria.ver',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_CATALOG: { key: Permission; module: string; label: string }[] = [
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

export const ALL_PERMISSIONS: Permission[] = PERMISSION_CATALOG.map((p) => p.key);

/** Códigos de los roles base definidos en RF02. */
export const BASE_ROLES = {
  ADMIN: 'ADMIN',
  EVALUADOR: 'EVALUADOR',
  CONSULTOR: 'CONSULTOR',
} as const;
