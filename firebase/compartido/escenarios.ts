// ARCHIVO GENERADO desde compartido/escenarios.ts. No lo edite aquí: edite el original y ejecute node scripts/compartido.mjs

import { CodigoNivel } from './norma';

/**
 * Árboles de escenarios de la Metodología del ICA (productor mediano y grande,
 * diagramas 1 a 19; el diagrama 20 de pequeño productor es igual al 1). Cada criterio
 * con diagrama se califica recorriendo su árbol: cada respuesta suma (o resta) los
 * puntos del diagrama y decide la siguiente pregunta. Al llegar al final, el total de
 * puntos da el nivel del criterio con los mismos cortes del diagrama.
 */

export interface Opcion {
  id: string;
  texto: string;
  puntos: number;
  /** Pregunta siguiente; sin ella, el recorrido termina aquí. */
  siguiente?: string;
  /** El diagrama marca este camino como "No aplica": el árbol no entra en el cálculo. */
  noAplica?: boolean;
}

export interface Pregunta {
  id: string;
  texto: string;
  opciones: Opcion[];
}

export interface Arbol {
  id: string;
  /** Criterio de la lista de chequeo que califica. */
  criterio: string;
  diagrama: number;
  titulo: string;
  inicio: string;
  preguntas: Record<string, Pregunta>;
  /** Puntos mínimos de cada nivel; un diagrama sin nivel Excelente lo deja en null. */
  cortes: { excelente: number | null; alto: number; medio: number };
}

/** Respuesta del evaluador: la opción elegida en cada pregunta del recorrido. */
export interface RutaArbol {
  ruta: Record<string, string>;
  observacion?: string | null;
}

export interface PasoArbol {
  pregunta: Pregunta;
  opcion: Opcion;
  /** Puntos acumulados hasta este paso, inclusive. */
  acumulado: number;
}

export interface EstadoArbol {
  pasos: PasoArbol[];
  /** Pregunta que falta responder; null cuando el recorrido terminó. */
  siguiente: Pregunta | null;
  completo: boolean;
  noAplica: boolean;
  puntos: number;
  maximo: number;
  nivel: CodigoNivel | null;
}

// Constructores cortos para escribir los diagramas.
const o = (id: string, texto: string, puntos: number, siguiente?: string): Opcion => ({ id, texto, puntos, ...(siguiente ? { siguiente } : {}) });
const p = (id: string, texto: string, ...opciones: Opcion[]): Pregunta => ({ id, texto, opciones });
const na = (id: string, texto: string): Opcion => ({ id, texto, puntos: 0, noAplica: true });
const sino = (si: number, no: number, siguiente?: string) => [o('si', 'Sí', si, siguiente), o('no', 'No', no, siguiente)];
const arbol = (a: Omit<Arbol, 'preguntas'> & { preguntas: Pregunta[] }): Arbol => ({
  ...a,
  preguntas: Object.fromEntries(a.preguntas.map((x) => [x.id, x])),
});

const PORCENTAJE_4 = (siguiente?: string, cortes = [3, 2, 1, 0]) => [
  o('todos', 'Sí, todos', cortes[0], siguiente),
  o('80', 'Sí, al menos el 80 %', cortes[1], siguiente),
  o('50', 'Sí, al menos el 50 %', cortes[2]),
  o('menos', 'Menos del 50 %', cortes[3]),
];

