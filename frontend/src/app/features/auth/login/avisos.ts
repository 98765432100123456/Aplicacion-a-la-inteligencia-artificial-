import { ParamMap } from '@angular/router';

/** Mensaje que se muestra sobre el formulario según cómo se llegó al ingreso. */
export function avisoDeIngreso(params: ParamMap): string | null {
  if (params.get('restablecida')) return 'Contraseña actualizada. Ingrese con la nueva contraseña.';
  if (params.get('motivo') === 'expired') return 'Su sesión terminó. Ingrese de nuevo para continuar.';
  return null;
}
