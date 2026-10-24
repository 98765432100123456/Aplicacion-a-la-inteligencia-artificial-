/** Usuario autenticado que queda en request.user tras validar el JWT. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { id: string; code: string; name: string };
  permissions: string[];
}

export interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}
