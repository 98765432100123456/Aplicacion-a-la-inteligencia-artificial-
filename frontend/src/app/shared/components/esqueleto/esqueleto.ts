import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Silueta de lo que va a aparecer mientras llegan los datos: evita el salto de la
 * pantalla en blanco al contenido. El lector de pantalla oye la etiqueta.
 */
@Component({
  selector: 'app-esqueleto',
  templateUrl: './esqueleto.html',
  styleUrl: './esqueleto.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Esqueleto {
  readonly etiqueta = input('Cargando…');
  /** lista: filas con título y detalle; cifras: bloques de resumen; ficha: título y párrafos. */
  readonly forma = input<'lista' | 'cifras' | 'ficha'>('lista');
  readonly filas = input(4);
  protected readonly indices = computed(() => Array.from({ length: this.filas() }, (_, i) => i));
}
