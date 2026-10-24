import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/utils/http-error';
import { AuthLayout } from '../auth-layout/auth-layout';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout],
  styleUrl: '../auth.scss',
  templateUrl: './forgot-password.html',
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
