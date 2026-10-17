ICA Bienestar Animal
====================

Aplicación web para la evaluación del bienestar animal en fincas. El sistema gestiona listas de chequeo diferenciadas por especie, calcula puntajes de forma automática, genera un diagnóstico y recomendaciones apoyadas en inteligencia artificial y permite formular planes de mejora.

El proyecto se desarrolla con base en el documento *Requerimientos funcionales Aplicación ICA – Bienestar Animal*, elaborado por la PhD. Paola Andrea Valencia A., en el marco de la asignatura Aplicación a la Inteligencia Artificial.


Estado del proyecto
-------------------

El primer sprint está concluido. En esta entrega están disponibles el inicio de sesión, la recuperación de contraseña por correo electrónico, la gestión de usuarios y la gestión de roles con permisos. El avance detallado por requerimiento se encuentra en el [plan de trabajo](docs/PLAN-DE-TRABAJO.md).


Tecnologías
-----------

| Componente | Tecnología | Ubicación |
|---|---|---|
| Interfaz web | Angular 20 | `frontend/` |
| Servicio de aplicación (API) | NestJS 11 con TypeORM | `backend/` |
| Base de datos | PostgreSQL 16, con Cloud SQL en producción | Migraciones en `backend/src/database/` |
| Infraestructura | Google Cloud: Firebase Hosting, Cloud Run, Cloud SQL y Secret Manager | `docs/ARQUITECTURA.md` |


Documentación del proyecto
--------------------------

| Documento | Contenido |
|---|---|
| [Arquitectura del sistema](docs/ARQUITECTURA.md) | Diagramas, conexión entre la interfaz, la API y la base de datos, modelo de datos, servicios de la API y despliegue |
| [Manual de instalación](docs/MANUAL-DE-INSTALACION.md) | Requisitos, puesta en marcha en un equipo local y consulta desde un teléfono móvil |
| [Manual de usuario](docs/MANUAL-DE-USUARIO.md) | Uso de cada pantalla según el rol del usuario |
| [Sistema de diseño](docs/SISTEMA-DE-DISENO.md) | Paleta en modo claro y oscuro, tipografía, componentes y decisiones de diseño |
| [Diagramas UML](docs/uml/DIAGRAMAS-UML.md) | Casos de uso, clases, secuencia, actividad, estados, componentes y despliegue |
| [Diseño de la base de datos](docs/base-de-datos/DISENO-BASE-DE-DATOS.md) | Modelo conceptual, lógico y físico, diagramas entidad relación, script SQL y diccionario de datos |
| [Diseños de interfaz](docs/disenos/) | Capturas de cada pantalla en escritorio y teléfono, en modo claro y oscuro |
| [Revisión con las guías de Apple](docs/REVISION-APPLE-HIG.md) | Auditoría de diseño con las guías de Apple y de Vercel, y correcciones aplicadas |
| [Plan de trabajo](docs/PLAN-DE-TRABAJO.md) | Estado de cada requerimiento y planeación de los sprints siguientes |
| [Estrategia de ramas](docs/RAMAS.md) | Flujo de trabajo con Git y reglas de contribución |
| [Servicio de aplicación](backend/README.md) | Configuración, comandos y pruebas de la API |
| [Interfaz web](frontend/README.md) | Configuración, comandos y pruebas de la aplicación Angular |


Vista rápida en modo demostración
---------------------------------

Para conocer las pantallas sin instalar PostgreSQL ni ejecutar el servicio de aplicación, la interfaz ofrece un modo demostración. En este modo las respuestas de la API se simulan dentro del navegador con datos de prueba, que se conservan únicamente en ese navegador; no se envían correos. Solo se requiere Node.js 22:

```bash
cd frontend
npm install
npm run demo
```

La aplicación queda disponible en `http://localhost:4200`, con el correo `admin@ica-bienestar.local` y la contraseña `CambiarEsta.2026`. Las cuentas `evaluador@ica-bienestar.local` y `consultor@ica-bienestar.local`, con la misma contraseña, permiten observar la aplicación con otros roles. El enlace **Restablecer datos** del aviso superior devuelve los datos a su estado inicial.


Puesta en marcha
----------------

