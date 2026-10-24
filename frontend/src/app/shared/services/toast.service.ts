import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'exito' | 'error';
}

const SUCCESS_MS = 6000;

/**
 * Mensajes breves de confirmación; se anuncian a lectores de pantalla.
 * Los errores no desaparecen solos y los de éxito se detienen mientras el
 * puntero o el foco están encima o la pestaña está oculta
 * (accessibility.md › Cognitive: minimizar elementos con tiempo límite).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private paused = false;
  readonly toasts = signal<Toast[]>([]);

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => (document.hidden ? this.pause() : this.resume()));
    }
  }

  success(text: string) {
    this.push(text, 'exito');
  }

  error(text: string) {
    this.push(text, 'error');
  }

  dismiss(id: number) {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  pause() {
    this.paused = true;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
  }

  resume() {
    this.paused = false;
    for (const t of this.toasts()) {
      if (t.kind === 'exito') this.schedule(t.id, SUCCESS_MS / 2);
    }
  }

  private push(text: string, kind: Toast['kind']) {
    const id = ++this.seq;
    const list = this.toasts();
    if (list.length >= 3) this.dismiss(list[0].id);
    this.toasts.update((l) => [...l, { id, text, kind }]);
    if (kind === 'exito' && !this.paused) this.schedule(id, SUCCESS_MS);
  }

  private schedule(id: number, ms: number) {
    clearTimeout(this.timers.get(id));
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), ms),
    );
  }
}
