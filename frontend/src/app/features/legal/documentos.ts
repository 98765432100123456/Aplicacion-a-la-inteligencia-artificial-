/**
 * Textos legales del sitio. Antes de publicar, el equipo debe escribir en CONTACTO_PRIVACIDAD
 * el correo que atenderá las solicitudes de datos personales (Ley 1581 de 2012); mientras sea
 * null, los textos remiten al administrador del sistema.
 */
export const CONTACTO_PRIVACIDAD: string | null = null;

export const ACTUALIZADO = '14 de noviembre de 2026';

export interface Seccion {
  titulo: string;
  parrafos: string[];
  lista?: string[];
}

export interface DocumentoLegal {
  titulo: string;
  resumen: string;
  secciones: Seccion[];
}

const contacto = CONTACTO_PRIVACIDAD
  ? `escribiendo a ${CONTACTO_PRIVACIDAD}`
  : 'a través del administrador del sistema de su organización';

export const DOCUMENTOS: Record<'privacidad' | 'terminos' | 'cookies', DocumentoLegal> = {
  privacidad: {
    titulo: 'Política de tratamiento de datos personales',
    resumen:
      'Qué datos personales recoge ICA Bienestar Animal, para qué los usa, cómo los protege y cómo puede ejercer sus derechos como titular, según la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
    secciones: [
      {
        titulo: 'Quién trata los datos',
        parrafos: [
          'ICA Bienestar Animal es un proyecto académico de la asignatura Aplicación a la Inteligencia Artificial que aplica la metodología del Instituto Colombiano Agropecuario (ICA) para evaluar el bienestar animal. No es un sitio oficial del ICA.',
          `El equipo del proyecto es responsable del tratamiento. Puede contactarlo ${contacto}.`,
        ],
      },
      {
        titulo: 'Qué datos recogemos',
        parrafos: ['Solo los necesarios para prestar el servicio:'],
        lista: [
          'De las personas usuarias: nombres, apellidos, correo electrónico, documento y teléfono (opcionales), rol y fecha del último ingreso.',
          'De los predios: nombre, ubicación (departamento, municipio y vereda), sistema productivo, inventario de animales y datos de contacto del propietario.',
          'De las evaluaciones: respuestas de la lista de chequeo, observaciones, puntajes, niveles y recomendaciones.',
          'Registros de seguridad: inicios de sesión verificados y una bitácora de acciones administrativas.',
        ],
      },
      {
        titulo: 'Para qué los usamos',
        parrafos: [],
        lista: [
          'Identificar a cada persona y darle acceso según su rol.',
          'Registrar predios, realizar evaluaciones de bienestar animal y generar sus informes.',
          'Enviar el código de verificación en dos pasos y los enlaces para crear o restablecer la contraseña.',
          'Permitir que cada propietario consulte los resultados de sus propios predios.',
        ],
      },
      {
        titulo: 'Inteligencia artificial',
        parrafos: [
          'Las recomendaciones y las respuestas del asistente Clara se generan con Firebase AI Logic (Gemini, de Google). Al modelo se envían los hallazgos de la evaluación y el municipio, sin nombres, documentos, teléfonos ni correos. Si el servicio no está disponible, se usan recomendaciones establecidas por reglas.',
        ],
      },
      {
        titulo: 'Dónde se guardan y cómo se protegen',
        parrafos: [
          'Los datos se guardan en Google Firebase (Authentication y Cloud Firestore), con servidores que pueden estar fuera de Colombia y que cumplen estándares internacionales de seguridad.',
          'Toda la comunicación viaja cifrada por HTTPS. Cada lectura y escritura pasa por reglas de seguridad que revisan el rol, los permisos y la verificación en dos pasos de quien consulta. Las contraseñas las administra Firebase y nunca las conocemos.',
        ],
      },
      {
        titulo: 'Con quién los compartimos',
        parrafos: [
          'No vendemos ni cedemos datos personales. Solo intervienen los proveedores tecnológicos necesarios para operar el servicio (Google Firebase) y, cuando la ley lo exija, las autoridades competentes.',
        ],
      },
      {
        titulo: 'Sus derechos',
        parrafos: [`Como titular puede, ${contacto}:`],
        lista: [
          'Conocer, actualizar y rectificar sus datos.',
          'Pedir prueba de la autorización que otorgó.',
          'Saber qué uso se ha dado a sus datos.',
          'Revocar la autorización o pedir que se eliminen, cuando no exista un deber legal de conservarlos.',
          'Presentar quejas ante la Superintendencia de Industria y Comercio.',
        ],
      },
      {
        titulo: 'Plazos de respuesta',
        parrafos: [
          'Las consultas se responden en un máximo de diez días hábiles y los reclamos en un máximo de quince días hábiles, como establece la Ley 1581 de 2012.',
        ],
      },
      {
        titulo: 'Vigencia',
        parrafos: [
          'Los datos se conservan mientras la cuenta esté activa o mientras sean necesarios para las finalidades descritas. Si esta política cambia, lo informaremos en esta página.',
        ],
      },
    ],
  },
  terminos: {
    titulo: 'Términos y condiciones de uso',
    resumen: 'Las reglas para usar ICA Bienestar Animal: quién puede usarlo, qué se espera de cada persona y los límites de la información que entrega.',
    secciones: [
      {
        titulo: 'Sobre el servicio',
        parrafos: [
          'ICA Bienestar Animal es una herramienta académica para registrar predios y evaluar el bienestar animal de bovinos y búfalos con la metodología del ICA (versión 2.0, 2023). No es un servicio oficial del Instituto Colombiano Agropecuario y sus resultados no reemplazan una certificación, una visita oficial ni el concepto de un médico veterinario.',
        ],
      },
      {
        titulo: 'Cuentas y acceso',
        parrafos: [
          'Cada cuenta es personal. Usted debe mantener en reserva su contraseña y los códigos de verificación que reciba, y avisar al administrador si sospecha que alguien más los conoce.',
          'El administrador asigna los roles y puede inactivar cuentas que se usen de forma indebida.',
        ],
      },
      {
        titulo: 'Uso adecuado',
        parrafos: ['Al usar la plataforma usted se compromete a:'],
        lista: [
          'Registrar información veraz sobre los predios y las evaluaciones.',
          'No intentar acceder a datos de otros usuarios ni evadir las medidas de seguridad.',
          'Tratar los datos personales de propietarios y usuarios solo para los fines de la evaluación.',
        ],
      },
      {
        titulo: 'Resultados y recomendaciones',
        parrafos: [
          'El puntaje, el nivel y las recomendaciones se calculan con la información registrada. Las recomendaciones generadas con inteligencia artificial y las respuestas del asistente son orientativas y pueden contener errores; revíselas antes de aplicarlas.',
        ],
      },
      {
        titulo: 'Disponibilidad',
        parrafos: [
          'Procuramos que el servicio esté disponible y que la información se conserve, pero al ser un proyecto académico no garantizamos su funcionamiento continuo.',
        ],
      },
      {
        titulo: 'Ley aplicable',
        parrafos: ['Estos términos se rigen por las leyes de la República de Colombia.'],
      },
    ],
  },
  cookies: {
    titulo: 'Política de cookies y almacenamiento',
    resumen: 'ICA Bienestar Animal no usa cookies de publicidad ni de analítica. Solo guarda en su navegador lo indispensable para funcionar.',
    secciones: [
      {
        titulo: 'Qué guardamos en su navegador',
        parrafos: ['Usamos almacenamiento esencial, que no se puede desactivar sin que el sitio deje de funcionar:'],
        lista: [
          'Sesión de Firebase Authentication (almacenamiento de sesión): mantiene su ingreso abierto mientras la pestaña esté abierta y se borra al cerrarla.',
          'Preferencia de modo claro u oscuro (ica-tema), si la elige.',
          'Constancia de que leyó este aviso (ica-cookies), para no mostrarlo de nuevo.',
          'Cookies técnicas de Google cuando ingresa con Google, Facebook o Microsoft, necesarias para completar ese ingreso.',
        ],
      },
      {
        titulo: 'Lo que no hacemos',
        parrafos: ['No usamos cookies de terceros con fines publicitarios, no rastreamos su navegación en otros sitios y no medimos audiencias.'],
      },
      {
        titulo: 'Cómo borrarlas',
        parrafos: [
          'Puede borrar este almacenamiento desde la configuración de su navegador. Al hacerlo se cerrará su sesión y volverá a ver el aviso de cookies.',
        ],
      },
    ],
  },
};
