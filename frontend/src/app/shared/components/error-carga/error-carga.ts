import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Aviso de que algo no cargó, con la opción de intentarlo de nuevo sin recargar la página. */
@Component({
  selector: 'app-error-carga',
  templateUrl: './error-carga.html',
  styleUrl: './error-carga.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorCarga {
  readonly mensaje = input.required<string>();
  readonly reintentar = output<void>();
}
