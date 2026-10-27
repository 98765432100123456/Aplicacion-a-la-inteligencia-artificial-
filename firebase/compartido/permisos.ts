// ARCHIVO GENERADO desde compartido/permisos.ts. No lo edite aquí: edite el original y ejecute node scripts/compartido.mjs

/**
 * Catálogo de permisos y roles base. Los roles se guardan en la colección `roles`
 * de Firestore con su lista de permisos; las reglas de seguridad (firebase/firestore.rules)
 * y las rutas de la interfaz consultan estas mismas claves (RNF07, RNF30).
 */

export const PERMISOS = {
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_GESTIONAR: 'usuarios.gestionar',
  ROLES_VER: 'roles.ver',
  ROLES_GESTIONAR: 'roles.gestionar',
  FINCAS_VER: 'fincas.ver',
  FINCAS_GESTIONAR: 'fincas.gestionar',
  PREDIOS_PROPIOS: 'predios.propios',
  PARAMETRIZACION_GESTIONAR: 'parametrizacion.gestionar',
  EVALUACIONES_VER: 'evaluaciones.ver',
  EVALUACIONES_DILIGENCIAR: 'evaluaciones.diligenciar',
  EVALUACIONES_VALIDAR: 'evaluaciones.validar',
  REPORTES_VER: 'reportes.ver',
  AUDITORIA_VER: 'auditoria.ver',
} as const;

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];

export const CATALOGO_PERMISOS: { key: Permiso; module: string; label: string }[] = [
  { key: 'usuarios.ver', module: 'Seguridad', label: 'Consultar usuarios' },
  { key: 'usuarios.gestionar', module: 'Seguridad', label: 'Crear, editar, activar e inactivar usuarios' },
  { key: 'roles.ver', module: 'Seguridad', label: 'Consultar roles' },
  { key: 'roles.gestionar', module: 'Seguridad', label: 'Crear y editar roles y sus permisos' },
  { key: 'fincas.ver', module: 'Fincas', label: 'Consultar todos los predios' },
  { key: 'fincas.gestionar', module: 'Fincas', label: 'Registrar y editar predios e inventario' },
  { key: 'predios.propios', module: 'Fincas', label: 'Consultar sus propios predios, evaluaciones e informes' },
  { key: 'parametrizacion.gestionar', module: 'Parametrización', label: 'Configurar especies, criterios y ponderaciones' },
  { key: 'evaluaciones.ver', module: 'Evaluación', label: 'Consultar evaluaciones y resultados' },
  { key: 'evaluaciones.diligenciar', module: 'Evaluación', label: 'Crear y diligenciar evaluaciones' },
  { key: 'evaluaciones.validar', module: 'Evaluación', label: 'Validar y cerrar evaluaciones' },
  { key: 'reportes.ver', module: 'Reportes', label: 'Ver tableros y descargar reportes' },
  { key: 'auditoria.ver', module: 'Administración', label: 'Consultar la bitácora de auditoría' },
];

export const TODOS_LOS_PERMISOS: Permiso[] = CATALOGO_PERMISOS.map((p) => p.key);

/** Identificadores de los documentos de los roles base en la colección `roles`. */
export const ROLES_BASE = {
  ADMINISTRADOR: 'administrador',
  EVALUADOR: 'evaluador',
  CONSULTOR: 'consultor',
  PROPIETARIO: 'propietario',
} as const;

export interface DefinicionRol {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: Permiso[];
}

export const DEFINICION_ROLES_BASE: DefinicionRol[] = [
  {
    id: ROLES_BASE.ADMINISTRADOR,
    nombre: 'Administrador',
    descripcion: 'Gestiona usuarios, roles, catálogos y parametrización de especies.',
    permisos: TODOS_LOS_PERMISOS,
  },
  {
    id: ROLES_BASE.EVALUADOR,
    nombre: 'Evaluador',
    descripcion: 'Registra predios y diligencia evaluaciones de bienestar animal.',
    permisos: ['fincas.ver', 'fincas.gestionar', 'evaluaciones.ver', 'evaluaciones.diligenciar', 'reportes.ver'],
  },
  {
    id: ROLES_BASE.CONSULTOR,
    nombre: 'Consultor externo',
    descripcion: 'Consulta predios, evaluaciones y reportes sin modificarlos.',
    permisos: ['fincas.ver', 'evaluaciones.ver', 'reportes.ver'],
  },
  {
    id: ROLES_BASE.PROPIETARIO,
    nombre: 'Propietario del predio',
    descripcion: 'Consulta la información de sus predios, los resultados de las evaluaciones y las recomendaciones.',
    permisos: ['predios.propios'],
  },
];
