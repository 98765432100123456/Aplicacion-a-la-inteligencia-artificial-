import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { resetDemoData } from './core/demo-api.interceptor';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts],
  template: `
    @if (demo) {
      <div class="demo" role="note">
        <span><strong>Modo demostración.</strong> Datos de prueba guardados solo en este navegador; no se envían correos.</span>
        <button type="button" (click)="reset()">Restablecer datos</button>
      </div>
    }
    <router-outlet /><app-toasts />
  `,
  styles: `
    .demo {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--e-1) var(--e-3);
      padding: var(--e-1) var(--e-4); background: var(--maiz-fondo); color: var(--maiz-texto);
      font-size: var(--texto-sm); text-align: center; border-bottom: 1px solid var(--linea);
    }
    button {
      min-height: 2.75rem; padding: 0 var(--e-2); border: 0; background: transparent; color: inherit;
      font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer;
    }
  `,
})
export class App {
  protected readonly demo = environment.demo;

  protected reset() {
    resetDemoData();
    sessionStorage.clear();
    location.href = '/ingresar';
  }
}
