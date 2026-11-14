import { afterRenderEffect, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { responderConIA, Turno } from '../../../core/firebase/asistente-ia';
import { AuthService } from '../../../core/services/auth.service';
import { EstadoMascota, Mascota } from '../mascota/mascota';
import { buscarRespuesta, PreguntaFrecuente, preguntasPara } from '../preguntas';

interface Mensaje {
  id: number;
  autor: 'persona' | 'asistente';
  parrafos: string[];
  enlace?: { texto: string; ruta: string };
}

const SUGERIDAS_VISIBLES = 4;
/** Tope de preguntas libres por sesión y espera mínima entre ellas: cada una consume cuota del modelo. */
const PREGUNTAS_LIBRES_MAXIMAS = 30;
const ESPERA_ENTRE_PREGUNTAS_MS = 2_000;
/** Pausa breve antes de una respuesta establecida: deja ver que Clara "piensa" sin hacer esperar. */
const PAUSA_MS = 550;

/**
 * Asistente flotante: un botón con la mascota abre un panel pequeño, no bloqueante, con
 * preguntas sugeridas según el rol y un campo para preguntar con sus propias palabras.
 * Las respuestas establecidas funcionan sin conexión a la IA; la pregunta libre usa Gemini
 * (Firebase AI Logic) cuando está disponible.
 */
@Component({
  selector: 'app-asistente',
  imports: [FormsModule, RouterLink, Mascota],
  templateUrl: './asistente.html',
  styleUrl: './asistente.scss',
  host: { '(document:keydown.escape)': 'cerrar(true)' },
})
export class Asistente {
  private readonly auth = inject(AuthService);
  private readonly lanzador = viewChild.required<ElementRef<HTMLButtonElement>>('lanzador');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly registro = viewChild<ElementRef<HTMLElement>>('registro');
  private siguienteId = 1;
  private hablandoHasta = 0;
  private preguntasLibres = 0;
  private ultimaPregunta = 0;

  protected readonly abierto = signal(false);
  protected readonly pensando = signal(false);
  protected readonly hablando = signal(false);
  protected readonly todas = signal(false);
  protected readonly texto = signal('');
  protected readonly mensajes = signal<Mensaje[]>([]);
  private readonly respondidas = signal<Set<string>>(new Set());

  protected readonly estado = computed<EstadoMascota>(() => (this.pensando() ? 'pensando' : this.hablando() ? 'hablando' : 'reposo'));
  private readonly disponibles = computed(() => {
    this.auth.user();
    return preguntasPara((...p) => this.auth.can(...p));
  });
  protected readonly sugeridas = computed(() => {
    const pendientes = this.disponibles().filter((p) => !this.respondidas().has(p.id));
    return this.todas() ? pendientes : pendientes.slice(0, SUGERIDAS_VISIBLES);
  });
  protected readonly hayMas = computed(
    () => !this.todas() && this.disponibles().filter((p) => !this.respondidas().has(p.id)).length > SUGERIDAS_VISIBLES,
  );

  constructor() {
    // La conversación siempre muestra lo último que se dijo.
    afterRenderEffect(() => {
      this.mensajes();
      this.pensando();
      const r = this.registro()?.nativeElement;
      if (r) r.scrollTop = r.scrollHeight;
    });
  }

  protected alternar() {
    if (this.abierto()) return this.cerrar(true);
    if (!this.mensajes().length) {
      const nombre = this.auth.user()?.firstName;
      this.agregar('asistente', [
        `Hola${nombre ? `, ${nombre}` : ''}. Soy Clara, la asistente de ICA Bienestar.`,
        'Elija una pregunta o escriba la suya.',
      ]);
    }
    this.abierto.set(true);
    // El foco entra al panel sin abrir el teclado del teléfono.
    queueMicrotask(() => setTimeout(() => this.panel()?.nativeElement.focus()));
  }

  cerrar(devolverFoco: boolean) {
    if (!this.abierto()) return;
    this.abierto.set(false);
    if (devolverFoco) this.lanzador().nativeElement.focus();
  }

  protected async elegir(p: PreguntaFrecuente) {
    if (this.pensando()) return;
    this.agregar('persona', [p.pregunta]);
    this.respondidas.update((s) => new Set(s).add(p.id));
    this.pensando.set(true);
    await new Promise((r) => setTimeout(r, PAUSA_MS));
    this.responder(p.respuesta, p.enlace);
  }

  protected async enviar() {
    const pregunta = this.texto().trim().slice(0, 500);
    if (!pregunta || this.pensando()) return;
    if (Date.now() - this.ultimaPregunta < ESPERA_ENTRE_PREGUNTAS_MS) return;
    this.ultimaPregunta = Date.now();
    this.texto.set('');
    if (++this.preguntasLibres > PREGUNTAS_LIBRES_MAXIMAS) {
      this.agregar('persona', [pregunta]);
      return this.responder([
        'Ya respondí muchas preguntas en esta sesión. Para cuidar el servicio, use por ahora las preguntas sugeridas.',
      ]);
    }
    const historial: Turno[] = this.mensajes().map((m) => ({ autor: m.autor, texto: m.parrafos.join(' ') }));
    this.agregar('persona', [pregunta]);
    this.pensando.set(true);
    const base = this.disponibles();
    const conocida = buscarRespuesta(pregunta, base);
    const ia = await responderConIA(pregunta, historial, base);
    if (ia) return this.responder([ia], conocida?.enlace);
    if (conocida) {
      this.respondidas.update((s) => new Set(s).add(conocida.id));
      return this.responder(conocida.respuesta, conocida.enlace);
    }
    this.responder([
      'No tengo una respuesta establecida para eso todavía.',
      'Pruebe con una de las preguntas sugeridas o consulte al administrador del sistema.',
    ]);
  }

  protected limpiar() {
    this.mensajes.set([]);
    this.respondidas.set(new Set());
    this.todas.set(false);
    this.agregar('asistente', ['Empecemos de nuevo. ¿En qué le ayudo?']);
  }

  private responder(parrafos: string[], enlace?: Mensaje['enlace']) {
    this.pensando.set(false);
    this.agregar('asistente', parrafos, enlace);
    this.hablando.set(true);
    const hasta = (this.hablandoHasta = Date.now() + 1300);
    setTimeout(() => Date.now() >= hasta && this.hablando.set(false), 1300);
  }

  private agregar(autor: Mensaje['autor'], parrafos: string[], enlace?: Mensaje['enlace']) {
    this.mensajes.update((m) => [...m, { id: this.siguienteId++, autor, parrafos, enlace }]);
  }
}
