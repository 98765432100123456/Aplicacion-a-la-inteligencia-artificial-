import { LIBERTADES, NIVELES } from '../../compartido/norma';
import { P } from '../../core/models/models';

/** Pregunta con respuesta establecida del asistente. */
export interface PreguntaFrecuente {
  id: string;
  pregunta: string;
  /** Párrafos de la respuesta. */
  respuesta: string[];
  /** Palabras que la identifican cuando la persona escribe su propia pregunta (sin tildes). */
  claves: string[];
  enlace?: { texto: string; ruta: string };
  /** Solo se sugiere a quien tenga alguno de estos permisos. */
  permisos?: string[];
}

const pesos = LIBERTADES.map((l) => `${l.corto} ${l.peso} %`).join(', ');
const niveles = NIVELES.map((n) => `${n.nombre}: ${n.rango}`).join('; ');

/** Respuestas establecidas. Los pesos y niveles salen de compartido/norma.ts para no desactualizarse. */
export const PREGUNTAS: PreguntaFrecuente[] = [
  {
    id: 'evaluar',
    pregunta: '¿Cómo hago una evaluación?',
    respuesta: [
      'Entre a Predios, abra el predio y pulse «Realizar evaluación».',
      'Responda cada criterio con las listas desplegables de los árboles de escenarios. El avance se guarda solo mientras trabaja, aunque se vaya la señal un momento.',
      'Cuando todo esté respondido, pulse «Finalizar evaluación»: la aplicación calcula el puntaje, el nivel y las recomendaciones.',
    ],
    claves: ['evaluacion', 'evaluar', 'diligenciar', 'formulario', 'lista de chequeo', 'empezar', 'realizar'],
    enlace: { texto: 'Ir a Predios', ruta: '/predios' },
    permisos: [P.EVALUACIONES_DILIGENCIAR],
  },
  {
    id: 'arboles',
    pregunta: '¿Qué es el árbol de escenarios?',
    respuesta: [
      'Es el método del ICA para calificar 17 criterios: cada respuesta suma los puntos del diagrama y decide cuál es la siguiente pregunta.',
      'Si cambia una respuesta, las preguntas que ya no aplican se borran y el puntaje se recalcula al instante. Los puntos solo los ve el evaluador.',
    ],
    claves: ['arbol', 'escenario', 'diagrama', 'desplegable', 'puntos', 'pregunta siguiente'],
    permisos: [P.EVALUACIONES_DILIGENCIAR, P.EVALUACIONES_VER],
  },
  {
    id: 'puntaje',
    pregunta: '¿Cómo se calcula el puntaje?',
    respuesta: [
      `El predio se califica de 0 a 5. Cada libertad pesa distinto: ${pesos}.`,
      'Dentro de cada libertad, un árbol de escenarios cuenta como los puntos obtenidos sobre el máximo posible, y las preguntas de cumplimiento como su promedio.',
    ],
    claves: ['puntaje', 'calcula', 'calificacion', 'nota', 'promedio', 'peso', 'porcentaje', 'suma'],
  },
  {
    id: 'niveles',
    pregunta: '¿Qué significa cada nivel?',
    respuesta: [
      `El puntaje de 0 a 5, redondeado a un decimal, da el nivel. ${niveles}.`,
      'Un nivel Bajo o Medio en un criterio aparece como hallazgo en el informe, con su recomendación.',
    ],
    claves: ['nivel', 'excelente', 'alto', 'medio', 'bajo', 'resultado', 'significa'],
  },
  {
    id: 'libertades',
    pregunta: '¿Qué son las cinco libertades?',
    respuesta: [
      'Son los principios de bienestar animal que usa la norma del ICA. La aplicación las agrupa en cuatro bloques:',
      ...LIBERTADES.map((l) => `${l.nombre} (${l.peso} % del puntaje).`),
    ],
    claves: ['libertad', 'libertades', 'principios', 'bienestar animal', 'cinco'],
  },
  {
    id: 'muestra',
    pregunta: '¿Cuántos animales debo revisar?',
    respuesta: [
      'Depende del inventario del predio. Con 99 animales o menos se revisan 20, o todos si hay menos de 20.',
      'De 100 a 499 animales se revisan 30; de 500 a 999, 40; y desde 1.000, el 5 % del inventario. El formulario muestra la cantidad exacta y cómo repartirla por edades.',
    ],
    claves: ['muestra', 'cuantos animales', 'revisar', 'inventario', 'tamano', 'cantidad'],
    permisos: [P.EVALUACIONES_DILIGENCIAR, P.EVALUACIONES_VER],
  },
  {
    id: 'informes',
    pregunta: '¿Cómo descargo los informes?',
    respuesta: [
      'Abra el predio y, en la evaluación finalizada, elija «Informe técnico (PDF)» o «Informe para el propietario (PDF)».',
      'Los PDF se generan en su navegador en el momento; no quedan guardados en ningún servidor.',
    ],
    claves: ['informe', 'pdf', 'descargar', 'reporte', 'imprimir'],
    enlace: { texto: 'Ir a Predios', ruta: '/predios' },
    permisos: [P.REPORTES_VER, P.EVALUACIONES_VER, P.PREDIOS_PROPIOS],
  },
  {
    id: 'recomendaciones',
    pregunta: '¿De dónde salen las recomendaciones?',
    respuesta: [
      'Al finalizar, la inteligencia artificial de Firebase (Gemini) redacta recomendaciones en lenguaje sencillo a partir de los hallazgos.',
      'La aplicación revisa esa respuesta; si no está disponible o no cumple el formato, usa las recomendaciones establecidas por reglas de la norma.',
    ],
    claves: ['recomendacion', 'inteligencia artificial', 'ia', 'gemini', 'sugerencia', 'mejorar'],
  },
  {
    id: 'predio',
    pregunta: '¿Cómo registro un predio?',
    respuesta: [
      'En Predios pulse «Nuevo predio» y escriba la ubicación, el sistema productivo, el inventario por edades y los datos del propietario.',
      'Si escribe el correo del propietario, él podrá ver los resultados finalizados de su finca al ingresar con ese correo.',
    ],
    claves: ['predio', 'finca', 'registrar', 'crear', 'nuevo predio', 'agregar'],
    enlace: { texto: 'Nuevo predio', ruta: '/predios/nuevo' },
    permisos: [P.FINCAS_GESTIONAR],
  },
  {
    id: 'propietario',
    pregunta: '¿Dónde veo los resultados de mi finca?',
    respuesta: [
      'En «Mis predios» aparecen las fincas registradas con su correo. Abra una para ver las evaluaciones finalizadas, el nivel de cada libertad y las recomendaciones.',
      'Si no ve su finca, pida al evaluador que registre su correo en los datos del propietario.',
    ],
    claves: ['mi finca', 'mis predios', 'resultados', 'propietario', 'ver resultado', 'no veo'],
    enlace: { texto: 'Ir a Mis predios', ruta: '/predios' },
    permisos: [P.PREDIOS_PROPIOS],
  },
  {
    id: 'usuarios',
    pregunta: '¿Cómo creo usuarios y asigno roles?',
    respuesta: [
      'En Usuarios pulse «Nuevo usuario», escriba sus datos y elija el rol. La persona recibe su acceso con el correo registrado.',
      'En Roles puede crear roles propios y marcar sus permisos. Los roles base no se eliminan y nadie puede cambiar su propio rol.',
    ],
    claves: ['usuario', 'rol', 'roles', 'permiso', 'crear usuario', 'administrador', 'acceso'],
    enlace: { texto: 'Ir a Usuarios', ruta: '/usuarios' },
    permisos: [P.USUARIOS_GESTIONAR, P.ROLES_GESTIONAR],
  },
  {
    id: 'dosPasos',
    pregunta: '¿Por qué me piden un código al ingresar?',
    respuesta: [
      'Es la verificación en dos pasos: además de su contraseña, escribe un código de 6 dígitos que llega a su correo y vence en 10 minutos.',
      'Así, aunque alguien conozca su contraseña, no puede entrar sin acceso a su correo. Nunca le pediremos ese código por teléfono ni por mensaje.',
    ],
    claves: ['codigo', 'dos pasos', 'verificacion', 'correo', 'seguridad', 'no llega', '2fa'],
  },
  {
    id: 'datos',
    pregunta: '¿Cómo protegen mis datos?',
    respuesta: [
      'La información viaja cifrada (HTTPS) y cada consulta pasa por reglas de seguridad que revisan su rol y permisos. Un propietario solo ve sus propios predios.',
      'Los datos personales se tratan según la Ley 1581 de 2012. Puede leer los detalles en la política de privacidad.',
    ],
    claves: ['datos', 'privacidad', 'proteger', 'cookies', 'seguro', 'habeas data', 'personal'],
    enlace: { texto: 'Leer la política de privacidad', ruta: '/privacidad' },
  },
];

/** Quita tildes y mayúsculas para comparar textos escritos a mano. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** La respuesta establecida que mejor coincide con lo que escribió la persona, o null si ninguna se parece. */
export function buscarRespuesta(texto: string, preguntas: PreguntaFrecuente[] = PREGUNTAS): PreguntaFrecuente | null {
  const t = normalizar(texto);
  let mejor: PreguntaFrecuente | null = null;
  let puntos = 0;
  for (const p of preguntas) {
    const n = p.claves.reduce((s, c) => s + (t.includes(c) ? c.split(' ').length + 1 : 0), 0);
    if (n > puntos) {
      mejor = p;
      puntos = n;
    }
  }
  return puntos >= 2 ? mejor : null;
}

/** Preguntas que se sugieren a la persona según sus permisos. */
export function preguntasPara(puede: (...permisos: string[]) => boolean): PreguntaFrecuente[] {
  return PREGUNTAS.filter((p) => !p.permisos || puede(...p.permisos));
}
