import { HttpErrorResponse } from '@angular/common/http';

/** Convierte la respuesta de error de la API en un texto para mostrar. */
export function errorMessage(error: unknown, fallback = 'No se pudo completar la acción. Intente de nuevo.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No hay conexión con el servidor. Revise su internet e intente de nuevo.';
    if (error.status === 429) return 'Demasiados intentos seguidos. Espere un minuto e intente de nuevo.';
    const message = error.error?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string' && error.status < 500) return message;
  }
  return fallback;
}
