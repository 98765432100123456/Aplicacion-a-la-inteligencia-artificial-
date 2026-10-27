Interfaz web
============

Aplicación Angular 20 de ICA Bienestar Animal. Usa componentes independientes (standalone), señales y detección de cambios sin zone.js. Funciona en computadores, tabletas y teléfonos móviles, en modo claro y oscuro.


Requisitos
----------

Node.js 22. Para iniciar sesión y consultar información se requiere además el servicio de aplicación en ejecución (ver [backend/README.md](../backend/README.md)).


Comandos
--------

| Comando | Función |
|---|---|
| `npm install` | Instala las dependencias |
| `npm start` | Inicia el servidor de desarrollo en `http://localhost:4200` y redirige las peticiones `/api` al servicio de aplicación en el puerto 3000 |
| `npm run demo` | Inicia la interfaz en modo demostración, sin servicio de aplicación ni base de datos: la API se simula en el navegador con datos de prueba |
| `npm start -- --host 0.0.0.0` | Igual que `npm start`, pero permite abrir la aplicación desde otro dispositivo de la misma red, como un teléfono móvil |
| `npm run build` | Compila la versión de producción en `dist/frontend/browser` |
| `npm run test:ci` | Ejecuta las pruebas unitarias en Chrome sin ventana |
| `npm run e2e` | Ejecuta las pruebas de extremo a extremo con Playwright |

En un entorno sin Chrome instalado, las pruebas pueden usar otro ejecutable de Chromium indicado en la variable `CHROME_BIN`.


Conexión con el servicio de aplicación
--------------------------------------

La interfaz invoca siempre la ruta relativa `/api`, de modo que la interfaz y el servicio comparten dominio en todos los ambientes:

- **Desarrollo:** el archivo `proxy.conf.json` redirige `/api` hacia `http://localhost:3000`.
- **Contenedores:** el servidor nginx, configurado en `nginx.conf`, redirige `/api/` hacia el contenedor del servicio.
- **Producción:** nginx, configurado en `nginx.conf`, sirve la interfaz y reenvía `/api` al servicio de aplicación (ver `docs/DESPLIEGUE.md`).

En el modo demostración, el interceptor `core/demo/demo-api.interceptor.ts` responde las peticiones a `/api` dentro del navegador con las mismas reglas y mensajes del servicio real, y guarda los datos en el almacenamiento local del navegador. Los usuarios y roles de prueba están en `core/demo/datos-demo.ts`; las rutas simuladas, en `core/demo/rutas/`.

El token de acceso se conserva en el almacenamiento de la sesión del navegador y se elimina al cerrarlo.


Organización del código
-----------------------

| Ruta | Responsabilidad |
|---|---|
| `src/app/core/services/` | Sesión (`auth.service.ts`) y acceso a la API (`api.service.ts`) |
| `src/app/core/interceptors/` | Interceptor que agrega el token y cierra la sesión vencida |
| `src/app/core/guards/` | Guardas de rutas: sesión, permisos y cambios sin guardar |
| `src/app/core/models/` | Tipos de datos que intercambian la interfaz y la API |
| `src/app/core/utils/` | Mensajes de error de la API y ruta de regreso después de ingresar |
| `src/app/core/demo/` | Modo demostración: datos de prueba, almacenamiento en el navegador y rutas simuladas |
| `src/app/shared/components/` | Componentes reutilizables: logotipo, diálogo, campo de contraseña, mensajes emergentes y encabezado de página |
| `src/app/shared/services/` | Servicio de mensajes emergentes |
| `src/app/shared/utils/` | Política de contraseñas y utilidades de formularios |
| `src/app/layout/shell/` | Estructura con barra superior translúcida, que en pantallas pequeñas se convierte en un menú desplegable |
| `src/app/features/auth/` | Ingreso, recuperación y creación de contraseña, con el marco común de esas pantallas |
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
