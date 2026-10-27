Interfaz web
============

Aplicación Angular 20 de ICA Bienestar Animal. Usa componentes independientes (standalone), señales y detección de cambios sin zone.js. Funciona en computadores, tabletas y teléfonos móviles, en modo claro y oscuro.


Requisitos
----------

Node.js 22. La aplicación se conecta directamente al proyecto de Firebase `bienestar-animal-ica`: no hay un servicio de aplicación propio. Para probar sin tocar los datos reales se usan los emuladores de Firebase (ver [firebase/README.md](../firebase/README.md)).


Comandos
--------

| Comando | Función |
|---|---|
| `npm install` | Instala las dependencias |
| `npm start` | Inicia el servidor de desarrollo en `http://localhost:4200`, conectado al proyecto real de Firebase |
| `npm run start:emuladores` | Igual, pero conectado a los emuladores locales de Auth y Firestore |
| `npm run demo` | Inicia la interfaz en modo demostración, sin conexión a Firebase: los datos se simulan en el navegador |
| `npm start -- --host 0.0.0.0` | Igual que `npm start`, pero permite abrir la aplicación desde otro dispositivo de la misma red, como un teléfono móvil |
| `npm run build` | Compila la versión de producción en `dist/frontend/browser` |
| `npm run test:ci` | Ejecuta las pruebas unitarias en Chrome sin ventana |
| `npm run e2e` | Ejecuta las pruebas de extremo a extremo con Playwright contra los emuladores |

En un entorno sin Chrome instalado, las pruebas pueden usar otro ejecutable de Chromium indicado en la variable `CHROME_BIN`.


Conexión con Firebase
---------------------

La configuración del proyecto está en `src/environments/firebase.config.ts`. El SDK de Firebase se descarga solo cuando se usa (`core/firebase/conexion.ts`), por lo que el modo demostración no lo carga.

| Ambiente | Archivo | Conexión |
|---|---|---|
| Producción (`npm run build`) | `environment.ts` | Proyecto `bienestar-animal-ica` |
| Desarrollo (`npm start`) | `environment.development.ts` | Proyecto `bienestar-animal-ica` |
| Emuladores (`npm run start:emuladores`) | `environment.emuladores.ts` | Auth en el puerto 9099 y Firestore en el 8080 de este equipo |
| Demostración (`npm run demo`) | `environment.demo.ts` | Ninguna: el interceptor `core/demo/demo-api.interceptor.ts` simula los datos en el navegador |

Los servicios que usan las pantallas (`AuthService`, `ApiService` y `FarmsApiService`) tienen la misma interfaz en todos los ambientes: con Firebase llaman a `core/firebase/`, y en la demostración a la API simulada. Los informes PDF se generan en el navegador con pdfmake (`core/informes/`).


Organización del código
-----------------------

| Ruta | Responsabilidad |
|---|---|
| `src/app/core/services/` | Sesión (`auth.service.ts` y `sesion/`), usuarios y roles (`api.service.ts`), predios y evaluaciones (`farms-api.service.ts`) |
| `src/app/core/firebase/` | Conexión con Firebase, usuarios y roles, predios y evaluaciones, recomendaciones con IA y bitácora sobre Firestore |
| `src/app/core/informes/` | Generación y descarga de los informes PDF |
| `src/app/core/interceptors/` | Interceptor del modo demostración que agrega el token y cierra la sesión vencida |
| `src/app/core/guards/` | Guardas de rutas: sesión, permisos y cambios sin guardar |
| `src/app/core/models/` | Tipos de datos que usan las pantallas |
| `src/app/core/utils/` | Mensajes de error de Firebase y de la demostración, y ruta de regreso después de ingresar |
| `src/app/core/demo/` | Modo demostración: datos de prueba, almacenamiento en el navegador y rutas simuladas |
| `src/app/shared/components/` | Componentes reutilizables: logotipo, diálogo, campo de contraseña, mensajes emergentes y encabezado de página |
| `src/app/shared/services/` | Servicio de mensajes emergentes |
| `src/app/shared/utils/` | Política de contraseñas y utilidades de formularios |
| `src/app/layout/shell/` | Estructura con barra superior translúcida, que en pantallas pequeñas se convierte en un menú desplegable |
| `src/app/features/auth/` | Ingreso, ingreso con Google, Facebook o Microsoft, registro de propietarios, recuperación y creación de contraseña |
| `src/app/features/farms/` | Lista de predios, registro y ficha del predio con su historial |
| `src/app/features/evaluations/` | Formulario de evaluación con guardado automático y pantalla de resultado |
| `src/app/compartido/` | Copia generada de `compartido/`: norma, lista de chequeo, cálculo, recomendaciones e informes. No se edita aquí |
| `src/app/features/home/` | Pantalla de inicio y guía de bienestar animal; los datos de la norma están en `data/` |
| `src/app/features/users/` | Lista de usuarios y formulario de usuario |
| `src/app/features/roles/` | Lista de roles y editor de permisos |
| `src/app/features/account/` | Datos de la cuenta y cambio de contraseña |

Cada componente tiene su propia carpeta con tres archivos: la lógica en `.ts`, la plantilla en `.html` y los estilos en `.scss`. Por ejemplo, la pantalla de ingreso está en `features/auth/login/` con `login.ts`, `login.html` y `avisos.ts`; sus estilos son los comunes de `features/auth/auth.scss`.
| `src/styles.scss` | Punto de entrada de los estilos globales: carga las fuentes y los archivos de `src/styles/` |
| `src/styles/` | Sistema de diseño dividido por tema: `_tokens` (variables y modo oscuro), `_base`, `_botones`, `_formularios`, `_interruptor`, `_segmentado`, `_avisos`, `_superficies` y `_movimiento` |
| `e2e/` | Pruebas de extremo a extremo |


Diseño y accesibilidad
----------------------

Todos los valores visuales se definen como variables CSS en `src/styles/_tokens.scss`, con variantes para el modo oscuro y para contraste aumentado. Los puntos de quiebre se expresan en unidades `em`, de manera que la interfaz se adapta tanto al ancho de la pantalla como al tamaño de letra configurado en el navegador. Las decisiones de diseño se documentan en [docs/SISTEMA-DE-DISENO.md](../docs/SISTEMA-DE-DISENO.md) y la auditoría con las guías de Apple en [docs/REVISION-APPLE-HIG.md](../docs/REVISION-APPLE-HIG.md).
