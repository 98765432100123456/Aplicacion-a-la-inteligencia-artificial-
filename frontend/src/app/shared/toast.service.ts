import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'exito' | 'error';
}

/** Mensajes breves de confirmación; se anuncian a lectores de pantalla. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  success(text: string) {
    this.push(text, 'exito');
  }

  error(text: string) {
    this.push(text, 'error');
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(text: string, kind: Toast['kind']) {
    const id = ++this.seq;
    this.toasts.update((list) => [...list.slice(-2), { id, text, kind }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 8000 : 5000);
  }
}
