import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// inject() solo funciona antes del primer await: por eso se toman al inicio.

/** Exige sesión; si no hay, envía al ingreso y recuerda a dónde iba. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (await auth.restore()) return true;
  return router.createUrlTree(['/ingresar'], { queryParams: { volver: state.url } });
};

/** Las pantallas de ingreso y recuperación no se muestran con sesión abierta. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (await auth.restore()) return router.createUrlTree(['/inicio']);
  return true;
};

/** Exige al menos uno de los permisos indicados en route.data.permissions. */
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const required: string[] = route.data['permissions'] ?? [];
  if (!required.length || auth.can(...required)) return true;
  return inject(Router).createUrlTree(['/inicio'], { queryParams: { sinPermiso: 1 } });
};

/** Pantallas con formularios que pueden perder cambios al salir. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Pide confirmación antes de salir de una pantalla con cambios sin guardar. */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() || window.confirm('Hay cambios sin guardar. ¿Salir y descartarlos?');
