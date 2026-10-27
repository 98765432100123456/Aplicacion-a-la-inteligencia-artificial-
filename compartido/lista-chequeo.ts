import { CodigoLibertad, Sistema, TamanoPredio, tamanoPredio } from './norma';

/**
 * Lista de chequeo para bovinos y búfalos con los 23 criterios de la Metodología
 * del ICA (versión 2.0, 2023), tal como se cargaron en Firestore (colección
 * `criterios`). Cada criterio se califica por sus indicadores; el sistema productivo
 * y el tamaño del predio definen qué criterios aplican.
 */

/** Versión de la lista; cada evaluación guarda la versión con la que se diligenció (RNF28). */
export const VERSION_LISTA = 'ICA-2023.1';

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

/** Explicación en lenguaje sencillo para el propietario. */
export interface TextoPropietario {
  problema: string;
  porque: string;
  acciones: string[];
}

export interface Criterio {
  /** Identificador del documento en Firestore, por ejemplo `suministro_agua`. */
  id: string;
  orden: number;
  nombre: string;
  libertad: CodigoLibertad;
  sistemas: Sistema[];
  tamanos: TamanoPredio[];
  propietario: TextoPropietario;
}

export interface Indicador {
  /** Número del criterio y del indicador, por ejemplo `1.2`. */
  codigo: string;
  criterio: string;
  nombreCriterio: string;
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
  propietario: TextoPropietario;
}

/** Indicador antes de numerarlo: texto, ayuda, tipo de respuesta, tipo, método y si es crítico. */
type Ind = [string, string, TipoRespuesta, TipoIndicador, Metodo, boolean?];

const TODOS_LOS_SISTEMAS: Sistema[] = ['LECHERIA', 'CARNE', 'DOBLE_PROPOSITO'];
const TODOS_LOS_TAMANOS: TamanoPredio[] = ['PEQUENO', 'MEDIANO_GRANDE'];

interface DefCriterio extends Omit<Criterio, 'orden' | 'sistemas' | 'tamanos'> {
  sistemas?: Sistema[];
  tamanos?: TamanoPredio[];
  indicadores: Ind[];
}

