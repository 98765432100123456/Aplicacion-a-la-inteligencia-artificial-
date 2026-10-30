import { Component, computed, ElementRef, signal, viewChildren } from '@angular/core';
import { LIBERTADES, METODOS, NIVELES, TIPOS_INDICADOR } from '../data/norma-ica';
import { muestraMinima, NOMBRE_PRODUCTOR, repartir, tipoProductor } from '../../../compartido/norma';
import { Ilustracion } from '../../../shared/components/ilustracion/ilustracion';

const GRUPOS = [
  { id: 'crias', nombre: 'Crías' },
  { id: 'jovenes', nombre: 'Jóvenes' },
  { id: 'adultos', nombre: 'Adultos' },
];

/** Guía de la metodología del ICA: pesos por libertad, cuidados, escala y tamaño de muestra. */
@Component({
  selector: 'app-guia-bienestar',
  templateUrl: './guia-bienestar.html',
  styleUrl: './guia-bienestar.scss',
  imports: [Ilustracion],
})
export class GuiaBienestar {
  protected readonly libertades = LIBERTADES;
  protected readonly niveles = NIVELES;
  protected readonly tipos = TIPOS_INDICADOR;
  protected readonly metodosTexto = METODOS.map((m) => m.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' e $1');
  protected readonly grupos = GRUPOS;
  protected readonly tablaMuestra = [
    { id: 'm20', rango: 'Hasta 99', muestra: '20 (todos, si son menos)' },
    { id: 'm30', rango: '100 a 499', muestra: '30' },
    { id: 'm40', rango: '500 a 999', muestra: '40' },
    { id: 'm5', rango: '1.000 o más', muestra: '5 % del total' },
  ];

  /** La salud se muestra primero: es la libertad con mayor peso. */
  protected readonly activa = signal(1);
  protected readonly inventario = signal<number[]>([18, 34, 68]);
  private readonly pestanas = viewChildren<ElementRef<HTMLButtonElement>>('pestana');

  protected readonly total = computed(() => this.inventario().reduce((a, b) => a + b, 0));
  protected readonly productor = computed(() => tipoProductor(this.total()));
  protected readonly productorTexto = computed(() => (this.total() === 0 ? 'Sin datos' : NOMBRE_PRODUCTOR[this.productor()]));
  protected readonly metodologia = computed(() => {
    if (this.total() === 0) return 'La metodología depende del número de animales.';
    return this.productor() === 'PEQUENO'
      ? 'Hasta 50 animales. Se evalúa con el capítulo de pequeño productor.'
      : 'Más de 50 animales. Se evalúan 23 criterios con 59 indicadores.';
  });
  protected readonly muestra = computed(() => muestraMinima(this.total()));
  protected readonly reparto = computed(() => repartir(this.muestra() ?? 0, this.inventario()));
  protected readonly filaActual = computed(() => {
    const t = this.total();
    if (t <= 0) return null;
    if (t <= 99) return 'm20';
    if (t <= 499) return 'm30';
    if (t <= 999) return 'm40';
    return 'm5';
  });

  protected cambiar(i: number, valor: string) {
    const n = Math.max(0, Math.floor(Number(valor) || 0));
    this.inventario.update((v) => v.map((x, j) => (j === i ? n : x)));
  }

  /** Flechas, Inicio y Fin recorren las pestañas, como en un control de pestañas nativo. */
  protected mover(e: KeyboardEvent, i: number) {
    const n = this.libertades.length;
    const destino = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    this.activa.set(destino);
    this.pestanas()[destino]?.nativeElement.focus();
  }
}
