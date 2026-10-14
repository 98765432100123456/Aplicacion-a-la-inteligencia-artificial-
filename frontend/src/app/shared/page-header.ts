import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="texto">
      <h1>{{ heading() }}</h1>
      @if (description()) {
        <p>{{ description() }}</p>
      }
    </div>
    <div class="acciones"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between;
      gap: var(--e-4) var(--e-6); margin-bottom: var(--e-6);
    }
    h1 { font-size: var(--texto-2xl); }
    p { margin-top: var(--e-1); color: var(--tinta-suave); max-width: 40rem; }
    .acciones { display: flex; gap: var(--e-3); flex-wrap: wrap; }
    .acciones:empty { display: none; }
    @media (max-width: 37.49em) { .acciones, .acciones ::ng-deep .btn { width: 100%; } }
  `,
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly description = input<string>();
}
