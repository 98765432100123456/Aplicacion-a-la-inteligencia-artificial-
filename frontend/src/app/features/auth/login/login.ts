import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/utils/http-error';
import { rutaDeRegreso } from '../../../core/utils/navegacion';
import { PasswordInput } from '../../../shared/components/password-input/password-input';
import { enfocarPrimerError, mostrarError } from '../../../shared/utils/formularios';
import { AuthLayout } from '../auth-layout/auth-layout';
import { ExternalLogin } from '../external-login/external-login';
import { avisoDeIngreso } from './avisos';

/** Pantalla de ingreso con correo y contraseña. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, PasswordInput, ExternalLogin],
  templateUrl: './login.html',
  styleUrl: '../auth.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = avisoDeIngreso(this.params);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  /** El formulario se marca como tocado al enviarlo, así que basta con revisar el campo. */
  protected readonly conError = (campo: 'email' | 'password') => mostrarError(this.form.controls[campo], false);

  async ingresar() {
    this.error.set(null);
    if (this.form.invalid) return enfocarPrimerError(this.form);
    this.cargando.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email.trim(), password);
      await this.router.navigateByUrl(rutaDeRegreso(this.params.get('volver')));
    } catch (e) {
      this.error.set(errorMessage(e));
      this.form.controls.password.reset();
    }
    this.cargando.set(false);
  }
}
