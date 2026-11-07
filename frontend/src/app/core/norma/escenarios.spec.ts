import { ARBOLES, recorrerArbol, rutaLimpia } from '../../compartido/escenarios';
import { calificar, faltantes } from '../../compartido/calificacion';
import { listaPara } from '../../compartido/lista-chequeo';

const arbol = (id: string) => ARBOLES.find((a) => a.id === id)!;

/** Recorre el árbol con las respuestas en orden y devuelve puntos y nivel del final. */
function resultado(id: string, ...respuestas: string[]) {
  const a = arbol(id);
  const ruta: Record<string, string> = {};
  let estado = recorrerArbol(a, ruta);
  for (const r of respuestas) {
    expect(estado.siguiente).withContext(`${id}: sobra la respuesta ${r}`).not.toBeNull();
    ruta[estado.siguiente!.id] = r;
    estado = recorrerArbol(a, ruta);
  }
  expect(estado.completo).withContext(`${id}: el recorrido no terminó`).toBeTrue();
  return { puntos: estado.puntos, nivel: estado.nivel, noAplica: estado.noAplica };
}

describe('Árboles de escenarios de la metodología del ICA', () => {
  it('todas las respuestas apuntan a preguntas que existen', () => {
    for (const a of ARBOLES) {
      expect(a.preguntas[a.inicio]).withContext(a.id).toBeDefined();
      for (const p of Object.values(a.preguntas)) {
        for (const o of p.opciones) {
          if (o.siguiente) expect(a.preguntas[o.siguiente]).withContext(`${a.id}.${p.id}.${o.id}`).toBeDefined();
        }
      }
    }
  });

  it('cada criterio con diagrama tiene su árbol, e identificación tiene dos', () => {
    const criterios = new Set(ARBOLES.map((a) => a.criterio));
    expect(criterios.size).toBe(17);
    expect(ARBOLES.filter((a) => a.criterio === 'identificacion').length).toBe(2);
  });

  it('diagrama 1: suministro de agua', () => {
    expect(resultado('agua', 'todos', 'bebederos', 'todos', 'si', 'si', 'si', 'si')).toEqual({ puntos: 14, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('agua', 'todos', 'bebederos', 'todos', 'si', 'no', 'no', 'si').nivel).toBe('ALTO');
    expect(resultado('agua', '80', 'bebederos', '80', 'si', 'si', 'si', 'no')).toEqual({ puntos: 10, nivel: 'MEDIO', noAplica: false });
    expect(resultado('agua', 'todos', 'bebederos', '50').nivel).toBe('BAJO');
    expect(resultado('agua', '50')).toEqual({ puntos: 1, nivel: 'BAJO', noAplica: false });
    expect(resultado('agua', 'menos').puntos).toBe(0);
    // Fuente natural: máximo 12 (alto); sin cobertura arbórea resta un punto.
    expect(resultado('agua', 'todos', 'natural', 'todos', 'si', 'si', 'si', 'si')).toEqual({ puntos: 12, nivel: 'ALTO', noAplica: false });
    expect(resultado('agua', 'todos', 'natural', 'todos', 'si', 'si', 'no', 'si').puntos).toBe(11);
    expect(resultado('agua', 'todos', 'natural', 'todos', 'si', 'no', 'si').puntos).toBe(12);
  });

  it('diagrama 2: suministro de alimento', () => {
    expect(resultado('alimento', 'todos', 'si', 'si', 'si', 'si')).toEqual({ puntos: 10, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('alimento', 'todos', 'si', 'si', 'si', 'no').nivel).toBe('ALTO');
    expect(resultado('alimento', 'todos', 'si', 'no', 'no')).toEqual({ puntos: 6, nivel: 'MEDIO', noAplica: false });
    expect(resultado('alimento', 'todos', 'no')).toEqual({ puntos: 3, nivel: 'BAJO', noAplica: false });
    expect(resultado('alimento', '50').puntos).toBe(1);
  });

  it('diagrama 3: topizado y descorne', () => {
    expect(resultado('topizado', 'no')).toEqual({ puntos: 8, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('topizado', 'si', 'crema2s', 'si', 'ambas').puntos).toBe(8);
    expect(resultado('topizado', 'si', 'hierro', 'si', 'una')).toEqual({ puntos: 5, nivel: 'ALTO', noAplica: false });
    expect(resultado('topizado', 'si', 'hierro', 'si', 'ninguna')).toEqual({ puntos: 4, nivel: 'MEDIO', noAplica: false });
    expect(resultado('topizado', 'si', 'crema2s', 'no')).toEqual({ puntos: 2, nivel: 'BAJO', noAplica: false });
    expect(resultado('topizado', 'si', 'crema3m', 'si', 'ambas')).toEqual({ puntos: 5, nivel: 'ALTO', noAplica: false });
    expect(resultado('topizado', 'si', 'crema3m', 'si', 'ninguna')).toEqual({ puntos: 3, nivel: 'BAJO', noAplica: false });
    expect(resultado('topizado', 'si', 'descorne', 'si', 'ambas')).toEqual({ puntos: 4, nivel: 'MEDIO', noAplica: false });
    expect(resultado('topizado', 'si', 'descorne', 'no').puntos).toBe(0);
  });

  it('diagrama 4: castración', () => {
    expect(resultado('castracion', 'si', 'cerrada', 'menor', 'si', 'si', 'si')).toEqual({ puntos: 8, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('castracion', 'si', 'cerrada', 'menor', 'si', 'si', 'no')).toEqual({ puntos: 6, nivel: 'ALTO', noAplica: false });
    expect(resultado('castracion', 'si', 'cerrada', 'menor', 'si', 'no')).toEqual({ puntos: 4, nivel: 'MEDIO', noAplica: false });
    expect(resultado('castracion', 'si', 'cerrada', 'menor', 'no', 'no')).toEqual({ puntos: 2, nivel: 'BAJO', noAplica: false });
    expect(resultado('castracion', 'si', 'cerrada', 'mayor', 'si', 'si').puntos).toBe(4);
    expect(resultado('castracion', 'si', 'cerrada', 'mayor', 'no', 'no').puntos).toBe(0);
    expect(resultado('castracion', 'si', 'abierta', 'menor', 'si', 'si').puntos).toBe(8);
    expect(resultado('castracion', 'si', 'abierta', 'menor', 'no').puntos).toBe(2);
    expect(resultado('castracion', 'si', 'abierta', 'mayor', 'si', 'si')).toEqual({ puntos: 5, nivel: 'MEDIO', noAplica: false });
  });

  it('diagramas 5 y 6: identificación y marcaje', () => {
    expect(resultado('identificacion', 'si', 'menor', 'si')).toEqual({ puntos: 7, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('identificacion', 'si', 'menor', 'no').nivel).toBe('ALTO');
    expect(resultado('identificacion', 'si', 'mayor', 'si')).toEqual({ puntos: 4, nivel: 'MEDIO', noAplica: false });
    expect(resultado('identificacion', 'si', 'mayor', 'no').nivel).toBe('BAJO');
    expect(resultado('identificacion', 'no')).toEqual({ puntos: 0, nivel: null, noAplica: true });
    expect(resultado('marcaje', 'nitrogeno', 'entre', 'si', 'si')).toEqual({ puntos: 7, nivel: 'ALTO', noAplica: false });
    expect(resultado('marcaje', 'nitrogeno', 'entre', 'no', 'no')).toEqual({ puntos: 3, nivel: 'MEDIO', noAplica: false });
    expect(resultado('marcaje', 'nitrogeno', 'fuera')).toEqual({ puntos: 1, nivel: 'BAJO', noAplica: false });
    expect(resultado('marcaje', 'hierro', 'entre', 'si', 'si').puntos).toBe(6);
    expect(resultado('marcaje', 'hierro', 'entre', 'no', 'no')).toEqual({ puntos: 2, nivel: 'BAJO', noAplica: false });
    expect(resultado('marcaje', 'ninguno').noAplica).toBeTrue();
  });

  it('diagrama 7: pezones supernumerarios', () => {
    expect(resultado('pezones', 'no')).toEqual({ puntos: 7, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('pezones', 'si', 'menor', 'si', 'si', 'si').puntos).toBe(7);
    expect(resultado('pezones', 'si', 'menor', 'si', 'si', 'no')).toEqual({ puntos: 5, nivel: 'ALTO', noAplica: false });
    expect(resultado('pezones', 'si', 'menor', 'si', 'no')).toEqual({ puntos: 4, nivel: 'MEDIO', noAplica: false });
    expect(resultado('pezones', 'si', 'menor', 'no', 'si')).toEqual({ puntos: 3, nivel: 'MEDIO', noAplica: false });
    expect(resultado('pezones', 'si', 'menor', 'no', 'no')).toEqual({ puntos: 2, nivel: 'BAJO', noAplica: false });
    expect(resultado('pezones', 'si', 'mayor', 'si', 'si')).toEqual({ puntos: 4, nivel: 'MEDIO', noAplica: false });
    expect(resultado('pezones', 'si', 'mayor', 'no', 'si')).toEqual({ puntos: 2, nivel: 'BAJO', noAplica: false });
  });

  it('diagramas 8, 9 y 10: lesiones, ectoparásitos y cojeras', () => {
    expect(resultado('lesiones', 'no', 'sin')).toEqual({ puntos: 10, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('lesiones', 'no', 'hasta50').nivel).toBe('ALTO');
    expect(resultado('lesiones', 'si', 'hasta50', 'sin')).toEqual({ puntos: 7, nivel: 'MEDIO', noAplica: false });
    expect(resultado('lesiones', 'si', 'mas50', 'hasta50')).toEqual({ puntos: 3, nivel: 'BAJO', noAplica: false });
    expect(resultado('ectoparasitos', 'hasta50', 'hasta50', 'hasta20', 'hasta50').puntos).toBe(10);
    expect(resultado('ectoparasitos', 'hasta50', 'mas50', 'mas20', 'hasta50')).toEqual({ puntos: 6, nivel: 'MEDIO', noAplica: false });
    expect(resultado('ectoparasitos', 'mas50', 'hasta50', 'hasta20', 'hasta50')).toEqual({ puntos: 7, nivel: 'ALTO', noAplica: false });
    expect(resultado('ectoparasitos', 'mas50', 'mas50', 'hasta20', 'hasta50')).toEqual({ puntos: 4, nivel: 'BAJO', noAplica: false });
    expect(resultado('ectoparasitos', 'mas50', 'mas50', 'mas20', 'hasta50').puntos).toBe(2);
    expect(resultado('cojeras', 'no')).toEqual({ puntos: 10, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('cojeras', 'si', 'hasta10', 'hasta5')).toEqual({ puntos: 7, nivel: 'ALTO', noAplica: false });
    expect(resultado('cojeras', 'si', '11a50', 'hasta10')).toEqual({ puntos: 4, nivel: 'MEDIO', noAplica: false });
    expect(resultado('cojeras', 'si', 'mas50', 'hasta10')).toEqual({ puntos: 2, nivel: 'BAJO', noAplica: false });
  });

  it('diagramas 11, 12 y 13: descarte, registros y medicamentos', () => {
    expect(resultado('descarte', 'tratamiento')).toEqual({ puntos: 6, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('descarte', 'predio', 'si', 'humanitario', 'no')).toEqual({ puntos: 4, nivel: 'ALTO', noAplica: false });
    expect(resultado('descarte', 'predio', 'si', 'nohumanitario')).toEqual({ puntos: 2, nivel: 'MEDIO', noAplica: false });
    expect(resultado('descarte', 'predio', 'espera').nivel).toBe('BAJO');
    expect(resultado('registros', 'si', 'si', 'si', 'si')).toEqual({ puntos: 4, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('registros', 'no', 'si', 'no', 'si')).toEqual({ puntos: 2, nivel: 'MEDIO', noAplica: false });
    expect(resultado('registros', 'no', 'no', 'no', 'si').nivel).toBe('BAJO');
    expect(resultado('medicamentos', 'no', 'si', 'si', 'si')).toEqual({ puntos: 4, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('medicamentos', 'no', 'si', 'si', 'no').nivel).toBe('ALTO');
    expect(resultado('medicamentos', 'no', 'si', 'no')).toEqual({ puntos: 2, nivel: 'MEDIO', noAplica: false });
    expect(resultado('medicamentos', 'si')).toEqual({ puntos: 0, nivel: 'BAJO', noAplica: false });
  });

  it('diagramas 14, 15 y 16: confort físico, térmico y espacio', () => {
    expect(resultado('confortFisico', 'ninguno', 'no', 'todos', 'si', 'si')).toEqual({ puntos: 12, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('confortFisico', 'menos20', 'no', '80', 'si', 'no').puntos).toBe(8);
    expect(resultado('confortFisico', 'mas50', 'si', 'menos', 'no', 'no').nivel).toBe('BAJO');
    expect(resultado('confortTermico', 'todos', 'todos', 'si')).toEqual({ puntos: 10, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('confortTermico', '80', 'trabajadores', 'no')).toEqual({ puntos: 5, nivel: 'MEDIO', noAplica: false });
    expect(resultado('confortTermico', '50', 'todos')).toEqual({ puntos: 5, nivel: 'MEDIO', noAplica: false });
    expect(resultado('confortTermico', '50', 'trabajadores')).toEqual({ puntos: 4, nivel: 'BAJO', noAplica: false });
    expect(resultado('confortTermico', 'menos').puntos).toBe(1);
    expect(resultado('espacio', 'no')).toEqual({ puntos: 8, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('espacio', 'si', 'individuales', 'todos')).toEqual({ puntos: 6, nivel: 'ALTO', noAplica: false });
    expect(resultado('espacio', 'si', 'puesto', 'cama').nivel).toBe('EXCELENTE');
    expect(resultado('espacio', 'si', 'comunal', '75')).toEqual({ puntos: 3, nivel: 'MEDIO', noAplica: false });
  });

  it('diagramas 18 y 19: interacción y capacitación', () => {
    expect(resultado('interaccion', 'positiva', 'calmados', 'positiva', 'no')).toEqual({ puntos: 12, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('interaccion', 'positiva', 'calmados', 'neutra', 'no')).toEqual({ puntos: 10, nivel: 'ALTO', noAplica: false });
    expect(resultado('interaccion', 'positiva', 'calmados', 'neutra', 'mas5')).toEqual({ puntos: 7, nivel: 'MEDIO', noAplica: false });
    expect(resultado('interaccion', 'positiva', 'ansiosos', 'no')).toEqual({ puntos: 6, nivel: 'BAJO', noAplica: false });
    expect(resultado('interaccion', 'negativa', 'no').puntos).toBe(3);
    expect(resultado('capacitacion', 'si', '100', 'si')).toEqual({ puntos: 8, nivel: 'EXCELENTE', noAplica: false });
    expect(resultado('capacitacion', 'si', '50', 'si')).toEqual({ puntos: 7, nivel: 'ALTO', noAplica: false });
    expect(resultado('capacitacion', 'si', '100', 'no')).toEqual({ puntos: 6, nivel: 'MEDIO', noAplica: false });
    expect(resultado('capacitacion', 'si', 'menos', 'no')).toEqual({ puntos: 4, nivel: 'BAJO', noAplica: false });
  });

  it('al cambiar una respuesta anterior se descartan las preguntas que quedaron fuera del camino', () => {
    const a = arbol('agua');
    const ruta = { disponibilidad: 'todos', metodo: 'bebederos', accesoBebederos: 'todos', voluntadBebederos: 'si' };
    expect(recorrerArbol(a, ruta).puntos).toBe(10);
    const cambiada = rutaLimpia(a, { ...ruta, disponibilidad: '50' });
    expect(cambiada).toEqual({ disponibilidad: '50' });
    expect(recorrerArbol(a, cambiada).puntos).toBe(1);
  });

  it('los criterios con árbol entran al cálculo y al resultado de la evaluación', () => {
    const lista = listaPara('BOVINO', 'LECHERIA', 120);
    const respuestas = Object.fromEntries(lista.map((i) => [i.codigo, { respuesta: 'CUMPLE' as const }]));
    // Evaluación anterior: todo respondido por indicadores, sin árboles.
    const anterior = calificar(lista, respuestas);
    expect(anterior.escenarios).toEqual([]);
    expect(anterior.puntaje).toBe(5);

    // Nueva: el agua se califica con su árbol en nivel bajo y el resto sigue completo.
    const sinAgua = Object.fromEntries(Object.entries(respuestas).filter(([c]) => !lista.find((i) => i.codigo === c && i.criterio === 'suministro_agua')));
    expect(faltantes(lista, sinAgua)).toContain('Suministro de agua');
    const r = calificar(lista, sinAgua, { agua: { ruta: { disponibilidad: '50' } } });
    expect(r.escenarios?.map((e) => [e.arbol, e.puntos, e.nivel])).toEqual([['agua', 1, 'BAJO']]);
    expect(r.puntaje).toBeLessThan(5);
    expect(r.hallazgos[0]).toEqual(jasmine.objectContaining({ criterio: 'suministro_agua', respuesta: 'NO_CUMPLE', critico: true }));
  });
});