export const ARBOLES: Arbol[] = [
  arbol({
    id: 'agua', criterio: 'suministro_agua', diagrama: 1, titulo: 'Suministro de agua', inicio: 'disponibilidad',
    cortes: { excelente: 14, alto: 12, medio: 9 },
    preguntas: [
      p('disponibilidad', '¿Los potreros o corrales visitados tienen agua de bebida disponible?', ...PORCENTAJE_4('metodo')),
      p('metodo', '¿Cuál es el método de oferta del agua de bebida?', o('bebederos', 'Bebedero(s)', 1, 'accesoBebederos'), o('natural', 'Fuente natural', 0, 'accesoNatural')),
      p('accesoBebederos', '¿Los bebederos pueden ser accedidos por los animales?', ...PORCENTAJE_4('voluntadBebederos')),
      p('voluntadBebederos', '¿El ganado bebe agua a voluntad?', ...sino(3, 0, 'sombra')),
      p('sombra', '¿Todos los bebederos están bajo sombra?', ...sino(1, 0, 'limpios')),
      p('limpios', '¿Los bebederos están limpios?', ...sino(1, 0, 'calidadBebederos')),
      p('calidadBebederos', '¿La calidad del agua es aceptable (está limpia a simple vista)?', ...sino(2, 0)),
      p('accesoNatural', '¿Las fuentes de agua pueden ser accedidas por los animales?', ...PORCENTAJE_4('voluntadNatural')),
      p('voluntadNatural', '¿El ganado bebe agua a voluntad?', ...sino(3, 0, 'reservorios')),
      p('reservorios', '¿Utiliza reservorios o jagüeyes?', o('si', 'Sí', 0, 'cobertura'), o('no', 'No', 0, 'calidadNatural')),
      p('cobertura', '¿Tienen cobertura arbórea?', o('si', 'Sí', 0, 'calidadNatural'), o('no', 'No', -1, 'calidadNatural')),
      p('calidadNatural', '¿La calidad del agua es aceptable (está limpia a simple vista)?', ...sino(3, 0)),
    ],
  }),
  arbol({
    id: 'alimento', criterio: 'suministro_alimento', diagrama: 2, titulo: 'Suministro de alimento', inicio: 'disponibilidad',
    cortes: { excelente: 10, alto: 8, medio: 5 },
    preguntas: [
      p('disponibilidad', '¿Los potreros o corrales visitados tienen disponibilidad de alimento para los animales?', ...PORCENTAJE_4('acceso')),
      p('acceso', '¿Los animales pueden acceder al alimento disponible?', o('si', 'Sí', 3, 'cantidad'), o('no', 'No', 0)),
      p('cantidad', '¿La cantidad de alimento es suficiente para los animales?', ...sino(4, 0, 'comederos')),
      p('comederos', '¿Se usan comederos?', o('si', 'Sí', 0, 'limpieza'), o('no', 'No', 0)),
      p('limpieza', '¿Los comederos están limpios?', ...sino(0, -1)),
    ],
  }),
  arbol({
    id: 'topizado', criterio: 'topizado_descorne', diagrama: 3, titulo: 'Topizado y/o descorne', inicio: 'realiza',
    cortes: { excelente: 8, alto: 5, medio: 4 },
    preguntas: [
      p('realiza', '¿Se realiza topizado y/o descorne?', o('no', 'No / No aplica', 8), o('si', 'Sí', 0, 'metodo')),
      p('metodo', '¿Qué método se utiliza?',
        o('crema2s', 'Topizado con crema antes de 2 semanas de edad', 2, 'experiencia'),
        o('hierro', 'Topizado con hierro hasta 3 meses de edad', 2, 'experiencia'),
        o('crema3m', 'Topizado con crema entre 2 semanas y 3 meses de edad', 1, 'experiencia2'),
        o('descorne', 'Descorne después de 3 meses de edad', 0, 'veterinario')),
      p('experiencia', '¿El personal que lo realiza tiene experiencia?', o('si', 'Sí', 2, 'dolor'), o('no', 'No', 0)),
      p('dolor', '¿Cómo se maneja el dolor?', o('ambas', 'Anestesia y analgesia', 4), o('una', 'Anestesia o analgesia', 1), o('ninguna', 'Ninguna', 0)),
      p('experiencia2', '¿El personal que lo realiza tiene experiencia?', o('si', 'Sí', 2, 'dolor2'), o('no', 'No', 0)),
      p('veterinario', '¿El descorne es realizado por un MV o MVZ?', o('si', 'Sí', 2, 'dolor2'), o('no', 'No', 0)),
      p('dolor2', '¿Cómo se maneja el dolor?', o('ambas', 'Anestesia y analgesia', 2), o('una', 'Anestesia o analgesia', 1), o('ninguna', 'Ninguna', 0)),
    ],
  }),
  arbol({
    id: 'castracion', criterio: 'castracion', diagrama: 4, titulo: 'Castración', inicio: 'realiza',
    cortes: { excelente: 8, alto: 6, medio: 4 },
    preguntas: [
      p('realiza', '¿Se realiza castración?', o('no', 'No / No aplica', 8), o('si', 'Sí', 0, 'metodo')),
      p('metodo', '¿Qué método de castración se utiliza más?', o('cerrada', 'Cerrada (emasculación, elastración)', 0, 'edadCerrada'), o('abierta', 'Abierta (quirúrgica)', 0, 'edadAbierta')),
      p('edadCerrada', '¿Qué edad tiene el animal?', o('menor', 'Menor o igual a 3 meses', 2, 'anestesiaCerrada'), o('mayor', 'Mayor de 3 meses', 0, 'anestesiaCerradaMayor')),
      p('anestesiaCerrada', '¿Se usa anestesia y analgesia?', o('si', 'Sí', 2, 'experienciaSupervisada'), o('no', 'No', 0, 'experiencia')),
      p('anestesiaCerradaMayor', '¿Se usa anestesia y analgesia?', ...sino(2, 0, 'experiencia')),
      p('experienciaSupervisada', '¿Lo realiza personal con experiencia?', o('si', 'Sí', 2, 'supervision'), o('no', 'No', 0)),
      p('supervision', '¿El procedimiento es supervisado por un MV o MVZ?', ...sino(2, 0)),
      p('experiencia', '¿Lo realiza personal con experiencia?', ...sino(2, 0)),
      p('edadAbierta', '¿Qué edad tiene el animal?', o('menor', 'Menor o igual a 3 meses', 2, 'anestesiaAbierta'), o('mayor', 'Mayor de 3 meses', 0, 'anestesiaAbiertaMayor')),
      p('anestesiaAbierta', '¿Se usa anestesia y analgesia?', o('si', 'Sí', 2, 'veterinario'), o('no', 'No', 0)),
      p('veterinario', '¿El procedimiento es realizado por un MV o MVZ?', ...sino(4, 0)),
      p('anestesiaAbiertaMayor', '¿Se usa anestesia y analgesia?', o('si', 'Sí', 2, 'veterinarioMayor'), o('no', 'No', 0)),
      p('veterinarioMayor', '¿El procedimiento es realizado por un MV o MVZ?', ...sino(3, 0)),
    ],
  }),
  arbol({
    id: 'identificacion', criterio: 'identificacion', diagrama: 5, titulo: 'Identificación con métodos no permanentes y tatuajes', inicio: 'identifica',
    cortes: { excelente: 7, alto: 5, medio: 4 },
    preguntas: [
      p('identifica', '¿Identifica a sus animales por medio de orejeras, tatuajes, dispositivos electrónicos, entre otros?', o('si', 'Sí', 3, 'edad'), na('no', 'No')),
      p('edad', '¿Qué edad tiene el animal al identificarlo?', o('menor', 'Menor o igual a 3 meses', 2, 'experticia'), o('mayor', 'Mayor de 3 meses', 0, 'experticiaMayor')),
      p('experticia', '¿Lo realiza personal con experticia?', ...sino(2, 0)),
      p('experticiaMayor', '¿Lo realiza personal con experticia?', ...sino(1, 0)),
    ],
  }),
  arbol({
    id: 'marcaje', criterio: 'identificacion', diagrama: 6, titulo: 'Marcaje con métodos permanentes', inicio: 'metodo',
    cortes: { excelente: null, alto: 5, medio: 3 },
    preguntas: [
      p('metodo', '¿Marca a sus animales con hierro caliente o nitrógeno líquido (identificación con fines de propiedad y visibilidad)?',
        o('nitrogeno', 'Sí, nitrógeno líquido (marcaje en frío)', 1, 'edad'), o('hierro', 'Sí, hierro caliente', 0, 'edad'), na('ninguno', 'Ninguno')),
      p('edad', '¿Qué edad tiene el animal al marcarlo?', o('entre', 'Entre 2 y 6 meses', 2, 'experticia'), o('fuera', 'Menor de 2 meses o mayor de 6 meses', 0)),
      p('experticia', '¿Lo realiza personal con experticia?', ...sino(2, 0, 'cuidados')),
      p('cuidados', '¿Utiliza analgesia, antiinflamatorios y/o soluciones tópicas cicatrizantes?', ...sino(2, 0)),
    ],
  }),
  arbol({
    id: 'pezones', criterio: 'pezones_supernumerarios', diagrama: 7, titulo: 'Corte de pezones supernumerarios', inicio: 'realiza',
    cortes: { excelente: 7, alto: 5, medio: 3 },
    preguntas: [
      p('realiza', '¿Se realiza remoción de pezones supernumerarios?', o('no', 'No', 7), o('si', 'Sí', 0, 'edad')),
      p('edad', '¿Qué edad tiene el animal?', o('menor', 'Menor o igual a 3 meses', 2, 'anestesia'), o('mayor', 'Mayor de 3 meses', 0, 'anestesiaMayor')),
      p('anestesia', '¿Se usa anestesia y analgesia?', o('si', 'Sí', 2, 'experiencia'), o('no', 'No', 0, 'experienciaSinAnestesia')),
      p('experiencia', '¿El procedimiento es realizado por personal con experiencia?', o('si', 'Sí', 1, 'supervision'), o('no', 'No', 0)),
      p('supervision', '¿El procedimiento es supervisado o realizado por un MV o MVZ?', ...sino(2, 0)),
      p('experienciaSinAnestesia', '¿El procedimiento es realizado por personal con experiencia?', ...sino(1, 0)),
      p('anestesiaMayor', '¿Se usa anestesia y analgesia?', ...sino(2, 0, 'veterinario')),
      p('veterinario', '¿El procedimiento es realizado por un MV o MVZ?', ...sino(2, 0)),
    ],
  }),
  arbol({
    id: 'lesiones', criterio: 'lesiones_inflamaciones', diagrama: 8, titulo: 'Presencia de lesiones e inflamaciones', inicio: 'presentan',
    cortes: { excelente: 10, alto: 8, medio: 5 },
    preguntas: [
      p('presentan', '¿Los animales presentan lesiones?', o('no', 'No', 5, 'inflamaciones'), o('si', 'Sí', 0, 'porcentaje')),
      p('porcentaje', '¿Qué porcentaje de animales tiene lesiones?', o('hasta50', '50 % o menos', 2, 'inflamaciones'), o('mas50', 'Más del 50 %', 0, 'inflamaciones')),
      p('inflamaciones', '¿Qué porcentaje de animales tiene inflamaciones?', o('sin', 'Sin inflamaciones', 5), o('hasta50', '50 % o menos', 3), o('mas50', 'Más del 50 %', 0)),
    ],
  }),
  arbol({
    id: 'ectoparasitos', criterio: 'ectoparasitos', diagrama: 9, titulo: 'Presencia de ectoparásitos', inicio: 'moscas',
    cortes: { excelente: 10, alto: 7, medio: 5 },
    preguntas: [
      p('moscas', '¿Qué porcentaje de animales presentan infestación por moscas?', o('hasta50', '50 % o menos', 3, 'garrapatas'), o('mas50', 'Más del 50 %', 0, 'garrapatasMoscas')),
      p('garrapatas', '¿Qué porcentaje de animales presentan infestación por garrapatas?', o('hasta50', '50 % o menos', 2, 'miasis'), o('mas50', 'Más del 50 %', 0, 'miasis')),
      p('garrapatasMoscas', '¿Qué porcentaje de animales presentan infestación por garrapatas?', o('hasta50', '50 % o menos', 2, 'miasis'), o('mas50', 'Más del 50 %', 0, 'miasisAltas')),
      p('miasis', '¿Qué porcentaje de animales presentan miasis?', o('hasta20', '20 % o menos', 2, 'nuches'), o('mas20', 'Más del 20 %', 0, 'nuches')),
      p('miasisAltas', '¿Qué porcentaje de animales presentan miasis?', o('hasta20', '20 % o menos', 2, 'nuchesAltas'), o('mas20', 'Más del 20 %', 0, 'nuchesAltas')),
      p('nuches', '¿Qué porcentaje de animales presentan nuches?', o('hasta50', '50 % o menos', 3), o('mas50', 'Más del 50 %', 0)),
      p('nuchesAltas', '¿Qué porcentaje de animales presentan nuches?', o('hasta50', '50 % o menos', 2), o('mas50', 'Más del 50 %', 0)),
    ],
  }),
  arbol({
    id: 'cojeras', criterio: 'movilidad_cojeras', diagrama: 10, titulo: 'Cojeras', inicio: 'hay',
    cortes: { excelente: 10, alto: 7, medio: 4 },
    preguntas: [
      p('hay', '¿Hay animales con cojeras?', o('no', 'No', 10), o('si', 'Sí', 0, 'porcentaje')),
      p('porcentaje', '¿Qué porcentaje de animales tiene cojeras?', o('hasta10', '10 % o menos', 5, 'graves5'), o('11a50', 'Entre 11 y 50 %', 2, 'graves10'), o('mas50', 'Más del 50 %', 0, 'graves10')),
      p('graves5', '¿Qué porcentaje de animales tiene cojeras graves?', o('hasta5', '5 % o menos', 2), o('mas5', 'Más del 5 %', 0)),
      p('graves10', '¿Qué porcentaje de animales tiene cojeras graves?', o('hasta10', '10 % o menos', 2), o('mas10', 'Más del 10 %', 0)),
    ],
  }),
  arbol({
    id: 'descarte', criterio: 'animales_descarte', diagrama: 11, titulo: 'Manejo de animales descartados y sacrificio en predio', inicio: 'manejo',
    cortes: { excelente: 6, alto: 4, medio: 2 },
    preguntas: [
      p('manejo', '¿Qué se hace con los animales con mínima o nula posibilidad de recuperación?',
        o('tratamiento', 'Se suben con cuidado a un vehículo para recibir tratamiento veterinario', 6),
        o('planta', 'Se suben con cuidado a un vehículo para ser sacrificados de emergencia en la planta más cercana', 6),
        o('predio', 'No salen del predio', 0, 'sacrificio'),
        o('cualquiera', 'Se suben a un vehículo de cualquier forma y sin importar su destino', 0)),
      p('sacrificio', '¿Se realiza sacrificio en el predio?', o('si', 'Sí, se sacrifica en el predio', 2, 'metodo'), o('espera', 'Se espera a que el animal muera solo', 0)),
      p('metodo', '¿Con qué método se sacrifica?', o('humanitario', 'Con métodos de sacrificio humanitario', 2, 'competente'), o('nohumanitario', 'Con métodos de sacrificio no humanitario', 0)),
      p('competente', '¿Lo realiza personal competente y con destreza?', ...sino(2, 0)),
    ],
  }),
  arbol({
    id: 'registros', criterio: 'procedimientos_registros', diagrama: 12, titulo: 'Procedimientos y registros', inicio: 'plan',
    cortes: { excelente: 4, alto: 3, medio: 2 },
    preguntas: [
      p('plan', '¿Existe un plan sanitario escrito e implementado?', ...sino(1, 0, 'vacunaciones')),
      p('vacunaciones', '¿Existe un registro de vacunaciones?', ...sino(1, 0, 'tratamientos')),
      p('tratamientos', '¿Existe un registro de tratamientos?', ...sino(1, 0, 'contingencia')),
      p('contingencia', '¿Existe un plan de contingencia definido?', ...sino(1, 0)),
    ],
  }),
  arbol({
    id: 'medicamentos', criterio: 'uso_medicamentos', diagrama: 13, titulo: 'Uso de medicamentos', inicio: 'prohibidas',
    cortes: { excelente: 4, alto: 3, medio: 2 },
    preguntas: [
      p('prohibidas', '¿Se utilizan sustancias prohibidas o promotores de crecimiento sin la autorización de uso?', o('no', 'No', 1, 'registro'), o('si', 'Sí', 0)),
      p('registro', '¿Los medicamentos utilizados cuentan con registro ICA?', o('si', 'Sí', 1, 'almacenamiento'), o('no', 'No', 0)),
      p('almacenamiento', '¿Los medicamentos se encuentran bien almacenados, vigentes y en buen estado de conservación?', o('si', 'Sí', 1, 'prescripcion'), o('no', 'No', 0)),
      p('prescripcion', '¿Los medicamentos utilizados cuentan con prescripción veterinaria?', ...sino(1, 0)),
    ],
  }),
  arbol({
    id: 'confortFisico', criterio: 'confort_fisico', diagrama: 14, titulo: 'Confort físico', inicio: 'encharcamiento',
    cortes: { excelente: 12, alto: 9, medio: 6 },
    preguntas: [
      p('encharcamiento', '¿Los potreros y/o corrales presentan inundaciones, encharcamientos o barriales permanentes en el área total?',
        o('ninguno', 'No, ninguno', 3, 'riesgo'), o('menos20', 'Sí, aunque menos del 20 %', 2, 'riesgo'),
        o('hasta50', 'Sí, aunque no más del 50 %', 1, 'riesgo'), o('mas50', 'Sí, más del 50 %', 0, 'riesgo')),
      p('riesgo', '¿Hay potreros o corrales con presencia de elementos que puedan generar algún riesgo para los animales?', o('no', 'No', 2, 'descanso'), o('si', 'Sí', 0, 'descanso')),
      p('descanso', '¿Los potreros y/o corrales tienen áreas de descanso limpias y secas para los animales?',
        o('todos', 'Sí, todos', 3, 'cercas'), o('80', 'Sí, al menos el 80 %', 2, 'cercas'), o('50', 'Sí, al menos el 50 %', 1, 'cercas'), o('menos', 'Menos del 50 %', 0, 'cercas')),
      p('cercas', '¿El estado de las cercas e instalaciones facilita el manejo y evita heridas y accidentes?', ...sino(2, 0, 'acicalamiento')),
      p('acicalamiento', '¿Existen elementos que promueven el auto-acicalamiento?', ...sino(2, 0)),
    ],
  }),
  arbol({
    id: 'confortTermico', criterio: 'confort_termico', diagrama: 15, titulo: 'Confort térmico', inicio: 'potreros',
    cortes: { excelente: 10, alto: 7, medio: 5 },
    preguntas: [
      p('potreros', '¿En los potreros y/o corrales de estabulación existen elementos para que los animales puedan protegerse de las inclemencias climáticas?',
        o('todos', 'Sí, todos', 5, 'corrales'), o('80', 'Sí, al menos el 80 %', 3, 'corrales'), o('50', 'Sí, al menos el 50 %', 2, 'corrales50'),
        o('menos', 'Menos del 50 %', 1), o('ninguno', 'No, ninguno tiene', 0)),
      p('corrales', '¿En los corrales o sitio de manejo existen elementos para que los animales y trabajadores puedan protegerse de las inclemencias climáticas?',
        o('todos', 'Sí, todos', 3, 'silvopastoril'), o('trabajadores', 'Sí, solo trabajadores', 2, 'silvopastoril'), o('no', 'No', 0, 'silvopastoril')),
      p('silvopastoril', '¿Tiene arreglos silvopastoriles implementados?', ...sino(2, 0)),
      p('corrales50', '¿En los corrales o sitio de manejo existen elementos para que los animales y trabajadores puedan protegerse de las inclemencias climáticas?',
        o('todos', 'Sí, todos', 3), o('trabajadores', 'Sí, solo trabajadores', 2), o('no', 'No', 0)),
    ],
  }),
  arbol({
    id: 'espacio', criterio: 'espacio_estabulados', diagrama: 16, titulo: 'Espacio en estabulación', inicio: 'estabula',
    cortes: { excelente: 8, alto: 6, medio: 3 },
    preguntas: [
      p('estabula', '¿Estabula animales?', o('no', 'No', 8), o('si', 'Sí', 0, 'metodo')),
      p('metodo', '¿Qué método de estabulación usa?',
        o('individuales', 'Corrales individuales', 0, 'individuales'),
        o('puesto', 'Establo grupal con puesto de descanso individual', 0, 'puesto'),
        o('comunal', 'Establo grupal con área de descanso comunal', 0, 'comunal')),
      p('individuales', '¿Todos los animales estabulados o corrales de estabulación tienen el espacio mínimo requerido?',
        o('todos', 'Todos', 6), o('75', 'Al menos el 75 % de los animales', 3), o('menos', 'Menos del 75 % de los animales', 0)),
      p('puesto', '¿Todos los animales estabulados o corrales de estabulación tienen el espacio mínimo requerido?',
        o('cama', 'Todos tienen 1 cama por animal', 8), o('estandar', 'Todos cumplen con el estándar mínimo (1,1:1)', 6),
        o('75', 'Al menos el 75 % cumplen con el estándar mínimo (1,1:1)', 3), o('menos', 'Menos del 75 % cumplen', 0)),
      p('comunal', '¿Todos los animales estabulados o corrales de estabulación tienen el espacio mínimo requerido?',
        o('mas', 'Todos tienen más del espacio mínimo', 8), o('minimo', 'Todos tienen el espacio mínimo', 6), o('75', 'Al menos el 75 %', 3), o('menos', 'Menos del 75 %', 0)),
    ],
  }),
  arbol({
    id: 'interaccion', criterio: 'interacciones', diagrama: 18, titulo: 'Interacción comportamental', inicio: 'actitud',
    cortes: { excelente: 12, alto: 10, medio: 7 },
    preguntas: [
      p('actitud', '¿La actitud del trabajador hacia los animales es positiva (confiado, paciente, empático, calmado) o negativa (inseguro, impaciente, agresivo)?',
        o('positiva', 'Positiva', 3, 'reaccion'), o('negativa', 'Negativa', 0, 'estereotipias')),
      p('reaccion', '¿Cómo es la reacción de los animales ante el humano?', o('calmados', 'Animales calmados', 3, 'relacion'), o('ansiosos', 'Animales ansiosos o excitados (relación negativa)', 0, 'estereotipias')),
      p('relacion', '¿Cómo es la relación humano-animal?', o('positiva', 'Positiva', 3, 'estereotipias'), o('neutra', 'Neutra', 1, 'estereotipias')),
      p('estereotipias', '¿Se observan estereotipias?', o('no', 'No', 3), o('hasta5', 'Sí, en el 5 % o menos de los animales', 1), o('mas5', 'Sí, en más del 5 % de los animales', 0)),
    ],
  }),
  arbol({
    id: 'capacitacion', criterio: 'capacitacion', diagrama: 19, titulo: 'Capacitación del personal', inicio: 'demuestra',
    cortes: { excelente: 8, alto: 7, medio: 5 },
    preguntas: [
      p('demuestra', '¿El personal demuestra conocimiento y experticia en bienestar animal?', o('si', 'Sí', 4, 'porcentaje'), o('no', 'No', 0)),
      p('porcentaje', '¿Qué porcentaje del personal demuestra conocimiento y experticia en bienestar animal?',
        o('100', '100 %', 2, 'certificacion'), o('50', '50 % o más', 1, 'certificacion'), o('menos', 'Menos del 50 %', 0, 'certificacion')),
      p('certificacion', '¿El personal cuenta con certificación escrita?', ...sino(2, 0)),
    ],
  }),
];

