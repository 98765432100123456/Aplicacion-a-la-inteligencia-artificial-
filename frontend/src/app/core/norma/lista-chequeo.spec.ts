import { calificar, RespuestaIndicador } from '../../compartido/calificacion';
import { CRITERIOS, LISTA_BOVINOS, listaPara } from '../../compartido/lista-chequeo';
import { nivelDePuntaje, puntajeTexto } from '../../compartido/norma';
import { recomendacionesPorReglas } from '../../compartido/recomendaciones';

/** Reglas de la lista de chequeo con los 23 criterios cargados en Firestore. */
describe('Lista de chequeo de la norma', () => {
  const todoCumple = (lista = LISTA_BOVINOS) =>
    Object.fromEntries(lista.map((i) => [i.codigo, { respuesta: 'CUMPLE' } as RespuestaIndicador]));

  it('tiene los 23 criterios, cada uno con indicadores y códigos únicos', () => {
    expect(CRITERIOS.length).toBe(23);
    expect(CRITERIOS.every((c) => LISTA_BOVINOS.some((i) => i.criterio === c.id))).toBeTrue();
    expect(new Set(LISTA_BOVINOS.map((i) => i.codigo)).size).toBe(LISTA_BOVINOS.length);
  });

  it('filtra por sistema productivo y por tamaño del predio', () => {
    const criterios = (lista: typeof LISTA_BOVINOS) => new Set(lista.map((i) => i.criterio));
    const lecheria = criterios(listaPara('BOVINO', 'LECHERIA', 120));
    expect(lecheria.has('castracion')).toBeFalse();
    expect(lecheria.has('mastitis')).toBeTrue();
    const carne = criterios(listaPara('BOVINO', 'CARNE', 120));
    expect(carne.has('castracion')).toBeTrue();
    expect(carne.has('mastitis')).toBeFalse();
    // Los registros documentales y los medicamentos solo se exigen a medianos y grandes.
    const pequeno = criterios(listaPara('BOVINO', null, 40));
    expect(pequeno.has('procedimientos_registros')).toBeFalse();
    expect(pequeno.has('uso_medicamentos')).toBeFalse();
    expect(criterios(listaPara('BOVINO', null, 120)).size).toBe(23);
  });

  it('pondera las libertades 20, 50, 15 y 15 y da 5 si todo cumple', () => {
    const r = calificar(LISTA_BOVINOS, todoCumple());
    expect(r.puntaje).toBe(5);
    expect(r.nivel).toBe('EXCELENTE');
    expect(r.libertades.map((l) => l.peso)).toEqual([20, 50, 15, 15]);
  });

  it('agrupa las recomendaciones por criterio y prioriza los críticos', () => {
    const respuestas = todoCumple();
    respuestas['1.1'] = { respuesta: 'NO_CUMPLE' }; // Disponibilidad de agua, crítico
    respuestas['1.6'] = { respuesta: 'PARCIAL' }; // Calidad del agua, mismo criterio
    respuestas['18.2'] = { respuesta: 'PARCIAL' }; // Limpieza de corrales
    const rec = recomendacionesPorReglas(calificar(LISTA_BOVINOS, respuestas), LISTA_BOVINOS);
    expect(rec.recomendaciones.map((r) => [r.titulo, r.prioridad])).toEqual([
      ['Suministro de agua', 'ALTA'],
      ['Confort físico', 'BAJA'],
    ]);
  });

  it('muestra el puntaje con el mismo redondeo que define el nivel', () => {
    expect(puntajeTexto(4.55)).toBe('4,6');
    expect(nivelDePuntaje(4.55).codigo).toBe('EXCELENTE');
    expect(puntajeTexto(4.54)).toBe('4,5');
    expect(nivelDePuntaje(4.54).codigo).toBe('ALTO');
  });
});
