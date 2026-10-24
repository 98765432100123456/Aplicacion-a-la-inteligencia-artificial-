import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { P } from '../../../core/models/models';
import { GuiaBienestar } from '../guia-bienestar/guia-bienestar';

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
  imports: [RouterLink, GuiaBienestar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
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
