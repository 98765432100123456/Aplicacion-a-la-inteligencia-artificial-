import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Campo de contraseña con botón para mostrarla u ocultarla. */
@Component({
  selector: 'app-password-input',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordInput), multi: true }],
  templateUrl: './password-input.html',
  styleUrl: './password-input.scss',
})
export class PasswordInput implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly autocomplete = input('current-password');
  readonly invalid = input(false);
  readonly describedBy = input<string | null>(null);

  protected readonly visible = signal(false);
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  private onChange: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onInput(event: Event) {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(v: string | null): void {
    this.value.set(v ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
