import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { HasUnsavedChanges } from '../../core/guards';
import { errorMessage } from '../../core/http-error';
import { PageHeader } from '../../shared/page-header';
import { PasswordInput } from '../../shared/password-input';
import { matchFields, PASSWORD_HINT, passwordPolicy } from '../../shared/password-policy';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-account-page',
  imports: [ReactiveFormsModule, PageHeader, PasswordInput],
  template: `
    <app-page-header heading="Cuenta" />

    <div class="columnas">
      <section class="panel bloque" aria-labelledby="datos-titulo">
        <h2 id="datos-titulo">Datos</h2>
        <dl>
          <div><dt>Nombre</dt><dd>{{ auth.fullName() }}</dd></div>
          <div><dt>Correo</dt><dd>{{ auth.user()?.email }}</dd></div>
          <div><dt>Rol</dt><dd>{{ auth.user()?.role?.name }}</dd></div>
        </dl>
        <p class="nota">Para corregir sus datos o cambiar de rol, pídalo al administrador del sistema.</p>
      </section>

      <section class="panel bloque" aria-labelledby="clave-titulo">
        <h2 id="clave-titulo">Cambiar contraseña</h2>
        <p class="nota">Al cambiarla se cierran sus sesiones en otros dispositivos.</p>
        @if (error()) {
          <p class="aviso aviso-error" role="alert">{{ error() }}</p>
        }
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="campo">
            <label for="actual">Contraseña actual</label>
            <app-password-input inputId="actual" formControlName="current" [invalid]="bad('current')" />
            @if (bad('current')) {
              <span class="error">Escriba su contraseña actual.</span>
            }
          </div>
          <div class="campo">
            <label for="nueva">Nueva contraseña</label>
            <app-password-input inputId="nueva" autocomplete="new-password" formControlName="password" [invalid]="bad('password')" describedBy="ayuda-nueva" />
            <span [class]="bad('password') ? 'error' : 'ayuda'" id="ayuda-nueva">{{ hint }}</span>
          </div>
          <div class="campo">
            <label for="confirmar">Repita la nueva contraseña</label>
            <app-password-input inputId="confirmar" autocomplete="new-password" formControlName="confirm" [invalid]="mismatch()" />
            @if (mismatch()) {
              <span class="error">Las contraseñas no coinciden.</span>
            }
          </div>
          <button class="btn btn-principal" type="submit" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner" aria-hidden="true"></span> Guardando…
            } @else {
              Cambiar contraseña
            }
          </button>
        </form>
      </section>
    </div>
  `,
  styles: `
    .columnas { display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: var(--e-5); align-items: start; max-width: 60rem; }
    .bloque { padding: var(--e-6); }
    h2 { font-size: var(--texto-lg); margin-bottom: var(--e-4); }
    dl { margin: 0 0 var(--e-4); border-top: 1px solid var(--linea); }
    dl div { display: grid; grid-template-columns: 5rem 1fr; gap: var(--e-3); padding: var(--e-3) 0; border-bottom: 1px solid var(--linea); }
    dt { font-size: var(--texto-sm); color: var(--tinta-tenue); font-weight: 600; }
    dd { margin: 0; overflow-wrap: anywhere; }
    .nota { color: var(--tinta-suave); font-size: var(--texto-sm); margin-bottom: var(--e-5); }
    .aviso { margin-bottom: var(--e-5); }
    form { display: grid; gap: var(--e-5); justify-items: start; }
    form .campo { width: 100%; }
    @media (max-width: 37.49em) {
      .columnas { grid-template-columns: 1fr; }
      .bloque { padding: var(--e-4); }
      form .btn { width: 100%; }
    }
  `,
})
export class AccountPage implements HasUnsavedChanges {
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly hint = PASSWORD_HINT;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  private submitted = false;

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      current: ['', Validators.required],
      password: ['', [Validators.required, passwordPolicy]],
      confirm: ['', Validators.required],
    },
    { validators: matchFields('password', 'confirm') },
  );

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  protected bad(field: 'current' | 'password'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || this.submitted);
  }

  protected mismatch(): boolean {
    return this.submitted && (this.form.hasError('mismatch') || this.form.controls.confirm.invalid);
  }

  async submit() {
    this.submitted = true;
    this.form.markAllAsTouched();
    this.error.set(null);
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const v = this.form.getRawValue();
      await this.auth.changePassword(v.current, v.password);
      this.form.reset();
      this.submitted = false;
      this.toast.success('Contraseña actualizada.');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}
