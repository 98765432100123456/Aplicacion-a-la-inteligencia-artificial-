import { Component, computed, input } from '@angular/core';
import { CodigoNivel, NIVELES, puntajeTexto } from '../../../compartido/norma';

const CX = 120;
const CY = 118;
const R = 92;

/** Ángulo (radianes) de un puntaje de 0 a 5 sobre el semicírculo: 0 a la izquierda, 5 a la derecha. */
const angulo = (v: number) => Math.PI * (1 - Math.min(5, Math.max(0, v)) / 5);
const punto = (v: number, r = R) => [CX + r * Math.cos(angulo(v)), CY - r * Math.sin(angulo(v))] as const;

/** Medidor semicircular del puntaje promedio con las cuatro franjas de nivel de la norma. */
@Component({
  selector: 'app-medidor',
  templateUrl: './medidor.html',
  styleUrl: './medidor.scss',
})
export class Medidor {
  readonly puntaje = input<number | null>(null);
  readonly nivel = input<CodigoNivel | null>(null);

  /** Franjas de la escala del ICA: bajo < 3, medio 3–3,9, alto 4–4,5, excelente 4,6–5. */
  protected readonly franjas = [
    { codigo: 'bajo', desde: 0, hasta: 3 },
    { codigo: 'medio', desde: 3, hasta: 4 },
    { codigo: 'alto', desde: 4, hasta: 4.6 },
    { codigo: 'excelente', desde: 4.6, hasta: 5 },
  ].map((f) => {
    const [x1, y1] = punto(f.desde);
    const [x2, y2] = punto(f.hasta);
    return { ...f, d: `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}` };
  });
  protected readonly marcas = [0, 3, 4, 4.6, 5].map((v) => {
    const [x, y] = punto(v, R + 20);
    return { v, x, y, texto: puntajeTexto(v) };
  });

  protected readonly aguja = computed(() => {
    const p = this.puntaje();
    if (p === null) return null;
    const [x, y] = punto(p, R - 26);
    return { x, y };
  });
  protected readonly texto = computed(() => (this.puntaje() === null ? '—' : puntajeTexto(this.puntaje()!)));
  protected readonly nombreNivel = computed(() => NIVELES.find((n) => n.codigo === this.nivel())?.nombre ?? 'Sin datos');
  protected readonly descripcion = computed(() =>
    this.puntaje() === null ? 'Sin evaluaciones en el periodo' : `Puntaje promedio ${this.texto()} de 5, nivel ${this.nombreNivel().toLowerCase()}`,
  );
  protected readonly cx = CX;
  protected readonly cy = CY;
}
