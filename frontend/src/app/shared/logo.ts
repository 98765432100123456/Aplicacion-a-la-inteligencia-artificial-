import { Component, input } from '@angular/core';

/** Logotipo: sello con la marca de verificación y el nombre en Unbounded. */
@Component({
  selector: 'app-logo',
  template: `
    <span class="logo" [class.claro]="claro()" translate="no">
      <svg class="sello" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" />
        <path d="M9 16.5l4.6 4.6L23 11.4" />
      </svg>
      <span>ICA Bienestar</span>
    </span>
  `,
  styles: `
    .logo { display: inline-flex; align-items: center; gap: 0.625rem; font-family: var(--fuente-logo); font-weight: 700; font-size: 1rem; letter-spacing: -0.02em; color: var(--tinta); white-space: nowrap; }
    .logo.claro { color: #fff; }
    .sello { width: 1.75rem; height: 1.75rem; flex: none; }
    .sello rect { fill: var(--accion); }
    .sello path { fill: none; stroke: var(--sobre-accion); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  `,
})
export class Logo {
  readonly claro = input(false);
}
