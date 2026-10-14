import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { matchFields, PASSWORD_HINT, passwordPolicy } from '../../shared/password-policy';
import { PasswordInput } from '../../shared/password-input';
import { AuthLayout } from './auth-layout';

type Estado = 'verificando' | 'valido' | 'invalido';

/** Sirve tanto para recuperar la contraseña como para definirla la primera vez (invitación). */
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, PasswordInput],
  styleUrl: './auth.scss',
  template: `
    <app-auth-layout>
      @switch (state()) {
        @case ('verificando') {
          <p class="intro" role="status"><span class="spinner" aria-hidden="true"></span> Verificando el enlace…</p>
        }
        @case ('invalido') {
          <h2>El enlace ya no sirve</h2>
          <p class="intro">Venció o ya se usó. Los enlaces sirven una sola vez y por tiempo limitado.</p>
          <a class="btn btn-principal btn-bloque" routerLink="/recuperar-contrasena">Pedir un enlace nuevo</a>
          <p class="volver"><a routerLink="/ingresar">Volver a ingresar</a></p>
        }
        @case ('valido') {
          <h2>Crear contraseña</h2>
          <p class="intro">Para la cuenta <strong>{{ email() }}</strong>.</p>
          @if (error()) {
            <p class="aviso aviso-error" role="alert">{{ error() }}</p>
          }
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="campo">
              <label for="password">Nueva contraseña</label>
              <app-password-input
                inputId="password"
                autocomplete="new-password"
                formControlName="password"
                [invalid]="showPolicyError()"
                describedBy="password-ayuda"
              />
              <span [class]="showPolicyError() ? 'error' : 'ayuda'" id="password-ayuda">{{ hint }}</span>
            </div>
            <div class="campo">
              <label for="confirm">Repita la contraseña</label>
              <app-password-input
                inputId="confirm"
                autocomplete="new-password"
                formControlName="confirm"
                [invalid]="showMismatch()"
                [describedBy]="showMismatch() ? 'confirm-error' : null"
              />
              @if (showMismatch()) {
                <span class="error" id="confirm-error">Las contraseñas no coinciden.</span>
              }
            </div>
            <button class="btn btn-principal btn-bloque" type="submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner" aria-hidden="true"></span> Guardando…
              } @else {
                Guardar contraseña
              }
            </button>
          </form>
        }
      }
    </app-auth-layout>
  `,
})
export class ResetPassword implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

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
    const c = this.form.controls.password;
    return (this.submitted() || c.touched) && c.invalid;
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
