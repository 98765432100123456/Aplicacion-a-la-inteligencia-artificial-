ICA Bienestar Animal
====================

Aplicación web para la evaluación del bienestar animal en predios, según la norma del ICA. El sistema registra los predios y su inventario, aplica listas de chequeo diferenciadas por especie, calcula el puntaje y el nivel de bienestar, y entrega al propietario recomendaciones en lenguaje sencillo apoyadas en inteligencia artificial, junto con un informe técnico en PDF.

El proyecto se desarrolla con base en el documento *Requerimientos funcionales Aplicación ICA – Bienestar Animal*, elaborado por la PhD. Paola Andrea Valencia A., en el marco de la asignatura Aplicación a la Inteligencia Artificial.


Estado del proyecto
-------------------

Están disponibles:

- inicio de sesión con Firebase Authentication: correo y contraseña, Google, Facebook o Microsoft;
- registro de propietarios y recuperación de contraseña por correo electrónico;
- gestión de usuarios y de roles con permisos, incluido el rol Propietario, que solo consulta sus propios predios;
- registro y edición de predios, con propietario, ubicación, especies e inventario por grupo de edad, y cálculo del tipo de productor y de la muestra mínima según la norma del ICA;
- evaluación por especie con los 23 criterios de la norma, filtrados por sistema productivo y tamaño del predio, con guardado automático, puntaje ponderado según las cinco libertades del bienestar animal y nivel de bienestar;
- recomendaciones en lenguaje sencillo generadas con inteligencia artificial, con respaldo por reglas cuando la IA no está disponible;
- informe técnico y informe de recomendaciones para el propietario, ambos en PDF;
- historial por predio separado en evaluaciones técnicas y recomendaciones de IA;
- datos en Cloud Firestore, protegidos por reglas de seguridad según el rol de cada usuario.

El avance detallado por requerimiento se encuentra en el [plan de trabajo](docs/PLAN-DE-TRABAJO.md).


Tecnologías
-----------

| Componente | Tecnología | Ubicación |
|---|---|---|
| Interfaz web | Angular 20 | `frontend/` |
| Base de datos | Cloud Firestore, proyecto de Firebase `bienestar-animal-ica` | Reglas en `firebase/firestore.rules` |
| Autenticación | Firebase Authentication: correo y contraseña, Google, Facebook y Microsoft | `frontend/src/app/core/services/sesion/` |
| Inteligencia artificial | Firebase AI Logic con un modelo Gemini, con respaldo por reglas | `frontend/src/app/core/firebase/ia.ts` |
| Informes | pdfmake, en el navegador | `compartido/informes.ts` |
| Publicación | Firebase Hosting | `firebase.json`, `docs/DESPLIEGUE.md` |


Documentación del proyecto
--------------------------

| Documento | Contenido |
|---|---|
| [Entrega de la semana 12](docs/entrega/Entrega-Semana-12-ICA-Bienestar-Animal.pdf) | Documento PDF con el código, el uso de Git, los diseños de interfaz, los diagramas UML y el diseño de la base de datos |
| [Arquitectura del sistema](docs/ARQUITECTURA.md) | Componentes, comunicación con Firebase, autenticación y autorización, flujos principales y operaciones sobre los datos |
| [Manual de instalación](docs/MANUAL-DE-INSTALACION.md) | Requisitos, puesta en marcha en un equipo local y consulta desde un teléfono móvil |
| [Implementación en Firebase](docs/DESPLIEGUE.md) | Configuración del proyecto, credenciales, publicación, servicios de IA y autenticación, seguridad, respaldos y pruebas de despliegue |
| [Manual de usuario](docs/MANUAL-DE-USUARIO.md) | Uso de cada pantalla según el rol del usuario |
| [Sistema de diseño](docs/SISTEMA-DE-DISENO.md) | Paleta en modo claro y oscuro, tipografía, componentes y decisiones de diseño |
| [Diagramas UML](docs/uml/DIAGRAMAS-UML.md) | Casos de uso, clases, secuencia, actividad, estados, componentes y despliegue |
| [Diseño de la base de datos](docs/base-de-datos/DISENO-BASE-DE-DATOS.md) | Colecciones de Firestore, decisiones de diseño, reglas de integridad y acceso, y diccionario de datos |
| [Diseños de interfaz](docs/disenos/) | Capturas de cada pantalla en escritorio y teléfono, en modo claro y oscuro; en `predios-y-evaluaciones/`, los predios, la evaluación, el resultado, la vista del propietario y ejemplos de los dos informes PDF |
| [Revisión con las guías de Apple](docs/REVISION-APPLE-HIG.md) | Auditoría de diseño con las guías de Apple y de Vercel, y correcciones aplicadas |
| [Plan de trabajo](docs/PLAN-DE-TRABAJO.md) | Estado de cada requerimiento y planeación de los sprints siguientes |
| [Estrategia de ramas](docs/RAMAS.md) | Flujo de trabajo con Git y reglas de contribución |
| [Herramientas de Firebase](firebase/README.md) | Reglas de seguridad, carga inicial, emuladores y pruebas de las reglas |
| [Interfaz web](frontend/README.md) | Configuración, comandos y pruebas de la aplicación Angular |


