import { afterNextRender, ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { TemaService } from '../../../core/services/tema.service';
import { Foto } from '../../../shared/components/foto/foto';
import { Nivel } from '../../../shared/components/nivel/nivel';
import { PageHeader } from '../../../shared/components/page-header/page-header';

interface Muestra {
  variable: string;
  nombre: string;
  uso: string;
}

const COLORES: { grupo: string; muestras: Muestra[] }[] = [
  {
    grupo: 'Superficies',
    muestras: [
      { variable: '--fondo', nombre: 'Fondo', uso: 'Lienzo de todas las pantallas' },
      { variable: '--superficie', nombre: 'Superficie', uso: 'Paneles, campos y tarjetas' },
      { variable: '--noche', nombre: 'Noche', uso: 'Héroe de ingreso y pestaña activa' },
    ],
  },
  {
    grupo: 'Texto y líneas',
    muestras: [
      { variable: '--tinta', nombre: 'Tinta', uso: 'Títulos y texto principal' },
      { variable: '--tinta-suave', nombre: 'Tinta suave', uso: 'Texto secundario' },
      { variable: '--linea', nombre: 'Línea', uso: 'Separadores' },
    ],
  },
  {
    grupo: 'Acción y estado',
    muestras: [
      { variable: '--accion', nombre: 'Pasto', uso: 'Única acción principal de cada pantalla' },
      { variable: '--acento', nombre: 'Acento', uso: 'Enlaces y elemento activo' },
      { variable: '--maiz', nombre: 'Maíz', uso: 'Advertencias y nivel medio' },
      { variable: '--alerta', nombre: 'Alerta', uso: 'Errores y nivel bajo' },
    ],
  },
];

const TIPOS = [
  { variable: '--texto-heroe', nombre: 'Héroe', muestra: 'Bienestar animal' },
  { variable: '--texto-3xl', nombre: 'Titular', muestra: 'Evaluación de bovinos' },
  { variable: '--texto-2xl', nombre: 'Sección', muestra: 'Resultado por libertad' },
  { variable: '--texto-xl', nombre: 'Subsección', muestra: 'Datos del predio' },
  { variable: '--texto-md', nombre: 'Cuerpo', muestra: 'El agua debe estar limpia y disponible todo el día.' },
  { variable: '--texto-sm', nombre: 'Apoyo', muestra: 'Inspección visual con muestreo' },
  { variable: '--texto-xs', nombre: 'Nota', muestra: 'Generado el 30 de octubre de 2026' },
];

const ESPACIOS = ['--e-1', '--e-2', '--e-3', '--e-4', '--e-6', '--e-8', '--e-12', '--e-16', '--e-24'];

/**
 * Sistema de diseño vivo: muestra los colores, la tipografía, el espacio y los
 * componentes tal como los usa la aplicación, leídos de styles/_tokens.scss.
 * Al cambiar de modo, los valores se vuelven a leer.
 */
@Component({
  selector: 'app-sistema-diseno',
  imports: [PageHeader, Nivel, Foto],
  templateUrl: './sistema-diseno.html',
  styleUrl: './sistema-diseno.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaDiseno {
  private readonly tema = inject(TemaService);
  protected readonly colores = COLORES;
  protected readonly tipos = TIPOS;
  protected readonly espacios = ESPACIOS;
  protected readonly valores = signal<Record<string, string>>({});
  protected readonly interruptor = signal(true);
  protected readonly vista = signal<'lista' | 'tabla'>('lista');

  constructor() {
    afterNextRender(() => this.leer());
    effect(() => {
      this.tema.tema();
      queueMicrotask(() => this.leer());
    });
  }

  private leer() {
    const estilo = getComputedStyle(document.documentElement);
    const variables = [...COLORES.flatMap((g) => g.muestras.map((m) => m.variable)), ...TIPOS.map((t) => t.variable), ...ESPACIOS];
    this.valores.set(Object.fromEntries(variables.map((v) => [v, estilo.getPropertyValue(v).trim()])));
  }
}
