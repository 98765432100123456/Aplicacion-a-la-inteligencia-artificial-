import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/utils/http-error';
import { PasswordInput } from '../../../shared/components/password-input/password-input';
import { enfocarPrimerError, mostrarError } from '../../../shared/utils/formularios';
import { PASSWORD_HINT, passwordPolicy } from '../../../shared/utils/password-policy';
import { AuthLayout } from '../auth-layout/auth-layout';

/** Registro de propietarios: se crea la cuenta y el enlace que llega al correo la confirma. */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, PasswordInput],
  templateUrl: './register.html',
  styleUrl: '../auth.scss',
})
export class Register {
  private readonly auth = inject(AuthService);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly enviado = signal<string | null>(null);
  protected readonly ayudaClave = PASSWORD_HINT;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    password: ['', [Validators.required, passwordPolicy]],
  });

  protected readonly conError = (campo: 'firstName' | 'lastName' | 'email' | 'password') => mostrarError(this.form.controls[campo], false);

  async registrar() {
    this.error.set(null);
    if (this.form.invalid) return enfocarPrimerError(this.form);
    this.cargando.set(true);
    try {
      const { firstName, lastName, email, password } = this.form.getRawValue();
      this.enviado.set(await this.auth.register(firstName.trim(), lastName.trim(), email.trim().toLowerCase(), password));
    } catch (e) {
      this.error.set(errorMessage(e));
    }
    this.cargando.set(false);
  }
}
