Plan de trabajo por requerimiento
=================================

Este documento registra el estado de cada requerimiento del documento *Requerimientos funcionales Aplicación ICA – Bienestar Animal* y establece la planeación de los sprints siguientes.

Los estados empleados son los siguientes:

| Estado | Significado |
|---|---|
| Implementado | La funcionalidad está desarrollada y cubierta por pruebas automatizadas |
| Base disponible | La infraestructura necesaria existe y falta el módulo funcional |
| Pendiente | La funcionalidad está planeada para un sprint posterior |


Primer sprint: seguridad e infraestructura
------------------------------------------

**Requerimientos funcionales**

| Código | Requerimiento | Estado | Ubicación |
|---|---|---|---|
| RF01 | Gestión de autenticación | Implementado | `backend/src/auth`, `frontend/src/app/features/auth/login/` |
| RF02 | Gestión de roles | Implementado | `backend/src/roles`, `frontend/src/app/features/roles` |
| RF03 | Registro de usuarios: creación, edición, activación e inactivación | Implementado | `backend/src/users`, `frontend/src/app/features/users` |
| RF04 | Recuperación de acceso por correo electrónico | Implementado | `auth/password-reset.service.ts`, `features/auth/forgot-password/`, `features/auth/reset-password/` |
| RF34 | Trazabilidad de acciones | Base disponible | La tabla `audit_logs` registra los eventos de ingreso, seguridad, usuarios y roles. Falta auditar las evaluaciones y construir la pantalla de consulta asociada al permiso `auditoria.ver` |

**Requerimientos no funcionales**

| Código | Requerimiento | Forma de cumplimiento |
|---|---|---|
| RNF01 | Interfaz web en Angular | Angular 20 |
| RNF05 | Autenticación segura | Contraseñas cifradas con bcrypt de 12 rondas, tokens JWT con vigencia de ocho horas, bloqueo tras cinco intentos fallidos y límite de peticiones |
| RNF07 | Control de acceso por rol | Guarda `PermissionsGuard` en la API y guardas de rutas en la interfaz |
| RNF08 | Bitácora de auditoría | Servicio `AuditService` |
| RNF12, RNF13 y RNF14 | Usabilidad, diseño adaptable y accesibilidad | Pruebas con Playwright en escritorio y teléfono móvil, con axe-core en modo claro y oscuro y sin violaciones |
| RNF15 y RNF16 | Código modular y reutilizable | Un módulo por dominio y componentes compartidos |
| RNF21 | Calidad de los datos | Validación con `class-validator` en la API y validadores en los formularios |
| RNF23 | Integración continua | `.github/workflows/ci.yml` |
| RNF24 y RNFG07 | Separación de ambientes | Configuración por variables de entorno y ambientes de desarrollo, pruebas y producción, descritos en la sección de [despliegue de la arquitectura](ARQUITECTURA.md#despliegue-en-google-cloud) |
| RNFG03 | Base de datos administrada | PostgreSQL compatible con Cloud SQL |
| RNFG06 | Credenciales fuera del código | Archivo `.env` excluido del repositorio y Secret Manager en la nube |


Planeación de los sprints siguientes
------------------------------------

El orden propuesto responde a las dependencias entre módulos: las evaluaciones requieren fincas y listas de chequeo, y el diagnóstico requiere evaluaciones diligenciadas.

**Segundo sprint: fincas y catálogos**

- **RF35:** catálogos de especies, departamentos y municipios según la codificación DIVIPOLA, tipos de productor, sistemas productivos y estados de evaluación.
- **RF05 a RF08:** registro de fincas con sus datos básicos, ubicación (departamento, municipio, vereda, dirección y coordenadas opcionales), especies asociadas e inventario por grupo etario.
- **RF33:** búsqueda y filtrado de fincas, con el mismo patrón empleado en la lista de usuarios.
- Los permisos `fincas.ver` y `fincas.gestionar` ya existen en el catálogo.

**Tercer sprint: parametrización por especie**

- **RF09 a RF12:** listas de chequeo por especie, con criterios, subcriterios, indicadores, preguntas, ponderaciones y tipos de respuesta. Cada grupo de estudiantes parametriza su especie con base en el manual del ICA correspondiente.
- **RNF17 y RNF28:** las listas se configuran como datos y no en el código, y se versionan, de modo que cada evaluación queda asociada a la versión del formulario con la que fue diligenciada.
- **Módulo administrativo multiespecie:** activación y desactivación de especies.
- Permiso asociado: `parametrizacion.gestionar`.

**Cuarto sprint: evaluación**

- **RF13 a RF19:** creación de evaluaciones por finca y especie, carga automática de la lista de chequeo, diligenciamiento por secciones, guardado parcial con fecha y hora, validación de campos obligatorios, registro de observaciones y carga de evidencias en Cloud Storage (RNF11 y RNFG02).
- **RF36:** estados de la evaluación: borrador, en proceso, finalizada, validada y cerrada.
- **RF34:** auditoría de la creación, modificación y cierre de evaluaciones.
- Permisos asociados: `evaluaciones.diligenciar` y `evaluaciones.validar`.

**Quinto sprint: diagnóstico y recomendaciones con inteligencia artificial**

- **RF20 a RF23:** cálculo de puntajes, clasificación del nivel de bienestar, diagnóstico y hallazgos críticos, con un tiempo de cálculo inferior a cinco segundos (RNF10).
- **RF24 a RF27:** recomendaciones generadas con inteligencia artificial según la especie y el sistema productivo, que el evaluador revisa, ajusta y convierte en un plan de mejora.
- **RNF25 y RNF26:** la inteligencia artificial actúa como apoyo a la decisión; si el servicio no está disponible, la evaluación continúa con el diagnóstico estructurado.

**Sexto sprint: reportes y notificaciones**

- **RF28 a RF32:** historial, comparación entre evaluaciones, tableros de indicadores, reporte en PDF y exportación a Excel o CSV.
- **Certificación:** generación del certificado y envío por correo cuando la finca cumple los criterios evaluados.
- **RF40:** notificaciones por correo y dentro de la plataforma, con reutilización del servicio `MailService`.


Pendientes técnicos
-------------------

- Respaldo automático de Cloud SQL y prueba periódica de restauración (RNF20).
- Pantalla de consulta de la bitácora de auditoría.
- Rotación de `JWT_SECRET` sin cerrar todas las sesiones; en la versión actual, un cambio de la clave obliga a todos los usuarios a ingresar de nuevo.
- Ejecución de las pruebas de Playwright en la integración continua; actualmente se ejecutan en el equipo local porque requieren la API y la base de datos en funcionamiento.
