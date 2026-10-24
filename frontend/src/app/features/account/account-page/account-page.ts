import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HasUnsavedChanges } from '../../../core/guards/guards';
import { errorMessage } from '../../../core/utils/http-error';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PasswordInput } from '../../../shared/components/password-input/password-input';
import { matchFields, PASSWORD_HINT, passwordPolicy } from '../../../shared/utils/password-policy';
import { ToastService } from '../../../shared/services/toast.service';
import { mostrarError } from '../../../shared/utils/formularios';

@Component({
  selector: 'app-account-page',
  imports: [ReactiveFormsModule, PageHeader, PasswordInput],
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
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
    return mostrarError(this.form.controls[field], this.submitted);
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
