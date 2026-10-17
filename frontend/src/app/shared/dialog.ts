import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Diálogo modal sobre <dialog> nativo: atrapa el foco, cierra con Escape y
 * devuelve el foco al elemento que lo abrió. El padre decide si se cierra
 * (por ejemplo, para confirmar antes de perder cambios).
 */
@Component({
  selector: 'app-dialog',
  template: `
    <dialog #dlg [attr.aria-labelledby]="titleId" (cancel)="$event.preventDefault(); closed.emit()" (click)="onBackdrop($event)">
      <div class="contenido" [class.ancho]="wide()">
        <div class="agarre" aria-hidden="true"></div>
        <header>
          <h2 [id]="titleId">{{ heading() }}</h2>
          <button type="button" class="cerrar" (click)="closed.emit()" aria-label="Cerrar">
            <svg width="20" height="20" style="width:1.25rem;height:1.25rem" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8"/></svg>
          </button>
        </header>
        <ng-content />
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      padding: 0; border: 0; border-radius: 22px; color: var(--tinta); background: var(--superficie-elevada);
      box-shadow: var(--sombra-flotante);
      width: min(34rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem); overscroll-behavior: contain;
    }
    dialog:has(.ancho) { width: min(44rem, calc(100vw - 2rem)); }
    dialog::backdrop { background: var(--velo); }
    /* Modal centrado: entra desde una escala apenas menor, nunca desde cero */
    dialog[open] { animation: aparecer 220ms var(--curva); }
    dialog[open]::backdrop { animation: velo 220ms ease; }
    @keyframes aparecer { from { opacity: 0; transform: scale(0.96); } }
    @keyframes velo { from { opacity: 0; } }
    .contenido { padding: var(--e-8); }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--e-4); margin-bottom: var(--e-6); }
    h2 { font-size: var(--texto-xl); letter-spacing: -0.04em; padding-top: var(--e-1); }
    .cerrar {
      flex: none; display: grid; place-items: center; width: 2.75rem; height: 2.75rem; margin: calc(var(--e-2) * -1);
      border: 0; border-radius: 50%; background: color-mix(in srgb, var(--tinta) 7%, transparent); color: var(--tinta); cursor: pointer;
      transition: background-color var(--dur-rapida) ease, transform var(--dur-presion) var(--curva);
    }
    .cerrar:hover { background: color-mix(in srgb, var(--tinta) 12%, transparent); }
    .cerrar:active { transform: scale(0.94); }
    .agarre { display: none; }

    /* Celular: hoja que sube desde abajo con la curva de iOS (HIG sheets.md) */
    @media (max-width: 37.49em) {
      dialog, dialog:has(.ancho) {
        width: 100vw; max-width: 100vw; max-height: 92dvh; margin: auto 0 0; border-radius: 22px 22px 0 0;
      }
      dialog[open] { animation: subir 380ms var(--curva-cajon); }
      @keyframes subir { from { transform: translateY(100%); } }
      .contenido { padding: var(--e-3) var(--margen) calc(var(--e-8) + env(safe-area-inset-bottom)); }
      .agarre { display: block; width: 2.25rem; height: 0.3125rem; margin: 0 auto var(--e-4); border-radius: 999px; background: var(--linea-control); }
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
