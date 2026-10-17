import { Component, computed, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { P } from '../core/models';
import { Logo } from '../shared/logo';

interface NavItem {
  path: string;
  label: string;
  permissions?: string[];
}

const NAV: NavItem[] = [
  { path: '/inicio', label: 'Inicio' },
  { path: '/usuarios', label: 'Usuarios', permissions: [P.USUARIOS_VER, P.USUARIOS_GESTIONAR] },
  { path: '/roles', label: 'Roles', permissions: [P.ROLES_VER] },
  { path: '/mi-cuenta', label: 'Cuenta' },
];

/** Estructura de la aplicación: barra superior translúcida y contenido centrado. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  template: `
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    <header class="barra">
      <div class="interior">
        <a class="marca" routerLink="/inicio" aria-label="ICA Bienestar, inicio"><app-logo /></a>

        <nav #nav id="navegacion" class="enlaces" [class.abierto]="menuOpen()" aria-label="Principal">
          <ul>
            @for (item of items(); track item.path) {
              <li>
                <a [routerLink]="item.path" routerLinkActive="activo" ariaCurrentWhenActive="page">{{ item.label }}</a>
              </li>
            }
          </ul>
          <div class="sesion-movil">
            <span class="avatar" aria-hidden="true">{{ initials() }}</span>
            <span class="quien"><b>{{ auth.fullName() }}</b><small>{{ auth.user()?.role?.name }}</small></span>
            <button type="button" class="btn btn-secundario btn-sm" (click)="auth.logout()">Cerrar sesión</button>
          </div>
        </nav>

        <div class="sesion">
          <span class="avatar" aria-hidden="true">{{ initials() }}</span>
          <span class="quien"><b>{{ auth.fullName() }}</b><small>{{ auth.user()?.role?.name }}</small></span>
          <button type="button" class="btn btn-secundario btn-sm" (click)="auth.logout()">Cerrar sesión</button>
        </div>

        <button
          #menuButton
          type="button"
          class="menu"
          (click)="menuOpen.set(!menuOpen())"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="navegacion"
        >
          <svg class="icono" viewBox="0 0 24 24" aria-hidden="true">
            <path [attr.d]="menuOpen() ? 'M6 6l12 12M18 6L6 18' : 'M4 8h16M4 16h16'" />
          </svg>
          <span class="visually-hidden">Menú</span>
        </button>
      </div>
    </header>

    @if (menuOpen()) {
      <div class="velo" (click)="menuOpen.set(false)" aria-hidden="true"></div>
    }

    <main id="contenido" tabindex="-1" [attr.inert]="menuOpen() || null">
      <router-outlet />
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .saltar {
      position: absolute; left: var(--e-3); top: -5rem; z-index: 70; padding: var(--e-3) var(--e-4);
      background: var(--tinta); color: var(--fondo); border-radius: var(--radio-control); text-decoration: none;
    }
    .saltar:focus { top: var(--e-3); }

    /* Barra translúcida: única capa funcional que flota sobre el contenido (HIG materials.md) */
    .barra {
      position: sticky; top: 0; z-index: 40;
      background: color-mix(in srgb, var(--fondo) 80%, transparent);
      -webkit-backdrop-filter: saturate(1.6) blur(20px); backdrop-filter: saturate(1.6) blur(20px);
      border-bottom: 1px solid color-mix(in srgb, var(--tinta) 8%, transparent);
    }
    @media (prefers-reduced-transparency: reduce) {
      .barra { background: var(--fondo); -webkit-backdrop-filter: none; backdrop-filter: none; }
    }
    .interior {
      display: flex; align-items: center; gap: var(--e-6); height: 4.25rem;
      width: min(75rem, 100% - 2 * var(--margen)); margin-inline: auto;
    }
    .marca { display: inline-flex; align-items: center; min-height: 2.75rem; text-decoration: none; }

    .enlaces { flex: 1; }
    ul { list-style: none; margin: 0; padding: 0; display: flex; gap: var(--e-1); }
    li a {
      display: inline-flex; align-items: center; min-height: 2.75rem; padding: 0 var(--e-4);
      border-radius: 999px; color: var(--tinta-suave); font-weight: 700; font-size: var(--texto-sm); text-decoration: none;
      transition: background-color var(--dur-rapida) ease, color var(--dur-rapida) ease;
    }
    li a.activo { color: var(--tinta); background: color-mix(in srgb, var(--tinta) 8%, transparent); }
    @media (hover: hover) and (pointer: fine) {
      li a:hover { color: var(--tinta); background: color-mix(in srgb, var(--tinta) 6%, transparent); }
    }

    .sesion { display: flex; align-items: center; gap: var(--e-3); }
    .quien { display: grid; line-height: 1.2; }
    .quien b { font-size: var(--texto-sm); }
    .quien small { font-size: var(--texto-xs); color: var(--tinta-suave); font-weight: 600; }
    .sesion-movil { display: none; }
    .avatar { width: 2.25rem; height: 2.25rem; font-size: var(--texto-xs); }

    .menu {
      display: none; place-items: center; width: 2.75rem; height: 2.75rem; margin-left: auto;
      border: 1px solid var(--linea-control); border-radius: 999px; background: var(--superficie); color: var(--tinta); cursor: pointer;
    }
    .icono { width: 1.375rem; height: 1.375rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
    .velo { display: none; }

    main { display: block; width: min(75rem, 100% - 2 * var(--margen)); margin-inline: auto; padding: var(--e-12) 0 var(--e-24); }
    main:focus { outline: none; }

    @media (max-width: 63.99em) {
      .quien small { display: none; }
    }

    @media (max-width: 51.99em) {
      .interior { height: 3.75rem; }
      .sesion { display: none; }
      .menu { display: grid; }
      /* Menú desplegable bajo la barra: entra desde arriba con la curva de iOS */
      .enlaces {
        position: fixed; left: 0; right: 0; top: 3.75rem; z-index: 45; flex: none;
        padding: var(--e-3) var(--margen) var(--e-6); background: var(--superficie-elevada);
        border-bottom: 1px solid var(--linea); box-shadow: var(--sombra-flotante);
        opacity: 0; visibility: hidden; transform: translateY(-8px);
        transition: opacity var(--dur-media) var(--curva-cajon), transform var(--dur-media) var(--curva-cajon), visibility 0s linear var(--dur-media);
      }
      .enlaces.abierto { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
      ul { flex-direction: column; gap: 0; }
      li a { display: flex; min-height: 3.25rem; padding: 0 var(--e-2); border-radius: var(--radio-control); font-size: var(--texto-md); }
      li + li a { border-top: 1px solid var(--linea); border-radius: 0; }
      li a.activo { background: transparent; color: var(--acento); }
      .sesion-movil {
        display: grid; grid-template-columns: auto 1fr; align-items: center; gap: var(--e-3);
        margin-top: var(--e-3); padding-top: var(--e-4); border-top: 1px solid var(--linea-fuerte);
      }
      .sesion-movil .quien small { display: block; }
      .sesion-movil .btn { grid-column: 1 / -1; }
      .velo { display: block; position: fixed; inset: 3.75rem 0 0; z-index: 35; background: var(--velo); }
      main { padding-top: var(--e-8); }
    }
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private wasOpen = false;

  protected readonly items = computed(() => {
    this.auth.user();
    return NAV.filter((i) => !i.permissions || this.auth.can(...i.permissions));
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
