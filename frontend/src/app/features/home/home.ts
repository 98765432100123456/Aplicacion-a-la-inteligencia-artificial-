import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { P } from '../../core/models';

interface Resumen {
  activos: number;
  inactivos: number;
  roles: number | null;
}

/** Hoja de ruta real del proyecto (docs/PLAN-DE-TRABAJO.md). */
const RUTA = [
  { modulo: 'Seguridad y acceso', detalle: 'Ingreso, recuperación de contraseña, usuarios y roles', cuando: 'Disponible', listo: true },
  { modulo: 'Fincas y catálogos', detalle: 'Ubicación, especies e inventario por grupo etario', cuando: 'Segundo sprint', listo: false },
  { modulo: 'Parametrización por especie', detalle: 'Criterios, indicadores, preguntas y ponderaciones', cuando: 'Tercer sprint', listo: false },
  { modulo: 'Evaluación en campo', detalle: 'Diligenciamiento por secciones, evidencias y guardado parcial', cuando: 'Cuarto sprint', listo: false },
  { modulo: 'Diagnóstico con IA', detalle: 'Puntaje, nivel de bienestar y recomendaciones editables', cuando: 'Quinto sprint', listo: false },
  { modulo: 'Reportes y certificación', detalle: 'Historial, comparación, PDF, Excel y certificado', cuando: 'Sexto sprint', listo: false },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="saludo entrada">
      <h1 class="titular">Hola, {{ auth.user()?.firstName }}.</h1>
      <p class="bajada">Ingresó como {{ auth.user()?.role?.name }}. Esto es lo que hay hoy en la plataforma.</p>
    </section>

    @if (noPermission) {
      <p class="aviso aviso-advertencia" role="status">Su rol no tiene acceso a la página que intentó abrir.</p>
    }

    @if (canManageUsers) {
      <section class="libro entrada" aria-labelledby="resumen-titulo">
        <h2 id="resumen-titulo" class="visually-hidden">Resumen de seguridad</h2>
        @if (resumen(); as r) {
          <a class="dato" routerLink="/usuarios" [queryParams]="{ estado: 'true' }">
            <span class="valor cifras">{{ r.activos }}</span>
            <span class="rotulo">Usuarios activos</span>
          </a>
          <a class="dato" routerLink="/usuarios" [queryParams]="{ estado: 'false' }">
            <span class="valor cifras">{{ r.inactivos }}</span>
            <span class="rotulo">Usuarios inactivos</span>
          </a>
          @if (r.roles !== null) {
            <a class="dato" [routerLink]="canSeeRoles ? '/roles' : null">
              <span class="valor cifras">{{ r.roles }}</span>
              <span class="rotulo">Roles configurados</span>
            </a>
          }
        } @else {
          <p class="cargando" role="status">Cargando resumen…</p>
        }
      </section>
    }

    <section class="ruta" aria-labelledby="ruta-titulo">
      <div class="ruta-texto">
        <h2 id="ruta-titulo">Lo que viene.</h2>
        <p>La plataforma crece por módulos. Este sprint entrega la seguridad; los siguientes llevan la evaluación al campo.</p>
      </div>
      <ol class="ruta-lista">
        @for (m of ruta; track m.modulo; let i = $index) {
          <li [style.--i]="i">
            <div>
              <b>{{ m.modulo }}</b>
              <span>{{ m.detalle }}</span>
            </div>
            <span class="estado" [class.estado-activo]="m.listo" [class.estado-inactivo]="!m.listo">{{ m.cuando }}</span>
          </li>
        }
      </ol>
    </section>
  `,
  styles: `
    .saludo { margin-bottom: var(--e-10); }
    .aviso { margin-bottom: var(--e-8); }

    /* Libro de cuentas: cifras grandes separadas por líneas verticales */
    .libro {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
      border-top: 1px solid var(--linea-fuerte); border-bottom: 1px solid var(--linea); margin-bottom: var(--e-16);
      animation-delay: 60ms;
    }
    .dato {
      display: grid; gap: var(--e-2); padding: var(--e-6) var(--e-6) var(--e-6) 0;
      color: var(--tinta); text-decoration: none; font-weight: 400;
    }
    .dato + .dato { padding-left: var(--e-6); border-left: 1px solid var(--linea); }
    .valor { font-size: var(--texto-3xl); font-weight: 700; line-height: 1; letter-spacing: -0.05em; }
    .rotulo { color: var(--tinta-suave); font-size: var(--texto-sm); font-weight: 700; }
    @media (hover: hover) and (pointer: fine) {
      .dato:hover .rotulo { color: var(--acento); text-decoration: underline; text-underline-offset: 3px; }
    }
    .cargando { padding: var(--e-6) 0; color: var(--tinta-suave); }

    .ruta { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 7fr); gap: var(--e-10); align-items: start; }
    .ruta h2 { font-size: var(--texto-2xl); letter-spacing: -0.045em; }
    .ruta-texto p { margin-top: var(--e-3); color: var(--tinta-suave); max-width: 24rem; }
    .ruta-lista { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--linea-fuerte); }
    .ruta-lista li {
      display: flex; align-items: center; justify-content: space-between; gap: var(--e-4);
      padding: var(--e-4) 0; border-bottom: 1px solid var(--linea);
    }
    .ruta-lista div { display: grid; gap: 0.125rem; }
    .ruta-lista b { font-size: var(--texto-md); letter-spacing: -0.01em; }
    .ruta-lista div span { font-size: var(--texto-sm); color: var(--tinta-suave); }
    @media (prefers-reduced-motion: no-preference) {
      .ruta-lista li { animation: entrar 360ms var(--curva) both; animation-delay: calc(120ms + var(--i) * 45ms); }
    }

    @media (max-width: 47.49em) {
      .libro { grid-template-columns: 1fr; }
      .dato, .dato + .dato { padding: var(--e-4) 0; border-left: 0; }
      .dato + .dato { border-top: 1px solid var(--linea); }
      .dato { grid-template-columns: auto 1fr; align-items: baseline; gap: var(--e-4); }
      .valor { font-size: var(--texto-2xl); min-width: 3ch; }
      .ruta { grid-template-columns: 1fr; gap: var(--e-6); }
      .ruta-lista li { align-items: flex-start; }
    }
  `,
})
export class Home implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly ruta = RUTA;
  protected readonly canManageUsers = this.auth.can(P.USUARIOS_VER, P.USUARIOS_GESTIONAR);
  protected readonly canSeeRoles = this.auth.can(P.ROLES_VER);
  private readonly canListRoles = this.auth.can(P.ROLES_VER, P.USUARIOS_GESTIONAR);
  protected readonly noPermission = !!inject(ActivatedRoute).snapshot.queryParamMap.get('sinPermiso');
  protected readonly resumen = signal<Resumen | null>(null);

  ngOnInit() {
    if (!this.canManageUsers) return;
    forkJoin({
      activos: this.api.listUsers({ active: 'true', pageSize: 1 }),
      inactivos: this.api.listUsers({ active: 'false', pageSize: 1 }),
      roles: this.canListRoles ? this.api.listRoles() : of(null),
    }).subscribe({
      next: (r) => this.resumen.set({ activos: r.activos.total, inactivos: r.inactivos.total, roles: r.roles ? r.roles.length : null }),
      error: () => this.resumen.set(null),
    });
  }
}
