import { CodigoLibertad } from './norma';

/**
 * Lista de chequeo de referencia para bovinos y búfalos, organizada según las
 * libertades y los tipos de indicador de la metodología del ICA. Debe ajustarse
 * con el texto oficial de los 23 criterios y 59 indicadores del manual antes de
 * usarse en una evaluación oficial; la estructura y las reglas de cálculo no cambian.
 */

/** Versión de la lista; cada evaluación guarda la versión con la que se diligenció (RNF28). */
export const VERSION_LISTA = 'REF-2026.1';

/** SI_NO: cumple o no. ESCALA: cumple, cumple en parte o no cumple. */
export type TipoRespuesta = 'SI_NO' | 'ESCALA';
export type TipoIndicador = 'ANIMAL' | 'RECURSOS' | 'GESTION';
export type Metodo = 'DOCUMENTAL' | 'VISUAL' | 'MUESTREO';

/** Respuestas posibles; NO_APLICA retira el indicador del cálculo. */
export type Respuesta = 'CUMPLE' | 'PARCIAL' | 'NO_CUMPLE' | 'NO_APLICA';

export const VALOR_RESPUESTA: Record<Respuesta, number | null> = {
  CUMPLE: 1,
  PARCIAL: 0.5,
  NO_CUMPLE: 0,
  NO_APLICA: null,
};

export const NOMBRE_RESPUESTA: Record<Respuesta, string> = {
  CUMPLE: 'Cumple',
  PARCIAL: 'Cumple en parte',
  NO_CUMPLE: 'No cumple',
  NO_APLICA: 'No aplica',
};

export const NOMBRE_TIPO: Record<TipoIndicador, string> = {
  ANIMAL: 'Basado en el animal',
  RECURSOS: 'Basado en los recursos',
  GESTION: 'Basado en la gestión',
};

export const NOMBRE_METODO: Record<Metodo, string> = {
  DOCUMENTAL: 'Revisión documental',
  VISUAL: 'Inspección visual sin muestreo',
  MUESTREO: 'Inspección visual con muestreo',
};

export interface Indicador {
  codigo: string;
  libertad: CodigoLibertad;
  texto: string;
  ayuda: string;
  respuesta: TipoRespuesta;
  tipo: TipoIndicador;
  metodo: Metodo;
  /** Su incumplimiento es una alerta crítica, aunque el promedio sea bueno. */
  critico: boolean;
  /** Peso relativo dentro de su libertad. */
  peso: number;
  /** Explicación en lenguaje sencillo para el propietario. */
  propietario: { problema: string; porque: string; acciones: string[] };
}

const ind = (
  codigo: string,
  libertad: CodigoLibertad,
  texto: string,
  ayuda: string,
  [respuesta, tipo, metodo, critico, peso]: [TipoRespuesta, TipoIndicador, Metodo, boolean, number],
  propietario: Indicador['propietario'],
): Indicador => ({ codigo, libertad, texto, ayuda, respuesta, tipo, metodo, critico, peso, propietario });

