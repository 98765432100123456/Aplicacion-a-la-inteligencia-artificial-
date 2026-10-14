import { Component, computed, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { P } from '../core/models';

interface NavItem {
  path: string;
  label: string;
  permissions?: string[];
}

const NAV: NavItem[] = [
  { path: '/inicio', label: 'Inicio' },
  { path: '/usuarios', label: 'Usuarios', permissions: [P.USUARIOS_VER, P.USUARIOS_GESTIONAR] },
  { path: '/roles', label: 'Roles y permisos', permissions: [P.ROLES_VER] },
  { path: '/mi-cuenta', label: 'Cuenta' },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    <header class="barra">
      <button
        #menuButton
        type="button"
        class="menu"
        (click)="menuOpen.set(!menuOpen())"
        [attr.aria-expanded]="menuOpen()"
        aria-controls="navegacion"
      >
        <svg class="icono" viewBox="0 0 22 22" aria-hidden="true">
          <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="1.8" />
        </svg>
        <span class="visually-hidden">Menú</span>
      </button>
      <a class="marca" routerLink="/inicio" translate="no">
        <svg class="icono" viewBox="0 0 28 28" aria-hidden="true">
          <rect x="1" y="1" width="26" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M7 14.5l4.5 4.5L21 9" fill="none" stroke="currentColor" stroke-width="2.4" />
        </svg>
        ICA Bienestar Animal
      </a>
    </header>

    <div class="cuerpo">
      <nav #nav id="navegacion" class="lateral" [class.abierto]="menuOpen()" aria-label="Principal">
        <ul>
          @for (item of items(); track item.path) {
            <li>
              <a [routerLink]="item.path" routerLinkActive="activo" ariaCurrentWhenActive="page">{{ item.label }}</a>
            </li>
          }
        </ul>
        <div class="sesion">
          <p class="nombre">{{ auth.fullName() }}</p>
          <p class="rol">{{ auth.user()?.role?.name }}</p>
          <button type="button" class="btn btn-secundario btn-bloque" (click)="auth.logout()">Cerrar sesión</button>
        </div>
      </nav>
      @if (menuOpen()) {
        <div class="velo" (click)="menuOpen.set(false)" aria-hidden="true"></div>
      }
      <main id="contenido" tabindex="-1" [attr.inert]="menuOpen() || null">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .saltar {
      position: absolute; left: var(--e-2); top: -4rem; z-index: 60; padding: var(--e-2) var(--e-4);
      background: var(--superficie); border-radius: var(--radio-control);
    }
    .saltar:focus { top: var(--e-2); }
    .barra { display: none; }
    /* Los íconos crecen con el tamaño de texto (typography.md › Supporting Dynamic Type). */
    .icono { width: 1.5rem; height: 1.5rem; flex: none; }
    .marca {
      display: flex; align-items: center; gap: var(--e-2); color: var(--acento-fuerte);
      font-weight: 700; text-decoration: none;
    }
    .cuerpo { display: grid; grid-template-columns: 15.5rem 1fr; min-height: 100dvh; }
    .lateral {
      position: sticky; top: 0; height: 100dvh; display: flex; flex-direction: column;
      padding: var(--e-6) var(--e-4); background: var(--superficie); border-right: 1px solid var(--linea);
    }
    .lateral::before {
      content: 'ICA Bienestar Animal'; display: block; padding: 0 var(--e-3) var(--e-6);
      font-weight: 700; color: var(--acento-fuerte);
    }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--e-1); }
    li a {
      display: flex; align-items: center; min-height: var(--alto-control); padding: 0 var(--e-3);
      border-radius: var(--radio-control); color: var(--tinta-suave); font-weight: 500; text-decoration: none;
    }
    li a.activo { background: var(--acento-suave); color: var(--acento-fuerte); font-weight: 700; box-shadow: inset 3px 0 0 var(--acento); }
    .sesion { margin-top: auto; padding: var(--e-4) var(--e-3) 0; border-top: 1px solid var(--linea); }
    .nombre { font-weight: 600; font-size: var(--texto-sm); overflow-wrap: anywhere; }
    .rol { font-size: var(--texto-sm); color: var(--tinta-tenue); margin-bottom: var(--e-3); }
    main { min-width: 0; padding: var(--e-8) clamp(var(--e-4), 4vw, var(--e-12)) var(--e-16); }
    main:focus { outline: none; }
    .velo { display: none; }

    @media (max-width: 63.99em) {
      .barra {
        position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: var(--e-2);
        height: 3.5rem; padding: 0 var(--e-2); border-bottom: 1px solid var(--linea);
        /* Capa funcional flotante: translúcida sobre el contenido (materials.md, liquid-glass.md) */
        background: color-mix(in srgb, var(--superficie) 82%, transparent);
        -webkit-backdrop-filter: saturate(180%) blur(16px);
        backdrop-filter: saturate(180%) blur(16px);
      }
      .menu {
        display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border: 0;
        border-radius: var(--radio-control); background: transparent; color: var(--tinta); cursor: pointer;
      }
      .menu:hover { background: var(--fondo); }
      .cuerpo { grid-template-columns: 1fr; min-height: calc(100dvh - 3.5rem); }
      .lateral {
        position: fixed; z-index: 40; top: 3.5rem; left: 0; bottom: 0; height: auto; width: min(18rem, 85vw);
        transform: translateX(-100%); visibility: hidden; background: var(--superficie-elevada); overflow-y: auto; overscroll-behavior: contain;
        transition: transform 300ms var(--curva-cajon), visibility 300ms;
      }
      .lateral::before { display: none; }
      .lateral.abierto { transform: none; visibility: visible; box-shadow: var(--sombra-flotante); }
      .velo { display: block; position: fixed; inset: 3.5rem 0 0; z-index: 35; background: var(--velo); }
      main { padding-top: var(--e-6); }
    }
    @media (max-width: 63.99em) and (prefers-reduced-transparency: reduce) {
      .barra { background: var(--superficie); -webkit-backdrop-filter: none; backdrop-filter: none; }
    }
    @media (hover: hover) and (pointer: fine) {
      li a:hover { background: var(--fondo); color: var(--tinta); }
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

  constructor() {
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));

    // Teclado: al abrir el cajón el foco entra en él; al cerrarlo vuelve al botón de menú.
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
