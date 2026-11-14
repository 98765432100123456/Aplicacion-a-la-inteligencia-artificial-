import { Component, input } from '@angular/core';

/** Estado de la mascota: en reposo parpadea, al pensar mira hacia arriba y al hablar mueve la boca. */
export type EstadoMascota = 'reposo' | 'pensando' | 'hablando';

/** Clara, la vaca asistente: ilustración SVG propia, animada solo con CSS. */
@Component({
  selector: 'app-mascota',
  templateUrl: './mascota.html',
  styleUrl: './mascota.scss',
  host: { '[attr.data-estado]': 'estado()', 'aria-hidden': 'true' },
})
export class Mascota {
  readonly estado = input<EstadoMascota>('reposo');
}
