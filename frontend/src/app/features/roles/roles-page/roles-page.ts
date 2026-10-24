import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/utils/http-error';
import { P, RoleItem } from '../../../core/models/models';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-roles-page',
  imports: [RouterLink, DatePipe, PageHeader],
  templateUrl: './roles-page.html',
  styleUrl: './roles-page.scss',
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
