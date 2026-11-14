import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pie con los enlaces legales del sitio; aparece en el ingreso, en las páginas legales y en la aplicación. */
@Component({
  selector: 'app-pie-legal',
  imports: [RouterLink],
  templateUrl: './pie-legal.html',
  styleUrl: './pie-legal.scss',
})
export class PieLegal {
  protected readonly anio = new Date().getFullYear();
}
