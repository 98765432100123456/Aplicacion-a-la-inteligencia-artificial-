import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Política de contraseñas; Firebase Authentication debe tener la misma en su configuración. */
export const PASSWORD_PATTERN = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])(?=.*\d).{10,72}$/;
export const PASSWORD_HINT = 'Mínimo 10 caracteres, con al menos una letra y un número.';

export const passwordPolicy: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: string = control.value ?? '';
  if (!value) return null;
  return PASSWORD_PATTERN.test(value) ? null : { policy: true };
};

/** Valida que dos campos del grupo coincidan. */
export function matchFields(field: string, confirm: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(field)?.value;
    const b = group.get(confirm)?.value;
    return a && b && a !== b ? { mismatch: true } : null;
  };
}
