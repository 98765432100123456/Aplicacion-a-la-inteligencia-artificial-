import { Component, computed, input } from '@angular/core';
import { CodigoNivel, NIVELES } from '../../../compartido/norma';

/** Nivel de bienestar con su punto de color y, si se da, el puntaje de 0 a 5. */
@Component({
  selector: 'app-nivel',
  template: `<span class="nivel" [class]="'nivel ' + (nivel() ?? 'NINGUNO').toLowerCase()"
    ><i aria-hidden="true"></i>{{ nombre() }}@if (puntaje() !== null) {<span class="cifras"> · {{ puntajeTexto() }}</span>}</span
  >`,
  styles: `
    .nivel { display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 700; font-size: var(--texto-sm); white-space: nowrap; }
    i { width: 0.55rem; height: 0.55rem; border-radius: 50%; background: var(--tinta-tenue); }
    .bajo i { background: var(--alerta); } .bajo { color: var(--alerta); }
    .medio i { background: var(--maiz); } .medio { color: var(--maiz); }
    .alto i { background: var(--accion); } .alto { color: var(--acento); }
    .excelente i { background: var(--acento); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accion) 40%, transparent); } .excelente { color: var(--acento); }
    span.cifras { color: var(--tinta-suave); font-weight: 600; }
  `,
})
export class Nivel {
  readonly nivel = input<CodigoNivel | string | null>(null);
  readonly puntaje = input<number | null>(null);
  protected readonly nombre = computed(() => NIVELES.find((n) => n.codigo === this.nivel())?.nombre ?? 'Sin evaluar');
  protected readonly puntajeTexto = computed(() => `${this.puntaje()!.toFixed(1).replace('.', ',')} de 5`);
}
