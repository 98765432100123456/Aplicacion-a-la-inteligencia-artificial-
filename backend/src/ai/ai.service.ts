import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resultado } from '../compartido/calificacion';
import { Indicador, NOMBRE_RESPUESTA } from '../compartido/lista-chequeo';
import { LIBERTADES, NIVELES } from '../compartido/norma';
import { Prioridad, Recomendacion, Recomendaciones } from '../compartido/recomendaciones';
import { AppConfig } from '../config/configuration';

export interface ContextoRecomendacion {
  especie: string;
  productor: string;
  municipio: string;
  resultado: Resultado;
  lista: Indicador[];
}

const SISTEMA = `Eres un asesor de bienestar animal que escribe para propietarios de fincas ganaderas en Colombia.
Recibes los resultados de una evaluación hecha con la Metodología para evaluar el bienestar animal en las especies bovina y bufalina del ICA (versión 2.0, 2023) y debes explicar al propietario qué mejorar.

Cómo escribir:
- Español de Colombia, sencillo y respetuoso, de usted. Frases cortas. Sin palabras técnicas; si una es necesaria, explícala en la misma frase.
- Cada recomendación dice el problema encontrado, por qué le importa al propietario (salud de los animales, producción, cumplimiento del ICA) y de dos a cuatro acciones concretas que pueda hacer en su finca.
- Basa las acciones en las orientaciones de referencia que acompañan cada hallazgo. Puedes agregar prácticas de manejo reconocidas, pero no inventes normas, artículos, cifras ni nombres de productos.
- Prioridad ALTA para incumplimientos críticos o de libertades en nivel bajo (la metodología exige corregirlos con urgencia), MEDIA para incumplimientos totales, BAJA para cumplimientos parciales.
- Agrupa hallazgos parecidos en una sola recomendación cuando tengan la misma solución.
- El resumen tiene dos o tres frases: el nivel obtenido, lo más urgente y un mensaje que anime a mejorar.
- No reemplazas al ICA ni al veterinario; cuando una acción requiera un profesional, dilo.`;

const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumen', 'recomendaciones'],
  properties: {
    resumen: { type: 'string' },
    recomendaciones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['prioridad', 'titulo', 'problema', 'porque', 'acciones'],
        properties: {
          prioridad: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'] },
          titulo: { type: 'string' },
          problema: { type: 'string' },
          porque: { type: 'string' },
          acciones: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

/**
 * Recomendaciones en lenguaje sencillo generadas con Claude (RF24, RF25). Si no hay
 * clave configurada o el servicio falla, devuelve null y la evaluación usa las
 * recomendaciones por reglas, sin bloquearse (RNF26).
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(config: ConfigService<AppConfig, true>) {
    const ai = config.get('ai', { infer: true });
    this.model = ai.model;
    this.client = ai.apiKey ? new Anthropic({ apiKey: ai.apiKey, timeout: ai.timeoutMs, maxRetries: 1 }) : null;
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  async recommend(ctx: ContextoRecomendacion): Promise<Recomendaciones | null> {
    if (!this.client || !ctx.resultado.hallazgos.length) return null;
    try {
      const response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: ESQUEMA } },
        system: SISTEMA,
        messages: [{ role: 'user', content: JSON.stringify(this.datos(ctx), null, 2) }],
      });
      if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
        this.logger.warn(`La IA no completó las recomendaciones (${response.stop_reason}); se usan las reglas.`);
        return null;
      }
      const texto = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
      const salida = this.validar(JSON.parse(texto));
      return salida && { origen: 'IA', modelo: response.model, ...salida };
    } catch (error) {
      if (error instanceof Anthropic.APIError) this.logger.warn(`Servicio de IA no disponible (${error.status}); se usan las reglas.`);
      else this.logger.warn(`Respuesta de IA no válida; se usan las reglas. ${(error as Error).message}`);
      return null;
    }
  }

  /** Datos de la evaluación sin información personal del propietario (RNF27). */
  private datos({ especie, productor, municipio, resultado, lista }: ContextoRecomendacion) {
    const nivel = (c: string | null) => NIVELES.find((n) => n.codigo === c)?.nombre ?? 'sin dato';
    const porCodigo = new Map(lista.map((i) => [i.codigo, i]));
    return {
      especie,
      tipo_de_productor: productor,
      municipio,
      calificacion: { puntaje_de_0_a_5: resultado.puntaje, nivel: nivel(resultado.nivel) },
      libertades: resultado.libertades.map((l) => ({
        libertad: LIBERTADES.find((x) => x.codigo === l.codigo)!.corto,
        peso_en_la_nota: `${l.peso} %`,
        puntaje: l.puntaje,
        nivel: nivel(l.nivel),
      })),
      hallazgos: resultado.hallazgos.map((h) => {
        const i = porCodigo.get(h.codigo)!;
        return {
          indicador: h.texto,
          resultado: NOMBRE_RESPUESTA[h.respuesta],
          critico: h.critico,
          libertad: LIBERTADES.find((x) => x.codigo === h.libertad)!.corto,
          libertad_en_nivel_bajo: resultado.libertadesBajas.includes(h.libertad),
          observacion_del_evaluador: h.observacion,
          orientacion_de_referencia: i.propietario,
        };
      }),
    };
  }

  private validar(x: unknown): { resumen: string; recomendaciones: Recomendacion[] } | null {
    const o = x as { resumen?: unknown; recomendaciones?: unknown };
    if (typeof o?.resumen !== 'string' || !Array.isArray(o.recomendaciones)) return null;
    const prioridades: Prioridad[] = ['ALTA', 'MEDIA', 'BAJA'];
    const recomendaciones = (o.recomendaciones as Recomendacion[]).filter(
      (r) =>
        prioridades.includes(r?.prioridad) &&
        [r.titulo, r.problema, r.porque].every((t) => typeof t === 'string' && t.trim()) &&
        Array.isArray(r.acciones) && r.acciones.length > 0 && r.acciones.every((a) => typeof a === 'string'),
    );
    if (!recomendaciones.length) return null;
    recomendaciones.sort((a, b) => prioridades.indexOf(a.prioridad) - prioridades.indexOf(b.prioridad));
    return { resumen: o.resumen.trim(), recomendaciones };
  }
}
