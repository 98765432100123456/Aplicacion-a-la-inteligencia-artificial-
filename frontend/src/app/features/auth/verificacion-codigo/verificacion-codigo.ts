import { afterNextRender, Component, ElementRef, inject, input, OnDestroy, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DesafioCodigo } from '../../../core/services/sesion/sesion';
import { errorMessage } from '../../../core/utils/http-error';

const ESPERA_REENVIO_S = 60;

/** Segundo paso del ingreso: el código de 6 dígitos que llegó al correo. */
@Component({
  selector: 'app-verificacion-codigo',
  imports: [ReactiveFormsModule],
  templateUrl: './verificacion-codigo.html',
  styleUrls: ['../auth.scss', './verificacion-codigo.scss'],
})
export class VerificacionCodigo implements OnDestroy {
  private readonly auth = inject(AuthService);
  readonly desafio = input.required<DesafioCodigo>();
  readonly verificado = output<void>();

  protected readonly codigo = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] });
  protected readonly form = new FormGroup({ codigo: this.codigo });
  protected readonly cargando = signal(false);
  protected readonly reenviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly espera = signal(ESPERA_REENVIO_S);
  private readonly entrada = viewChild.required<ElementRef<HTMLInputElement>>('entrada');
  private readonly reloj = setInterval(() => this.espera.update((s) => Math.max(0, s - 1)), 1000);

  constructor() {
    afterNextRender(() => this.entrada().nativeElement.focus());
  }

  ngOnDestroy() {
    clearInterval(this.reloj);
  }

  /** Acepta el código pegado con espacios o guiones; deja solo los dígitos. */
  protected soloDigitos() {
    const limpio = this.codigo.value.replace(/\D/g, '').slice(0, 6);
    if (limpio !== this.codigo.value) this.codigo.setValue(limpio);
  }

  protected async verificar() {
    this.error.set(null);
    this.aviso.set(null);
    if (this.codigo.invalid) {
      this.error.set('Escriba los 6 dígitos del código que llegó a su correo.');
      this.entrada().nativeElement.focus();
      return;
    }
    this.cargando.set(true);
    try {
      await this.auth.verificarCodigo(this.codigo.value);
      this.verificado.emit();
    } catch (e) {
      this.error.set(errorMessage(e));
      this.codigo.reset();
      this.entrada().nativeElement.focus();
    }
    this.cargando.set(false);
  }

  protected async reenviar() {
    this.error.set(null);
    this.aviso.set(null);
    this.reenviando.set(true);
    try {
      await this.auth.reenviarCodigo();
      this.aviso.set(`Enviamos un código nuevo a ${this.desafio().correo}. El anterior ya no sirve.`);
      this.espera.set(ESPERA_REENVIO_S);
      this.codigo.reset();
    } catch (e) {
      this.error.set(errorMessage(e));
    }
    this.reenviando.set(false);
  }

  protected cancelar() {
    this.auth.cancelarVerificacion();
  }
}
