import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/utils/http-error';
import { enfocarPrimerError, mostrarError } from '../../../shared/utils/formularios';
import { AuthLayout } from '../auth-layout/auth-layout';

/** Registro de propietarios: el enlace que llega al correo confirma la cuenta y define la contraseña. */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout],
  templateUrl: './register.html',
  styleUrl: '../auth.scss',
})
export class Register {
  private readonly auth = inject(AuthService);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly enviado = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
  });

  protected readonly conError = (campo: 'firstName' | 'lastName' | 'email') => mostrarError(this.form.controls[campo], false);

  async registrar() {
    this.error.set(null);
    if (this.form.invalid) return enfocarPrimerError(this.form);
    this.cargando.set(true);
    try {
      const { firstName, lastName, email } = this.form.getRawValue();
      await this.auth.register(firstName.trim(), lastName.trim(), email.trim().toLowerCase());
      this.enviado.set(email.trim().toLowerCase());
    } catch (e) {
      this.error.set(errorMessage(e));
    }
    this.cargando.set(false);
  }
}