/** Árboles de un criterio (identificación tiene dos: diagramas 5 y 6). */
export function arbolesDe(criterio: string): Arbol[] {
  return ARBOLES.filter((a) => a.criterio === criterio);
}

const maximos = new Map<string, number>();

/** Mayor puntaje posible del árbol: el mejor recorrido del diagrama. */
export function maximoArbol(a: Arbol): number {
  const guardado = maximos.get(a.id);
  if (guardado !== undefined) return guardado;
  const mejor = (id: string): number =>
    Math.max(...a.preguntas[id].opciones.filter((x) => !x.noAplica).map((x) => x.puntos + (x.siguiente ? mejor(x.siguiente) : 0)));
  const max = mejor(a.inicio);
  maximos.set(a.id, max);
  return max;
}

/** Nivel del criterio con los cortes de su diagrama. */
export function nivelArbol(a: Arbol, puntos: number): CodigoNivel {
  if (a.cortes.excelente !== null && puntos >= a.cortes.excelente) return 'EXCELENTE';
  if (puntos >= a.cortes.alto) return 'ALTO';
  if (puntos >= a.cortes.medio) return 'MEDIO';
  return 'BAJO';
}

/**
 * Recorre el árbol con las respuestas dadas. Las respuestas de preguntas que quedaron
 * fuera del camino (porque se cambió una respuesta anterior) se ignoran.
 */