Vista rápida en modo demostración
---------------------------------

Para conocer las pantallas sin conectarse a Firebase, la interfaz ofrece un modo demostración. En este modo los datos se simulan dentro del navegador con datos de prueba, que se conservan únicamente en ese navegador; no se envían correos. Solo se requiere Node.js 22:

```bash
cd frontend
npm install
npm run demo
```

La aplicación queda disponible en `http://localhost:4200`, con el correo `admin@ica-bienestar.local` y la contraseña `CambiarEsta.2026`. Las cuentas `evaluador@ica-bienestar.local`, `consultor@ica-bienestar.local` y `propietario@ica-bienestar.local`, con la misma contraseña, permiten observar la aplicación con otros roles; el propietario solo ve su predio La Esperanza. La demostración incluye tres predios y dos evaluaciones finalizadas, y genera los informes PDF en el propio navegador. Las recomendaciones de la demostración se generan con reglas, sin IA. Estos datos de prueba se definen en `frontend/src/app/core/demo/`; los datos reales se guardan en Firestore. El enlace **Restablecer datos** del aviso superior devuelve los datos a su estado inicial.


Puesta en marcha
----------------

La aplicación se conecta directamente al proyecto de Firebase `bienestar-animal-ica`; no hay un servidor propio que iniciar. Se requiere Node.js 22:

```bash
cd frontend
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200` y trabaja con los datos reales del proyecto. El primer administrador se crea con la carga inicial (`firebase/semilla.ts`); las demás cuentas, desde la pantalla **Usuarios** o con el registro de propietarios.

Para probar sin tocar los datos reales se usan los emuladores de Firebase, que requieren además Java 21. El procedimiento está en el [manual de instalación](docs/MANUAL-DE-INSTALACION.md), y la configuración de la consola de Firebase y la publicación, en la guía de [implementación en Firebase](docs/DESPLIEGUE.md).


Pruebas
-------

| Comando | Alcance |
|---|---|
| `npm run test:reglas`, en `firebase/` | Reglas de seguridad de Firestore en el emulador: acceso por rol, propietario, registro, roles protegidos, validación, evaluación finalizada, historial y bitácora |
| `npm run test:ci`, en `frontend/` | Pruebas unitarias de la interfaz en Chrome sin ventana: sesión, mensajes de error, los 23 criterios, ponderación y recomendaciones |
| `npm run e2e`, en `frontend/` | Pruebas de extremo a extremo con Playwright contra los emuladores, en escritorio y en teléfono móvil: flujos, accesibilidad con axe-core en modo claro y oscuro, texto ampliado al doble, navegación con teclado, desbordamiento y tamaño de los controles táctiles |

Las pruebas de extremo a extremo requieren los emuladores en ejecución con la carga inicial (en `firebase/`: `npm run emuladores` y `npm run semilla:emulador`). La integración continua, definida en `.github/workflows/ci.yml`, ejecuta las tres en cada envío al repositorio y en cada solicitud de integración.


Estructura del repositorio
--------------------------

| Ruta | Contenido |
|---|---|
| `firebase/` | Reglas de seguridad, índices, carga inicial y pruebas de las reglas |
| `firebase.json`, `.firebaserc` | Configuración del proyecto de Firebase: Firestore, Hosting y emuladores |
| `frontend/src/app/core/` | Conexión con Firebase, sesión, servicios de datos, informes, guardas, modelos, utilidades y modo demostración, cada uno en su carpeta |
| `frontend/src/app/shared/` | Componentes, servicios y utilidades reutilizables |
| `frontend/src/app/features/` | Pantallas organizadas por módulo; cada componente en su carpeta con `.ts`, `.html` y `.scss` |
| `compartido/` | Norma del ICA, los 23 criterios, cálculo del puntaje, recomendaciones, instrucciones de la IA, permisos e informes PDF; `node scripts/compartido.mjs` los copia a la interfaz y a `firebase/` |
| `frontend/e2e/` | Pruebas con Playwright |
| `docs/` | Documentación del proyecto |
| `.claude/agents/` | Agentes especializados de agency-agents para el desarrollo con Claude Code |
| `.claude/skills/` | Habilidades de diseño y pruebas para Claude Code |


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
