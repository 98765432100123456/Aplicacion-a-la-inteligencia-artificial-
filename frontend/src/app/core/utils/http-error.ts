import { HttpErrorResponse } from '@angular/common/http';
import { MENSAJE_CONTRASENA } from './mensajes';

/** Error con un mensaje pensado para mostrarse tal cual al usuario. */
export class ErrorVisible extends Error {}

/** Mensajes en español para los códigos de error de Firebase Authentication y Firestore. */
const MENSAJES_FIREBASE: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'Escriba un correo válido.',
  'auth/user-disabled': 'Su usuario está inactivo. Contacte al administrador del sistema.',
  'auth/too-many-requests': 'Demasiados intentos seguidos. Espere unos minutos o restablezca su contraseña.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Ingrese o recupere su contraseña.',
  'auth/weak-password': MENSAJE_CONTRASENA,
  'auth/password-does-not-meet-requirements': MENSAJE_CONTRASENA,
  'auth/network-request-failed': 'No hay conexión con el servidor. Revise su internet e intente de nuevo.',
  'auth/requires-recent-login': 'Por seguridad, cierre sesión e ingrese de nuevo antes de esta acción.',
  'auth/expired-action-code': 'El enlace venció o ya fue usado. Solicite uno nuevo.',
  'auth/invalid-action-code': 'El enlace venció o ya fue usado. Solicite uno nuevo.',
  'auth/operation-not-allowed': 'Este método de ingreso no está habilitado en el proyecto de Firebase.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Authentication.',
  'permission-denied': 'Su rol no tiene permiso para esta acción.',
  unavailable: 'No hay conexión con el servidor. Revise su internet e intente de nuevo.',
  'deadline-exceeded': 'El servidor tardó demasiado en responder. Intente de nuevo.',
};

/** Convierte el error de la API o de Firebase en un texto para mostrar. */
export function errorMessage(error: unknown, fallback = 'No se pudo completar la acción. Intente de nuevo.'): string {
  if (error instanceof ErrorVisible) return error.message;
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No hay conexión con el servidor. Revise su internet e intente de nuevo.';
    if (error.status === 429) return 'Demasiados intentos seguidos. Espere un minuto e intente de nuevo.';
    const message = error.error?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string' && error.status < 500) return message;
    return fallback;
  }
  const codigo = (error as { code?: unknown })?.code;
  if (typeof codigo === 'string' && MENSAJES_FIREBASE[codigo]) return MENSAJES_FIREBASE[codigo];
  return fallback;
}
