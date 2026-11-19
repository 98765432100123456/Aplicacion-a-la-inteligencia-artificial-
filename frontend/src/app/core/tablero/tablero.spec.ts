import { FilaTablero } from '../models/tablero';
import { analisisPorReglas, datosAnalisis, validarAnalisis } from './analisis';
import { celdaCsv, evaluacionesCsv, resumirTablero } from './resumen';

const HOY = new Date('2026-11-18T12:00:00Z');

function fila(id: string, puntaje: number, nivel: FilaTablero['nivel'], finalizada: string, hallazgos: FilaTablero['hallazgos'] = []): FilaTablero {
  return {
    id, codigo: `EV-${id}`, predio: `Predio ${id}`, departamento: 'Boyacá', municipio: 'Paipa', especie: 'Bovinos',
    sistema: 'LECHERIA', productor: 'MEDIANO', animales: 120, evaluador: 'Eva Luna', fechaVisita: finalizada.slice(0, 10), finalizada,
    puntaje, nivel,
    libertades: [
      { codigo: 'NUTRICION', puntaje: 5 }, { codigo: 'SALUD', puntaje }, { codigo: 'CONFORT', puntaje: 4 }, { codigo: 'COMPORTAMIENTO', puntaje: null },
    ],
    hallazgos, origenRecomendaciones: 'IA',
  };
}

const DATOS = {
  predios: 5,
  borradores: 2,
  evaluaciones: [
    fila('1', 4.8, 'EXCELENTE', '2026-11-10T10:00:00Z', [{ criterio: 'c16', nombre: 'Registros', critico: false }]),
    fila('2', 2.4, 'BAJO', '2026-10-02T10:00:00Z', [
      { criterio: 'c3', nombre: 'Condición corporal', critico: true },
      { criterio: 'c3', nombre: 'Condición corporal', critico: false },
      { criterio: 'c16', nombre: 'Registros', critico: false },
    ]),
    fila('3', 3.5, 'MEDIO', '2026-01-15T10:00:00Z'),
  ],
};

describe('Tablero', () => {
  it('resume totales, niveles, libertades y meses', () => {
    const r = resumirTablero(DATOS, 'todo', HOY);
    expect(r.evaluaciones).toBe(3);
    expect(r.prediosEvaluados).toBe(3);
    expect(r.puntajePromedio).toBe(3.57);
    expect(r.nivelPromedio).toBe('MEDIO');
    expect(r.buenasPracticas).toBe(33);
    expect(r.porNivel.map((n) => n.cantidad)).toEqual([1, 1, 0, 1]);
    // Las libertades sin dato no cuentan en el promedio.
    expect(r.porLibertad.find((l) => l.codigo === 'COMPORTAMIENTO')!.promedio).toBeNull();
    expect(r.porMes.length).toBe(12);
    expect(r.porMes.map((m) => m.cantidad)).toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]);
    expect(r.requierenAtencion.map((f) => f.id)).toEqual(['2', '3']);
    expect(r.porDepartamento).toEqual([{ departamento: 'Boyacá', evaluaciones: 3, promedio: 3.57, nivel: 'MEDIO' }]);
    expect(r.recientes[0].id).toBe('1');
  });

  it('cuenta cada criterio una vez por evaluación y marca los críticos', () => {
    const r = resumirTablero(DATOS, 'todo', HOY);
    expect(r.hallazgosFrecuentes[0]).toEqual({ criterio: 'c16', nombre: 'Registros', veces: 2, criticos: 0 });
    expect(r.hallazgosFrecuentes[1]).toEqual({ criterio: 'c3', nombre: 'Condición corporal', veces: 1, criticos: 1 });
  });

  it('filtra por periodo y compara con el periodo anterior', () => {
    const r90 = resumirTablero(DATOS, '90d', HOY);
    expect(r90.evaluaciones).toBe(2);
    // En los 90 días anteriores no hubo evaluaciones: la variación del conteo es +2 y no hay puntaje con qué comparar.
    expect(r90.variacion).toEqual({ evaluaciones: 2, puntaje: null, buenasPracticas: null });
    expect(resumirTablero(DATOS, '12m', HOY).evaluaciones).toBe(3);
    expect(resumirTablero(DATOS, 'todo', HOY).variacion.puntaje).toBeNull();
  });

  it('filtra por departamento y sistema productivo', () => {
    expect(resumirTablero(DATOS, 'todo', HOY, { departamento: 'Antioquia' }).evaluaciones).toBe(0);
    expect(resumirTablero(DATOS, 'todo', HOY, { sistema: 'LECHERIA' }).evaluaciones).toBe(3);
  });

  it('exporta a CSV para Excel en español y sin fórmulas ejecutables', () => {
    const csv = evaluacionesCsv(DATOS.evaluaciones);
    expect(csv.startsWith('﻿"Código";"Predio"')).toBeTrue();
    expect(csv).toContain('"4,80";"Excelente"');
    expect(celdaCsv('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(celdaCsv('+57 300')).toBe('"\'+57 300"');
    expect(celdaCsv('Predio "La Fe"')).toBe('"Predio ""La Fe"""');
  });

  it('el análisis por reglas usa solo las cifras y la IA no recibe datos personales', () => {
    const r = resumirTablero(DATOS, 'todo', HOY);
    const a = analisisPorReglas(r);
    expect(a.origen).toBe('REGLAS');
    expect(a.resumen).toContain('3 evaluaciones');
    expect(a.observaciones.join(' ')).toContain('Registros');
    const enviado = JSON.stringify(datosAnalisis(r));
    expect(enviado).not.toContain('Predio 1');
    expect(enviado).not.toContain('Eva Luna');
  });

  it('descarta respuestas de la IA que no cumplen el esquema', () => {
    expect(validarAnalisis({ resumen: 'Bien.', observaciones: ['a'], acciones: ['b'] })).not.toBeNull();
    expect(validarAnalisis({ resumen: '', observaciones: ['a'], acciones: ['b'] })).toBeNull();
    expect(validarAnalisis({ resumen: 'x', observaciones: [], acciones: ['b'] })).toBeNull();
    expect(validarAnalisis({ resumen: 'x', observaciones: ['a'], acciones: Array(6).fill('b') })).toBeNull();
    expect(validarAnalisis('texto suelto')).toBeNull();
  });
});
