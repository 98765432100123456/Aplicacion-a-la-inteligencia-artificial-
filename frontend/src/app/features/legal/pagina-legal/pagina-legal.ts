import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Logo } from '../../../shared/components/logo/logo';
import { PieLegal } from '../../../shared/components/pie-legal/pie-legal';
import { SelectorTema } from '../../../shared/components/selector-tema/selector-tema';
import { ACTUALIZADO, DOCUMENTOS } from '../documentos';

/** Páginas públicas de privacidad, términos y cookies; se leen con o sin sesión. */
@Component({
  selector: 'app-pagina-legal',
  imports: [RouterLink, Logo, SelectorTema, PieLegal],
  templateUrl: './pagina-legal.html',
  styleUrl: './pagina-legal.scss',
})
export class PaginaLegal {
  protected readonly auth = inject(AuthService);
  private readonly clave = toSignal(inject(ActivatedRoute).data.pipe(map((d) => d['documento'] as keyof typeof DOCUMENTOS)), {
    requireSync: true,
  });
  protected readonly doc = computed(() => DOCUMENTOS[this.clave()]);
  protected readonly actualizado = ACTUALIZADO;

  constructor() {
    // Las rutas públicas no pasan por authGuard: se revisa si hay sesión para el enlace de regreso.
    void this.auth.restore();
  }
}
