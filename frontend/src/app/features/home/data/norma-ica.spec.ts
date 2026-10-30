import { LIBERTADES, muestraMinima, repartir, tipoProductor } from './norma-ica';

describe('Reglas de la metodología del ICA', () => {
  it('los pesos de las libertades suman 100 %', () => {
    expect(LIBERTADES.reduce((a, l) => a + l.peso, 0)).toBe(100);
  });

  it('clasifica el tamaño del productor', () => {
    expect(tipoProductor(50)).toBe('pequeño');
    expect(tipoProductor(51)).toBe('mediano');
    expect(tipoProductor(500)).toBe('mediano');
    expect(tipoProductor(501)).toBe('grande');
  });

  it('aplica la tabla de muestra mínima', () => {
    expect(muestraMinima(0)).toBeNull();
    expect(muestraMinima(12)).toBe(12);
    expect(muestraMinima(50)).toBe(20);
    expect(muestraMinima(51)).toBe(20);
    expect(muestraMinima(99)).toBe(20);
    expect(muestraMinima(100)).toBe(30);
    expect(muestraMinima(499)).toBe(30);
    expect(muestraMinima(500)).toBe(40);
    expect(muestraMinima(999)).toBe(40);
    expect(muestraMinima(1220)).toBe(61);
  });

  it('reparte la muestra en proporción a los grupos etarios sin perder animales', () => {
    expect(repartir(30, [18, 34, 68])).toEqual([5, 8, 17]);
    expect(repartir(40, [100, 300, 600])).toEqual([4, 12, 24]);
    expect(repartir(20, [0, 0, 0])).toEqual([0, 0, 0]);
  });
});
