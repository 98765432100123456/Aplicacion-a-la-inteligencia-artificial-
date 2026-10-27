import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, SessionUser } from '../models/models';
import { AuthConfig } from '../models/predios';

const TOKEN_KEY = 'ica.token';

/** Estado de la sesión. El token se guarda en sessionStorage: se borra al cerrar el navegador. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = environment.apiUrl;

  private readonly _user = signal<SessionUser | null>(null);
  private token: string | null = readToken();

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly fullName = computed(() => {
    const u = this._user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  get accessToken(): string | null {
    return this.token;
  }

  can(...permissions: string[]): boolean {
    const user = this._user();
    return !!user && permissions.some((p) => user.permissions.includes(p));
  }

  /** Restaura la sesión al recargar la página. Devuelve false si no hay sesión válida. */
  async restore(): Promise<boolean> {
    if (this._user()) return true;
    if (!this.token) return false;
    try {
      this._user.set(await firstValueFrom(this.http.get<SessionUser>(`${this.api}/auth/me`)));
      return true;
    } catch {
      this.clear();
      return false;
    }
  }

  /** Vuelve a leer el usuario (p. ej. tras cambiar los permisos de su rol). */
  async refresh(): Promise<void> {
    try {
      this._user.set(await firstValueFrom(this.http.get<SessionUser>(`${this.api}/auth/me`)));
    } catch {
      /* el interceptor maneja la sesión vencida */
    }
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(this.http.post<LoginResponse>(`${this.api}/auth/login`, { email, password }));
    this.setSession(res);
  }

  /** Ingreso con el token que entrega Firebase tras autenticarse con Google, Facebook o Microsoft. */
  async loginWithFirebase(idToken: string): Promise<void> {
    this.setSession(await firstValueFrom(this.http.post<LoginResponse>(`${this.api}/auth/firebase`, { idToken })));
  }

  /** Opciones de ingreso que ofrece el servidor: registro y proveedores externos. */
  authConfig() {
    return firstValueFrom(this.http.get<AuthConfig>(`${this.api}/auth/config`));
  }

  register(firstName: string, lastName: string, email: string) {
    return firstValueFrom(this.http.post<{ message: string }>(`${this.api}/auth/register`, { firstName, lastName, email }));
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.api}/auth/change-password`, { currentPassword, newPassword }),
    );
    this.setSession(res);
  }

  forgotPassword(email: string) {
    return firstValueFrom(this.http.post<{ message: string }>(`${this.api}/auth/forgot-password`, { email }));
  }

  validateResetToken(token: string) {
    return firstValueFrom(
      this.http.get<{ valid: boolean; email?: string }>(`${this.api}/auth/reset-password/validate`, {
        params: { token },
      }),
    );
  }

  resetPassword(token: string, password: string) {
    return firstValueFrom(this.http.post<{ message: string }>(`${this.api}/auth/reset-password`, { token, password }));
  }

  logout(reason?: 'expired'): void {
    this.clear();
    this.router.navigate(['/ingresar'], { queryParams: reason ? { motivo: reason } : {} });
  }

  private setSession(res: LoginResponse): void {
    this.token = res.accessToken;
    try {
      sessionStorage.setItem(TOKEN_KEY, res.accessToken);
    } catch {
      // Sin almacenamiento disponible la sesión dura lo que la pestaña.
    }
    this._user.set(res.user);
  }

  private clear(): void {
    this.token = null;
    this._user.set(null);
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nada que limpiar */
    }
  }
}

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
