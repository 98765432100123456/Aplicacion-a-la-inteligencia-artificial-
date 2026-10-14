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

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <h1>Hola, {{ auth.user()?.firstName }}</h1>
    <p class="sub">Ingresó como <strong>{{ auth.user()?.role?.name }}</strong>.</p>

    @if (noPermission) {
      <p class="aviso aviso-advertencia" role="status">Su rol no tiene acceso a la página que intentó abrir.</p>
    }

    @if (canManageUsers) {
      <section class="resumen" aria-labelledby="resumen-titulo">
        <h2 id="resumen-titulo" class="visually-hidden">Resumen de seguridad</h2>
        @if (resumen(); as r) {
          <a class="dato panel" routerLink="/usuarios" [queryParams]="{ estado: 'true' }">
            <span class="valor cifras">{{ r.activos }}</span>
            <span class="rotulo">Usuarios activos</span>
          </a>
          <a class="dato panel" routerLink="/usuarios" [queryParams]="{ estado: 'false' }">
            <span class="valor cifras">{{ r.inactivos }}</span>
            <span class="rotulo">Usuarios inactivos</span>
          </a>
          @if (r.roles !== null) {
            <a class="dato panel" [routerLink]="canSeeRoles ? '/roles' : null">
              <span class="valor cifras">{{ r.roles }}</span>
              <span class="rotulo">Roles configurados</span>
            </a>
          }
        } @else {
          <p class="cargando" role="status">Cargando resumen…</p>
        }
      </section>
    }

    <section class="panel proximo" aria-labelledby="proximo-titulo">
      <h2 id="proximo-titulo">En construcción</h2>
      <p>
        Este sprint habilita el ingreso, la recuperación de contraseña, los usuarios y los roles. Los
        módulos de fincas, parametrización por especie, evaluación, diagnóstico y reportes se
        integrarán en los siguientes sprints.
      </p>
    </section>
  `,
  styles: `
    h1 { font-size: var(--texto-2xl); }
    .sub { color: var(--tinta-suave); margin: var(--e-1) 0 var(--e-8); }
    .aviso { margin-bottom: var(--e-6); }
    .resumen { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: var(--e-4); margin-bottom: var(--e-8); }
    .dato {
      display: grid; gap: var(--e-1); padding: var(--e-5); color: var(--tinta); text-decoration: none;
      transition: border-color var(--dur-rapida) var(--curva);
    }
    .dato:hover { border-color: var(--potrero-700); color: var(--tinta); }
    .valor { font-size: var(--texto-3xl); font-weight: 700; line-height: 1; color: var(--potrero-900); }
    .rotulo { color: var(--tinta-suave); font-size: var(--texto-sm); font-weight: 500; }
    .cargando { color: var(--tinta-tenue); }
    .proximo { padding: var(--e-6); max-width: 46rem; border-style: dashed; background: transparent; }
    .proximo h2 { font-size: var(--texto-lg); margin-bottom: var(--e-2); }
    .proximo p { color: var(--tinta-suave); }
  `,
})
export class Home implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
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
