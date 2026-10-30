import { Component, computed, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { P } from '../../core/models/models';
import { Logo } from '../../shared/components/logo/logo';
import { SelectorTema } from '../../shared/components/selector-tema/selector-tema';
import { SinConexion } from '../../shared/components/sin-conexion/sin-conexion';

interface NavItem {
  path: string;
  label: string;
  permissions?: string[];
}

const NAV: NavItem[] = [
  { path: '/inicio', label: 'Inicio' },
  { path: '/predios', label: 'Predios', permissions: [P.FINCAS_VER, P.FINCAS_GESTIONAR, P.PREDIOS_PROPIOS] },
  { path: '/usuarios', label: 'Usuarios', permissions: [P.USUARIOS_VER, P.USUARIOS_GESTIONAR] },
  { path: '/roles', label: 'Roles', permissions: [P.ROLES_VER] },
  { path: '/sistema-de-diseno', label: 'Diseño', permissions: [P.ROLES_VER] },
  { path: '/mi-cuenta', label: 'Cuenta' },
];

/** Estructura de la aplicación: barra superior translúcida y contenido centrado. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, SelectorTema, SinConexion],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private wasOpen = false;

  protected readonly items = computed(() => {
    this.auth.user();
    const soloPropios = !this.auth.can(P.FINCAS_VER, P.FINCAS_GESTIONAR);
    return NAV.filter((i) => !i.permissions || this.auth.can(...i.permissions)).map((i) =>
      i.path === '/predios' && soloPropios ? { ...i, label: 'Mis predios' } : i,
    );
  });

  protected readonly initials = computed(() => {
    const u = this.auth.user();
    return u ? `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase() : '';
  });

  constructor() {
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));

    // Teclado: al abrir el menú el foco entra en él; al cerrarlo vuelve al botón.
    effect(() => {
      const open = this.menuOpen();
      if (open) {
        setTimeout(() => this.nav().nativeElement.querySelector<HTMLElement>('a')?.focus(), 50);
      } else if (this.wasOpen && this.nav().nativeElement.contains(document.activeElement)) {
        this.menuButton().nativeElement.focus();
      }
      this.wasOpen = open;
    });
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape() {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      this.menuButton().nativeElement.focus();
    }
  }
}
