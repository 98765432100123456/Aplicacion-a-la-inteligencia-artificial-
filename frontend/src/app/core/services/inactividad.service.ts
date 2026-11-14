import { DestroyRef, inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';

/** Minutos sin usar la aplicación antes de cerrar la sesión (equipos compartidos en campo). */
export const MINUTOS_INACTIVIDAD = 30;
const EVENTOS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
/** Reiniciar el reloj en cada tecla es innecesario: basta una vez cada 15 segundos. */
const INTERVALO_MINIMO_MS = 15_000;

/** Cierra la sesión tras un rato sin actividad. Las evaluaciones se guardan solas, así que no se pierde trabajo. */
@Injectable({ providedIn: 'root' })
export class InactividadService {
  private readonly auth = inject(AuthService);

  /** Vigila la actividad mientras viva el componente que lo llama (la estructura de la aplicación). */
  vigilar(destroyRef = inject(DestroyRef), limiteMs = MINUTOS_INACTIVIDAD * 60_000) {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let ultimo = 0;
    const reiniciar = () => {
      const ahora = Date.now();
      if (ahora - ultimo < INTERVALO_MINIMO_MS) return;
      ultimo = ahora;
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        if (this.auth.isAuthenticated()) this.auth.logout('inactividad');
      }, limiteMs);
    };
    EVENTOS.forEach((e) => document.addEventListener(e, reiniciar, { passive: true }));
    reiniciar();
    destroyRef.onDestroy(() => {
      clearTimeout(temporizador);
      EVENTOS.forEach((e) => document.removeEventListener(e, reiniciar));
    });
  }
}
