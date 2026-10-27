import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, from, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PERMISOS } from '../../compartido/permisos';
import { PrediosEvaluacionesFirebase } from '../firebase/predios-evaluaciones';
import { guardarArchivo } from '../informes/informes';
import { EvaluationDetail, EvaluationSummary, FarmInput, FarmItem, SaveEvaluationInput, Species } from '../models/predios';
import { AuthService } from './auth.service';

/** Predios, evaluaciones e informes: Firestore en uso real; la API simulada en el modo demostración. */
@Injectable({ providedIn: 'root' })
export class FarmsApiService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private readonly real = environment.demo
    ? null
    : new PrediosEvaluacionesFirebase(() => {
        const u = this.auth.user()!;
        return {
          uid: u.id,
          correo: u.email.toLowerCase(),
          nombre: `${u.firstName} ${u.lastName}`,
          todosLosPredios: this.auth.can(PERMISOS.FINCAS_VER, PERMISOS.FINCAS_GESTIONAR),
          personal: this.auth.can(PERMISOS.EVALUACIONES_VER, PERMISOS.EVALUACIONES_DILIGENCIAR, PERMISOS.REPORTES_VER),
        };
      });

  species(): Observable<Species[]> {
    return this.real ? from(this.real.species()) : this.http.get<Species[]>(`${this.api}/species`);
  }

  listFarms(search = ''): Observable<FarmItem[]> {
    if (this.real) return from(this.real.listFarms(search));
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<FarmItem[]>(`${this.api}/farms`, { params });
  }

  getFarm(id: string): Observable<FarmItem> {
    return this.real ? from(this.real.getFarm(id)) : this.http.get<FarmItem>(`${this.api}/farms/${id}`);
  }

  createFarm(input: FarmInput): Observable<FarmItem> {
    return this.real ? from(this.real.createFarm(input)) : this.http.post<FarmItem>(`${this.api}/farms`, input);
  }

  updateFarm(id: string, input: Partial<FarmInput>): Observable<FarmItem> {
    return this.real ? from(this.real.updateFarm(id, input)) : this.http.patch<FarmItem>(`${this.api}/farms/${id}`, input);
  }

  history(farmId: string): Observable<EvaluationSummary[]> {
    return this.real ? from(this.real.history(farmId)) : this.http.get<EvaluationSummary[]>(`${this.api}/farms/${farmId}/evaluations`);
  }

  startEvaluation(farmId: string, speciesId: string): Observable<EvaluationDetail> {
    return this.real
      ? from(this.real.startEvaluation(farmId, speciesId))
      : this.http.post<EvaluationDetail>(`${this.api}/farms/${farmId}/evaluations`, { speciesId });
  }

  getEvaluation(id: string): Observable<EvaluationDetail> {
    return this.real ? from(this.real.getEvaluation(id)) : this.http.get<EvaluationDetail>(`${this.api}/evaluations/${id}`);
  }

  saveEvaluation(id: string, input: SaveEvaluationInput): Observable<EvaluationDetail> {
    return this.real ? from(this.real.saveEvaluation(id, input)) : this.http.put<EvaluationDetail>(`${this.api}/evaluations/${id}`, input);
  }

  finalize(id: string): Observable<EvaluationDetail> {
    return this.real ? from(this.real.finalize(id)) : this.http.post<EvaluationDetail>(`${this.api}/evaluations/${id}/finalize`, {});
  }

  regenerateRecommendations(id: string): Observable<EvaluationDetail> {
    return this.real
      ? from(this.real.regenerateRecommendations(id))
      : this.http.post<EvaluationDetail>(`${this.api}/evaluations/${id}/recommendations`, {});
  }

  /** Genera el PDF y lo descarga con su nombre. */
  async downloadReport(evaluationId: string, kind: 'tecnico' | 'propietario') {
    if (this.real) return this.real.downloadReport(evaluationId, kind);
    const res = await firstValueFrom(
      this.http.get(`${this.api}/evaluations/${evaluationId}/reports/${kind}`, { responseType: 'blob', observe: 'response' }),
    );
    const nombre = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? `informe-${kind}.pdf`;
    guardarArchivo(res.body!, nombre);
  }
}
