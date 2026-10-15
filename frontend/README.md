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
| `npm start -- --host 0.0.0.0` | Igual al anterior, pero permite abrir la aplicación desde otro dispositivo de la misma red, como un teléfono móvil |
| `npm run build` | Compila la versión de producción en `dist/frontend/browser` |
| `npm run test:ci` | Ejecuta las pruebas unitarias en Chrome sin ventana |
| `npm run e2e` | Ejecuta las pruebas de extremo a extremo con Playwright |

En un entorno sin Chrome instalado, las pruebas pueden usar otro ejecutable de Chromium indicado en la variable `CHROME_BIN`.


Conexión con el servicio de aplicación
--------------------------------------

La interfaz invoca siempre la ruta relativa `/api`, de modo que la interfaz y el servicio comparten dominio en todos los ambientes:

- **Desarrollo:** el archivo `proxy.conf.json` redirige `/api` hacia `http://localhost:3000`.
- **Contenedores:** el servidor nginx, configurado en `nginx.conf`, redirige `/api/` hacia el contenedor del servicio.
- **Producción:** Firebase Hosting, configurado en `firebase.json`, redirige `/api/**` hacia el servicio en Cloud Run.

El token de acceso se conserva en el almacenamiento de la sesión del navegador y se elimina al cerrarlo.


Organización del código
-----------------------

| Ruta | Responsabilidad |
|---|---|
| `src/app/core/` | Servicio de sesión, acceso a la API, interceptor de autenticación, guardas de rutas y modelos |
| `src/app/shared/` | Componentes reutilizables: diálogo, campo de contraseña, mensajes emergentes y encabezado de página |
| `src/app/layout/` | Estructura con navegación lateral, que en pantallas pequeñas se convierte en un panel desplegable |
| `src/app/features/auth/` | Ingreso, recuperación de contraseña y creación de contraseña |
| `src/app/features/home/` | Pantalla de inicio |
| `src/app/features/users/` | Gestión de usuarios |
| `src/app/features/roles/` | Gestión de roles y permisos |
| `src/app/features/account/` | Datos de la cuenta y cambio de contraseña |
| `src/styles.scss` | Sistema de diseño: colores, tipografía, espaciado y componentes base |
| `e2e/` | Pruebas de extremo a extremo |


Diseño y accesibilidad
----------------------

Todos los valores visuales se definen como variables CSS en `src/styles.scss`, con variantes para el modo oscuro y para contraste aumentado. Los puntos de quiebre se expresan en unidades `em`, de manera que la interfaz se adapta tanto al ancho de la pantalla como al tamaño de letra configurado en el navegador. Las decisiones de diseño se documentan en [docs/SISTEMA-DE-DISENO.md](../docs/SISTEMA-DE-DISENO.md) y la auditoría con las guías de Apple en [docs/REVISION-APPLE-HIG.md](../docs/REVISION-APPLE-HIG.md).