export const LISTA_BOVINOS: Indicador[] = [
  ind('N1', 'NUTRICION', 'Los animales de la muestra tienen una condición corporal adecuada.',
    'Observe costillas, cadera y base de la cola. Cuente los animales flacos de la muestra.',
    ['ESCALA', 'ANIMAL', 'MUESTREO', true, 3],
    { problema: 'Hay animales flacos.', porque: 'Un animal flaco produce menos, se enferma más fácil y tarda en preñarse.',
      acciones: ['Separe los animales flacos y deles alimento adicional.', 'Pida al veterinario revisar si hay parásitos.', 'Ajuste la ración según la etapa de cada animal.'] }),
  ind('N2', 'NUTRICION', 'Hay agua limpia disponible todo el día.',
    'Revise bebederos, fuentes de agua y su limpieza en cada potrero.',
    ['SI_NO', 'RECURSOS', 'VISUAL', true, 3],
    { problema: 'Los animales no tienen agua limpia siempre.', porque: 'Sin agua el ganado deja de comer, se deshidrata y baja la producción en pocas horas.',
      acciones: ['Asegure agua limpia en cada potrero todo el día.', 'Lave los bebederos al menos una vez por semana.', 'Revise que no haya fugas ni agua estancada.'] }),
  ind('N3', 'NUTRICION', 'Los bebederos son suficientes para el número de animales y están en buen estado.',
    'Observe si los animales hacen fila o pelean por beber.',
    ['ESCALA', 'RECURSOS', 'VISUAL', false, 2],
    { problema: 'Faltan bebederos o están en mal estado.', porque: 'Cuando hay pocos bebederos, los animales más débiles no alcanzan a tomar agua.',
      acciones: ['Agregue bebederos o amplíe los que tiene.', 'Repare los bebederos rotos o con filos.'] }),
  ind('N4', 'NUTRICION', 'Hay forraje o alimento suficiente para el lote.',
    'Revise la oferta de pasto y la existencia de reservas para la época seca.',
    ['ESCALA', 'RECURSOS', 'VISUAL', false, 2],
    { problema: 'El alimento no alcanza para todo el lote.', porque: 'La falta de alimento hace que los animales pierdan peso y se enfermen.',
      acciones: ['Rote los potreros para que el pasto se recupere.', 'Guarde forraje (ensilaje o heno) para la época seca.'] }),
  ind('N5', 'NUTRICION', 'Existe un plan de alimentación o suplementación según la etapa productiva.',
    'Solicite el plan o los registros de suplementación.',
    ['SI_NO', 'GESTION', 'DOCUMENTAL', false, 1],
    { problema: 'No hay un plan de alimentación por etapa.', porque: 'Una vaca preñada, un ternero y un animal de levante necesitan raciones distintas.',
      acciones: ['Haga con un técnico un plan de alimentación por etapa.', 'Anote lo que se suministra a cada lote.'] }),

  ind('S1', 'SALUD', 'Los animales de la muestra no presentan cojeras.',
    'Observe a cada animal de la muestra caminar sobre piso firme.',
    ['ESCALA', 'ANIMAL', 'MUESTREO', true, 3],
    { problema: 'Hay animales que cojean.', porque: 'La cojera causa dolor, el animal come menos y produce menos.',
      acciones: ['Revise las patas de los animales que cojean y pida atención veterinaria.', 'Mantenga los corrales y caminos sin barro ni piedras.'] }),
  ind('S2', 'SALUD', 'Los animales de la muestra no presentan heridas ni lesiones.',
    'Revise cuello, patas, cola y lomo de los animales de la muestra.',
    ['ESCALA', 'ANIMAL', 'MUESTREO', true, 3],
    { problema: 'Hay animales con heridas o lesiones.', porque: 'Las heridas duelen, se pueden infectar y atraen moscas.',
      acciones: ['Limpie y trate las heridas a tiempo.', 'Busque qué las causa: cercas, clavos o golpes en el manejo.'] }),
  ind('S3', 'SALUD', 'La vacunación obligatoria del ICA está al día y registrada.',
    'Verifique los registros únicos de vacunación de los ciclos vigentes.',
    ['SI_NO', 'GESTION', 'DOCUMENTAL', true, 3],
    { problema: 'La vacunación obligatoria no está al día.', porque: 'Las vacunas obligatorias protegen al hato y a la región de enfermedades graves, y son exigidas por el ICA.',
      acciones: ['Vacune en el próximo ciclo del ICA.', 'Guarde los registros de vacunación de cada animal.'] }),
  ind('S4', 'SALUD', 'Existe un plan sanitario con asistencia de un médico veterinario.',
    'Solicite el plan sanitario y la evidencia de las visitas del veterinario.',
    ['SI_NO', 'GESTION', 'DOCUMENTAL', false, 2],
    { problema: 'No hay un plan sanitario con veterinario.', porque: 'Prevenir las enfermedades cuesta menos que curarlas.',
      acciones: ['Acuerde visitas periódicas con un médico veterinario.', 'Escriba un plan de vacunas, purgas y revisiones.'] }),
  ind('S5', 'SALUD', 'Se registran los tratamientos aplicados (producto, dosis, fecha y tiempo de retiro).',
    'Revise el libro o formato de tratamientos.',
    ['SI_NO', 'GESTION', 'DOCUMENTAL', false, 2],
    { problema: 'No se anotan los tratamientos.', porque: 'Sin registro no se sabe cuándo se puede vender la leche o la carne sin residuos de medicamento.',
      acciones: ['Anote cada tratamiento: animal, producto, dosis, fecha y tiempo de retiro.'] }),
  ind('S6', 'SALUD', 'Los procedimientos dolorosos (descorne, castración) se hacen con anestesia y analgesia.',
    'Pregunte cómo se hacen los procedimientos y revise los registros o facturas de medicamentos.',
    ['SI_NO', 'GESTION', 'DOCUMENTAL', true, 3],
    { problema: 'Se hacen procedimientos dolorosos sin anestesia.', porque: 'Descornar o castrar sin anestesia causa un dolor intenso y retrasa la recuperación.',
      acciones: ['Haga estos procedimientos con un veterinario y con anestesia y analgésico.', 'Prefiera hacerlos cuando el animal es joven.'] }),
  ind('S7', 'SALUD', 'Hay un corral o área para separar y atender animales enfermos o lesionados.',
    'Verifique la existencia y el estado del área de enfermería.',
    ['SI_NO', 'RECURSOS', 'VISUAL', false, 1],
    { problema: 'No hay un lugar para atender animales enfermos.', porque: 'Separar al animal enfermo evita contagios y facilita su recuperación.',
      acciones: ['Adecúe un corral con sombra, agua y comida para animales enfermos.'] }),

  ind('C1', 'CONFORT', 'Los animales tienen sombra o refugio contra el sol y la lluvia.',
    'Revise árboles, polisombras o techos en potreros y corrales de espera.',
    ['ESCALA', 'RECURSOS', 'VISUAL', true, 3],
    { problema: 'Falta sombra o refugio.', porque: 'El calor fuerte agota al animal, baja la producción y afecta la preñez.',
      acciones: ['Siembre árboles o instale polisombra en los potreros.', 'Ponga sombra en los corrales donde esperan los animales.'] }),
  ind('C2', 'CONFORT', 'Los pisos de corrales y caminos son firmes, secos y antideslizantes.',
    'Observe barro, encharcamientos y superficies lisas.',
    ['ESCALA', 'RECURSOS', 'VISUAL', false, 2],
    { problema: 'Los pisos tienen barro o son resbalosos.', porque: 'El barro y los pisos lisos causan caídas, cojeras e infecciones en las patas.',
      acciones: ['Mejore el drenaje de corrales y caminos.', 'Use material antideslizante en las zonas de manejo.'] }),
  ind('C3', 'CONFORT', 'Cercas, mangas y corrales no tienen puntas, clavos ni salientes.',
    'Recorra las instalaciones buscando elementos que puedan lastimar.',
    ['ESCALA', 'RECURSOS', 'VISUAL', false, 2],
    { problema: 'Hay puntas o clavos en las instalaciones.', porque: 'Estos elementos causan heridas que se pueden infectar.',
      acciones: ['Retire o cubra clavos, alambres sueltos y tablas rotas.'] }),
  ind('C4', 'CONFORT', 'Los animales tienen áreas secas para echarse y espacio suficiente.',
    'Observe si los animales pueden echarse al tiempo sin amontonarse.',
    ['ESCALA', 'RECURSOS', 'VISUAL', false, 2],
    { problema: 'Falta espacio o lugar seco para descansar.', porque: 'Un animal que no descansa bien produce menos y se estresa.',
      acciones: ['Reduzca el número de animales por lote o amplíe el espacio.', 'Mantenga secas las áreas de descanso.'] }),

  ind('K1', 'COMPORTAMIENTO', 'Los animales se muestran tranquilos ante la presencia de personas.',
    'Acérquese con calma y observe si los animales huyen o se agitan.',
    ['ESCALA', 'ANIMAL', 'MUESTREO', false, 2],
    { problema: 'Los animales se asustan con las personas.', porque: 'Un animal con miedo se lastima más fácil, es peligroso de manejar y produce menos.',
      acciones: ['Maneje a los animales con calma y siempre de la misma forma.', 'Evite movimientos bruscos y ruidos fuertes cerca del ganado.'] }),
  ind('K2', 'COMPORTAMIENTO', 'El manejo se hace sin golpes, gritos ni perros que muerdan.',
    'Observe el arreo y el manejo en la manga.',
    ['ESCALA', 'GESTION', 'VISUAL', true, 3],
    { problema: 'Hay golpes o gritos durante el manejo.', porque: 'El maltrato causa lesiones y miedo, y es una falta grave al bienestar animal.',
      acciones: ['Arree caminando despacio y sin gritar.', 'Use banderas en lugar de palos o perros.'] }),
  ind('K3', 'COMPORTAMIENTO', 'El personal está capacitado en manejo y bienestar animal.',
    'Solicite evidencia de capacitación del personal.',
    ['SI_NO', 'GESTION', 'DOCUMENTAL', false, 2],
    { problema: 'El personal no ha recibido capacitación.', porque: 'Un trabajador capacitado maneja mejor a los animales y evita accidentes.',
      acciones: ['Inscriba al personal en una capacitación de bienestar animal (el SENA y el ICA ofrecen cursos).', 'Guarde los certificados.'] }),
  ind('K4', 'COMPORTAMIENTO', 'Mangas, bretes y embarcaderos están en buen estado.',
    'Revise el estado de las estructuras de manejo y embarque.',
    ['ESCALA', 'RECURSOS', 'VISUAL', false, 2],
    { problema: 'Las estructuras de manejo están en mal estado.', porque: 'Una manga dañada asusta y lastima a los animales al pasar.',
      acciones: ['Repare mangas, bretes y embarcaderos.', 'Revise que el piso de la manga no sea resbaloso.'] }),
  ind('K5', 'COMPORTAMIENTO', 'Los animales permanecen en grupo, sin aislamientos prolongados.',
    'Pregunte por las prácticas de aislamiento y observe los lotes.',
    ['SI_NO', 'ANIMAL', 'VISUAL', false, 1],
    { problema: 'Hay animales aislados por mucho tiempo.', porque: 'El ganado vive en grupo; separarlo por mucho tiempo le causa estrés.',
      acciones: ['Mantenga a los animales en grupo siempre que sea posible.'] }),
];

/** Lista de chequeo que corresponde a cada especie. Las nuevas especies se agregan aquí (RNF30). */
export const LISTAS_POR_ESPECIE: Record<string, Indicador[]> = {
  BOVINO: LISTA_BOVINOS,
  BUFALINO: LISTA_BOVINOS,
};
