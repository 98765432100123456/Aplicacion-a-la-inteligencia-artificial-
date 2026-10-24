import { Component, computed, ElementRef, signal, viewChildren } from '@angular/core';
import { LIBERTADES, METODOS, muestraMinima, NIVELES, repartir, tipoProductor, TIPOS_INDICADOR } from './norma-ica';

const GRUPOS = [
  { id: 'crias', nombre: 'Crías' },
  { id: 'jovenes', nombre: 'Jóvenes' },
  { id: 'adultos', nombre: 'Adultos' },
];

/** Guía de la metodología del ICA: pesos por libertad, cuidados, escala y tamaño de muestra. */
@Component({
  selector: 'app-guia-bienestar',
  template: `
    <section class="bloque" aria-labelledby="libertades-titulo">
      <header class="encabezado">
        <h2 id="libertades-titulo">Cómo califica el ICA un predio.</h2>
        <p>La metodología oficial para bovinos y bufalinos agrupa las cinco libertades del animal en cuatro bloques. No pesan igual: la salud vale la mitad de la nota.</p>
      </header>

      <div class="balanza" role="tablist" aria-label="Libertades y su peso en la calificación">
        @for (l of libertades; track l.id; let i = $index) {
          <button
            #pestana
            type="button"
            role="tab"
            class="tramo"
            [id]="'tab-' + l.id"
            [style.flex-grow]="l.peso"
            [attr.aria-selected]="i === activa()"
            [attr.aria-controls]="'panel-' + l.id"
            [tabIndex]="i === activa() ? 0 : -1"
            (click)="activa.set(i)"
            (keydown)="mover($event, i)"
          >
            <span class="peso cifras">{{ l.peso }} %</span>
            <span class="nombre-corto">{{ l.corto }}</span>
          </button>
        }
      </div>

      @for (l of libertades; track l.id; let i = $index) {
        @if (i === activa()) {
          <div class="detalle" role="tabpanel" [id]="'panel-' + l.id" [attr.aria-labelledby]="'tab-' + l.id">
            <div class="panel-intro">
              <h3>{{ l.nombre }}</h3>
              <p class="pesa">Pesa <b class="cifras">{{ l.peso }} %</b> de la calificación del predio.</p>
              <h4>Qué revisa el evaluador</h4>
              <ul class="revisa">
                @for (e of l.evalua; track e) { <li>{{ e }}</li> }
              </ul>
            </div>
            <div class="panel-cuidados">
              <h4>Cuidados en la finca</h4>
              <ul class="cuidados">
                @for (c of l.cuidados; track c) {
                  <li>
                    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 7" /></svg>
                    <span>{{ c }}</span>
                  </li>
                }
              </ul>
              <p class="alerta"><span class="estado estado-alerta">Señal de alerta</span> {{ l.alerta }}</p>
            </div>
          </div>
        }
      }
    </section>

    <section class="bloque" aria-labelledby="escala-titulo">
      <header class="encabezado">
        <h2 id="escala-titulo">Cuatro niveles de resultado.</h2>
        <p>Al cerrar la evaluación, el predio queda en uno de cuatro niveles. La norma usa como referencia una escala de 0 a 5.</p>
      </header>

      <div class="regla" aria-hidden="true">
        @for (n of niveles; track n.nombre) {
          <span class="franja" [class]="'franja ' + n.tono" [style.flex-grow]="n.hasta - n.desde"></span>
        }
      </div>
      <div class="marcas cifras" aria-hidden="true">
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
      </div>

      <dl class="niveles">
        @for (n of niveles; track n.nombre) {
          <div>
            <dt><i [class]="n.tono" aria-hidden="true"></i>{{ n.nombre }}</dt>
            <dd class="cifras">{{ n.rango }}</dd>
          </div>
        }
      </dl>

      <p class="aviso aviso-advertencia urgente">
        Un resultado bajo en cualquiera de las libertades obliga a tomar acciones correctivas con urgencia, aunque el promedio del predio sea bueno.
      </p>
    </section>

    <section class="bloque calculo" aria-labelledby="muestra-titulo">
      <header class="encabezado">
        <h2 id="muestra-titulo">¿A cuántos animales hay que revisar?</h2>
        <p>Escriba el inventario por grupo de edad. La metodología define el tipo de productor y la muestra mínima para la inspección visual.</p>
      </header>

      <div class="calculadora">
        <div class="entrada-datos">
          <fieldset class="inventario">
            <legend>Inventario del predio</legend>
            @for (g of grupos; track g.id; let i = $index) {
              <div class="campo">
                <label [for]="'inv-' + g.id">{{ g.nombre }}</label>
                <input
                  class="control cifras"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  step="1"
                  [id]="'inv-' + g.id"
                  [value]="inventario()[i]"
                  (input)="cambiar(i, $any($event.target).value)"
                />
              </div>
            }
            <p class="nota">Si en la finca hay bovinos y búfalos, se hacen dos evaluaciones independientes, una por especie.</p>
          </fieldset>
          <table class="tabla-muestra">
            <caption>Muestra mínima según la norma</caption>
            <thead><tr><th scope="col">Animales en el predio</th><th scope="col">Muestra mínima</th></tr></thead>
            <tbody>
              @for (f of tablaMuestra; track f.rango) {
                <tr [class.actual]="f.id === filaActual()">
                  <td class="cifras">{{ f.rango }}</td>
                  <td class="cifras">{{ f.muestra }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="resultado" aria-live="polite">
          <div class="fila">
            <span>Animales en el predio</span>
            <b class="cifras">{{ total() }}</b>
          </div>
          <div class="fila">
            <span>Tipo de productor</span>
            <b>{{ productorTexto() }}</b>
          </div>
          <p class="metodologia">{{ metodologia() }}</p>

          @if (muestra(); as m) {
            <div class="muestra">
              <span class="muestra-valor cifras">{{ m }}</span>
              <span class="muestra-rotulo">animales como mínimo en la muestra</span>
            </div>
            <ul class="reparto">
              @for (g of grupos; track g.id; let i = $index) {
                <li><b class="cifras">{{ reparto()[i] }}</b> {{ g.nombre.toLowerCase() }}</li>
              }
            </ul>
          } @else {
            <p class="sin-muestra">
              @if (total() === 0) { Escriba cuántos animales hay en cada grupo. }
              @else { Con 50 animales o menos aplica el capítulo de pequeño productor, que tiene su propia escala de calificación. }
            </p>
          }
        </div>
      </div>

    </section>

    <section class="bloque" aria-labelledby="indicadores-titulo">
      <header class="encabezado">
        <h2 id="indicadores-titulo">Qué mira el evaluador.</h2>
        <p>Cada indicador se apoya en una de tres fuentes y se verifica con uno de tres métodos: {{ metodosTexto }}.</p>
      </header>
      <dl class="tipos">
        @for (t of tipos; track t.nombre) {
          <div>
            <dt>{{ t.nombre }}</dt>
            <dd>{{ t.ejemplo }}</dd>
          </div>
        }
      </dl>
    </section>

    <p class="fuente">
      Fuente: Instituto Colombiano Agropecuario, <cite>Metodología para evaluar el bienestar animal en las especies bovina y bufalina</cite>, versión 2.0 (2023), expedida en cumplimiento de la Resolución 253 de 2020 del Ministerio de Agricultura y Desarrollo Rural. Análisis de la norma: Angie Caterin Patiño Hernández, Universidad Cooperativa de Colombia. Los cuidados son prácticas de manejo de referencia y no reemplazan la asistencia de un médico veterinario.
    </p>
  `,
  styles: `
    :host { display: block; }
    .bloque { margin-bottom: var(--e-16); }
    .encabezado { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: var(--e-10); align-items: end; margin-bottom: var(--e-8); }
    h2 { font-size: var(--texto-2xl); letter-spacing: -0.045em; line-height: 1.02; }
    .encabezado p { color: var(--tinta-suave); max-width: 32rem; }
    h3 { font-size: var(--texto-xl); letter-spacing: -0.035em; line-height: 1.1; }
    h4 { font-size: var(--texto-sm); font-weight: 800; margin: var(--e-6) 0 var(--e-3); }

    /* Balanza de pesos: el ancho de cada tramo es su peso real en la nota */
    .balanza { display: flex; gap: 3px; }
    .tramo {
      position: relative; flex-basis: 0; min-width: 0; min-height: 6.5rem; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start;
      padding: var(--e-4); border: 0; border-radius: 6px; cursor: pointer; text-align: left;
      background: var(--acento-suave); color: var(--tinta); font: inherit;
      transition: background-color var(--dur-rapida) ease, color var(--dur-rapida) ease, transform var(--dur-presion) var(--curva);
    }
    .tramo:first-child { border-radius: var(--radio-panel) 6px 6px var(--radio-panel); }
    .tramo:last-child { border-radius: 6px var(--radio-panel) var(--radio-panel) 6px; }
    .tramo:active { transform: scale(0.98); }
    .tramo[aria-selected='true'] { background: var(--tinta); color: var(--fondo); box-shadow: inset 0 -4px 0 var(--accion); }
    @media (hover: hover) and (pointer: fine) {
      .tramo[aria-selected='false']:hover { background: color-mix(in srgb, var(--acento) 22%, var(--superficie)); }
    }
    .peso { font-size: var(--texto-2xl); font-weight: 800; letter-spacing: -0.05em; line-height: 1; white-space: nowrap; }
    .nombre-corto { font-size: var(--texto-sm); font-weight: 700; overflow-wrap: anywhere; }

    .detalle {
      display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: var(--e-10);
      margin-top: var(--e-6); padding-top: var(--e-6); border-top: 1px solid var(--linea-fuerte);
    }
    @media (prefers-reduced-motion: no-preference) {
      .detalle { animation: entrar 320ms var(--curva) both; }
    }
    .pesa { margin-top: var(--e-2); color: var(--tinta-suave); }
    .pesa b { color: var(--tinta); }
    .revisa { margin: 0; padding-left: 1.1rem; display: grid; gap: var(--e-2); color: var(--tinta-suave); }
    .cuidados { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--linea); }
    .cuidados li { display: grid; grid-template-columns: 1.25rem 1fr; gap: var(--e-3); padding: var(--e-3) 0; border-bottom: 1px solid var(--linea); }
    .cuidados svg { width: 1.25rem; height: 1.25rem; margin-top: 0.15rem; fill: none; stroke: var(--acento); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
    .alerta { margin-top: var(--e-4); color: var(--tinta-suave); font-size: var(--texto-sm); }
    .alerta .estado { margin-right: var(--e-2); }

    /* Regla de niveles */
    .regla { display: flex; gap: 3px; height: 0.875rem; }
    .franja { flex-basis: 0; border-radius: 3px; }
    .franja:first-child { border-radius: 999px 3px 3px 999px; }
    .franja:last-child { border-radius: 3px 999px 999px 3px; }
    .bajo { background: var(--alerta); }
    .medio { background: var(--maiz); }
    .alto { background: color-mix(in srgb, var(--accion) 55%, var(--superficie)); }
    .excelente { background: var(--accion); }
    .marcas { display: flex; justify-content: space-between; margin-top: var(--e-2); font-size: var(--texto-xs); color: var(--tinta-suave); }
    .niveles { display: grid; grid-template-columns: repeat(4, 1fr); margin: var(--e-6) 0 0; border-top: 1px solid var(--linea-fuerte); }
    .niveles div { padding: var(--e-4) var(--e-4) var(--e-4) 0; border-bottom: 1px solid var(--linea); }
    .niveles div + div { padding-left: var(--e-4); border-left: 1px solid var(--linea); }
    .niveles dt { display: flex; align-items: center; gap: var(--e-2); font-weight: 800; font-size: var(--texto-lg); letter-spacing: -0.02em; }
    .niveles dt i { width: 0.625rem; height: 0.625rem; border-radius: 50%; flex: none; }
    .niveles dd { margin: var(--e-1) 0 0; color: var(--tinta-suave); font-size: var(--texto-sm); }
    .urgente { margin-top: var(--e-6); }

    /* Calculadora de muestra */
    .calculadora { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: var(--e-10); align-items: start; }
    .inventario { margin: 0; padding: 0; border: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--e-4); }
    .inventario legend { padding: 0; margin-bottom: var(--e-3); font-weight: 800; font-size: var(--texto-sm); }
    .campo { display: grid; gap: var(--e-2); }
    .campo label { font-weight: 700; font-size: var(--texto-sm); }
    .campo input { width: 100%; }
    .nota { grid-column: 1 / -1; margin-top: var(--e-2); font-size: var(--texto-sm); color: var(--tinta-suave); }
    .resultado { border-top: 1px solid var(--linea-fuerte); }
    .fila { display: flex; justify-content: space-between; align-items: baseline; gap: var(--e-4); padding: var(--e-3) 0; border-bottom: 1px solid var(--linea); }
    .fila span { color: var(--tinta-suave); font-weight: 600; }
    .fila b { font-size: var(--texto-lg); letter-spacing: -0.02em; text-transform: capitalize; }
    .metodologia { padding: var(--e-3) 0; border-bottom: 1px solid var(--linea); font-size: var(--texto-sm); color: var(--tinta-suave); }
    .muestra { display: flex; align-items: baseline; gap: var(--e-3); padding-top: var(--e-6); }
    .muestra-valor { font-size: var(--texto-3xl); font-weight: 800; letter-spacing: -0.05em; line-height: 1; color: var(--acento); }
    .muestra-rotulo { font-weight: 700; color: var(--tinta-suave); }
    .reparto { list-style: none; margin: var(--e-4) 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--e-2) var(--e-6); color: var(--tinta-suave); }
    .reparto b { color: var(--tinta); font-size: var(--texto-lg); }
    .sin-muestra { padding-top: var(--e-4); color: var(--tinta-suave); }

    .tabla-muestra { width: 100%; margin-top: var(--e-8); border-collapse: collapse; font-size: var(--texto-sm); }
    .tabla-muestra caption { text-align: left; font-weight: 800; margin-bottom: var(--e-3); }
    .tabla-muestra th { text-align: left; padding: var(--e-2) var(--e-4) var(--e-2) 0; font-size: var(--texto-xs); color: var(--tinta-suave); border-top: 1px solid var(--linea-fuerte); border-bottom: 1px solid var(--linea); }
    .tabla-muestra td { padding: var(--e-3) var(--e-4) var(--e-3) 0; border-bottom: 1px solid var(--linea); }
    .tabla-muestra tr.actual td { font-weight: 800; color: var(--acento); }
    .tabla-muestra tr.actual td:first-child { box-shadow: inset 3px 0 0 var(--accion); padding-left: var(--e-3); }

    /* Tipos de indicador */
    .tipos { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0; border-top: 1px solid var(--linea-fuerte); }
    .tipos div { padding: var(--e-5) var(--e-6) var(--e-5) 0; border-bottom: 1px solid var(--linea); }
    .tipos div + div { padding-left: var(--e-6); border-left: 1px solid var(--linea); }
    .tipos dt { font-weight: 800; font-size: var(--texto-md); }
    .tipos dd { margin: var(--e-2) 0 0; color: var(--tinta-suave); font-size: var(--texto-sm); }

    .fuente { max-width: 48rem; margin: 0 0 var(--e-16); padding-top: var(--e-6); border-top: 1px solid var(--linea); font-size: var(--texto-xs); color: var(--tinta-suave); line-height: 1.55; }
    .fuente cite { font-style: italic; }

    @media (max-width: 56em) {
      .encabezado, .detalle, .calculadora { grid-template-columns: 1fr; gap: var(--e-4); }
      .encabezado { margin-bottom: var(--e-6); }
      .detalle { gap: 0; }
      .calculadora { gap: var(--e-8); }
    }
    @media (max-width: 47.49em) {
      .bloque { margin-bottom: var(--e-12); }
      .tramo { min-height: 4rem; padding: var(--e-3) var(--e-2); justify-content: center; align-items: center; }
      .peso { font-size: var(--texto-md); letter-spacing: -0.03em; }
      /* Solo se oculta a la vista: el lector de pantalla sigue leyendo el nombre */
      .nombre-corto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
      .niveles { grid-template-columns: 1fr 1fr; }
      .niveles div:nth-child(3) { padding-left: 0; border-left: 0; }
      .tipos { grid-template-columns: 1fr; }
      .tipos div, .tipos div + div { padding: var(--e-4) 0; border-left: 0; }
    }
  `,
})
export class GuiaBienestar {
  protected readonly libertades = LIBERTADES;
  protected readonly niveles = NIVELES;
  protected readonly tipos = TIPOS_INDICADOR;
  protected readonly metodosTexto = METODOS.map((m) => m.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' e $1');
  protected readonly grupos = GRUPOS;
  protected readonly tablaMuestra = [
    { id: 'm20', rango: '51 a 99', muestra: '20' },
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
  protected readonly productorTexto = computed(() => (this.total() === 0 ? 'Sin datos' : this.productor()));
  protected readonly metodologia = computed(() => {
    if (this.total() === 0) return 'La metodología depende del número de animales.';
    return this.productor() === 'pequeño'
      ? 'Hasta 50 animales. Se evalúa con el capítulo de pequeño productor.'
      : 'Más de 50 animales. Se evalúan 23 criterios con 59 indicadores.';
  });
  protected readonly muestra = computed(() => muestraMinima(this.total()));
  protected readonly reparto = computed(() => repartir(this.muestra() ?? 0, this.inventario()));
  protected readonly filaActual = computed(() => {
    const t = this.total();
    if (t <= 50) return null;
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
