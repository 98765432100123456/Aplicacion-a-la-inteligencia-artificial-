Plan de trabajo por requerimiento
=================================

Este documento registra el estado de cada requerimiento de los documentos *Requerimientos funcionales Aplicación ICA – Bienestar Animal* y *Requerimientos funcionales y técnicos del sistema*, y establece la planeación de los sprints siguientes.

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
| RF34 | Trazabilidad de acciones | Base disponible | La tabla `audit_logs` registra el ingreso, la seguridad, los usuarios, los roles, los predios y las evaluaciones. Falta la pantalla de consulta asociada al permiso `auditoria.ver` |

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
| RNF24 y RNFG07 | Separación de ambientes | Configuración por variables de entorno; cada ambiente tiene su propio archivo de credenciales, descrito en la guía de [implementación del servidor](DESPLIEGUE.md) |
| RNFG03 | Base de datos | MariaDB 11.4 |
| RNFG06 | Credenciales fuera del código | Archivos `.env` y `.env.servidor` excluidos del repositorio y con permisos restringidos |


Segundo sprint: predios, evaluación, inteligencia artificial e informes
-----------------------------------------------------------------------

Este sprint atiende el documento *Requerimientos funcionales y técnicos del sistema*.

| Sección | Requerimiento | Estado | Ubicación |
|---|---|---|---|
| Gestión de usuarios | Rol Propietario, que consulta sus predios, los resultados, las observaciones y las recomendaciones | Implementado | `backend/src/farms/farm-access.ts`, rol sembrado en `backend/src/database/seed.ts` |
| Registro y gestión de predios | Nombre, propietario, teléfono, dirección y ubicación, especies, cantidad de animales e información adicional, con consulta, edición y actualización | Implementado | `backend/src/farms`, `frontend/src/app/features/farms` |
| Registro y gestión de predios | Relación entre especie, cantidad y tamaño del productor según la norma del ICA, con la muestra mínima | Implementado | `compartido/norma.ts` |
| Administración y evaluación de predios | Ficha del predio con *Editar finca*, *Realizar evaluación* y *Guardar cambios* | Implementado | `features/farms/farm-detail/` |
| Administración y evaluación de predios | Evaluación por especie con guardado automático, puntaje por libertad, puntaje total y nivel | Implementado | `backend/src/evaluations`, `features/evaluations/`, `compartido/calificacion.ts` |
| Informes | Informe técnico en PDF con la terminología de la norma | Implementado | `compartido/informes.ts` |
| Informes | Informe de recomendaciones para el propietario en lenguaje sencillo: problemas, causas, acciones, prioridades y aviso de que no reemplaza el concepto oficial | Implementado | `backend/src/ai`, `compartido/recomendaciones.ts`, `compartido/informes.ts` |
| Historial | Historial por predio separado en evaluaciones técnicas y recomendaciones de IA, en orden cronológico | Implementado | `features/farms/farm-detail/` |
| Base de datos | MariaDB con integridad referencial y control de acceso | Implementado | `backend/src/database/migrations`, [diseño de la base de datos](base-de-datos/DISENO-BASE-DE-DATOS.md) |
| Autenticación | Registro de propietarios e ingreso con Google, Facebook y Microsoft mediante Firebase, separado de la autorización | Implementado | `backend/src/auth/external-auth.service.ts`, `features/auth/external-login/`, `features/auth/register/` |
| Servidores | Servidor, base de datos, comunicación entre componentes, servicios externos, credenciales, seguridad y pruebas de despliegue | Implementado | `despliegue/`, [DESPLIEGUE.md](DESPLIEGUE.md) |

Los requerimientos del documento original que este sprint cubre son RF05 a RF08 (predios e inventario), RF13 a RF18 (evaluación con guardado parcial), RF20 a RF24 (puntaje, nivel, hallazgos y recomendaciones), RF28 (historial), RF31 (reporte en PDF) y RNF25 y RNF26 (la IA como apoyo, con respaldo cuando no está disponible).

**Pruebas que respaldan el sprint**

| Prueba | Alcance |
|---|---|
| `backend/test/predios-evaluaciones.e2e-spec.ts` | Registro de predios y cálculo de la norma, acceso del propietario solo a sus predios, borradores, validación, puntaje ponderado, recomendaciones, informes PDF, registro e ingreso externo deshabilitado |
| `backend/src/ai/ai.service.spec.ts` | Salida estructurada de la IA, ausencia de datos personales y respaldo por reglas |
| `frontend/e2e/predios.spec.ts` | Registro de un predio, evaluación completa, resultado, descarga del informe e historial, en escritorio y teléfono, con accesibilidad |


Planeación de los sprints siguientes
------------------------------------

**Tercer sprint: catálogos y parametrización por especie**

- **RF35:** departamentos y municipios con la codificación DIVIPOLA y sistemas productivos como catálogos administrables.
- **RF09 a RF12 y RNF17:** listas de chequeo configurables como datos para porcinos, aves y otras especies, con su versión (RNF28). Hoy la lista de bovinos y búfalos está en `compartido/lista-chequeo.ts`, versión `REF-2026.1`.
- Permiso asociado: `parametrizacion.gestionar`.

**Cuarto sprint: validación y evidencias**

- **RF19:** fotografías y documentos como evidencia de cada indicador.
- **RF36:** estados validada y cerrada, con revisión de un segundo evaluador (`evaluaciones.validar`).
- **RF25 a RF27:** ajuste de las recomendaciones por el evaluador y plan de mejora con responsables y plazos.

**Quinto sprint: análisis, certificación y notificaciones**

- **RF29, RF30 y RF32:** comparación entre evaluaciones, tableros de indicadores y exportación a Excel o CSV.
- **Certificación:** certificado y envío por correo cuando el predio cumple los criterios.
- **RF40:** notificaciones por correo y dentro de la plataforma.


Pendientes técnicos
-------------------

- Pantalla de consulta de la bitácora de auditoría (`auditoria.ver`).
- Copia automática de los respaldos fuera del servidor y prueba trimestral de restauración (RNF20).
- Rotación de `JWT_SECRET` sin cerrar todas las sesiones; en la versión actual, un cambio de la clave obliga a todos los usuarios a ingresar de nuevo.
- Ejecución de las pruebas de Playwright en la integración continua; actualmente se ejecutan en el equipo local porque requieren la API y la base de datos en funcionamiento.
