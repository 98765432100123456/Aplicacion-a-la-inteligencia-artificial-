import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { P } from '../../../core/models/models';
import { GuiaBienestar } from '../guia-bienestar/guia-bienestar';
import { Foto } from '../../../shared/components/foto/foto';
import { Esqueleto } from '../../../shared/components/esqueleto/esqueleto';
import { ErrorCarga } from '../../../shared/components/error-carga/error-carga';

interface Resumen {
  activos: number;
  inactivos: number;
  roles: number | null;
}

/** Hoja de ruta real del proyecto (docs/PLAN-DE-TRABAJO.md). */
const RUTA = [
  { modulo: 'Seguridad y acceso', detalle: 'Ingreso, registro de propietarios, recuperación de contraseña, usuarios y roles', cuando: 'Disponible', listo: true },
  { modulo: 'Predios', detalle: 'Propietario, ubicación, especies e inventario por grupo etario', cuando: 'Disponible', listo: true },
  { modulo: 'Evaluación en campo', detalle: 'Lista de chequeo por libertad, guardado parcial y puntaje según la norma', cuando: 'Disponible', listo: true },
  { modulo: 'Recomendaciones de mejora', detalle: 'Lenguaje sencillo para el propietario; redactadas con IA cuando está activa, o por reglas', cuando: 'Disponible', listo: true },
  { modulo: 'Informes e historial', detalle: 'Informe técnico e informe para el propietario en PDF', cuando: 'Disponible', listo: true },
  { modulo: 'Parametrización por especie', detalle: 'Editar criterios, indicadores y ponderaciones desde la plataforma', cuando: 'Próximo sprint', listo: false },
  { modulo: 'Tableros y certificación', detalle: 'Indicadores por zona, comparación, Excel y certificado', cuando: 'Próximo sprint', listo: false },
];

@Component({
  selector: 'app-home',
  imports: [Esqueleto, ErrorCarga, RouterLink, GuiaBienestar, Foto],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly ruta = RUTA;
  protected readonly canManageUsers = this.auth.can(P.USUARIOS_VER, P.USUARIOS_GESTIONAR);
  protected readonly canSeeRoles = this.auth.can(P.ROLES_VER);
  protected readonly ownerOnly = !this.auth.can(P.FINCAS_VER, P.FINCAS_GESTIONAR) && this.auth.can(P.PREDIOS_PROPIOS);
  private readonly canListRoles = this.auth.can(P.ROLES_VER, P.USUARIOS_GESTIONAR);
  protected readonly noPermission = !!inject(ActivatedRoute).snapshot.queryParamMap.get('sinPermiso');
  protected readonly resumen = signal<Resumen | null>(null);
  protected readonly resumenError = signal(false);

  ngOnInit() {
    if (this.canManageUsers) this.cargarResumen();
  }

  protected cargarResumen() {
    this.resumenError.set(false);
    forkJoin({
      activos: this.api.listUsers({ active: 'true', pageSize: 1 }),
      inactivos: this.api.listUsers({ active: 'false', pageSize: 1 }),
      roles: this.canListRoles ? this.api.listRoles() : of(null),
    }).subscribe({
      next: (r) => this.resumen.set({ activos: r.activos.total, inactivos: r.inactivos.total, roles: r.roles ? r.roles.length : null }),
      error: () => this.resumenError.set(true),
    });
  }
}
