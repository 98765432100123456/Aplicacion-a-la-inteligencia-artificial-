import { Component, input } from '@angular/core';

/** Logotipo: sello con la marca de verificación y el nombre en Unbounded. */
@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {
  readonly claro = input(false);
}
