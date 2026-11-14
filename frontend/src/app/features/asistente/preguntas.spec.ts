import { buscarRespuesta, preguntasPara, PREGUNTAS } from './preguntas';

describe('Preguntas del asistente', () => {
  it('reconoce preguntas escritas a mano, sin tildes ni mayúsculas', () => {
    expect(buscarRespuesta('¿COMO se calcula el PUNTAJE?')?.id).toBe('puntaje');
    expect(buscarRespuesta('cuantos animales reviso en la muestra')?.id).toBe('muestra');
    expect(buscarRespuesta('No me llega el código de verificación')?.id).toBe('dosPasos');
  });

  it('no inventa una respuesta para temas ajenos', () => {
    expect(buscarRespuesta('¿quién ganó el partido de fútbol?')).toBeNull();
  });

  it('sugiere a cada rol solo lo que puede hacer', () => {
    const propietario = preguntasPara((...p) => p.includes('predios.propios'));
    expect(propietario.some((p) => p.id === 'propietario')).toBeTrue();
    expect(propietario.some((p) => p.id === 'usuarios')).toBeFalse();
    expect(preguntasPara(() => true).length).toBe(PREGUNTAS.length);
  });

  it('cita los pesos y niveles de la norma', () => {
    const texto = (id: string) => PREGUNTAS.find((p) => p.id === id)!.respuesta.join(' ');
    expect(texto('puntaje')).toContain('Salud 50 %');
    expect(texto('niveles')).toContain('Excelente: 4,6 a 5,0');
  });
});
