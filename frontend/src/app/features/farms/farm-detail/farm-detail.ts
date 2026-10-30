import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HasUnsavedChanges } from '../../../core/guards/guards';
import { P } from '../../../core/models/models';
import { EvaluationSummary, FarmInput, FarmItem, FarmSpeciesItem, Species } from '../../../core/models/predios';
import { AuthService } from '../../../core/services/auth.service';
import { FarmsApiService } from '../../../core/services/farms-api.service';
import { errorMessage } from '../../../core/utils/http-error';
import { NOMBRE_PRODUCTOR, NOMBRE_SISTEMA } from '../../../compartido/norma';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { Nivel } from '../../../shared/components/nivel/nivel';
import { ToastService } from '../../../shared/services/toast.service';
import { FarmForm } from '../farm-form/farm-form';
import { Foto } from '../../../shared/components/foto/foto';
import { Esqueleto } from '../../../shared/components/esqueleto/esqueleto';
import { ErrorCarga } from '../../../shared/components/error-carga/error-carga';

type Pestana = 'tecnicas' | 'recomendaciones';

/**
 * Ficha del predio: desde una sola pantalla se editan sus datos, se inicia o
 * continúa una evaluación y se consulta el historial con sus informes (RF28).
 */
@Component({
  selector: 'app-farm-detail',
  imports: [Esqueleto, ErrorCarga, Foto, RouterLink, DatePipe, DecimalPipe, Dialog, Nivel, FarmForm],
  templateUrl: './farm-detail.html',
  styleUrl: './farm-detail.scss',
})
export class FarmDetail implements OnInit, HasUnsavedChanges {
  private readonly api = inject(FarmsApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  private readonly auth = inject(AuthService);
  private readonly formulario = viewChild(FarmForm);

  protected readonly canEdit = this.auth.can(P.FINCAS_GESTIONAR);
  protected readonly canEvaluate = this.auth.can(P.EVALUACIONES_DILIGENCIAR);
  protected readonly ownerOnly = !this.auth.can(P.FINCAS_VER, P.FINCAS_GESTIONAR);
  protected readonly productor = NOMBRE_PRODUCTOR;
  protected readonly sistemas = NOMBRE_SISTEMA;

  protected readonly farm = signal<FarmItem | null>(null);
  protected readonly history = signal<EvaluationSummary[]>([]);
  protected readonly species = signal<Species[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly choosing = signal(false);
  protected readonly starting = signal<string | null>(null);
  protected readonly tab = signal<Pestana>('tecnicas');

  protected readonly finished = computed(() => this.history().filter((e) => e.status === 'FINALIZADA'));
  protected readonly drafts = computed(() => this.history().filter((e) => e.status === 'BORRADOR'));

  ngOnInit() {
    this.cargar();
    if (this.canEdit) this.api.species().subscribe((s) => this.species.set(s));
  }

  protected cargar() {
    this.error.set(null);
    forkJoin({ farm: this.api.getFarm(this.id), history: this.api.history(this.id) }).subscribe({
      next: ({ farm, history }) => {
        this.farm.set(farm);
        this.history.set(history);
      },
      error: (e) => this.error.set(errorMessage(e, 'No se pudo cargar el predio.')),
    });
  }

  hasUnsavedChanges(): boolean {
    return this.editing() && !!this.formulario()?.isDirty();
  }

  protected draftFor(s: FarmSpeciesItem): EvaluationSummary | undefined {
    return this.drafts().find((d) => d.species.id === s.speciesId);
  }

  /** Con una sola especie empieza directo; con varias pregunta cuál evaluar. */
  protected realizarEvaluacion() {
    const especies = this.farm()!.species;
    if (especies.length === 1) this.iniciar(especies[0]);
    else this.choosing.set(true);
  }

  protected iniciar(s: FarmSpeciesItem) {
    this.starting.set(s.speciesId);
    this.api.startEvaluation(this.id, s.speciesId).subscribe({
      next: (e) => this.router.navigate(['/evaluaciones', e.id]),
      error: (e) => {
        this.starting.set(null);
        this.toast.error(errorMessage(e));
      },
    });
  }

  protected guardar(input: FarmInput) {
    this.saving.set(true);
    this.formError.set(null);
    this.api.updateFarm(this.id, input).subscribe({
      next: (farm) => {
        this.saving.set(false);
        this.farm.set(farm);
        this.editing.set(false);
        this.toast.success('Cambios del predio guardados.');
      },
      error: (e) => {
        this.saving.set(false);
        this.formError.set(errorMessage(e));
      },
    });
  }

  protected cancelarEdicion() {
    if (this.formulario()?.isDirty() && !window.confirm('Hay cambios sin guardar. ¿Descartarlos?')) return;
    this.editing.set(false);
  }

  protected async descargar(e: EvaluationSummary, kind: 'tecnico' | 'propietario') {
    try {
      await this.api.downloadReport(e.id, kind);
    } catch (err) {
      this.toast.error(errorMessage(err, 'No se pudo descargar el informe.'));
    }
  }

  protected ubicacion(f: FarmItem) {
    return [f.address, f.vereda && `vereda ${f.vereda}`, f.municipality, f.department].filter(Boolean).join(', ');
  }

  protected especies(f: FarmItem) {
    return f.species.map((s) => `${s.total} ${s.name.toLowerCase()}`).join(' y ');
  }
}
