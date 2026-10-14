import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService, UserFilters } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { P, RoleItem, UserItem } from '../../core/models';
import { Dialog } from '../../shared/dialog';
import { PageHeader } from '../../shared/page-header';
import { ToastService } from '../../shared/toast.service';
import { UserForm } from './user-form';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-users-page',
  imports: [ReactiveFormsModule, DatePipe, PageHeader, Dialog, UserForm],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly canManage = this.auth.can(P.USUARIOS_GESTIONAR);
  protected readonly myId = this.auth.user()?.id;

  protected readonly users = signal<UserItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly roles = signal<RoleItem[]>([]);

  protected readonly filters = inject(FormBuilder).nonNullable.group({
    search: [''],
    roleId: [''],
    active: [''],
  });

  protected readonly hasFilters = signal(false);
  protected readonly rangeText = computed(() => {
    const total = this.total();
    if (!total) return '';
    const from = (this.page() - 1) * PAGE_SIZE + 1;
    const to = Math.min(this.page() * PAGE_SIZE, total);
    return `${from}–${to} de ${total}`;
  });
  protected readonly lastPage = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  /** Diálogo de creación/edición: null cerrado, 'nuevo' o el usuario a editar. */
  protected readonly editing = signal<UserItem | 'nuevo' | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly confirmDiscard = signal(false);
  private readonly userForm = viewChild(UserForm);

  protected readonly confirming = signal<UserItem | null>(null);
  protected readonly statusBusy = signal(false);

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.filters.setValue(
      {
        search: params.get('buscar') ?? '',
        roleId: params.get('rol') ?? '',
        active: params.get('estado') ?? '',
      },
      { emitEvent: false },
    );
    this.page.set(Number(params.get('pagina')) || 1);

    this.filters.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });

    if (this.auth.can(P.ROLES_VER, P.USUARIOS_GESTIONAR)) {
      this.api.listRoles().subscribe({ next: (r) => this.roles.set(r) });
    }
    this.load();
  }

  protected load() {
    const f = this.filters.getRawValue();
    this.hasFilters.set(!!(f.search || f.roleId || f.active));
    this.router.navigate([], {
      queryParams: {
        buscar: f.search || null,
        rol: f.roleId || null,
        estado: f.active || null,
        pagina: this.page() > 1 ? this.page() : null,
      },
      replaceUrl: true,
    });

    this.loading.set(true);
    this.loadError.set(null);
    const query: UserFilters = { ...f, active: f.active as UserFilters['active'], page: this.page(), pageSize: PAGE_SIZE };
    this.api.listUsers(query).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (e) => {
        this.loadError.set(errorMessage(e, 'No se pudo cargar la lista de usuarios.'));
        this.loading.set(false);
      },
    });
  }

  protected goTo(page: number) {
    this.page.set(page);
    this.load();
    document.getElementById('contenido')?.focus();
  }

  protected clearFilters() {
    this.filters.setValue({ search: '', roleId: '', active: '' });
  }

  protected openCreate() {
    this.formError.set(null);
    this.editing.set('nuevo');
  }

  protected openEdit(user: UserItem) {
    this.formError.set(null);
    this.editing.set(user);
  }

  /** Cerrar el formulario: si hay cambios sin guardar, primero se confirma. */
  protected requestCloseEditor() {
    if (this.editing() === null) return;
    if (this.userForm()?.isDirty() && !this.confirmDiscard()) {
      this.confirmDiscard.set(true);
      return;
    }
    this.closeEditor();
  }

  protected closeEditor() {
    this.confirmDiscard.set(false);
    this.editing.set(null);
  }

  protected editingUser(): UserItem | null {
    const e = this.editing();
    return e && e !== 'nuevo' ? e : null;
  }

  protected save(input: Parameters<ApiService['createUser']>[0]) {
    const current = this.editingUser();
    this.saving.set(true);
    this.formError.set(null);
    const request = current ? this.api.updateUser(current.id, input) : this.api.createUser(input);
    request.subscribe({
      next: (user) => {
        this.saving.set(false);
        this.closeEditor();
        this.toast.success(
          current
            ? `Cambios guardados para ${user.firstName} ${user.lastName}.`
            : `Usuario creado. Enviamos a ${user.email} el enlace para definir su contraseña.`,
        );
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.formError.set(errorMessage(e));
      },
    });
  }

  protected sendLink(user: UserItem) {
    this.api.sendAccessLink(user.id).subscribe({
      next: () => this.toast.success(`Enviamos a ${user.email} un enlace para crear una nueva contraseña.`),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  protected toggleStatus(user: UserItem) {
    if (user.active) {
      this.confirming.set(user);
    } else {
      this.applyStatus(user, true);
    }
  }

  protected applyStatus(user: UserItem, active: boolean) {
    this.statusBusy.set(true);
    this.api.setUserStatus(user.id, active).subscribe({
      next: (updated) => {
        this.statusBusy.set(false);
        this.confirming.set(null);
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.toast.success(`${updated.firstName} ${updated.lastName} quedó ${active ? 'activo' : 'inactivo'}.`);
      },
      error: (e) => {
        this.statusBusy.set(false);
        this.confirming.set(null);
        this.toast.error(errorMessage(e));
      },
    });
  }
}
