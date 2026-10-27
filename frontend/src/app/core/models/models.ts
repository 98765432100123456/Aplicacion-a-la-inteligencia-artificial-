export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { id: string; code: string; name: string };
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string | null;
  phone: string | null;
  role: { id: string; code: string; name: string };
  active: boolean;
  locked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string | null;
  phone: string | null;
  roleId: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  active: boolean;
  userCount: number;
  updatedAt: string;
}

export interface RoleInput {
  code?: string;
  name: string;
  description: string | null;
  permissions: string[];
}

export interface PermissionDef {
  key: string;
  module: string;
  label: string;
}

/** Claves de permiso; deben coincidir con backend/src/roles/constants/permissions.ts */
export const P = {
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_GESTIONAR: 'usuarios.gestionar',
  ROLES_VER: 'roles.ver',
  ROLES_GESTIONAR: 'roles.gestionar',
  FINCAS_VER: 'fincas.ver',
  FINCAS_GESTIONAR: 'fincas.gestionar',
  PREDIOS_PROPIOS: 'predios.propios',
  EVALUACIONES_VER: 'evaluaciones.ver',
  EVALUACIONES_DILIGENCIAR: 'evaluaciones.diligenciar',
  REPORTES_VER: 'reportes.ver',
} as const;
