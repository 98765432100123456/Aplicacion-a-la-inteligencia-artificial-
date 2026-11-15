import { Component, inject } from '@angular/core';
import { ActualizacionService } from '../../../core/services/actualizacion.service';

/** Franja que avisa que hay una versión nueva publicada y la carga con un toque. */
@Component({
  selector: 'app-aviso-actualizacion',
  templateUrl: './aviso-actualizacion.html',
  styleUrl: './aviso-actualizacion.scss',
})
export class AvisoActualizacion {
  protected readonly actualizacion = inject(ActualizacionService);

  constructor() {
    this.actualizacion.iniciar();
  }
}
