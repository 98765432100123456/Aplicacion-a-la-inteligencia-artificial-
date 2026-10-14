import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { AuthLayout } from './auth-layout';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout],
  styleUrl: './auth.scss',
  template: `
    <app-auth-layout>
      @if (sentTo(); as email) {
        <h2>Revise su correo</h2>
        <p class="intro">
          Si <strong>{{ email }}</strong> está registrado y activo, le llegará un enlace para crear una
          nueva contraseña. El enlace vence en 30 minutos.
        </p>
        <p class="aviso">¿No llega? Revise la carpeta de spam o pida ayuda al administrador del sistema.</p>
        <button class="btn btn-secundario btn-bloque" type="button" (click)="sentTo.set(null)">Usar otro correo</button>
        <p class="volver"><a routerLink="/ingresar">Volver a ingresar</a></p>
      } @else {
        <h2>Recuperar contraseña</h2>
        <p class="intro">Escriba su correo y le enviaremos un enlace para crear una nueva.</p>
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
              autocomplete="email"
              inputmode="email"
              placeholder="nombre@dominio.co"
              autocapitalize="off"
              spellcheck="false"
              [attr.aria-invalid]="invalid() || null"
              [attr.aria-describedby]="invalid() ? 'email-error' : null"
            />
            @if (invalid()) {
              <span class="error" id="email-error">Escriba un correo válido, por ejemplo nombre&#64;dominio.co.</span>
            }
          </div>
          <button class="btn btn-principal btn-bloque" type="submit" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner" aria-hidden="true"></span> Enviando…
            } @else {
              Enviar enlace
            }
          </button>
        </form>
        <p class="volver"><a routerLink="/ingresar">Volver a ingresar</a></p>
      }
    </app-auth-layout>
  `,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sentTo = signal<string | null>(null);
  protected readonly invalid = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async submit() {
    this.error.set(null);
    this.invalid.set(this.form.invalid);
    if (this.form.invalid) {
      document.getElementById('email')?.focus();
      return;
    }
    this.loading.set(true);
    const email = this.form.getRawValue().email.trim().toLowerCase();
    try {
      await this.auth.forgotPassword(email);
      this.sentTo.set(email);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
}
