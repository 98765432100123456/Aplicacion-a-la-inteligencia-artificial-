import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { P } from '../../../core/models/models';
import { EvaluationDetail } from '../../../core/models/predios';
import { AuthService } from '../../../core/services/auth.service';
import { FarmsApiService } from '../../../core/services/farms-api.service';
import { errorMessage } from '../../../core/utils/http-error';
import { NOMBRE_RESPUESTA } from '../../../compartido/lista-chequeo';
import { LIBERTADES, NOMBRE_PRODUCTOR } from '../../../compartido/norma';
import { AVISO_RECOMENDACIONES, NOMBRE_PRIORIDAD } from '../../../compartido/recomendaciones';
import { Nivel } from '../../../shared/components/nivel/nivel';
import { ToastService } from '../../../shared/services/toast.service';

/** Resultado de una evaluación finalizada: nivel, libertades, hallazgos, recomendaciones e informes. */
@Component({
  selector: 'app-evaluation-result',
  imports: [DatePipe, Nivel],
  templateUrl: './evaluation-result.html',
  styleUrl: './evaluation-result.scss',
})
export class EvaluationResult {
  readonly evaluation = input.required<EvaluationDetail>();
  readonly updated = output<EvaluationDetail>();

  private readonly api = inject(FarmsApiService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  protected readonly ownerOnly = !this.auth.can(P.FINCAS_VER, P.FINCAS_GESTIONAR);
  protected readonly canEvaluate = this.auth.can(P.EVALUACIONES_DILIGENCIAR);
  protected readonly prioridad = NOMBRE_PRIORIDAD;
  protected readonly respuesta = NOMBRE_RESPUESTA;
  protected readonly productor = NOMBRE_PRODUCTOR;
  protected readonly aviso = AVISO_RECOMENDACIONES;
  protected readonly regenerating = signal(false);
  protected readonly downloading = signal<string | null>(null);

  protected readonly corto = (codigo: string) => LIBERTADES.find((l) => l.codigo === codigo)?.corto ?? codigo;
  protected readonly bajas = computed(() => (this.evaluation().results?.libertadesBajas ?? []).map(this.corto));
  protected readonly respuestasPorLibertad = computed(() => {
    const e = this.evaluation();
    const porCodigo = new Map(e.answers.map((a) => [a.indicatorCode, a]));
    return LIBERTADES.map((l) => ({
      nombre: l.nombre,
      filas: e.checklist.filter((i) => i.libertad === l.codigo).map((i) => ({ ...i, r: porCodigo.get(i.codigo) })),
    }));
  });

  protected async descargar(kind: 'tecnico' | 'propietario') {
    this.downloading.set(kind);
    try {
      await this.api.downloadReport(this.evaluation().id, kind);
    } catch (e) {
      this.toast.error(errorMessage(e, 'No se pudo descargar el informe.'));
    }
    this.downloading.set(null);
  }

  protected regenerar() {
    this.regenerating.set(true);
    this.api.regenerateRecommendations(this.evaluation().id).subscribe({
      next: (e) => {
        this.regenerating.set(false);
        this.updated.emit(e);
        this.toast.success(e.recommendation?.origen === 'IA' ? 'Recomendaciones generadas con IA.' : 'La IA no está disponible; se mantienen las recomendaciones del sistema.');
      },
      error: (err) => {
        this.regenerating.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
