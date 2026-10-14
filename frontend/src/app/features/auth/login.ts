import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { PasswordInput } from '../../shared/password-input';
import { AuthLayout } from './auth-layout';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, PasswordInput],
  styleUrl: './auth.scss',
  template: `
    <app-auth-layout>
      <h2>Ingresar</h2>
      <p class="intro">Use el correo con el que el administrador lo registró.</p>

      @if (notice) {
        <p class="aviso aviso-advertencia" role="status">{{ notice }}</p>
      }
      @if (error()) {
        <p class="aviso aviso-error" role="alert">{{ error() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="campo">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            class="control"
            type="email"
            formControlName="email"
            autocomplete="username"
            inputmode="email"
            autocapitalize="off"
            spellcheck="false"
            [attr.aria-invalid]="showError('email') || null"
            [attr.aria-describedby]="showError('email') ? 'email-error' : null"
          />
          @if (showError('email')) {
            <span class="error" id="email-error">Escriba un correo válido, por ejemplo nombre&#64;dominio.co.</span>
          }
        </div>

        <div class="campo">
          <div class="fila">
            <label for="password">Contraseña</label>
            <a routerLink="/recuperar-contrasena">¿Olvidó su contraseña?</a>
          </div>
          <app-password-input
            inputId="password"
            formControlName="password"
            [invalid]="showError('password')"
            [describedBy]="showError('password') ? 'password-error' : null"
          />
          @if (showError('password')) {
            <span class="error" id="password-error">Escriba su contraseña.</span>
          }
        </div>

        <button class="btn btn-principal btn-bloque" type="submit" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner" aria-hidden="true"></span> Ingresando…
          } @else {
            Ingresar
          }
        </button>
      </form>
    </app-auth-layout>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private submitted = false;

  protected readonly notice = (() => {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('motivo') === 'expired') return 'Su sesión terminó. Ingrese de nuevo para continuar.';
    if (params.get('restablecida')) return 'Contraseña actualizada. Ingrese con la nueva contraseña.';
    return null;
  })();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected showError(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted);
  }

  async submit() {
    this.submitted = true;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      document.getElementById(this.form.controls.email.invalid ? 'email' : 'password')?.focus();
      return;
    }
    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email.trim(), password);
      const back = this.route.snapshot.queryParamMap.get('volver');
      await this.router.navigateByUrl(back?.startsWith('/') && !back.startsWith('//') ? back : '/inicio');
    } catch (e) {
      this.error.set(errorMessage(e));
      this.form.controls.password.reset();
    } finally {
      this.loading.set(false);
    }
  }
}
