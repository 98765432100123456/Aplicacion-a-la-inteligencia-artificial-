import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type NombreIlustracion =
  | 'pradera'
  | 'hambre'
  | 'salud'
  | 'confort'
  | 'comportamiento'
  | 'animal'
  | 'recursos'
  | 'gestion'
  | 'finca';

/**
 * Ilustraciones del campo dibujadas en SVG. Los colores salen de las variables --il-*
 * de styles/_tokens.scss, así que cambian con el modo claro y el oscuro.
 * Solo la pradera se anuncia a los lectores de pantalla; las demás acompañan un texto
 * que ya dice lo mismo y se ocultan.
 */
@Component({
  selector: 'app-ilustracion',
  templateUrl: './ilustracion.html',
  styleUrl: './ilustracion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ilustracion {
  readonly nombre = input.required<NombreIlustracion>();
}
