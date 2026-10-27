import { Component, computed, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleItem, UserInput, UserItem } from '../../../core/models/models';
import { mostrarError } from '../../../shared/utils/formularios';

type Field = 'firstName' | 'lastName' | 'email' | 'documentNumber' | 'phone' | 'roleId';

const MESSAGES: Record<Field, string> = {
  firstName: 'Escriba los nombres (mínimo 2 caracteres).',
  lastName: 'Escriba los apellidos (mínimo 2 caracteres).',
  email: 'Escriba un correo válido, por ejemplo nombre@dominio.co.',
  documentNumber: 'Use de 4 a 20 letras, números o guiones.',
  phone: 'Use de 7 a 20 dígitos.',
  roleId: 'Seleccione un rol.',
};

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm implements OnInit {
  readonly user = input<UserItem | null>(null);
  readonly roles = input<RoleItem[]>([]);
  readonly saving = input(false);
  readonly serverError = input<string | null>(null);
  readonly isSelf = input(false);
  readonly save = output<UserInput>();
  readonly cancel = output<void>();
  readonly sendLink = output<UserItem>();

  protected readonly messages = MESSAGES;
  private submitted = false;

  /** Roles activos, más el actual del usuario aunque esté inactivo. */
  protected readonly roleOptions = computed(() =>
    this.roles().filter((r) => r.active || r.id === this.user()?.role.id),
  );

  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    documentNumber: ['', Validators.pattern(/^[0-9A-Za-z-]{4,20}$/)],
    phone: ['', Validators.pattern(/^\+?[0-9 ]{7,20}$/)],
    roleId: ['', Validators.required],
  });

  /** Hay datos escritos sin guardar (modality.md: evitar perder datos al cerrar). */
  isDirty(): boolean {
    return this.form.dirty;
  }

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.form.setValue({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        documentNumber: u.documentNumber ?? '',
        phone: u.phone ?? '',
        roleId: u.role.id,
      });
      // El correo identifica la cuenta en Firebase Authentication: no se cambia al editar.
      this.form.controls.email.disable();
    }
    if (this.isSelf()) this.form.controls.roleId.disable();
  }

  protected bad(field: Field): boolean {
    return mostrarError(this.form.controls[field], this.submitted);
  }

  protected submit() {
    this.submitted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      const first = (Object.keys(this.form.controls) as Field[]).find((k) => this.form.controls[k].invalid);
      const ids: Record<Field, string> = {
        firstName: 'u-nombres', lastName: 'u-apellidos', email: 'u-correo',
        documentNumber: 'u-doc', phone: 'u-tel', roleId: 'u-rol',
      };
      if (first) document.getElementById(ids[first])?.focus();
      return;
    }
    const v = this.form.getRawValue();
    this.save.emit({
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim().toLowerCase(),
      documentNumber: v.documentNumber.trim() || null,
      phone: v.phone.trim() || null,
      roleId: v.roleId,
    });
  }
}
