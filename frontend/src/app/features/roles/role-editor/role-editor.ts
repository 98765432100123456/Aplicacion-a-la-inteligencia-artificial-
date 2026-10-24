import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/utils/http-error';
import { HasUnsavedChanges } from '../../../core/guards/guards';
import { P, PermissionDef, RoleItem } from '../../../core/models/models';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { ToastService } from '../../../shared/services/toast.service';

interface Group {
  module: string;
  items: PermissionDef[];
}

@Component({
  selector: 'app-role-editor',
  imports: [ReactiveFormsModule, RouterLink, Dialog],
  templateUrl: './role-editor.html',
  styleUrl: './role-editor.scss',
})
export class RoleEditor implements OnInit, HasUnsavedChanges {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly isNew = !this.id;
  protected readonly canManage = this.auth.can(P.ROLES_GESTIONAR);
  protected readonly role = signal<RoleItem | null>(null);
  protected readonly groups = signal<Group[]>([]);
  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly loadError = signal<string | null>(null);
  protected readonly ready = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmStatus = signal(false);
  private submitted = false;
  private initialPermissions = '';
  private saved = false;

  /** El Administrador conserva todos los permisos para que nadie quede sin acceso a la seguridad. */
  protected readonly lockedPermissions = computed(() => this.role()?.code === 'ADMIN');
  protected readonly readOnly = computed(() => !this.canManage);
  protected readonly count = computed(() => this.selected().size);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z][A-Za-z0-9_]{1,39}$/)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    description: ['', Validators.maxLength(255)],
  });

  ngOnInit() {
    forkJoin({
      catalog: this.api.permissionCatalog(),
      role: this.id ? this.api.getRole(this.id) : of(null),
    }).subscribe({
      next: ({ catalog, role }) => {
        const modules = [...new Set(catalog.map((p) => p.module))];
        this.groups.set(modules.map((module) => ({ module, items: catalog.filter((p) => p.module === module) })));
        if (role) {
          this.role.set(role);
          this.form.setValue({ code: role.code, name: role.name, description: role.description ?? '' });
          this.form.controls.code.disable();
          this.selected.set(new Set(role.permissions));
        }
        if (this.readOnly()) this.form.disable();
        this.initialPermissions = [...this.selected()].sort().join(',');
        this.ready.set(true);
      },
      error: (e) => this.loadError.set(errorMessage(e, 'No se pudo cargar el rol.')),
    });
  }

  hasUnsavedChanges(): boolean {
    if (this.saved || this.readOnly() || !this.ready()) return false;
    return this.form.dirty || [...this.selected()].sort().join(',') !== this.initialPermissions;
  }

  protected isChecked(key: string) {
    return this.selected().has(key);
  }

  protected toggle(key: string, checked: boolean) {
    this.selected.update((s) => {
      const next = new Set(s);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  protected groupState(group: Group): 'todos' | 'algunos' | 'ninguno' {
    const n = group.items.filter((p) => this.selected().has(p.key)).length;
    return n === 0 ? 'ninguno' : n === group.items.length ? 'todos' : 'algunos';
  }

  protected toggleGroup(group: Group, checked: boolean) {
    this.selected.update((s) => {
      const next = new Set(s);
      for (const p of group.items) {
        if (checked) next.add(p.key);
        else next.delete(p.key);
      }
      return next;
    });
  }

  protected bad(field: 'code' | 'name' | 'description'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || this.submitted);
  }

  protected submit() {
    this.submitted = true;
    this.form.markAllAsTouched();
    this.error.set(null);
    if (this.form.invalid) {
      const first = (['code', 'name', 'description'] as const).find((f) => this.form.controls[f].invalid);
      if (first) document.getElementById(`r-${first}`)?.focus();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      name: v.name.trim(),
      description: v.description.trim() || null,
      permissions: [...this.selected()],
    };
    this.saving.set(true);
    const request = this.isNew
      ? this.api.createRole({ ...payload, code: v.code.trim().toUpperCase() })
      : this.api.updateRole(this.id!, payload);
    request.subscribe({
      next: (role) => {
        this.saving.set(false);
        this.saved = true;
        this.toast.success(this.isNew ? `Rol ${role.name} creado.` : `Cambios guardados en ${role.name}.`);
        // Si el usuario editó su propio rol, se refrescan sus permisos.
        if (role.id === this.auth.user()?.role.id) this.auth.refresh();
        this.router.navigate(['/roles']);
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(errorMessage(e));
      },
    });
  }

  protected setStatus(active: boolean) {
    const role = this.role();
    if (!role) return;
    this.saving.set(true);
    this.api.setRoleStatus(role.id, active).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.confirmStatus.set(false);
        this.role.set(updated);
        this.toast.success(`El rol ${updated.name} quedó ${active ? 'activo' : 'inactivo'}.`);
      },
      error: (e) => {
        this.saving.set(false);
        this.confirmStatus.set(false);
        this.toast.error(errorMessage(e));
      },
    });
  }
}
