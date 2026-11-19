import { Component, computed, input } from '@angular/core';
import { CodigoNivel } from '../../../compartido/norma';

const R = 54;
const C = 2 * Math.PI * R;

/** Dona con la cantidad de evaluaciones en cada nivel y el total en el centro. */
@Component({
  selector: 'app-dona',
  templateUrl: './dona.html',
  styleUrl: './dona.scss',
})
export class Dona {
  readonly segmentos = input.required<{ codigo: CodigoNivel; nombre: string; cantidad: number }[]>();

  protected readonly total = computed(() => this.segmentos().reduce((a, s) => a + s.cantidad, 0));
  protected readonly r = R;
  protected readonly arcos = computed(() => {
    const total = this.total();
    let acumulado = 0;
    return this.segmentos()
      .filter((s) => s.cantidad > 0)
      .map((s) => {
        const largo = (s.cantidad / total) * C;
        // Un pequeño espacio separa los segmentos cuando hay más de uno.
        const hueco = this.segmentos().filter((x) => x.cantidad).length > 1 ? 2 : 0;
        const arco = { codigo: s.codigo.toLowerCase(), dash: `${Math.max(0, largo - hueco)} ${C}`, offset: -acumulado };
        acumulado += largo;
        return arco;
      });
  });
  protected readonly descripcion = computed(() =>
    `${this.total()} evaluaciones: ` + this.segmentos().map((s) => `${s.nombre} ${s.cantidad}`).join(', '),
  );
  protected porcentaje(n: number) {
    return this.total() ? Math.round((n / this.total()) * 100) : 0;
  }
}