El sistema se compone de dos procesos que deben ejecutarse de forma simultánea, cada uno en su propia terminal: el servicio de aplicación, que atiende el inicio de sesión y la gestión de usuarios y roles, y la interfaz web, que presenta las pantallas en el navegador. Ambos requieren una base de datos PostgreSQL disponible.

Se requiere Node.js 22 y PostgreSQL 16. La preparación inicial, que se realiza una sola vez, se describe en el [manual de instalación](docs/MANUAL-DE-INSTALACION.md). Una vez preparado el entorno, el servicio de aplicación se inicia con:

```bash
cd backend
npm run start:dev
```

La interfaz web se inicia en otra terminal con:

```bash
cd frontend
npm start
```

La aplicación queda disponible en `http://localhost:4200`. El acceso inicial se realiza con la cuenta de administrador definida en el archivo `backend/.env`, mediante las variables `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`. Se recomienda cambiar esa contraseña desde la sección **Cuenta** en el primer ingreso.


Pruebas
-------

| Comando | Alcance |
|---|---|
| `npm test`, en `backend/` | Pruebas unitarias del servicio de aplicación |
| `npm run test:e2e`, en `backend/` | Flujos completos contra PostgreSQL, sobre la base `ica_bienestar_test`, que se reinicia en cada ejecución |
| `npm run test:ci`, en `frontend/` | Pruebas unitarias de la interfaz en Chrome sin ventana |
| `npm run e2e`, en `frontend/` | Pruebas de extremo a extremo con Playwright en escritorio y en teléfono móvil: flujos, accesibilidad con axe-core en modo claro y oscuro, texto ampliado al doble, navegación con teclado, desbordamiento y tamaño de los controles táctiles |

Las pruebas de extremo a extremo de la interfaz requieren que el servicio de aplicación y la interfaz web estén en ejecución, con la variable `THROTTLE_DISABLED=true` en el servicio. La integración continua, definida en `.github/workflows/ci.yml`, ejecuta las pruebas y la compilación en cada envío al repositorio y en cada solicitud de integración.


Estructura del repositorio
--------------------------

| Ruta | Contenido |
|---|---|
| `backend/src/auth/` | Inicio de sesión, tokens de acceso y recuperación de contraseña |
| `backend/src/users/` | Gestión de usuarios |
| `backend/src/roles/` | Roles y catálogo de permisos |
| `backend/src/audit/` | Bitácora de auditoría |
| `backend/src/mail/` | Envío de correo electrónico |
| `backend/src/database/` | Migraciones y carga de datos iniciales |
| `backend/test/` | Pruebas de extremo a extremo de la API |
| `frontend/src/app/core/` | Sesión, acceso a la API y protección de rutas |
| `frontend/src/app/shared/` | Componentes reutilizables |
| `frontend/src/app/features/` | Pantallas, organizadas por módulo |
| `frontend/e2e/` | Pruebas con Playwright |
| `docs/` | Documentación del proyecto |
| `.claude/agents/` | Agentes especializados de agency-agents para el desarrollo con Claude Code |
| `.claude/skills/` | Habilidades de diseño y pruebas para Claude Code |
| `docker-compose.yml` | Entorno local completo con contenedores |


Habilidades de Claude Code
--------------------------

El directorio `.claude/skills/` contiene habilidades que Claude Code carga de forma automática al trabajar en este repositorio.

| Habilidad | Propósito | Origen |
|---|---|---|
| `apple-design` | Revisión y mejora de la interfaz según las Human Interface Guidelines de Apple | [dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill) |
| `web-design-guidelines` | Revisión del código frente a las Web Interface Guidelines de Vercel | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| `design-taste-frontend` | Dirección de arte para páginas públicas. No aplica a las pantallas internas de la aplicación | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) |
| `image-to-code` | Generación de un diseño en imagen y su implementación en código. Requiere una herramienta de generación de imágenes | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) |
| `playwright-cli` | Automatización del navegador desde la terminal | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) |

El archivo `apple-design/references/design-md/apple-DESIGN.md` es la referencia del sistema visual de Apple, tomada de [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md).


Responsables
------------

**Esteban:** arquitectura, desarrollo completo y administración del repositorio.
