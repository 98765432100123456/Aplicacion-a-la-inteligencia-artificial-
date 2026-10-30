import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HasUnsavedChanges } from '../../../core/guards/guards';
import { P } from '../../../core/models/models';
import { EvaluationDetail } from '../../../core/models/predios';
import { AuthService } from '../../../core/services/auth.service';
import { FarmsApiService } from '../../../core/services/farms-api.service';
import { errorMessage } from '../../../core/utils/http-error';
import { EvaluationForm } from '../evaluation-form/evaluation-form';
import { EvaluationResult } from '../evaluation-result/evaluation-result';
import { Esqueleto } from '../../../shared/components/esqueleto/esqueleto';
import { ErrorCarga } from '../../../shared/components/error-carga/error-carga';

/** Muestra el formulario mientras la evaluación está en borrador y el resultado cuando se finaliza. */
@Component({
  selector: 'app-evaluation-page',
  imports: [Esqueleto, ErrorCarga, RouterLink, EvaluationForm, EvaluationResult],
  templateUrl: './evaluation-page.html',
  styleUrl: './evaluation-page.scss',
})
export class EvaluationPage implements OnInit, HasUnsavedChanges {
  private readonly api = inject(FarmsApiService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  private readonly form = viewChild(EvaluationForm);
  protected readonly canEvaluate = inject(AuthService).can(P.EVALUACIONES_DILIGENCIAR);
  protected readonly evaluation = signal<EvaluationDetail | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.cargar();
  }

  protected cargar() {
    this.error.set(null);
    this.api.getEvaluation(this.id).subscribe({
      next: (e) => this.evaluation.set(e),
      error: (e) => this.error.set(errorMessage(e, 'No se pudo cargar la evaluación.')),
    });
  }

  hasUnsavedChanges(): boolean {
    return !!this.form()?.hasPending();
  }

  protected finalizada(e: EvaluationDetail) {
    this.evaluation.set(e);
    window.scrollTo({ top: 0 });
  }
}
