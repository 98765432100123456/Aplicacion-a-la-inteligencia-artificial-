import { estado, fallo, guardar, limpiar, MENSAJE_CONTRASENA, ok, PATRON_CONTRASENA, Peticion, Respuesta, sesion } from '../almacen-demo';
import { DemoUser, RESET_TOKEN } from '../datos-demo';

/** Ingreso y recuperación de contraseña: no requieren sesión. */
export function rutasPublicas({ req, metodo, ruta, cuerpo }: Peticion): Respuesta {
  if (metodo === 'POST' && ruta === '/auth/login') {
    const u = estado.datos.users.find((x) => x.email === limpiar(cuerpo['email']).toLowerCase());
    if (!u || u.password !== cuerpo['password']) return fallo(401, 'Correo o contraseña incorrectos.');
    if (!u.active) return fallo(401, 'Su usuario está inactivo. Contacte al administrador del sistema.');
    u.lastLoginAt = new Date().toISOString();
    guardar();
    return ok({ accessToken: `demo-${u.id}`, user: sesion(u) });
  }
  // En la demostración no hay proyecto de Firebase: solo se ofrece el registro con correo.
  if (metodo === 'GET' && ruta === '/auth/config') return ok({ registration: true, firebase: null });
  if (metodo === 'POST' && ruta === '/auth/register') {
    return ok({ message: 'Si el correo no tenía cuenta, enviamos un enlace para crear su contraseña. Revise también la carpeta de spam.' });
  }
  if (metodo === 'POST' && ruta === '/auth/forgot-password') {
    return ok({ message: 'Si el correo está registrado y activo, enviamos un enlace para restablecer la contraseña.' });
  }
  if (metodo === 'GET' && ruta === '/auth/reset-password/validate') {
    const valido = req.params.get('token') === RESET_TOKEN;
    return ok(valido ? { valid: true, email: 'ad•••••@ica-bienestar.local' } : { valid: false });
  }
  if (metodo === 'POST' && ruta === '/auth/reset-password') {
    if (cuerpo['token'] !== RESET_TOKEN) return fallo(400, 'El enlace venció o ya fue usado. Solicite uno nuevo.');
    if (!PATRON_CONTRASENA.test(String(cuerpo['password'] ?? ''))) return fallo(400, [MENSAJE_CONTRASENA]);
    estado.datos.users.find((x) => x.id === 'u-admin')!.password = String(cuerpo['password']);
    guardar();
    return ok({ message: 'Contraseña actualizada. Ya puede ingresar.' });
  }
  return null;
}

/** Datos de la sesión y cambio de contraseña del usuario que ingresó. */
export function rutasDeCuenta({ metodo, ruta, cuerpo }: Peticion, yo: DemoUser): Respuesta {
  if (metodo === 'GET' && ruta === '/auth/me') return ok(sesion(yo));
  if (metodo === 'POST' && ruta === '/auth/change-password') {
    if (cuerpo['currentPassword'] !== yo.password) return fallo(400, 'La contraseña actual no es correcta.');
    if (!PATRON_CONTRASENA.test(String(cuerpo['newPassword'] ?? ''))) return fallo(400, [MENSAJE_CONTRASENA]);
    yo.password = String(cuerpo['newPassword']);
    guardar();
    return ok({ accessToken: `demo-${yo.id}`, user: sesion(yo) });
  }
  return null;
}
