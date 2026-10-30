import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TemaService } from '../../../core/services/tema.service';

/** Botón para pasar entre el modo claro y el oscuro. */
@Component({
  selector: 'app-selector-tema',
  templateUrl: './selector-tema.html',
  styleUrl: './selector-tema.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorTema {
  protected readonly tema = inject(TemaService);
}
