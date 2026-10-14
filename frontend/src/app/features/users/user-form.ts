import { Component, computed, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleItem, UserInput, UserItem } from '../../core/models';

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
  template: `
    @if (serverError()) {
      <p class="aviso aviso-error" role="alert">{{ serverError() }}</p>
    }
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="rejilla">
        <div class="campo">
          <label for="u-nombres">Nombres</label>
          <input id="u-nombres" class="control" formControlName="firstName" autocomplete="off" [attr.aria-invalid]="bad('firstName') || null" [attr.aria-describedby]="bad('firstName') ? 'e-firstName' : null" />
          @if (bad('firstName')) { <span class="error" id="e-firstName">{{ messages.firstName }}</span> }
        </div>
        <div class="campo">
          <label for="u-apellidos">Apellidos</label>
          <input id="u-apellidos" class="control" formControlName="lastName" autocomplete="off" [attr.aria-invalid]="bad('lastName') || null" [attr.aria-describedby]="bad('lastName') ? 'e-lastName' : null" />
          @if (bad('lastName')) { <span class="error" id="e-lastName">{{ messages.lastName }}</span> }
        </div>
        <div class="campo completo">
          <label for="u-correo">Correo electrónico</label>
          <input id="u-correo" class="control" type="email" placeholder="nombre@dominio.co" formControlName="email" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="email" [attr.aria-invalid]="bad('email') || null" [attr.aria-describedby]="bad('email') ? 'e-email' : null" />
          @if (bad('email')) { <span class="error" id="e-email">{{ messages.email }}</span> }
        </div>
        <div class="campo">
          <label for="u-doc">Documento <span class="opcional">(opcional)</span></label>
          <input id="u-doc" class="control" formControlName="documentNumber" placeholder="1020304050" autocomplete="off" [attr.aria-invalid]="bad('documentNumber') || null" [attr.aria-describedby]="bad('documentNumber') ? 'e-documentNumber' : null" />
          @if (bad('documentNumber')) { <span class="error" id="e-documentNumber">{{ messages.documentNumber }}</span> }
        </div>
        <div class="campo">
          <label for="u-tel">Teléfono <span class="opcional">(opcional)</span></label>
          <input id="u-tel" class="control" type="tel" placeholder="300 123 4567" formControlName="phone" autocomplete="off" inputmode="tel" [attr.aria-invalid]="bad('phone') || null" [attr.aria-describedby]="bad('phone') ? 'e-phone' : null" />
          @if (bad('phone')) { <span class="error" id="e-phone">{{ messages.phone }}</span> }
        </div>
        <div class="campo completo">
          <label for="u-rol">Rol</label>
          <select id="u-rol" class="control" formControlName="roleId" [attr.aria-invalid]="bad('roleId') || null" [attr.aria-describedby]="isSelf() ? 'ayuda-rol' : bad('roleId') ? 'e-roleId' : null">
            <option value="" disabled>Seleccione…</option>
            @for (r of roleOptions(); track r.id) {
              <option [value]="r.id" [disabled]="!r.active">{{ r.name }}{{ r.active ? '' : ' (inactivo)' }}</option>
            }
          </select>
          @if (isSelf()) {
            <span class="ayuda" id="ayuda-rol">No puede cambiar su propio rol.</span>
          }
          @if (bad('roleId')) { <span class="error" id="e-roleId">{{ messages.roleId }}</span> }
        </div>
      </div>

      @if (!user()) {
        <p class="aviso">Al guardar, la persona recibe un correo para definir su contraseña. El enlace vence en 72 horas.</p>
      } @else if (user()!.active) {
        <div class="acceso">
          <div>
            <p class="etiqueta">Acceso</p>
            <p class="ayuda">Si la persona no recibió la invitación u olvidó su contraseña.</p>
          </div>
          <button type="button" class="btn btn-secundario" (click)="sendLink.emit(user()!)">Enviar enlace de acceso</button>
        </div>
      }

      <div class="botones">
        <button type="button" class="btn btn-secundario" (click)="cancel.emit()">Cancelar</button>
        <button type="submit" class="btn btn-principal" [disabled]="saving()">
          @if (saving()) { <span class="spinner" aria-hidden="true"></span> Guardando… } @else { {{ user() ? 'Guardar cambios' : 'Crear usuario' }} }
        </button>
      </div>
    </form>
  `,
  styles: `
    .aviso-error { margin-bottom: var(--e-5); }
    .rejilla { display: grid; grid-template-columns: 1fr 1fr; gap: var(--e-5) var(--e-4); }
    .completo { grid-column: 1 / -1; }
    .opcional { font-weight: 400; color: var(--tinta-tenue); }
    form > .aviso { margin-top: var(--e-6); }
    .acceso {
      display: flex; align-items: center; justify-content: space-between; gap: var(--e-4);
      margin-top: var(--e-6); padding-top: var(--e-5); border-top: 1px solid var(--linea);
    }
    .etiqueta { font-weight: 600; font-size: var(--texto-sm); }
    .ayuda { font-size: var(--texto-sm); color: var(--tinta-tenue); }
    .botones { display: flex; justify-content: flex-end; gap: var(--e-3); margin-top: var(--e-8); }
    @media (max-width: 37.49em) {
      .rejilla { grid-template-columns: 1fr; }
      .acceso { flex-direction: column; align-items: stretch; }
      .botones { flex-direction: column-reverse; }
      .botones .btn { width: 100%; }
    }
  `,
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
    }
    if (this.isSelf()) this.form.controls.roleId.disable();
  }

  protected bad(field: Field): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || this.submitted);
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
