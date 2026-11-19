import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NOMBRE_SISTEMA, puntajeTexto, Sistema } from '../../../compartido/norma';
import { analizarTableroConIA } from '../../../core/firebase/tablero-ia';
import { guardarArchivo } from '../../../core/informes/informes';
import { DatosTablero } from '../../../core/models/tablero';
import { AuthService } from '../../../core/services/auth.service';
import { FarmsApiService } from '../../../core/services/farms-api.service';
import { AnalisisTablero, analisisPorReglas } from '../../../core/tablero/analisis';
import { excelTablero } from '../../../core/tablero/excel';
import { pdfTablero, reporteTablero } from '../../../core/tablero/reporte-pdf';
import { FiltrosTablero, filtrarPeriodo, NOMBRE_PERIODO, opcionesFiltro, Periodo, resumirTablero } from '../../../core/tablero/resumen';
import { errorMessage } from '../../../core/utils/http-error';
import { ErrorCarga } from '../../../shared/components/error-carga/error-carga';
import { Esqueleto } from '../../../shared/components/esqueleto/esqueleto';
import { Nivel } from '../../../shared/components/nivel/nivel';
import { ToastService } from '../../../shared/services/toast.service';
import { Dona } from '../dona/dona';
import { Indicador } from '../indicador/indicador';
import { Medidor } from '../medidor/medidor';
import { Tendencia } from '../tendencia/tendencia';

const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
/** Meta de la norma que el tablero marca en cada libertad: nivel alto desde 4,0. */
export const META_ALTO = 4;

/**
 * Tablero de bienestar animal: indicadores con su variación, medidor del puntaje, distribución por
 * nivel, tendencia mensual, libertades frente a la meta, hallazgos, departamentos, predios que
 * requieren atención, análisis con IA y exportación a Excel y PDF. Cada rol ve lo que las reglas de
 * Firestore le dejan leer: el propietario, solo sus predios.
 */
@Component({
  selector: 'app-tablero',
  imports: [RouterLink, Esqueleto, ErrorCarga, Nivel, Indicador, Medidor, Dona, Tendencia],
  templateUrl: './tablero.html',
  styleUrl: './tablero.scss',
})
export class Tablero implements OnInit {
  private readonly api = inject(FarmsApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly periodos: Periodo[] = ['todo', '12m', '90d'];
  protected readonly nombrePeriodo = NOMBRE_PERIODO;
  protected readonly nombreSistema = NOMBRE_SISTEMA;
  protected readonly meta = META_ALTO;
  protected readonly decimal = (n: number | null) => (n === null ? '—' : puntajeTexto(n));

  protected readonly datos = signal<DatosTablero | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly periodo = signal<Periodo>('todo');
  protected readonly departamento = signal<string>('');
  protected readonly sistema = signal<Sistema | ''>('');
  protected readonly analisis = signal<AnalisisTablero | null>(null);
  protected readonly analizando = signal(false);
  protected readonly exportando = signal<'excel' | 'pdf' | null>(null);

  private readonly filtros = computed<FiltrosTablero>(() => ({ departamento: this.departamento() || null, sistema: this.sistema() || null }));
  protected readonly opciones = computed(() => (this.datos() ? opcionesFiltro(this.datos()!) : { departamentos: [], sistemas: [] }));
  protected readonly resumen = computed(() => {
    const d = this.datos();
    return d ? resumirTablero(d, this.periodo(), new Date(), this.filtros()) : null;
  });
  protected readonly serieCantidad = computed(() => this.resumen()?.porMes.map((m) => m.cantidad) ?? []);
  protected readonly seriePromedio = computed(() => this.resumen()?.porMes.map((m) => m.promedio) ?? []);
  protected readonly maxHallazgo = computed(() => Math.max(1, ...(this.resumen()?.hallazgosFrecuentes.map((h) => h.veces) ?? [1])));
  protected readonly maxDepartamento = computed(() => Math.max(1, ...(this.resumen()?.porDepartamento.map((d) => d.evaluaciones) ?? [1])));
  protected readonly alcance = computed(() => {
    const r = this.resumen();
    if (!r) return '';
    const partes = [this.nombrePeriodo[r.periodo].toLowerCase(), this.departamento() || null, this.sistema() ? this.nombreSistema[this.sistema() as Sistema].toLowerCase() : null];
    return partes.filter(Boolean).join(' · ');
  });

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
    this.analisis.set(null);
  }

  protected cambiarDepartamento(v: string) {
    this.departamento.set(v);
    this.analisis.set(null);
  }

  protected cambiarSistema(v: string) {
    this.sistema.set(v as Sistema | '');
    this.analisis.set(null);
  }

  protected limpiarFiltros() {
    this.departamento.set('');
    this.sistema.set('');
    this.periodo.set('todo');
    this.analisis.set(null);
  }

  /** Pide el análisis a la IA; si no responde, usa el de reglas. */
  protected async analizar() {
    const r = this.resumen();
    if (!r || this.analizando()) return;
    this.analizando.set(true);
    this.analisis.set((await analizarTableroConIA(r)) ?? analisisPorReglas(r));
    this.analizando.set(false);
  }

  private generado() {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date());
  }

  /** Libro de Excel con el tablero (gráficos nativos), las evaluaciones, los hallazgos y el análisis. */
  protected async exportarExcel() {
    const d = this.datos();
    const r = this.resumen();
    if (!d || !r) return;
    this.exportando.set('excel');
    try {
      const filas = filtrarPeriodo(d.evaluaciones, this.periodo(), new Date(), this.filtros()).sort((a, b) => b.finalizada.localeCompare(a.finalizada));
      const blob = await excelTablero(r, filas, this.analisis() ?? analisisPorReglas(r), {
        generado: this.generado(), quien: this.auth.fullName(), alcance: this.alcance(),
      });
      guardarArchivo(blob, `tablero-bienestar-animal-${hoy()}.xlsx`);
      this.toast.success(`Se descargó el libro de Excel con ${filas.length} ${filas.length === 1 ? 'evaluación' : 'evaluaciones'}.`);
    } catch (e) {
      console.error(e);
      this.toast.error(errorMessage(e, 'No se pudo generar el archivo de Excel.'));
    }
    this.exportando.set(null);
  }

  protected async exportarPdf() {
    const r = this.resumen();
    if (!r) return;
    this.exportando.set('pdf');
    try {
      guardarArchivo(await pdfTablero(reporteTablero(r, this.analisis(), this.generado(), this.auth.fullName())), `reporte-tablero-${hoy()}.pdf`);
    } catch (e) {
      this.toast.error(errorMessage(e, 'No se pudo generar el reporte.'));
    }
    this.exportando.set(null);
  }
}
