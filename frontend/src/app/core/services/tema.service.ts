import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const CLAVE = 'ica-tema';

/**
 * Modo claro u oscuro. Mientras la persona no elija, sigue la preferencia del sistema;
 * al elegir, se guarda en este navegador y se marca en data-tema del elemento html
 * (styles/_tokens.scss define los colores de cada modo).
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);
  private readonly sistemaOscuro = this.documento.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
  private readonly elegido = signal<Tema | null>(leer());
  readonly tema = signal<Tema>(this.calcular());

  constructor() {
    this.aplicar();
    this.sistemaOscuro?.addEventListener?.('change', () => this.tema.set(this.calcular()));
  }

  alternar() {
    this.elegido.set(this.tema() === 'oscuro' ? 'claro' : 'oscuro');
    try {
      localStorage.setItem(CLAVE, this.elegido()!);
    } catch {
      // Sin almacenamiento (navegación privada): el modo dura hasta recargar.
    }
    this.tema.set(this.calcular());
    this.aplicar();
  }

  private calcular(): Tema {
    return this.elegido() ?? (this.sistemaOscuro?.matches ? 'oscuro' : 'claro');
  }

  private aplicar() {
    const html = this.documento.documentElement;
    const elegido = this.elegido();
    if (elegido) html.dataset['tema'] = elegido;
    else delete html.dataset['tema'];
  }
}

function leer(): Tema | null {
  try {
    const valor = localStorage.getItem(CLAVE);
    return valor === 'claro' || valor === 'oscuro' ? valor : null;
  } catch {
    return null;
  }
}
