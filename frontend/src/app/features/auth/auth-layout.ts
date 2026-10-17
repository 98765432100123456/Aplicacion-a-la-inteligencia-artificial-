import { Component } from '@angular/core';
import { Logo } from '../../shared/logo';

/**
 * Marco de ingreso y recuperación. A la izquierda, el héroe oscuro muestra el
 * producto (mostrar antes de prometer); a la derecha, el formulario.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [Logo],
  template: `
    <div class="marco">
      <section class="heroe" aria-labelledby="heroe-titulo">
        <app-logo [claro]="true" />
        <div class="copia">
          <h1 id="heroe-titulo">Bienestar animal, evaluado en campo.</h1>
          <p>Listas de chequeo por especie, puntaje automático y un plan de mejora para cada finca.</p>
        </div>

        <figure class="escenario" aria-label="Ejemplo ilustrativo de una evaluación en el teléfono">
          <figcaption>Ejemplo ilustrativo del módulo de evaluación</figcaption>
          <div class="telefono" aria-hidden="true">
            <div class="pantalla">
              <p class="t-sup">Evaluación de bovinos</p>
              <p class="t-finca">Finca La Esperanza</p>
              <div class="t-puntaje">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" class="pista" />
                  <circle cx="60" cy="60" r="50" class="avance" />
                </svg>
                <span><b>82</b><small>de 100</small></span>
              </div>
              <p class="t-nivel">Nivel bueno</p>
              <ul class="t-lista">
                <li><i class="ok"></i>Alimentación y agua<em>5/5</em></li>
                <li><i class="ok"></i>Alojamiento<em>6/6</em></li>
                <li><i class="medio"></i>Salud y manejo<em>3/5</em></li>
                <li><i></i>Comportamiento<em>0/4</em></li>
              </ul>
              <span class="t-boton">Continuar evaluación</span>
            </div>
          </div>
        </figure>

        <p class="pie">Proyecto académico de la asignatura Aplicación a la Inteligencia Artificial.</p>
      </section>

      <main class="formulario" id="contenido">
        <div class="hoja entrada">
          <ng-content />
        </div>
      </main>
    </div>
  `,
  styles: `
    .marco { min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 7fr) minmax(24rem, 5fr); }
    .heroe {
      position: relative; overflow: hidden; display: grid; grid-template-rows: auto auto 1fr auto; gap: var(--e-8);
      padding: var(--e-8) clamp(var(--e-8), 5vw, var(--e-16));
      background: var(--noche); color: #f2f3f0;
    }
    .copia { position: relative; z-index: 1; max-width: 34rem; padding-top: clamp(var(--e-8), 6vh, var(--e-16)); }
    h1 { font-size: clamp(2.5rem, 1.2rem + 3.4vw, 4.25rem); line-height: 0.98; letter-spacing: -0.05em; color: #fff; }
    .copia p { margin-top: var(--e-5); max-width: 24rem; font-size: var(--texto-lg); line-height: 1.45; color: var(--sobre-noche); }

    /* El producto como protagonista: el teléfono asoma desde el borde inferior derecho */
    .escenario { position: absolute; right: clamp(var(--e-6), 4vw, var(--e-12)); bottom: 0; margin: 0; width: clamp(13rem, 17vw, 15.5rem); }
    figcaption { margin-bottom: var(--e-4); font-size: var(--texto-xs); font-weight: 600; color: var(--sobre-noche); }
    .telefono {
      width: 100%; aspect-ratio: 9 / 18.5; margin-bottom: -22%;
      padding: 0.45rem; border-radius: 2.6rem; background: #050706; box-shadow: 0 0 0 1px #2a312c;
      transform: rotate(-4deg); transform-origin: bottom center;
    }
    @media (prefers-reduced-motion: no-preference) {
      .telefono { animation: asomar 700ms var(--curva) 120ms both; }
      @keyframes asomar { from { opacity: 0; transform: translateY(12%) rotate(-4deg); } }
    }
    .pantalla {
      height: 100%; border-radius: 2.2rem; padding: 1.6rem 1.1rem 1rem; overflow: hidden;
      display: grid; align-content: start; gap: 0.5rem; background: #f2f3f0; color: #1a1f1c;
    }
    .t-sup { font-size: 0.6875rem; font-weight: 700; color: #59625c; }
    .t-finca { font-size: 1.05rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
    .t-puntaje { position: relative; width: 6.4rem; margin: 0.35rem auto 0; }
    .t-puntaje svg { display: block; width: 100%; transform: rotate(-90deg); }
    .pista { fill: none; stroke: #dde1dc; stroke-width: 12; }
    .avance { fill: none; stroke: #4cc77f; stroke-width: 12; stroke-linecap: round; stroke-dasharray: 314; stroke-dashoffset: 57; }
    .t-puntaje span { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; line-height: 1; }
    .t-puntaje b { font-size: 1.9rem; letter-spacing: -0.05em; }
    .t-puntaje small { font-size: 0.625rem; color: #59625c; font-weight: 600; }
    .t-nivel { text-align: center; font-size: 0.75rem; font-weight: 800; color: #1d6b40; }
    .t-lista { list-style: none; margin: 0.25rem 0 0; padding: 0; border-top: 1px solid #1a1f1c; }
    .t-lista li { display: flex; align-items: center; gap: 0.45rem; padding: 0.42rem 0; border-bottom: 1px solid #dde1dc; font-size: 0.6875rem; font-weight: 700; }
    .t-lista i { width: 0.45rem; height: 0.45rem; border-radius: 50%; background: #c3cac5; }
    .t-lista i.ok { background: #1e7a52; }
    .t-lista i.medio { background: #c28b1e; }
    .t-lista em { margin-left: auto; font-style: normal; color: #59625c; font-variant-numeric: tabular-nums; }
    .t-boton { margin-top: 0.4rem; display: grid; place-items: center; min-height: 2rem; border-radius: 999px; background: #4cc77f; font-size: 0.6875rem; font-weight: 800; }

    .pie { position: relative; z-index: 1; align-self: end; max-width: 22rem; font-size: var(--texto-sm); color: var(--sobre-noche); }

    .formulario { display: grid; place-items: center; padding: var(--e-12) clamp(var(--e-6), 4vw, var(--e-16)); background: var(--fondo); }
    .hoja { width: 100%; max-width: 25rem; }

    /* Pantallas bajas: el teléfono no cabe sin tapar el titular */
    @media (max-height: 47em) { .escenario { display: none; } }

    @media (max-width: 63.99em) {
      .marco { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
      .heroe { grid-template-rows: auto auto; gap: var(--e-6); padding: var(--e-5) var(--margen) var(--e-8); }
      .copia { padding-top: var(--e-4); }
      h1 { font-size: clamp(2.2rem, 1.2rem + 5vw, 3.25rem); }
      .copia p { font-size: var(--texto-md); margin-top: var(--e-3); }
      .escenario, .pie { display: none; }
      .formulario { place-items: start center; padding: var(--e-8) var(--margen) var(--e-12); }
    }
  `,
})
export class AuthLayout {}
