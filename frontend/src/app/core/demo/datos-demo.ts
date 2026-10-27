import { CATALOGO_PERMISOS } from '../../compartido/permisos';
import { PermissionDef, RoleItem, UserItem } from '../models/models';
import { DemoEvaluation, DemoFarm, prediosIniciales, Species } from './predios-demo';

/**
 * Datos de prueba del modo demostración (`npm run demo`). Son los usuarios y
 * roles que se ven en la aplicación cuando no hay conexión con Firebase.
 * Los usuarios reales viven en Firebase Authentication y en la colección
 * `usuarios` de Firestore; el administrador inicial lo crea firebase/semilla.ts.
 */

/** Contraseña de todas las cuentas de prueba. */
export const DEMO_PASSWORD = 'CambiarEsta.2026';
/** Token que acepta la pantalla de restablecer contraseña: /restablecer-contrasena?token=demo */
export const RESET_TOKEN = 'demo';

/** Catálogo de permisos del sistema (compartido/permisos.ts). */
export const CATALOGO: PermissionDef[] = CATALOGO_PERMISOS;

export const TODOS_LOS_PERMISOS = CATALOGO.map((p) => p.key);

export interface DemoUser extends UserItem {
  password: string;
}

export interface DemoData {
  roles: RoleItem[];
  users: DemoUser[];
  species: Species[];
  farms: DemoFarm[];
  evaluations: DemoEvaluation[];
}

const ROLES: Omit<RoleItem, 'isSystem' | 'active' | 'userCount' | 'updatedAt'>[] = [
  { id: 'r-admin', code: 'ADMINISTRADOR', name: 'Administrador', description: 'Gestiona usuarios, roles, catálogos y parametrización de especies.', permissions: TODOS_LOS_PERMISOS },
  { id: 'r-eval', code: 'EVALUADOR', name: 'Evaluador', description: 'Registra fincas y diligencia evaluaciones de bienestar animal.', permissions: ['fincas.ver', 'fincas.gestionar', 'evaluaciones.ver', 'evaluaciones.diligenciar', 'reportes.ver'] },
  { id: 'r-cons', code: 'CONSULTOR', name: 'Consultor externo', description: 'Consulta fincas, evaluaciones y reportes sin modificarlos.', permissions: ['fincas.ver', 'evaluaciones.ver', 'reportes.ver'] },
  { id: 'r-prop', code: 'PROPIETARIO', name: 'Propietario del predio', description: 'Consulta la información de sus predios, los resultados de las evaluaciones y las recomendaciones.', permissions: ['predios.propios'] },
];

/** Personas de ejemplo: [id, nombres, apellidos, correo, rol, documento, teléfono, activo]. */
const PERSONAS: [string, string, string, string, string, string | null, string | null, boolean][] = [
  ['u-admin', 'Administrador', 'del sistema', 'admin@ica-bienestar.local', 'r-admin', null, null, true],
  ['u-1', 'María Fernanda', 'Gómez Ruiz', 'evaluador@ica-bienestar.local', 'r-eval', '1020456781', '3104567890', true],
  ['u-2', 'Carlos Andrés', 'Rincón Patiño', 'crincon@ica-bienestar.local', 'r-eval', '80123456', '3157894561', true],
  ['u-3', 'Luisa', 'Martínez Ocampo', 'lmartinez@ica-bienestar.local', 'r-eval', '1037654321', '3006543210', true],
  ['u-4', 'Jorge Iván', 'Castaño Mejía', 'consultor@ica-bienestar.local', 'r-cons', '71234567', '3112345678', true],
  ['u-5', 'Daniela', 'Ramírez Torres', 'dramirez@ica-bienestar.local', 'r-cons', '1001234567', '3209876543', true],
  ['u-6', 'Natalia', 'Herrera Quintero', 'nherrera@ica-bienestar.local', 'r-cons', '52345678', '3128765432', false],
  ['u-7', 'Pedro Antonio', 'Rojas Salamanca', 'propietario@ica-bienestar.local', 'r-prop', '79456123', '3104567890', true],
];

/** Estado inicial del modo demostración; el enlace "Restablecer datos" vuelve a él. */
export function datosIniciales(): DemoData {
  const ahora = new Date().toISOString();
  const roles: RoleItem[] = ROLES.map((r) => ({ ...r, isSystem: true, active: true, userCount: 0, updatedAt: ahora }));
  const users = PERSONAS.map(([id, firstName, lastName, email, rolId, documentNumber, phone, active]): DemoUser => {
    const r = roles.find((x) => x.id === rolId)!;
    return {
      id, firstName, lastName, email, documentNumber, phone, active, locked: false, lastLoginAt: null,
      role: { id: r.id, code: r.code, name: r.name }, createdAt: ahora, password: DEMO_PASSWORD,
    };
  });
  return { roles, users, ...prediosIniciales() };
}
