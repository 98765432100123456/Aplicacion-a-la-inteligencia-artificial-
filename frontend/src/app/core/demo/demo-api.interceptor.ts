import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { fallo, Peticion, usuarioActual } from './almacen-demo';
import { rutasDeCuenta, rutasPublicas } from './rutas/autenticacion';
import { rutasDeEvaluaciones } from './rutas/evaluaciones';
import { rutasDePredios } from './rutas/predios';
import { rutasDeRoles } from './rutas/roles';
import { rutasDeUsuarios } from './rutas/usuarios';

export { resetDemoData } from './almacen-demo';

/**
 * Modo demostración (`npm run demo`): responde las llamadas a /api dentro del
 * navegador, sin servicio de aplicación ni base de datos, con las mismas reglas
 * y mensajes que la versión con Firebase (core/firebase). Los datos de prueba están en datos-demo.ts.
 */
export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.demo || !req.url.startsWith(environment.apiUrl)) return next(req);

  const peticion: Peticion = {
    req,
    metodo: req.method,
    ruta: req.url.slice(environment.apiUrl.length).split('?')[0],
    cuerpo: (req.body ?? {}) as Record<string, unknown>,
  };
  const publica = rutasPublicas(peticion);
  if (publica) return publica;

  const yo = usuarioActual(req);
  if (!yo) return fallo(401, 'Su sesión ya no es válida. Ingrese de nuevo.');
  return (
    rutasDeCuenta(peticion, yo) ??
    rutasDeUsuarios(peticion, yo) ??
    rutasDeRoles(peticion, yo) ??
    rutasDePredios(peticion, yo) ??
    rutasDeEvaluaciones(peticion, yo) ??
    fallo(404, 'Recurso no disponible en el modo demostración.')
  );
};
