import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Franja que avisa cuando el dispositivo pierde internet, algo común en el campo. */
@Component({
  selector: 'app-sin-conexion',
  templateUrl: './sin-conexion.html',
  styleUrl: './sin-conexion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SinConexion {
  protected readonly desconectado = signal(false);

  constructor() {
    const ventana = inject(DOCUMENT).defaultView;
    if (!ventana) return;
    const actualizar = () => this.desconectado.set(!ventana.navigator.onLine);
    actualizar();
    ventana.addEventListener('online', actualizar);
    ventana.addEventListener('offline', actualizar);
    inject(DestroyRef).onDestroy(() => {
      ventana.removeEventListener('online', actualizar);
      ventana.removeEventListener('offline', actualizar);
    });
  }
}
