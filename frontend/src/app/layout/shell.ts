import { Component, computed, inject, signal } from '@angular/core';
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
  { path: '/mi-cuenta', label: 'Mi cuenta' },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    <header class="barra">
      <button
        type="button"
        class="menu"
        (click)="menuOpen.set(!menuOpen())"
        [attr.aria-expanded]="menuOpen()"
        aria-controls="navegacion"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="1.8" />
        </svg>
        <span class="visually-hidden">Menú</span>
      </button>
      <a class="marca" routerLink="/inicio">
        <svg width="24" height="24" viewBox="0 0 28 28" aria-hidden="true">
          <rect x="1" y="1" width="26" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M7 14.5l4.5 4.5L21 9" fill="none" stroke="currentColor" stroke-width="2.4" />
        </svg>
        ICA Bienestar Animal
      </a>
    </header>

    <div class="cuerpo">
      <nav id="navegacion" class="lateral" [class.abierto]="menuOpen()" aria-label="Principal">
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
      <main id="contenido" tabindex="-1">
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
    .marca {
      display: flex; align-items: center; gap: var(--e-2); color: var(--potrero-900);
      font-weight: 700; text-decoration: none;
    }
    .cuerpo { display: grid; grid-template-columns: 15.5rem 1fr; min-height: 100dvh; }
    .lateral {
      position: sticky; top: 0; height: 100dvh; display: flex; flex-direction: column;
      padding: var(--e-6) var(--e-4); background: var(--superficie); border-right: 1px solid var(--linea);
    }
    .lateral::before {
      content: 'ICA Bienestar Animal'; display: block; padding: 0 var(--e-3) var(--e-6);
      font-weight: 700; color: var(--potrero-900);
    }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--e-1); }
    li a {
      display: flex; align-items: center; min-height: var(--alto-control); padding: 0 var(--e-3);
      border-radius: var(--radio-control); color: var(--tinta-suave); font-weight: 500; text-decoration: none;
    }
    li a:hover { background: var(--fondo); color: var(--tinta); }
    li a.activo { background: var(--potrero-100); color: var(--potrero-900); font-weight: 700; box-shadow: inset 3px 0 0 var(--potrero-700); }
    .sesion { margin-top: auto; padding: var(--e-4) var(--e-3) 0; border-top: 1px solid var(--linea); }
    .nombre { font-weight: 600; font-size: var(--texto-sm); overflow-wrap: anywhere; }
    .rol { font-size: var(--texto-sm); color: var(--tinta-tenue); margin-bottom: var(--e-3); }
    main { min-width: 0; padding: var(--e-8) clamp(var(--e-4), 4vw, var(--e-12)) var(--e-16); }
    main:focus { outline: none; }
    .velo { display: none; }

    @media (max-width: 1023px) {
      .barra {
        position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: var(--e-2);
        height: 3.5rem; padding: 0 var(--e-2); background: var(--superficie); border-bottom: 1px solid var(--linea);
      }
      .menu {
        display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border: 0;
        border-radius: var(--radio-control); background: transparent; color: var(--tinta); cursor: pointer;
      }
      .menu:hover { background: var(--fondo); }
      .cuerpo { grid-template-columns: 1fr; min-height: calc(100dvh - 3.5rem); }
      .lateral {
        position: fixed; z-index: 40; top: 3.5rem; left: 0; bottom: 0; height: auto; width: min(18rem, 85vw);
        transform: translateX(-100%); visibility: hidden;
        transition: transform var(--dur-media) var(--curva), visibility var(--dur-media);
      }
      .lateral::before { display: none; }
      .lateral.abierto { transform: none; visibility: visible; box-shadow: var(--sombra-flotante); }
      .velo { display: block; position: fixed; inset: 3.5rem 0 0; z-index: 35; background: rgb(20 30 24 / 0.4); }
      main { padding-top: var(--e-6); }
    }
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);
  protected readonly items = computed(() => {
    this.auth.user();
    return NAV.filter((i) => !i.permissions || this.auth.can(...i.permissions));
  });

  constructor() {
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));
  }
}
