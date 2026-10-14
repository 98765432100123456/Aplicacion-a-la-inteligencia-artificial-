import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Page, PermissionDef, RoleInput, RoleItem, UserInput, UserItem } from './models';

export interface UserFilters {
  search?: string;
  roleId?: string;
  active?: 'true' | 'false' | '';
  page?: number;
  pageSize?: number;
}

/** Acceso a los recursos de usuarios y roles de la API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

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
