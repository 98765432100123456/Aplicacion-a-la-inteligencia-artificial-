import { Component, input } from '@angular/core';

/** Encabezado de pantalla: titular grande de letras juntas, bajada y acciones. */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly description = input<string>();
}
