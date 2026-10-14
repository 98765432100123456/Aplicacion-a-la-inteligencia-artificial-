import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Diálogo modal sobre <dialog> nativo: atrapa el foco, cierra con Escape y
 * devuelve el foco al elemento que lo abrió.
 */
@Component({
  selector: 'app-dialog',
  template: `
    <dialog #dlg [attr.aria-labelledby]="titleId" (close)="closed.emit()" (cancel)="closed.emit()" (click)="onBackdrop($event)">
      <div class="contenido" [class.ancho]="wide()">
        <header>
          <h2 [id]="titleId">{{ heading() }}</h2>
          <button type="button" class="cerrar" (click)="closed.emit()" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8"/></svg>
          </button>
        </header>
        <ng-content />
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      padding: 0; border: 0; border-radius: var(--radio-panel);
      box-shadow: var(--sombra-flotante); color: var(--tinta);
      width: min(34rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem);
    }
    dialog:has(.ancho) { width: min(44rem, calc(100vw - 2rem)); }
    dialog::backdrop { background: rgb(20 30 24 / 0.5); }
    dialog[open] { animation: entrar var(--dur-media) var(--curva); }
    @keyframes entrar { from { opacity: 0; transform: translateY(8px); } }
    .contenido { padding: var(--e-6); }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--e-4); margin-bottom: var(--e-5); }
    h2 { font-size: var(--texto-xl); padding-top: var(--e-1); }
    .cerrar {
      flex: none; display: grid; place-items: center; width: 2.75rem; height: 2.75rem; margin: calc(var(--e-2) * -1);
      border: 0; border-radius: var(--radio-control); background: transparent; color: var(--tinta-suave); cursor: pointer;
    }
    .cerrar:hover { background: var(--fondo); color: var(--tinta); }
    @media (max-width: 599px) {
      dialog { width: 100vw; max-width: 100vw; max-height: 100dvh; height: 100dvh; margin: 0; border-radius: 0; }
      dialog:has(.ancho) { width: 100vw; }
      .contenido { padding: var(--e-5) var(--e-4); }
    }
  `,
})
export class Dialog {
  private static seq = 0;
  readonly open = input(false);
  readonly heading = input.required<string>();
  readonly wide = input(false);
  readonly closed = output<void>();
  protected readonly titleId = `dlg-titulo-${++Dialog.seq}`;
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const el = this.dlg().nativeElement;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  protected onBackdrop(event: MouseEvent) {
    if (event.target === this.dlg().nativeElement) this.closed.emit();
  }
}
