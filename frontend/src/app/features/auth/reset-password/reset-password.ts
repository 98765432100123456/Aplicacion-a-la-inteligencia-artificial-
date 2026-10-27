import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/utils/http-error';
import { matchFields, PASSWORD_HINT, passwordPolicy } from '../../../shared/utils/password-policy';
import { PasswordInput } from '../../../shared/components/password-input/password-input';
import { AuthLayout } from '../auth-layout/auth-layout';
import { mostrarError } from '../../../shared/utils/formularios';

type Estado = 'verificando' | 'valido' | 'invalido';

/** Sirve tanto para recuperar la contraseña como para definirla la primera vez (invitación). */
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, PasswordInput],
  styleUrl: '../auth.scss',
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;
  // Firebase envía el código como oobCode; el modo demostración usa token.
  private readonly token = this.params.get('oobCode') ?? this.params.get('token') ?? '';

  protected readonly hint = PASSWORD_HINT;
  protected readonly state = signal<Estado>('verificando');
  protected readonly email = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly submitted = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      password: ['', [Validators.required, passwordPolicy]],
      confirm: ['', Validators.required],
    },
    { validators: matchFields('password', 'confirm') },
  );

  async ngOnInit() {
    if (!this.token) {
      this.state.set('invalido');
      return;
    }
    try {
      const res = await this.auth.validateResetToken(this.token);
      this.email.set(res.email ?? '');
      this.state.set(res.valid ? 'valido' : 'invalido');
    } catch {
      this.state.set('invalido');
    }
  }

  protected showPolicyError(): boolean {
    return mostrarError(this.form.controls.password, this.submitted());
  }

  protected showMismatch(): boolean {
    return this.submitted() && (this.form.hasError('mismatch') || this.form.controls.confirm.invalid);
  }

  async submit() {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.error.set(null);
    if (this.form.invalid) {
      document.getElementById(this.form.controls.password.invalid ? 'password' : 'confirm')?.focus();
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.resetPassword(this.token, this.form.getRawValue().password);
      await this.router.navigate(['/ingresar'], { queryParams: { restablecida: 1 } });
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
}
