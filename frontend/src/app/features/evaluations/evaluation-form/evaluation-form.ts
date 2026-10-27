import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { Answer, EvaluationDetail } from '../../../core/models/predios';
import { FarmsApiService } from '../../../core/services/farms-api.service';
import { errorMessage } from '../../../core/utils/http-error';
import { NOMBRE_METODO, NOMBRE_TIPO, Respuesta } from '../../../compartido/lista-chequeo';
import { LIBERTADES, NOMBRE_PRODUCTOR } from '../../../compartido/norma';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { ToastService } from '../../../shared/services/toast.service';

const AUTOGUARDADO_MS = 1200;

/**
 * Diligenciamiento por secciones (una por libertad) con guardado automático
 * parcial (RF15, RF16), observaciones por indicador (RF18) y validación de
 * obligatorios antes de finalizar (RF17).
 */
@Component({
  selector: 'app-evaluation-form',
  imports: [DatePipe, Dialog],
  templateUrl: './evaluation-form.html',
  styleUrl: './evaluation-form.scss',
})
export class EvaluationForm implements OnInit {
  readonly evaluation = input.required<EvaluationDetail>();
  readonly finalized = output<EvaluationDetail>();

  private readonly api = inject(FarmsApiService);
  private readonly toast = inject(ToastService);
  protected readonly tipo = NOMBRE_TIPO;
  protected readonly metodo = NOMBRE_METODO;
  protected readonly productor = NOMBRE_PRODUCTOR;

  protected readonly answers = signal<Record<string, Answer>>({});
  protected readonly observando = signal<Set<string>>(new Set());
  protected readonly visitDate = signal('');
  protected readonly general = signal('');
  protected readonly lastSaved = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly confirming = signal(false);
  protected readonly finalizing = signal(false);
  private readonly pendientes = new Set<string>();
  private camposPendientes = false;
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  protected readonly secciones = computed(() =>
    LIBERTADES.map((l) => ({ ...l, indicadores: this.evaluation().checklist.filter((i) => i.libertad === l.codigo) })),
  );
  protected readonly respondidas = computed(() => Object.keys(this.answers()).length);
  protected readonly total = computed(() => this.evaluation().checklist.length);
  protected readonly faltantes = computed(() => this.evaluation().checklist.filter((i) => !this.answers()[i.codigo]));

  constructor() {
    // Los mensajes emergentes suben para no tapar la barra inferior de esta pantalla.
    document.documentElement.style.setProperty('--barra-inferior', '7.5rem');
    inject(DestroyRef).onDestroy(() => {
      if (this.temporizador) clearTimeout(this.temporizador);
      document.documentElement.style.removeProperty('--barra-inferior');
    });
  }

  ngOnInit() {
    const e = this.evaluation();
    this.answers.set(Object.fromEntries(e.answers.map((a) => [a.indicatorCode, a])));
    this.observando.set(new Set(e.answers.filter((a) => a.observation).map((a) => a.indicatorCode)));
    this.visitDate.set(e.visitDate);
    this.general.set(e.generalObservation ?? '');
    this.lastSaved.set(e.lastSavedAt);
  }

  hasPending(): boolean {
    return this.pendientes.size > 0 || this.camposPendientes || this.saving();
  }

  protected opciones(respuesta: 'SI_NO' | 'ESCALA'): { valor: Respuesta; texto: string }[] {
    const base: { valor: Respuesta; texto: string }[] = [{ valor: 'CUMPLE', texto: 'Cumple' }];
    if (respuesta === 'ESCALA') base.push({ valor: 'PARCIAL', texto: 'En parte' });
    return [...base, { valor: 'NO_CUMPLE', texto: 'No cumple' }, { valor: 'NO_APLICA', texto: 'No aplica' }];
  }

  protected responder(codigo: string, valor: Respuesta) {
    this.answers.update((a) => ({ ...a, [codigo]: { indicatorCode: codigo, answer: valor, observation: a[codigo]?.observation ?? null } }));
    this.marcar(codigo);
  }

  protected observar(codigo: string, texto: string) {
    const actual = this.answers()[codigo];
    if (!actual) return;
    this.answers.update((a) => ({ ...a, [codigo]: { ...actual, observation: texto.trim() ? texto : null } }));
    this.marcar(codigo);
  }

  protected mostrarObservacion(codigo: string) {
    this.observando.update((s) => new Set(s).add(codigo));
    setTimeout(() => document.getElementById(`obs-${codigo}`)?.focus());
  }

  protected cambiarCampo(campo: 'visitDate' | 'general', valor: string) {
    (campo === 'visitDate' ? this.visitDate : this.general).set(valor);
    this.camposPendientes = true;
    this.programar();
  }

  private marcar(codigo: string) {
    this.pendientes.add(codigo);
    this.programar();
  }

  private programar() {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.guardar(), AUTOGUARDADO_MS);
  }

  /** Envía solo lo que cambió desde el último guardado. */
  protected async guardar(silencioso = true): Promise<boolean> {
    if (this.temporizador) clearTimeout(this.temporizador);
    if (!this.pendientes.size && !this.camposPendientes) return true;
    const codigos = [...this.pendientes];
    this.pendientes.clear();
    const campos = this.camposPendientes;
    this.camposPendientes = false;
    this.saving.set(true);
    return new Promise((resolve) => {
      this.api
        .saveEvaluation(this.evaluation().id, {
          answers: codigos.map((c) => this.answers()[c]).filter(Boolean),
          ...(campos ? { visitDate: this.visitDate(), generalObservation: this.general().trim() || null } : {}),
        })
        .subscribe({
          next: (e) => {
            this.saving.set(false);
            this.lastSaved.set(e.lastSavedAt);
            if (!silencioso) this.toast.success('Evaluación guardada.');
            resolve(true);
          },
          error: (err) => {
            this.saving.set(false);
            codigos.forEach((c) => this.pendientes.add(c));
            this.camposPendientes ||= campos;
            this.toast.error(errorMessage(err, 'No se pudo guardar. Revise la conexión e intente de nuevo.'));
            resolve(false);
          },
        });
    });
  }

  protected pedirFinalizar() {
    const falta = this.faltantes()[0];
    if (falta) {
      this.toast.error(`Faltan ${this.faltantes().length} indicadores por responder.`);
      document.getElementById(`ind-${falta.codigo}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById(`ind-${falta.codigo}`)?.focus({ preventScroll: true });
      return;
    }
    this.confirming.set(true);
  }

  protected async finalizar() {
    this.confirming.set(false);
    if (!(await this.guardar())) return;
    this.finalizing.set(true);
    this.api.finalize(this.evaluation().id).subscribe({
      next: (e) => {
        this.toast.success('Evaluación finalizada. Los informes están listos.');
        this.finalized.emit(e);
      },
      error: (err) => {
        this.finalizing.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
