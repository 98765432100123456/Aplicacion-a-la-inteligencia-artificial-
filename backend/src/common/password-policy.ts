/** Política de contraseñas compartida por DTOs (RNF05). */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])(?=.*\d).{10,72}$/;
export const PASSWORD_MESSAGE =
  'La contraseña debe tener entre 10 y 72 caracteres e incluir al menos una letra y un número.';
