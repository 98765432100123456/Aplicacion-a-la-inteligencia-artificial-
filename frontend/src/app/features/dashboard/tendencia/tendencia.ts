import { Component, computed, input } from '@angular/core';
import { puntajeTexto } from '../../../compartido/norma';

const W = 720;
const H = 260;
const M = { arriba: 18, derecha: 44, abajo: 30, izquierda: 34 };
const ANCHO = W - M.izquierda - M.derecha;
const ALTO = H - M.arriba - M.abajo;

/**
 * Tendencia mensual: columnas con la cantidad de evaluaciones (eje izquierdo) y línea con el
 * puntaje promedio de 0 a 5 (eje derecho), con las referencias de nivel medio (3,0) y excelente (4,6).
 */
@Component({
  selector: 'app-tendencia',
  templateUrl: './tendencia.html',
  styleUrl: './tendencia.scss',
})
export class Tendencia {
  readonly meses = input.required<{ mes: string; etiqueta: string; cantidad: number; promedio: number | null }[]>();

  protected readonly w = W;
  protected readonly h = H;
  protected readonly m = M;
  protected readonly base = M.arriba + ALTO;
  protected readonly derecha = W - M.derecha;

  /** Escala del eje de cantidades con un tope redondo. */
  private readonly tope = computed(() => {
    const max = Math.max(1, ...this.meses().map((x) => x.cantidad));
    return max <= 4 ? 4 : Math.ceil(max / 4) * 4;
  });
  protected readonly lineasCantidad = computed(() =>
    [0, 0.25, 0.5, 0.75, 1].map((f) => ({ y: M.arriba + ALTO * (1 - f), texto: String(Math.round(this.tope() * f)) })),
  );
  protected readonly referencias = [
    { v: 3, texto: 'Medio 3,0', clase: 'medio' },
    { v: 4.6, texto: 'Excelente 4,6', clase: 'excelente' },
  ].map((r) => ({ ...r, y: M.arriba + ALTO * (1 - r.v / 5) }));

  protected readonly columnas = computed(() => {
    const n = this.meses().length;
    const banda = ANCHO / n;
    return this.meses().map((x, i) => {
      const alto = (x.cantidad / this.tope()) * ALTO;
      const cx = M.izquierda + banda * i + banda / 2;
      return {
        ...x,
        cx,
        x: cx - banda * 0.28,
        ancho: banda * 0.56,
        y: M.arriba + ALTO - alto,
        alto,
        py: x.promedio === null ? null : M.arriba + ALTO * (1 - x.promedio / 5),
        titulo: `${x.etiqueta}: ${x.cantidad} ${x.cantidad === 1 ? 'evaluación' : 'evaluaciones'}${x.promedio === null ? '' : `, promedio ${puntajeTexto(x.promedio)}`}`,
      };
    });
  });

  /** La línea se interrumpe en los meses sin evaluaciones. */
  protected readonly linea = computed(() => {
    let d = '';
    let abierto = false;
    for (const c of this.columnas()) {
      if (c.py === null) {
        abierto = false;
        continue;
      }
      d += `${abierto ? 'L' : 'M'}${c.cx.toFixed(1)} ${c.py.toFixed(1)} `;
      abierto = true;
    }
    return d.trim();
  });

  protected readonly descripcion = computed(() => 'Tendencia de los últimos 12 meses. ' + this.columnas().map((c) => c.titulo).join('; '));
}