const DEFINICION: DefCriterio[] = [
  // Libre de hambre, sed y desnutrición
  {
    id: 'suministro_agua', libertad: 'NUTRICION', nombre: 'Suministro de agua',
    propietario: { problema: 'Los animales no tienen agua limpia y suficiente en todo momento.',
      porque: 'Sin agua el ganado deja de comer, se deshidrata y baja la producción en pocas horas.',
      acciones: ['Asegure agua limpia en cada potrero durante todo el día.', 'Lave los bebederos al menos una vez por semana.', 'Ponga bebederos suficientes para que los animales no hagan fila ni peleen.'] },
    indicadores: [
      ['Disponibilidad de agua', 'Verifique que haya agua en el momento de la visita en todos los potreros y corrales con animales.', 'SI_NO', 'RECURSOS', 'VISUAL', true],
      ['Método de oferta', 'Bebederos, tanques o fuentes naturales protegidas, sin riesgo de que los animales se atasquen o caigan.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Acceso al agua', 'Todos los animales, incluidas las crías, alcanzan el agua sin obstáculos ni competencia excesiva.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Cantidad de agua', 'El caudal y el número de bebederos alcanzan para el lote; observe si hay filas o peleas al beber.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Sombrío/cobertura arbórea', 'Hay sombra cerca de los puntos de agua para que los animales beban sin exponerse al sol.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Calidad del agua', 'El agua se ve limpia, sin lodo, algas, heces ni malos olores.', 'ESCALA', 'RECURSOS', 'VISUAL'],
    ],
  },
  {
    id: 'suministro_alimento', libertad: 'NUTRICION', nombre: 'Suministro de alimento',
    propietario: { problema: 'El alimento no alcanza o no llega bien a todos los animales.',
      porque: 'Un animal mal alimentado produce menos, se enferma más y tarda en preñarse.',
      acciones: ['Ajuste la carga de animales al forraje disponible en cada potrero.', 'Dé suplemento en épocas secas o de poco pasto.', 'Mantenga los comederos limpios y con espacio para todos.'] },
    indicadores: [
      ['Disponibilidad del alimento', 'Hay forraje o alimento en cantidad visible para el lote en el momento de la visita.', 'SI_NO', 'RECURSOS', 'VISUAL', true],
      ['Acceso al alimento', 'Todos los animales comen sin ser desplazados; los comederos tienen espacio suficiente.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Cantidad de alimento', 'La oferta corresponde al número de animales y a su etapa productiva.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Limpieza de comederos', 'Comederos sin restos fermentados, hongos, barro ni heces.', 'ESCALA', 'RECURSOS', 'VISUAL'],
    ],
  },
  {
    id: 'condicion_corporal', libertad: 'NUTRICION', nombre: 'Evaluación de condición corporal',
    propietario: { problema: 'Hay animales flacos.',
      porque: 'Un animal flaco produce menos, se enferma más fácil y tarda en preñarse.',
      acciones: ['Separe los animales flacos y deles alimento adicional.', 'Pida al veterinario revisar si hay parásitos.', 'Ajuste la ración según la etapa de cada animal.'] },
    indicadores: [
      ['Condición corporal', 'Observe costillas, cadera y base de la cola en los animales de la muestra y cuente los muy flacos.', 'ESCALA', 'ANIMAL', 'MUESTREO', true],
    ],
  },
  // Libre de dolor, lesión y enfermedad
  {
    id: 'topizado_descorne', libertad: 'SALUD', nombre: 'Topizado y/o descorne',
    propietario: { problema: 'El descorne se hace de forma que causa dolor innecesario.',
      porque: 'Descornar sin anestesia ni a la edad adecuada causa mucho dolor, sangrado e infecciones.',
      acciones: ['Haga el topizado a temprana edad, cuando el botón del cuerno es pequeño.', 'Pida al veterinario aplicar anestesia y analgésico.', 'Que lo haga una persona capacitada.'] },
    indicadores: [
      ['Método utilizado', 'Método aceptado (pasta cáustica o hierro en crías); no se usan sierras ni cortes en adultos sin justificación.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Edad de los animales', 'El procedimiento se hace a la edad recomendada por la norma.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Experticia del personal', 'Quien lo hace está capacitado o es médico veterinario.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Uso de anestesia y/o analgesia', 'Se usa anestesia local y analgésico; verifique con registros o con el responsable.', 'SI_NO', 'GESTION', 'DOCUMENTAL', true],
    ],
  },
  {
    id: 'castracion', libertad: 'SALUD', nombre: 'Castración', sistemas: ['CARNE', 'DOBLE_PROPOSITO'],
    propietario: { problema: 'La castración se hace de forma que causa dolor innecesario.',
      porque: 'Castrar sin anestesia o tarde causa dolor fuerte, infecciones y pérdida de peso.',
      acciones: ['Castre a temprana edad.', 'Pida al veterinario aplicar anestesia y analgésico.', 'Revise la herida los días siguientes.'] },
    indicadores: [
      ['Método utilizado', 'Método aceptado y aplicado correctamente.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Edad de los animales', 'La castración se hace a la edad recomendada.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Experticia de quien realiza la labor', 'Quien la hace está capacitado o es médico veterinario.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Uso de anestesia y analgesia', 'Se usa anestesia y analgésico; verifique con registros o con el responsable.', 'SI_NO', 'GESTION', 'DOCUMENTAL', true],
    ],
  },
  {
    id: 'identificacion', libertad: 'SALUD', nombre: 'Identificación de los animales',
    propietario: { problema: 'La marcación de los animales causa dolor o heridas.',
      porque: 'Una marca mal hecha duele, se infecta y puede dejar al animal herido por semanas.',
      acciones: ['Prefiera chapetas o marcas que causen menos dolor.', 'Marque a temprana edad y con personal capacitado.', 'Cuide la herida después de marcar.'] },
    indicadores: [
      ['Método de identificación', 'Chapeta, tatuaje, marca u otro método aplicado sin lesiones excesivas.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Edad de los animales', 'La identificación se hace a la edad recomendada.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Experticia del personal', 'Quien marca está capacitado.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Manejo del dolor y cuidados posteriores', 'Se controla el dolor y se cuida la herida después de marcar.', 'ESCALA', 'GESTION', 'VISUAL'],
    ],
  },
  {
    id: 'pezones_supernumerarios', libertad: 'SALUD', nombre: 'Corte de pezones supernumerarios',
    propietario: { problema: 'El corte de pezones extra se hace de forma que causa dolor.',
      porque: 'Cortar tarde o sin anestesia duele y puede infectar la ubre.',
      acciones: ['Haga el corte en terneras jóvenes.', 'Que lo haga el veterinario o personal capacitado, con anestesia.'] },
    indicadores: [
      ['Edad de los animales', 'El corte se hace a la edad recomendada.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Uso de anestesia y/o analgesia', 'Se usa anestesia y analgésico.', 'SI_NO', 'GESTION', 'DOCUMENTAL'],
      ['Persona que realiza el corte', 'Lo hace un médico veterinario o personal capacitado.', 'ESCALA', 'GESTION', 'VISUAL'],
    ],
  },
  {
    id: 'lesiones_inflamaciones', libertad: 'SALUD', nombre: 'Presencia de lesiones e inflamaciones',
    propietario: { problema: 'Hay animales con heridas o inflamaciones.',
      porque: 'Las heridas duelen, se infectan y atraen moscas y gusanos.',
      acciones: ['Revise cercas, comederos y mangas que puedan lastimar.', 'Cure las heridas a tiempo.', 'Pida al veterinario revisar las inflamaciones.'] },
    indicadores: [
      ['Inflamaciones en la piel', 'Cuente en la muestra los animales con inflamaciones visibles.', 'ESCALA', 'ANIMAL', 'MUESTREO'],
      ['Lesiones, incluidas heridas', 'Cuente en la muestra los animales con heridas, peladuras o lesiones.', 'ESCALA', 'ANIMAL', 'MUESTREO'],
    ],
  },
  {
    id: 'ectoparasitos', libertad: 'SALUD', nombre: 'Presencia de ectoparásitos',
    propietario: { problema: 'Hay muchas moscas, nuches, garrapatas o gusaneras.',
      porque: 'Los parásitos chupan sangre, transmiten enfermedades y hacen que el animal coma y produzca menos.',
      acciones: ['Haga un plan de control de parásitos con el veterinario.', 'Rote los productos para que sigan funcionando.', 'Cure de inmediato las gusaneras.'] },
    indicadores: [
      ['Presencia de moscas', 'Observe la cantidad de moscas sobre los animales de la muestra.', 'ESCALA', 'ANIMAL', 'MUESTREO'],
      ['Presencia de nuches', 'Cuente los animales con nuches.', 'ESCALA', 'ANIMAL', 'MUESTREO'],
      ['Presencia de garrapatas', 'Observe la carga de garrapatas en los animales de la muestra.', 'ESCALA', 'ANIMAL', 'MUESTREO'],
      ['Presencia de miasis (gusaneras)', 'Cuente los animales con gusaneras.', 'ESCALA', 'ANIMAL', 'MUESTREO', true],
    ],
  },
  {
    id: 'movilidad_cojeras', libertad: 'SALUD', nombre: 'Movilidad (cojeras)',
    propietario: { problema: 'Hay animales que cojean.',
      porque: 'La cojera causa dolor; el animal come menos y produce menos.',
      acciones: ['Revise las patas de los animales que cojean y pida atención veterinaria.', 'Mantenga los corrales y caminos sin barro ni piedras.'] },
    indicadores: [
      ['Presentación de cojeras', 'Observe caminar a los animales de la muestra y cuente los que cojean.', 'ESCALA', 'ANIMAL', 'MUESTREO', true],
    ],
  },
  {
    id: 'mastitis', libertad: 'SALUD', nombre: 'Presencia de mastitis clínica', sistemas: ['LECHERIA', 'DOBLE_PROPOSITO'],
    propietario: { problema: 'Hay vacas con mastitis.',
      porque: 'La mastitis duele, baja la producción y daña la calidad de la leche.',
      acciones: ['Haga la prueba de mastitis con regularidad.', 'Lave y seque los pezones antes del ordeño.', 'Trate las vacas enfermas con el veterinario y respete el tiempo de retiro.'] },
    indicadores: [
      ['Prevalencia de mastitis clínica', 'Revise registros de ordeño y la ubre de las vacas en producción.', 'ESCALA', 'ANIMAL', 'DOCUMENTAL'],
    ],
  },
  {
    id: 'mortalidad', libertad: 'SALUD', nombre: 'Mortalidad',
    propietario: { problema: 'Se están muriendo más animales de lo normal.',
      porque: 'Las muertes muestran problemas de salud o de manejo que afectan a todo el hato.',
      acciones: ['Registre cada muerte con su causa.', 'Revise con el veterinario las causas más frecuentes.'] },
    indicadores: [
      ['Porcentaje de mortalidad', 'Calcule el porcentaje del último año con los registros del predio.', 'ESCALA', 'GESTION', 'DOCUMENTAL'],
    ],
  },
  {
    id: 'animales_descarte', libertad: 'SALUD', nombre: 'Animales de descarte',
    propietario: { problema: 'Los animales de descarte no se manejan bien.',
      porque: 'Un animal enfermo o débil que se deja sin atención sufre de forma innecesaria.',
      acciones: ['Decida a tiempo qué hacer con los animales que no se recuperan.', 'Si hay que sacrificar en el predio, que lo haga el veterinario con un método humanitario.'] },
    indicadores: [
      ['Manejo de animales descartados', 'Los animales de descarte se atienden y se retiran oportunamente.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Sacrificio en predio', 'Si hay sacrificio, se hace con un método humanitario y por personal capacitado.', 'ESCALA', 'GESTION', 'DOCUMENTAL'],
    ],
  },
  {
    id: 'cuidados_complementarios', libertad: 'SALUD', nombre: 'Cuidados complementarios',
    propietario: { problema: 'Hay animales enfermos o lesionados sin la atención que necesitan.',
      porque: 'Un animal que no se atiende a tiempo empeora y puede contagiar a otros.',
      acciones: ['Tenga un corral para separar y atender animales enfermos.', 'Llame al veterinario cuando un animal no mejora.'] },
    indicadores: [
      ['Presencia de animales que requieren cuidados complementarios', 'Animales enfermos, débiles o lesionados están separados y reciben atención.', 'ESCALA', 'ANIMAL', 'VISUAL'],
    ],
  },
  {
    id: 'diarreas', libertad: 'SALUD', nombre: 'Diarreas',
    propietario: { problema: 'Hay terneros o bucerros con diarrea.',
      porque: 'La diarrea deshidrata rápido a las crías y puede matarlas.',
      acciones: ['Asegure que cada cría tome calostro en sus primeras horas.', 'Mantenga limpios y secos los lugares de las crías.', 'Dé suero oral y llame al veterinario ante una diarrea.'] },
    indicadores: [
      ['Diarrea en terneros(as) y bucerros(as)', 'Cuente las crías con diarrea en la muestra.', 'ESCALA', 'ANIMAL', 'MUESTREO'],
    ],
  },
  {
    id: 'procedimientos_registros', libertad: 'SALUD', nombre: 'Existencia de procedimientos y registros documentales', tamanos: ['MEDIANO_GRANDE'],
    propietario: { problema: 'Faltan el plan sanitario o los registros de tratamientos.',
      porque: 'Sin registros no se sabe qué se aplicó ni cuándo, y se puede vender leche o carne con residuos.',
      acciones: ['Tenga un plan sanitario firmado por un veterinario.', 'Anote cada tratamiento: animal, producto, dosis, fecha y tiempo de retiro.', 'Prepare un plan para emergencias.'] },
    indicadores: [
      ['Plan sanitario firmado por MV o MVZ e implementado', 'Revise el documento firmado y si se está cumpliendo.', 'SI_NO', 'GESTION', 'DOCUMENTAL'],
      ['Registro de tratamiento veterinario', 'Revise que los tratamientos estén registrados y al día.', 'ESCALA', 'GESTION', 'DOCUMENTAL'],
      ['Plan de contingencia y emergencias', 'Existe un plan para incendios, inundaciones u otras emergencias.', 'SI_NO', 'GESTION', 'DOCUMENTAL'],
    ],
  },
  {
    id: 'uso_medicamentos', libertad: 'SALUD', nombre: 'Uso de medicamentos veterinarios', tamanos: ['MEDIANO_GRANDE'],
    propietario: { problema: 'Los medicamentos no se usan o no se guardan correctamente.',
      porque: 'Un medicamento mal usado no cura, deja residuos en la leche o la carne y puede estar prohibido.',
      acciones: ['Use solo medicamentos formulados por el veterinario.', 'Guárdelos en un lugar fresco, seco y con llave.', 'Nunca use sustancias prohibidas ni promotores de crecimiento.'] },
    indicadores: [
      ['Uso de sustancias prohibidas o promotores de crecimiento', 'Cumple si no se encuentran ni se usan sustancias prohibidas.', 'SI_NO', 'GESTION', 'DOCUMENTAL', true],
      ['Almacenamiento, estado y conservación', 'Medicamentos vigentes, rotulados y guardados en condiciones adecuadas.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Prescripción por MV o MVZ', 'Los tratamientos tienen fórmula de un médico veterinario.', 'ESCALA', 'GESTION', 'DOCUMENTAL'],
    ],
  },
  // Libre de molestias físicas y térmicas
  {
    id: 'confort_fisico', libertad: 'CONFORT', nombre: 'Confort físico',
    propietario: { problema: 'Los lugares donde están los animales no son cómodos ni seguros.',
      porque: 'El barro, la suciedad y las cercas dañadas causan heridas, cojeras y enfermedades.',
      acciones: ['Drene los potreros y corrales que se encharcan.', 'Limpie los corrales con frecuencia.', 'Repare cercas e instalaciones con puntas o tablas rotas.'] },
    indicadores: [
      ['Encharcamiento de potreros/corrales', 'Observe zonas con barro o agua acumulada donde permanecen los animales.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Limpieza de potreros/corrales', 'Corrales y potreros sin acumulación de estiércol ni basura.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Áreas de descanso limpias y secas', 'Hay lugares secos y limpios donde los animales pueden echarse.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Estado de instalaciones y cercas', 'Sin clavos, alambres sueltos, tablas rotas ni salientes.', 'ESCALA', 'RECURSOS', 'VISUAL'],
      ['Elementos para auto-acicalamiento', 'Hay árboles, postes o cepillos donde los animales se rascan.', 'ESCALA', 'RECURSOS', 'VISUAL'],
    ],
  },
  {
    id: 'confort_termico', libertad: 'CONFORT', nombre: 'Confort térmico',
    propietario: { problema: 'Los animales no tienen cómo protegerse del sol, la lluvia o el frío.',
      porque: 'El calor y el frío extremos estresan al animal, que come y produce menos.',
      acciones: ['Siembre árboles o ponga polisombra en los potreros.', 'Ofrezca refugio en épocas de lluvia o frío.'] },
    indicadores: [
      ['Protección contra inclemencia climática', 'Hay sombra o refugio suficiente para todo el lote.', 'ESCALA', 'RECURSOS', 'VISUAL'],
    ],
  },
  {
    id: 'espacio_estabulados', libertad: 'CONFORT', nombre: 'Espacio disponible en animales estabulados',
    propietario: { problema: 'Los animales encerrados tienen poco espacio.',
      porque: 'Con poco espacio los animales pelean, se lastiman y no pueden echarse a descansar.',
      acciones: ['Reduzca el número de animales por corral o amplíe el espacio.', 'Que todos puedan echarse al mismo tiempo.'] },
    indicadores: [
      ['Espacio disponible para los animales', 'Si hay animales estabulados, todos pueden echarse y moverse; si no hay, marque "No aplica".', 'ESCALA', 'RECURSOS', 'VISUAL'],
    ],
  },
  // Libre de temor y angustia, y de manifestar su comportamiento natural
  {
    id: 'movimiento_expresion', libertad: 'COMPORTAMIENTO', nombre: 'Libertad de movimiento y expresión comportamental',
    propietario: { problema: 'Los animales no pueden moverse ni comportarse con normalidad.',
      porque: 'Un animal amarrado o una cría mal alimentada sufre estrés y se desarrolla menos.',
      acciones: ['Evite tener animales amarrados por largos periodos.', 'Asegure que las crías reciban leche suficiente.'] },
    indicadores: [
      ['Suministro de leche a las crías', 'Las crías reciben leche suficiente, por amamantamiento o en balde.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Animales amarrados', 'Cumple si no hay animales amarrados de forma permanente o prolongada.', 'ESCALA', 'ANIMAL', 'VISUAL'],
    ],
  },
  {
    id: 'interacciones', libertad: 'COMPORTAMIENTO', nombre: 'Interacciones comportamentales',
    propietario: { problema: 'El trato a los animales los asusta.',
      porque: 'Un animal asustado se lastima, lastima a las personas y produce menos.',
      acciones: ['Arree con calma, sin golpes, gritos ni perros que muerdan.', 'Use banderas en lugar de palos o rejos.'] },
    indicadores: [
      ['Actitud del trabajador hacia los animales', 'Trato tranquilo, sin golpes, gritos ni elementos que causen dolor.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Reacción de los animales frente al trabajador', 'Los animales no huyen ni se muestran asustados ante las personas.', 'ESCALA', 'ANIMAL', 'MUESTREO'],
      ['Interacción trabajador-animales', 'El manejo en corrales y mangas es calmado y sin forcejeos.', 'ESCALA', 'GESTION', 'VISUAL'],
      ['Presencia de estereotipias', 'Cumple si no se observan conductas repetitivas anormales (lamer objetos, morder barras).', 'ESCALA', 'ANIMAL', 'MUESTREO'],
    ],
  },
  {
    id: 'capacitacion', libertad: 'COMPORTAMIENTO', nombre: 'Conocimiento y capacitación en bienestar animal',
    propietario: { problema: 'El personal no ha recibido capacitación en bienestar animal.',
      porque: 'Quien sabe manejar a los animales evita golpes, heridas y pérdidas.',
      acciones: ['Inscriba al personal en cursos de bienestar animal del ICA o del SENA.', 'Guarde los certificados de las capacitaciones.'] },
    indicadores: [
      ['Capacitación del personal sobre bienestar animal', 'Revise certificados o pregunte al personal sobre buenas prácticas.', 'ESCALA', 'GESTION', 'DOCUMENTAL'],
    ],
  },
];

