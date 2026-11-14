import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const CLAVE = 'ica-cookies';

/**
 * Aviso de cookies. El sitio solo usa almacenamiento esencial (sesión, modo claro u oscuro),
 * así que no hay nada que aceptar o rechazar: el aviso informa y se oculta al leerlo.
 */
@Component({
  selector: 'app-aviso-cookies',
  imports: [RouterLink],
  templateUrl: './aviso-cookies.html',
  styleUrl: './aviso-cookies.scss',
})
export class AvisoCookies {
  protected readonly visible = signal(!leido());

  protected entendido() {
    this.visible.set(false);
    try {
      localStorage.setItem(CLAVE, new Date().toISOString());
    } catch {
      // Sin almacenamiento el aviso vuelve a salir en la próxima visita.
    }
  }
}

function leido(): boolean {
  try {
    return !!localStorage.getItem(CLAVE);
  } catch {
    return false;
  }
}
