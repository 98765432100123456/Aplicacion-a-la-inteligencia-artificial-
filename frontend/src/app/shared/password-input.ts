import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Campo de contraseña con botón para mostrarla u ocultarla. */
@Component({
  selector: 'app-password-input',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordInput), multi: true }],
  template: `
    <div class="envoltura">
      <input
        class="control"
        [id]="inputId()"
        [type]="visible() ? 'text' : 'password'"
        [attr.autocomplete]="autocomplete()"
        [attr.aria-invalid]="invalid() || null"
        [attr.aria-describedby]="describedBy() || null"
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        spellcheck="false"
        autocapitalize="off"
      />
      <button
        type="button"
        class="alternar"
        (click)="visible.set(!visible())"
        [attr.aria-pressed]="visible()"
        [attr.aria-label]="visible() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      >
        {{ visible() ? 'Ocultar' : 'Mostrar' }}
      </button>
    </div>
  `,
  styles: `
    .envoltura { position: relative; }
    .control { padding-right: 5.5rem; }
    .alternar {
      position: absolute; top: 0; right: 0; bottom: 0;
      min-width: 4.75rem; min-height: var(--alto-control); padding: 0 var(--e-3);
      border: 1px solid transparent; border-left-color: var(--linea);
      border-radius: 0 var(--radio-control) var(--radio-control) 0;
      background: transparent; color: var(--acento);
      font: inherit; font-size: var(--texto-sm); font-weight: 600; cursor: pointer;
    }
    .alternar:hover { background: var(--acento-tenue); }
  `,
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
