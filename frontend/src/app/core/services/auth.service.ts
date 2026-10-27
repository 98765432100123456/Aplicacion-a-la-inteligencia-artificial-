import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionUser } from '../models/models';
import { AuthConfig, Proveedor } from '../models/predios';
import { ProveedorSesion } from './sesion/sesion';
import { SesionDemo } from './sesion/sesion-demo';
import { SesionFirebase } from './sesion/sesion-firebase';

/** Firebase Authentication en uso real; la API simulada en el modo demostración. */
export const PROVEEDOR_SESION = new InjectionToken<ProveedorSesion>('PROVEEDOR_SESION', {
  providedIn: 'root',
  factory: () => (environment.demo ? new SesionDemo(inject(HttpClient)) : new SesionFirebase()),
});

/** Estado de la sesión y permisos del usuario. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly sesion = inject(PROVEEDOR_SESION);

  private readonly _user = signal<SessionUser | null>(null);
  private restaurando: Promise<boolean> | null = null;

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly fullName = computed(() => {
    const u = this._user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  /** Token de la API simulada (solo modo demostración). */
  get accessToken(): string | null {
    return this.sesion.token;
  }

  can(...permissions: string[]): boolean {
    const user = this._user();
    return !!user && permissions.some((p) => user.permissions.includes(p));
  }

  /** Restaura la sesión al recargar la página. Devuelve false si no hay sesión válida. */
  restore(): Promise<boolean> {
    if (this._user()) return Promise.resolve(true);
    this.restaurando ??= this.sesion.restaurar().then((u) => {
      this.restaurando = null;
      if (u) this.abrir(u);
      return !!u;
    });
    return this.restaurando;
  }

  /** Con Firebase los permisos se actualizan solos; en la demostración se vuelven a pedir. */
  async refresh(): Promise<void> {
    const u = await this.sesion.restaurar();
    if (u) this._user.set(u);
  }

  async login(email: string, password: string): Promise<void> {
    this.abrir(await this.sesion.ingresar(email, password));
  }

  async loginWithProvider(proveedor: Proveedor): Promise<void> {
    this.abrir(await this.sesion.ingresarConProveedor(proveedor));
  }

  /** Opciones de ingreso: registro de propietarios y los proveedores externos configurados. */
  async authConfig(): Promise<AuthConfig> {
    return { registration: true, providers: environment.firebase.proveedores };
  }

  register(firstName: string, lastName: string, email: string, password: string): Promise<string> {
    return this.sesion.registrar(firstName, lastName, email, password);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const u = await this.sesion.cambiarClave(currentPassword, newPassword);
    if (u) this._user.set(u);
  }

  forgotPassword(email: string): Promise<string> {
    return this.sesion.olvideClave(email);
  }

  validateResetToken(token: string) {
    return this.sesion.validarEnlace(token);
  }

  resetPassword(token: string, password: string): Promise<string> {
    return this.sesion.restablecerClave(token, password);
  }

  logout(reason?: 'expired'): void {
    this._user.set(null);
    void this.sesion.salir();
    this.router.navigate(['/ingresar'], { queryParams: reason ? { motivo: reason } : {} });
  }

  private abrir(u: SessionUser) {
    this._user.set(u);
    // Si el administrador inactiva al usuario o cambia su rol, la sesión lo refleja de inmediato.
    this.sesion.observar((actual) => {
      if (!this._user()) return;
      if (actual) this._user.set(actual);
      else this.logout('expired');
    });
  }
}
