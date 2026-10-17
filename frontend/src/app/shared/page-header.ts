import { Component, input } from '@angular/core';

/** Encabezado de pantalla: titular grande de letras juntas, bajada y acciones. */
@Component({
  selector: 'app-page-header',
  template: `
    <div class="texto">
      <h1 class="titular">{{ heading() }}</h1>
      @if (description()) {
        <p class="bajada">{{ description() }}</p>
      }
    </div>
    <div class="acciones"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between;
      gap: var(--e-5) var(--e-8); margin-bottom: var(--e-10);
    }
    .acciones { display: flex; gap: var(--e-3); flex-wrap: wrap; }
    .acciones:empty { display: none; }
    @media (max-width: 37.49em) {
      :host { margin-bottom: var(--e-8); }
      .acciones, .acciones ::ng-deep .btn { width: 100%; }
    }
  `,
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly description = input<string>();
}
