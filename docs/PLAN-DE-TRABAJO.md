# Plan de trabajo por requerimiento

Estado de cada requerimiento del documento *Requerimientos funcionales Aplicación ICA – Bienestar Animal* y qué falta implementar.

Estados: **Hecho** (implementado y probado) · **Base lista** (la infraestructura existe, falta el módulo) · **Pendiente**.

## Sprint 1: seguridad e infraestructura

| RF | Requerimiento | Estado | Dónde |
|---|---|---|---|
| RF01 | Gestión de autenticación | Hecho | `backend/src/auth`, `frontend/src/app/features/auth/login.ts` |
| RF02 | Gestión de roles | Hecho | `backend/src/roles`, `frontend/src/app/features/roles` |
| RF03 | Registro de usuarios (crear, editar, activar, inactivar) | Hecho | `backend/src/users`, `frontend/src/app/features/users` |
| RF04 | Recuperación de acceso por correo | Hecho | `auth/password-reset.service.ts`, `features/auth/forgot-password.ts`, `reset-password.ts` |
| RF34 | Trazabilidad de acciones | Base lista | `audit_logs` registra el ingreso, la seguridad, los usuarios y los roles. Falta auditar las evaluaciones y crear la pantalla de consulta (`auditoria.ver`) |

| RNF | Requerimiento | Cómo se cumple |
|---|---|---|
| RNF01 | Frontend en Angular | Angular 20 |
| RNF05 | Autenticación segura | bcrypt (12 rondas), JWT de 8 h, bloqueo tras 5 intentos y límite de peticiones |
| RNF07 | Control de acceso por rol | `PermissionsGuard` en la API y guards en el frontend |
| RNF08 | Bitácora | `AuditService` |
| RNF12–14 | Usabilidad, diseño responsivo y accesibilidad | Pruebas Playwright a 390 y 1440 px con axe-core (0 violaciones) |
| RNF15–16 | Código modular y reutilizable | Un módulo por dominio, componentes compartidos |
| RNF21 | Calidad de datos | `class-validator` en la API y validadores en los formularios |
| RNF23 | Integración continua | `.github/workflows/ci.yml` |
| RNF24 / RNFG07 | Ambientes separados | Variables de entorno; dev, qa y prod en [ARQUITECTURA.md](ARQUITECTURA.md#8-despliegue-en-google-cloud) |
| RNFG03 | Base de datos administrada | PostgreSQL compatible con Cloud SQL |
| RNFG06 | Credenciales fuera del código | `.env` ignorado por git; Secret Manager en la nube |

## Lo que sigue (próximos sprints)

Orden sugerido según las dependencias entre módulos.

### Sprint 2: Fincas y catálogos

- **RF35** Catálogos: especies, departamentos y municipios (DIVIPOLA), tipos de productor, sistemas productivos y estados de evaluación.
- **RF05–RF08** Fincas: datos básicos, ubicación (departamento, municipio, vereda, dirección y coordenadas opcionales), especies asociadas e inventario por grupo etario.
- **RF33** Búsqueda y filtros de fincas. Se puede reutilizar el patrón de la lista de usuarios.
- Permisos que ya existen: `fincas.ver` y `fincas.gestionar`.

### Sprint 3: Parametrización por especie

- **RF09–RF12** Listas de chequeo por especie: criterios, subcriterios, indicadores, preguntas, ponderaciones y tipos de respuesta. Cada grupo de estudiantes parametriza su especie según su manual del ICA.
- **RNF17 / RNF28** Las listas no se escriben en el código y se versionan: una evaluación queda ligada a la versión del formulario con la que se diligenció.
- **RF38** (multiespecie) Activar o desactivar especies.
- Permiso: `parametrizacion.gestionar`.

### Sprint 4: Evaluación

- **RF13–RF19** Crear una evaluación (finca + especie), cargar su lista de chequeo, diligenciarla por secciones, guardar avances parciales con fecha y hora, validar los campos obligatorios, registrar observaciones y adjuntar evidencias en Cloud Storage (RNF11, RNFG02).
- **RF36** Estados: borrador → en proceso → finalizada → validada → cerrada.
- **RF34** Auditoría de creación, modificación y cierre.
- Permisos: `evaluaciones.diligenciar` y `evaluaciones.validar`.

### Sprint 5: Diagnóstico y recomendaciones con IA

- **RF20–RF23** Puntajes, clasificación del nivel de bienestar, diagnóstico y hallazgos críticos. Debe calcularse en menos de 5 s (RNF10).
- **RF24–RF27** Recomendaciones con IA según la especie y el sistema productivo; el evaluador las edita y las convierte en un plan de mejora.
- **RNF25 / RNF26** La IA es solo un apoyo: si el servicio falla, la evaluación sigue con el diagnóstico estructurado.

### Sprint 6: Reportes y notificaciones

- **RF28–RF32** Historial, comparación entre evaluaciones, tableros, reporte en PDF y exportación a Excel o CSV.
- **RF38** (certificación) Certificado por correo cuando la finca cumple.
- **RF40** Notificaciones por correo y dentro de la plataforma (se puede reutilizar `MailService`).

## Pendientes técnicos conocidos

- Respaldo automático de Cloud SQL y prueba de restauración (RNF20).
- Pantalla de consulta de la bitácora de auditoría.
- Rotación de `JWT_SECRET` sin cerrar todas las sesiones (hoy, al cambiarlo, todos deben ingresar de nuevo).
- Ejecutar las pruebas Playwright en CI (necesitan la API y la base corriendo; hoy se ejecutan en local).
