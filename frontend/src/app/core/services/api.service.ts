import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserFilters, UsuariosRolesFirebase } from '../firebase/usuarios-roles';
import { Page, PermissionDef, RoleInput, RoleItem, UserInput, UserItem } from '../models/models';
import { AuthService } from './auth.service';

export type { UserFilters };

/** Usuarios y roles: Firestore en uso real; la API simulada en el modo demostración. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly auth = inject(AuthService);
  private readonly real = environment.demo ? null : new UsuariosRolesFirebase(() => this.auth.user()?.id ?? null);
  private readonly demo = new ApiDemo(inject(HttpClient));

  listUsers(filters: UserFilters): Observable<Page<UserItem>> {
    return this.real ? from(this.real.listUsers(filters)) : this.demo.listUsers(filters);
  }
  createUser(input: UserInput): Observable<UserItem> {
    return this.real ? from(this.real.createUser(input)) : this.demo.createUser(input);
  }
  updateUser(id: string, input: Partial<UserInput>): Observable<UserItem> {
    return this.real ? from(this.real.updateUser(id, input)) : this.demo.updateUser(id, input);
  }
  setUserStatus(id: string, active: boolean): Observable<UserItem> {
    return this.real ? from(this.real.setUserStatus(id, active)) : this.demo.setUserStatus(id, active);
  }
  sendAccessLink(id: string): Observable<{ message: string }> {
    return this.real ? from(this.real.sendAccessLink(id)) : this.demo.sendAccessLink(id);
  }
  listRoles(): Observable<RoleItem[]> {
    return this.real ? from(this.real.listRoles()) : this.demo.listRoles();
  }
  getRole(id: string): Observable<RoleItem> {
    return this.real ? from(this.real.getRole(id)) : this.demo.getRole(id);
  }
  permissionCatalog(): Observable<PermissionDef[]> {
    return this.real ? from(this.real.permissionCatalog()) : this.demo.permissionCatalog();
  }
  createRole(input: RoleInput): Observable<RoleItem> {
    return this.real ? from(this.real.createRole(input)) : this.demo.createRole(input);
  }
  updateRole(id: string, input: Partial<RoleInput>): Observable<RoleItem> {
    return this.real ? from(this.real.updateRole(id, input)) : this.demo.updateRole(id, input);
  }
  setRoleStatus(id: string, active: boolean): Observable<RoleItem> {
    return this.real ? from(this.real.setRoleStatus(id, active)) : this.demo.setRoleStatus(id, active);
  }
}

/** Llamadas a la API que simula core/demo en el navegador. */
class ApiDemo {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listUsers(filters: UserFilters) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<Page<UserItem>>(`${this.api}/users`, { params });
  }

  createUser(input: UserInput) {
    return this.http.post<UserItem>(`${this.api}/users`, input);
  }

  updateUser(id: string, input: Partial<UserInput>) {
    return this.http.patch<UserItem>(`${this.api}/users/${id}`, input);
  }

  setUserStatus(id: string, active: boolean) {
    return this.http.patch<UserItem>(`${this.api}/users/${id}/status`, { active });
  }

  sendAccessLink(id: string) {
    return this.http.post<{ message: string }>(`${this.api}/users/${id}/access-link`, {});
  }

  listRoles() {
    return this.http.get<RoleItem[]>(`${this.api}/roles`);
  }

  getRole(id: string) {
    return this.http.get<RoleItem>(`${this.api}/roles/${id}`);
  }

  permissionCatalog() {
    return this.http.get<PermissionDef[]>(`${this.api}/roles/permissions`);
  }

  createRole(input: RoleInput) {
    return this.http.post<RoleItem>(`${this.api}/roles`, input);
  }

  updateRole(id: string, input: Partial<RoleInput>) {
    return this.http.patch<RoleItem>(`${this.api}/roles/${id}`, input);
  }

  setRoleStatus(id: string, active: boolean) {
    return this.http.patch<RoleItem>(`${this.api}/roles/${id}/status`, { active });
  }
}