/** Los 23 criterios, con los datos que se guardan en la colección `criterios` de Firestore. */
export const CRITERIOS: Criterio[] = DEFINICION.map(({ indicadores: _indicadores, ...c }, n) => ({
  ...c,
  orden: n + 1,
  sistemas: c.sistemas ?? TODOS_LOS_SISTEMAS,
  tamanos: c.tamanos ?? TODOS_LOS_TAMANOS,
}));

/** Todos los indicadores; dentro de cada libertad, todos pesan lo mismo. */
export const LISTA_BOVINOS: Indicador[] = DEFINICION.flatMap((c, n) =>
  c.indicadores.map(([texto, ayuda, respuesta, tipo, metodo, critico], k) => ({
    codigo: `${n + 1}.${k + 1}`,
    criterio: c.id,
    nombreCriterio: c.nombre,
    libertad: c.libertad,
    texto,
    ayuda,
    respuesta,
    tipo,
    metodo,
    critico: critico ?? false,
    peso: 1,
    propietario: c.propietario,
  })),
);

export const LISTAS_POR_ESPECIE: Record<string, Indicador[]> = {
  BOVINO: LISTA_BOVINOS,
  BUFALINO: LISTA_BOVINOS,
};

/**
 * Indicadores que aplican a una evaluación: los de la especie, filtrados por el sistema
 * productivo del predio (si se conoce) y por su tamaño. Los registros documentales y el
 * uso de medicamentos solo se exigen a medianos y grandes productores.
 */
export function listaPara(especie: string, sistema: Sistema | null, totalAnimales: number): Indicador[] {
  const tamano = tamanoPredio(totalAnimales);
  const criterios = new Map(CRITERIOS.map((c) => [c.id, c]));
  return (LISTAS_POR_ESPECIE[especie] ?? []).filter((i) => {
    const c = criterios.get(i.criterio)!;
    return c.tamanos.includes(tamano) && (!sistema || c.sistemas.includes(sistema));
  });
}
