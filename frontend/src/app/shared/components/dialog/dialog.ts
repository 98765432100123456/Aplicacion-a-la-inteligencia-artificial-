import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Diálogo modal sobre <dialog> nativo: atrapa el foco, cierra con Escape y
 * devuelve el foco al elemento que lo abrió. El padre decide si se cierra
 * (por ejemplo, para confirmar antes de perder cambios).
 */
@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
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
