import { Component, computed, input } from '@angular/core';
import { CodigoNivel, NIVELES, puntajeTexto } from '../../../compartido/norma';

/** Nivel de bienestar con su punto de color y, si se da, el puntaje de 0 a 5. */
@Component({
  selector: 'app-nivel',
  templateUrl: './nivel.html',
  styleUrl: './nivel.scss',
})
export class Nivel {
  readonly nivel = input<CodigoNivel | string | null>(null);
  readonly puntaje = input<number | null>(null);
  protected readonly nombre = computed(() => NIVELES.find((n) => n.codigo === this.nivel())?.nombre ?? 'Sin evaluar');
  protected readonly puntajeTexto = computed(() => `${puntajeTexto(this.puntaje()!)} de 5`);
}
