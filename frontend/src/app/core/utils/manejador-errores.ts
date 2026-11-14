import { ErrorHandler, inject, Injectable } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';

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
  private ultimoAviso = 0;

  handleError(error: unknown): void {
    console.error(error);
    const ahora = Date.now();
    if (ahora - this.ultimoAviso < ESPERA_ENTRE_AVISOS_MS) return;
    this.ultimoAviso = ahora;
    this.toasts.error(AVISO);
  }
}
