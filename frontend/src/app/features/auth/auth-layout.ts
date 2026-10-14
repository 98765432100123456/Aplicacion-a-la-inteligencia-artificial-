import { Component } from '@angular/core';

/** Marco común de ingreso y recuperación: contexto a la izquierda, formulario a la derecha. */
@Component({
  selector: 'app-auth-layout',
  template: `
    <div class="marco">
      <aside class="contexto">
        <p class="marca">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <rect x="1" y="1" width="26" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="M7 14.5l4.5 4.5L21 9" fill="none" stroke="currentColor" stroke-width="2.4" />
          </svg>
          <span>ICA Bienestar Animal</span>
        </p>
        <div class="presentacion">
          <h1>Evaluación de bienestar animal en fincas</h1>
          <p>
            Listas de chequeo por especie, puntaje automático, diagnóstico y plan de mejora para cada
            visita.
          </p>
          <dl class="ficha">
            <div>
              <dt>Administrador</dt>
              <dd>Gestiona usuarios, roles, catálogos y la parametrización de especies.</dd>
            </div>
            <div>
              <dt>Evaluador</dt>
              <dd>Registra fincas y diligencia las evaluaciones en campo.</dd>
            </div>
            <div>
              <dt>Consultor externo</dt>
              <dd>Consulta resultados, historial y reportes.</dd>
            </div>
          </dl>
        </div>
        <p class="pie">Proyecto académico de la asignatura Aplicación a la Inteligencia Artificial.</p>
      </aside>
      <main class="formulario" id="contenido">
        <div class="hoja">
          <ng-content />
        </div>
      </main>
    </div>
  `,
  styles: `
    .marco { min-height: 100dvh; display: grid; grid-template-columns: minmax(22rem, 5fr) 7fr; }
    .contexto {
      display: flex; flex-direction: column; justify-content: space-between; gap: var(--e-10);
      padding: var(--e-10) clamp(var(--e-8), 4vw, var(--e-16));
      background: var(--potrero-900); color: #e8efe9;
    }
    .marca { display: flex; align-items: center; gap: var(--e-3); font-weight: 700; color: #fff; }
    .presentacion { max-width: 30rem; }
    h1 { font-size: var(--texto-3xl); color: #fff; margin-bottom: var(--e-4); }
    .presentacion > p { color: #c9d8cd; font-size: var(--texto-lg); margin-bottom: var(--e-10); }
    .ficha { margin: 0; border-top: 1px solid rgb(255 255 255 / 0.22); }
    .ficha div {
      display: grid; grid-template-columns: 9.5rem 1fr; gap: var(--e-4);
      padding: var(--e-3) 0; border-bottom: 1px solid rgb(255 255 255 / 0.22);
    }
    dt { font-weight: 700; color: #fff; font-size: var(--texto-sm); }
    dd { margin: 0; color: #c9d8cd; font-size: var(--texto-sm); }
    .pie { font-size: var(--texto-sm); color: #a9bfae; }
    .formulario { display: grid; place-items: center; padding: var(--e-10) var(--e-6); background: var(--superficie); }
    .hoja { width: 100%; max-width: 24rem; }

    @media (max-width: 899px) {
      .marco { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
      .contexto { padding: var(--e-4); gap: 0; }
      .presentacion, .pie { display: none; }
      .formulario { place-items: start center; padding: var(--e-8) var(--e-4) var(--e-12); }
    }
  `,
})
export class AuthLayout {}
