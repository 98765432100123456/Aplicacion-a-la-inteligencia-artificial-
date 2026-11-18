import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { puntajeTexto } from '../../../compartido/norma';
import { analizarTableroConIA } from '../../../core/firebase/tablero-ia';
import { guardarArchivo } from '../../../core/informes/informes';
import { DatosTablero } from '../../../core/models/tablero';
import { AuthService } from '../../../core/services/auth.service';
import { FarmsApiService } from '../../../core/services/farms-api.service';
import { AnalisisTablero, analisisPorReglas } from '../../../core/tablero/analisis';
import { pdfTablero, reporteTablero } from '../../../core/tablero/reporte-pdf';
import { evaluacionesCsv, filtrarPeriodo, NOMBRE_PERIODO, Periodo, resumirTablero } from '../../../core/tablero/resumen';
import { errorMessage } from '../../../core/utils/http-error';
import { ErrorCarga } from '../../../shared/components/error-carga/error-carga';
import { Esqueleto } from '../../../shared/components/esqueleto/esqueleto';
import { Nivel } from '../../../shared/components/nivel/nivel';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ToastService } from '../../../shared/services/toast.service';

const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

/**
 * Tablero: cifras de las evaluaciones finalizadas, gráficas por nivel, libertad y mes, criterios con
 * más hallazgos, análisis con IA (o por reglas) y exportación a Excel y PDF. Cada rol ve lo que las
 * reglas de Firestore le dejan leer: el propietario, solo sus predios.
 */
@Component({
  selector: 'app-tablero',
  imports: [RouterLink, PageHeader, Esqueleto, ErrorCarga, Nivel],
  templateUrl: './tablero.html',
  styleUrl: './tablero.scss',
})
export class Tablero implements OnInit {
  private readonly api = inject(FarmsApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly periodos: Periodo[] = ['todo', '12m', '90d'];
  protected readonly nombrePeriodo = NOMBRE_PERIODO;
  protected readonly decimal = (n: number | null) => (n === null ? '—' : puntajeTexto(n));

  protected readonly datos = signal<DatosTablero | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly periodo = signal<Periodo>('todo');
  protected readonly analisis = signal<AnalisisTablero | null>(null);
  protected readonly analizando = signal(false);
  protected readonly exportando = signal<'csv' | 'pdf' | null>(null);

  protected readonly resumen = computed(() => {
    const d = this.datos();
    return d ? resumirTablero(d, this.periodo()) : null;
  });
  /** Escala de la gráfica mensual: el mes con más evaluaciones ocupa toda la altura. */
  protected readonly maxMes = computed(() => Math.max(1, ...(this.resumen()?.porMes.map((m) => m.cantidad) ?? [1])));
  protected readonly maxHallazgo = computed(() => Math.max(1, ...(this.resumen()?.hallazgosFrecuentes.map((h) => h.veces) ?? [1])));

  ngOnInit() {
    this.cargar();
  }

  protected cargar() {
    this.error.set(null);
    this.api.dashboard().subscribe({
      next: (d) => this.datos.set(d),
      error: (e) => this.error.set(errorMessage(e, 'No se pudo cargar el tablero.')),
    });
  }

  protected cambiarPeriodo(p: Periodo) {
    this.periodo.set(p);
    // El análisis anterior corresponde a otras cifras.
    this.analisis.set(null);
  }

  protected porcentaje(cantidad: number) {
    const total = this.resumen()?.evaluaciones ?? 0;
    return total ? Math.round((cantidad / total) * 100) : 0;
  }

  /** Pide el análisis a la IA; si no responde, usa el de reglas. */
  protected async analizar() {
    const r = this.resumen();
    if (!r || this.analizando()) return;
    this.analizando.set(true);
    this.analisis.set((await analizarTableroConIA(r)) ?? analisisPorReglas(r));
    this.analizando.set(false);
  }

  protected exportarExcel() {
    const d = this.datos();
    if (!d) return;
    this.exportando.set('csv');
    const filas = filtrarPeriodo(d.evaluaciones, this.periodo()).sort((a, b) => b.finalizada.localeCompare(a.finalizada));
    guardarArchivo(new Blob([evaluacionesCsv(filas)], { type: 'text/csv;charset=utf-8' }), `evaluaciones-bienestar-${hoy()}.csv`);
    this.toast.success(`Se descargó el archivo con ${filas.length} ${filas.length === 1 ? 'evaluación' : 'evaluaciones'}.`);
    this.exportando.set(null);
  }

  protected async exportarPdf() {
    const r = this.resumen();
    if (!r) return;
    this.exportando.set('pdf');
    try {
      const generado = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date());
      guardarArchivo(await pdfTablero(reporteTablero(r, this.analisis(), generado, this.auth.fullName())), `reporte-tablero-${hoy()}.pdf`);
    } catch (e) {
      this.toast.error(errorMessage(e, 'No se pudo generar el reporte.'));
    }
    this.exportando.set(null);
  }
}
