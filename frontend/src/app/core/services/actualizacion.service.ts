import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

/** Cada cuánto se pregunta si hay una versión nueva publicada. */
export const INTERVALO_REVISION_MS = 5 * 60_000;

/**
 * Actualización en vivo: la aplicación abierta compara su versión con /version.json (que escribe
 * scripts/version.mjs en cada compilación). Cuando se publica una versión nueva, avisa para recargar;
 * no hace falta descargar el proyecto ni borrar la caché. En desarrollo no hay version.json y no hace nada.
 */
@Injectable({ providedIn: 'root' })
export class ActualizacionService {
  private readonly documento = inject(DOCUMENT);
  private actual: string | null = null;
  private iniciado = false;
  readonly disponible = signal(false);

  iniciar(intervaloMs = INTERVALO_REVISION_MS) {
    if (this.iniciado) return;
    this.iniciado = true;
    void this.revisar();
    setInterval(() => void this.revisar(), intervaloMs);
    // Al volver a la pestaña (p. ej. desde otra aplicación del teléfono) se revisa enseguida.
    this.documento.addEventListener('visibilitychange', () => {
      if (this.documento.visibilityState === 'visible') void this.revisar();
    });
  }

  async revisar(): Promise<void> {
    if (this.disponible()) return;
    const version = await leerVersion();
    if (!version) return;
    if (this.actual === null) this.actual = version;
    else if (version !== this.actual) this.disponible.set(true);
  }

  /** Carga la versión nueva. Lo guardado no se pierde: las evaluaciones se guardan solas. */
  recargar() {
    this.documento.defaultView?.location.reload();
  }
}

async function leerVersion(): Promise<string | null> {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const datos = (await r.json()) as { version?: unknown };
    return typeof datos.version === 'string' && datos.version.length <= 100 ? datos.version : null;
  } catch {
    return null;
  }
}
