import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Arbol, Opcion, recorrerArbol, RutaArbol, rutaLimpia } from '../../../compartido/escenarios';
import { NIVELES } from '../../../compartido/norma';

/**
 * Un criterio calificado con su árbol de escenarios: una lista desplegable por pregunta,
 * siguiendo el camino del diagrama, y la suma de puntos en vivo. Si el evaluador cambia
 * una respuesta, las preguntas que ya no están en el camino desaparecen y el puntaje se
 * recalcula. El puntaje solo se ve en este formulario, que usa el evaluador.
 */
@Component({
  selector: 'app-arbol-escenario',
  templateUrl: './arbol-escenario.html',
  styleUrl: './arbol-escenario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArbolEscenario {
  readonly arbol = input.required<Arbol>();
  readonly valor = input<RutaArbol | undefined>(undefined);
  readonly cambio = output<RutaArbol>();

  protected readonly observando = signal(false);
  protected readonly estado = computed(() => recorrerArbol(this.arbol(), this.valor()?.ruta));
  protected readonly nivel = computed(() => {
    const n = this.estado().nivel;
    return n ? NIVELES.find((x) => x.codigo === n)!.nombre : null;
  });

  protected texto(o: Opcion): string {
    if (o.noAplica) return `${o.texto} (no aplica)`;
    const signo = o.puntos >= 0 ? '+' : '';
    return `${o.texto} (${signo}${o.puntos} ${Math.abs(o.puntos) === 1 ? 'punto' : 'puntos'})`;
  }

  protected elegir(preguntaId: string, opcionId: string) {
    const ruta = { ...(this.valor()?.ruta ?? {}) };
    if (opcionId) ruta[preguntaId] = opcionId;
    else delete ruta[preguntaId];
    this.cambio.emit({ ruta: rutaLimpia(this.arbol(), ruta), observacion: this.valor()?.observacion ?? null });
  }

  protected observar(texto: string) {
    this.cambio.emit({ ruta: this.valor()?.ruta ?? {}, observacion: texto.trim() ? texto : null });
  }

  protected mostrarObservacion() {
    this.observando.set(true);
    setTimeout(() => document.getElementById(`obs-arbol-${this.arbol().id}`)?.focus());
  }
}
