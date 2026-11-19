import { Component, computed, input } from '@angular/core';

export type IconoIndicador = 'evaluaciones' | 'predios' | 'puntaje' | 'nivel';

/** Tarjeta de indicador del tablero: cifra principal, variación frente al periodo anterior y minigráfica. */
@Component({
  selector: 'app-indicador',
  templateUrl: './indicador.html',
  styleUrl: './indicador.scss',
})
export class Indicador {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string>();
  readonly unidad = input<string | null>(null);
  readonly detalle = input<string | null>(null);
  readonly icono = input<IconoIndicador>('evaluaciones');
  /** Diferencia con el periodo anterior; null si no hay con qué comparar. */
  readonly variacion = input<number | null>(null);
  readonly formatoVariacion = input<'entero' | 'decimal' | 'puntos'>('entero');
  /** Serie mensual para la minigráfica; los null se omiten. */
  readonly serie = input<(number | null)[]>([]);

  protected readonly variacionTexto = computed(() => {
    const v = this.variacion();
    if (v === null) return null;
    const signo = v > 0 ? '+' : v < 0 ? '−' : '±';
    const abs = Math.abs(v);
    const n = this.formatoVariacion() === 'decimal' ? abs.toFixed(1).replace('.', ',') : String(Math.round(abs));
    return `${signo}${n}${this.formatoVariacion() === 'puntos' ? ' pts' : ''}`;
  });
  protected readonly tendencia = computed(() => {
    const v = this.variacion();
    return v === null || v === 0 ? 'igual' : v > 0 ? 'sube' : 'baja';
  });

  /** Trazo de la minigráfica en un lienzo de 120 × 32. */
  protected readonly trazo = computed(() => {
    const puntos = this.serie().map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
    if (puntos.length < 2) return null;
    const n = this.serie().length - 1;
    const max = Math.max(...puntos.map((p) => p.v));
    const min = Math.min(...puntos.map((p) => p.v));
    const rango = max - min || 1;
    const xy = puntos.map((p) => [(p.i / n) * 116 + 2, 28 - ((p.v - min) / rango) * 24] as const);
    const linea = xy.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const area = `${linea} L${xy[xy.length - 1][0].toFixed(1)} 32 L${xy[0][0].toFixed(1)} 32 Z`;
    return { linea, area, final: xy[xy.length - 1] };
  });
}
