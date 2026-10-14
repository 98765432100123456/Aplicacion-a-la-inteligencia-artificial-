import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { P, RoleItem } from '../../core/models';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'app-roles-page',
  imports: [RouterLink, DatePipe, PageHeader],
  template: `
    <app-page-header heading="Roles y permisos" description="Cada rol agrupa los permisos que reciben sus usuarios. Los cambios aplican de inmediato.">
      @if (canManage) {
        <a class="btn btn-principal" routerLink="/roles/nuevo">Nuevo rol</a>
      }
    </app-page-header>

    @if (error()) {
      <div class="panel vacio">
        <p class="aviso aviso-error" role="alert">{{ error() }}</p>
        <button type="button" class="btn btn-secundario" (click)="load()">Reintentar</button>
      </div>
    } @else if (roles() === null) {
      <p class="cargando" role="status">Cargando roles…</p>
    } @else {
      <ul class="roles">
        @for (r of roles(); track r.id) {
          <li class="panel" [class.inactivo]="!r.active">
            <div class="cabeza">
              <h2><a [routerLink]="['/roles', r.id]">{{ r.name }}</a></h2>
              @if (!r.active) {
                <span class="sello sello-inactivo">Inactivo</span>
              } @else if (r.isSystem) {
                <span class="sello sello-activo">Rol base</span>
              }
            </div>
            @if (r.description) {
              <p class="desc">{{ r.description }}</p>
            }
            <dl class="datos">
              <div><dt>Permisos</dt><dd class="cifras">{{ r.permissions.length }}</dd></div>
              <div><dt>Usuarios</dt><dd class="cifras">{{ r.userCount }}</dd></div>
              <div><dt>Actualizado</dt><dd class="cifras">{{ r.updatedAt | date: 'd MMM y' }}</dd></div>
            </dl>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .roles { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--e-3); }
    li {
      position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center;
      gap: var(--e-1) var(--e-8); padding: var(--e-5) var(--e-6); transition: border-color var(--dur-rapida) var(--curva);
    }
    li:hover { border-color: var(--potrero-700); }
    li:focus-within { outline: 3px solid var(--foco); outline-offset: 2px; }
    .cabeza { display: flex; align-items: center; gap: var(--e-3); flex-wrap: wrap; }
    h2 { font-size: var(--texto-lg); }
    h2 a { color: var(--tinta); text-decoration: none; }
    h2 a:focus-visible { outline: none; }
    /* Toda la tarjeta es clicable sin anidar enlaces */
    h2 a::after { content: ''; position: absolute; inset: 0; border-radius: var(--radio-panel); }
    .desc { grid-column: 1; color: var(--tinta-suave); font-size: var(--texto-sm); }
    .datos { grid-column: 2; grid-row: 1 / span 2; display: flex; gap: var(--e-8); margin: 0; }
    .datos div { display: grid; text-align: right; }
    dt { font-size: var(--texto-xs); color: var(--tinta-tenue); font-weight: 600; }
    dd { margin: 0; font-weight: 700; font-size: var(--texto-lg); }
    .inactivo h2 a, .inactivo dd { color: var(--tinta-suave); }
    .cargando { color: var(--tinta-tenue); }
    .vacio { display: grid; justify-items: start; gap: var(--e-4); padding: var(--e-6); }
    @media (max-width: 719px) {
      li { grid-template-columns: 1fr; padding: var(--e-4); }
      .datos { grid-column: 1; grid-row: auto; gap: var(--e-6); margin-top: var(--e-3); }
      .datos div { text-align: left; }
    }
  `,
})
export class RolesPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly canManage = inject(AuthService).can(P.ROLES_GESTIONAR);
  protected readonly roles = signal<RoleItem[] | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  protected load() {
    this.error.set(null);
    this.api.listRoles().subscribe({
      next: (r) => this.roles.set(r),
      error: (e) => this.error.set(errorMessage(e, 'No se pudo cargar la lista de roles.')),
    });
  }
}
