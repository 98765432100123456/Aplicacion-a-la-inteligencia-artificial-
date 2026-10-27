import { ConfigService } from '@nestjs/config';
import { calificar } from '../compartido/calificacion';
import { LISTA_BOVINOS } from '../compartido/lista-chequeo';
import { AiService } from './ai.service';

const respuestas = Object.fromEntries(LISTA_BOVINOS.map((i) => [i.codigo, { respuesta: i.codigo === 'S1' ? 'NO_CUMPLE' : 'CUMPLE' } as const]));
const contexto = { especie: 'Bovinos', productor: 'Mediano productor', municipio: 'Ubaté', resultado: calificar(LISTA_BOVINOS, respuestas), lista: LISTA_BOVINOS };

function servicio(respuesta: unknown) {
  const config = { get: () => ({ apiKey: 'clave-de-prueba', model: 'claude-opus-5-5', timeoutMs: 1000 }) } as unknown as ConfigService<never, true>;
  const ai = new AiService(config);
  const create = jest.fn().mockResolvedValue(respuesta);
  (ai as unknown as { client: unknown }).client = { beta: { messages: { create } } };
  return { ai, create };
}

const texto = (json: unknown, stop_reason = 'end_turn') => ({
  model: 'claude-opus-5-5',
  stop_reason,
  content: [{ type: 'text', text: typeof json === 'string' ? json : JSON.stringify(json) }],
});

describe('AiService', () => {
  it('pide salida estructurada sin datos personales y devuelve las recomendaciones ordenadas', async () => {
    const { ai, create } = servicio(
      texto({
        resumen: 'Su finca está en nivel alto.',
        recomendaciones: [
          { prioridad: 'BAJA', titulo: 'Confort', problema: 'a', porque: 'b', acciones: ['c'] },
          { prioridad: 'ALTA', titulo: 'Salud', problema: 'Cojeras', porque: 'Duele', acciones: ['Llame al veterinario'] },
        ],
      }),
    );
    const r = await ai.recommend(contexto);
    expect(r).toMatchObject({ origen: 'IA', modelo: 'claude-opus-5-5', recomendaciones: [{ prioridad: 'ALTA' }, { prioridad: 'BAJA' }] });

    const pedido = create.mock.calls[0][0];
    expect(pedido.output_config.format.type).toBe('json_schema');
    expect(pedido.fallbacks).toBe('default');
    expect(pedido.messages[0].content).not.toMatch(/Pedro|310\d{7}/);
  });

  it('devuelve null para usar las reglas si la IA se niega o responde algo inválido', async () => {
    expect(await servicio(texto({ resumen: 'x', recomendaciones: [] }, 'refusal')).ai.recommend(contexto)).toBeNull();
    expect(await servicio(texto('no es json')).ai.recommend(contexto)).toBeNull();
    expect(await servicio(texto({ resumen: 'x', recomendaciones: [{ prioridad: 'URGENTE' }] })).ai.recommend(contexto)).toBeNull();
  });

  it('no llama a la IA si no hay clave configurada', async () => {
    const config = { get: () => ({ model: 'claude-opus-5-5', timeoutMs: 1000 }) } as unknown as ConfigService<never, true>;
    const ai = new AiService(config);
    expect(ai.enabled).toBe(false);
    expect(await ai.recommend(contexto)).toBeNull();
  });
});
