import { AbstractControl, FormGroup } from '@angular/forms';

/** Un campo muestra su error cuando ya se tocó o cuando se intentó enviar el formulario. */
export function mostrarError(control: AbstractControl, enviado: boolean): boolean {
  return control.invalid && (control.touched || enviado);
}

/** Marca todos los campos y lleva el foco al primero con error; el id del campo debe coincidir con su nombre. */
export function enfocarPrimerError(form: FormGroup): void {
  form.markAllAsTouched();
  const primero = Object.keys(form.controls).find((nombre) => form.controls[nombre].invalid);
  if (primero) document.getElementById(primero)?.focus();
}
