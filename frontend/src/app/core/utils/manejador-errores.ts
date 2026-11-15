import { ErrorHandler, inject, Injectable } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { ActualizacionService } from '../services/actualizacion.service';

/** El navegador no encontró un archivo de la versión anterior (se publicó una nueva). */
export function esVersionVieja(error: unknown): boolean {
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(
    String((error as Error)?.message ?? error),
  );
}

/** Permite una recarga automática cada 30 segundos como máximo, para no entrar en un ciclo. */
export function recargaPermitida(): boolean {
  try {
    const ultima = Number(sessionStorage.getItem('ica-recarga') ?? 0);
    if (Date.now() - ultima < 30_000) return false;
    sessionStorage.setItem('ica-recarga', String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

const AVISO = 'Algo falló en esta pantalla. Recargue la página; lo que ya estaba guardado no se pierde.';
/** Un mismo error repetido no llena la pantalla de avisos. */
const ESPERA_ENTRE_AVISOS_MS = 10_000;

/**
 * Errores inesperados: la persona ve un aviso claro en lugar de una pantalla que no responde,
 * y nunca el detalle técnico (pila, rutas internas o mensajes de Firebase), que solo va a la consola.
 * Es el equivalente del ErrorBoundary de Forja Digital.
 */
@Injectable()
export class ManejadorErrores implements ErrorHandler {
  private readonly toasts = inject(ToastService);
  private readonly actualizacion = inject(ActualizacionService);
  private ultimoAviso = 0;

  handleError(error: unknown): void {
    console.error(error);
    // Se publicó una versión nueva y los archivos de esta pantalla ya no existen en el servidor.
    if (esVersionVieja(error)) {
      this.actualizacion.disponible.set(true);
      return;
    }
    const ahora = Date.now();
    if (ahora - this.ultimoAviso < ESPERA_ENTRE_AVISOS_MS) return;
    this.ultimoAviso = ahora;
    this.toasts.error(AVISO);
  }
}
