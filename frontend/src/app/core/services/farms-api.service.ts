import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EvaluationDetail, EvaluationSummary, FarmInput, FarmItem, SaveEvaluationInput, Species } from '../models/predios';

/** Acceso a predios, evaluaciones e informes de la API. */
@Injectable({ providedIn: 'root' })
export class FarmsApiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  species() {
    return this.http.get<Species[]>(`${this.api}/species`);
  }

  listFarms(search = '') {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<FarmItem[]>(`${this.api}/farms`, { params });
  }

  getFarm(id: string) {
    return this.http.get<FarmItem>(`${this.api}/farms/${id}`);
  }

  createFarm(input: FarmInput) {
    return this.http.post<FarmItem>(`${this.api}/farms`, input);
  }

  updateFarm(id: string, input: Partial<FarmInput>) {
    return this.http.patch<FarmItem>(`${this.api}/farms/${id}`, input);
  }

  history(farmId: string) {
    return this.http.get<EvaluationSummary[]>(`${this.api}/farms/${farmId}/evaluations`);
  }

  startEvaluation(farmId: string, speciesId: string) {
    return this.http.post<EvaluationDetail>(`${this.api}/farms/${farmId}/evaluations`, { speciesId });
  }

  getEvaluation(id: string) {
    return this.http.get<EvaluationDetail>(`${this.api}/evaluations/${id}`);
  }

  saveEvaluation(id: string, input: SaveEvaluationInput) {
    return this.http.put<EvaluationDetail>(`${this.api}/evaluations/${id}`, input);
  }

  finalize(id: string) {
    return this.http.post<EvaluationDetail>(`${this.api}/evaluations/${id}/finalize`, {});
  }

  regenerateRecommendations(id: string) {
    return this.http.post<EvaluationDetail>(`${this.api}/evaluations/${id}/recommendations`, {});
  }

  /** Descarga el PDF con el nombre que envía el servicio. */
  async downloadReport(evaluationId: string, kind: 'tecnico' | 'propietario') {
    const res = await firstValueFrom(
      this.http.get(`${this.api}/evaluations/${evaluationId}/reports/${kind}`, { responseType: 'blob', observe: 'response' }),
    );
    const nombre = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? `informe-${kind}.pdf`;
    const url = URL.createObjectURL(res.body!);
    const enlace = Object.assign(document.createElement('a'), { href: url, download: nombre });
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