export function recorrerArbol(a: Arbol, ruta: Record<string, string> = {}): EstadoArbol {
  const pasos: PasoArbol[] = [];
  let acumulado = 0;
  let actual: Pregunta | null = a.preguntas[a.inicio];
  let noAplica = false;
  while (actual) {
    const pregunta: Pregunta = actual;
    const opcion: Opcion | undefined = pregunta.opciones.find((x) => x.id === ruta[pregunta.id]);
    if (!opcion) break;
    acumulado += opcion.puntos;
    pasos.push({ pregunta, opcion, acumulado });
    if (opcion.noAplica) noAplica = true;
    actual = opcion.siguiente ? a.preguntas[opcion.siguiente] : null;
  }
  const completo = actual === null;
  const puntos = Math.max(0, acumulado);
  return {
    pasos,
    siguiente: actual,
    completo,
    noAplica,
    puntos,
    maximo: maximoArbol(a),
    nivel: completo && !noAplica ? nivelArbol(a, puntos) : null,
  };
}

/** Deja solo las respuestas del camino recorrido, para guardar sin restos de caminos abandonados. */
export function rutaLimpia(a: Arbol, ruta: Record<string, string>): Record<string, string> {
  return Object.fromEntries(recorrerArbol(a, ruta).pasos.map((x) => [x.pregunta.id, x.opcion.id]));
}
