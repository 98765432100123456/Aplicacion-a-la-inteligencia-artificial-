import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="pila" role="status" aria-live="polite" (mouseenter)="toasts.pause()" (mouseleave)="toasts.resume()" (focusin)="toasts.pause()" (focusout)="toasts.resume()">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class.error]="t.kind === 'error'">
          <span>{{ t.text }}</span>
          <button type="button" (click)="toasts.dismiss(t.id)" aria-label="Cerrar mensaje">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .pila {
      position: fixed; z-index: 50; left: 50%; bottom: var(--e-6); transform: translateX(-50%);
      display: grid; gap: var(--e-2); width: min(28rem, calc(100vw - 2rem));
    }
    .toast {
      display: flex; align-items: center; justify-content: space-between; gap: var(--e-3);
      padding: var(--e-2) var(--e-2) var(--e-2) var(--e-4); border-radius: var(--radio-control);
      background: var(--toast-fondo); color: var(--toast-texto); box-shadow: var(--sombra-flotante);
      font-size: var(--texto-sm); font-weight: 500; animation: subir 240ms var(--curva);
    }
    .toast.error { background: var(--peligro); color: #ffffff; }
    button {
      flex: none; width: 2.75rem; height: 2.75rem; border: 0; border-radius: var(--radio-control);
      background: transparent; color: inherit; font-size: 1.4rem; cursor: pointer;
    }
    button:hover { background: color-mix(in srgb, currentColor 12%, transparent); }
    @keyframes subir { from { opacity: 0; transform: translateY(8px); } }
  `,
})
export class Toasts {
  protected readonly toasts = inject(ToastService);
}
