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
| RF01 | Gestión de autenticación | Implementado | Firebase Authentication, `frontend/src/app/core/services/sesion/`, `features/auth/login/` |
| RF02 | Gestión de roles | Implementado | Colección `roles`, `core/firebase/usuarios-roles.ts`, `features/roles` |
| RF03 | Registro de usuarios: creación, edición, activación e inactivación | Implementado | Colección `usuarios`, `core/firebase/usuarios-roles.ts`, `features/users` |
| RF04 | Recuperación de acceso por correo electrónico | Implementado | `auth/password-reset.service.ts`, `features/auth/forgot-password/`, `features/auth/reset-password/` |
| RF34 | Trazabilidad de acciones | Base disponible | La tabla `audit_logs` registra el ingreso, la seguridad, los usuarios, los roles, los predios y las evaluaciones. Falta la pantalla de consulta asociada al permiso `auditoria.ver` |

**Requerimientos no funcionales**

| Código | Requerimiento | Forma de cumplimiento |
|---|---|---|
| RNF01 | Interfaz web en Angular | Angular 20 |
| RNF05 | Autenticación segura | Firebase Authentication: contraseñas administradas por Google, bloqueo temporal ante intentos repetidos, verificación del correo y sesión que se cierra con el navegador |
| RNF07 | Control de acceso por rol | Reglas de seguridad de Firestore por permiso del rol y guardas de rutas en la interfaz |
| RNF08 | Bitácora de auditoría | Colección `auditoria`, que solo admite agregar entradas |
| RNF12, RNF13 y RNF14 | Usabilidad, diseño adaptable y accesibilidad | Pruebas con Playwright en escritorio y teléfono móvil, con axe-core en modo claro y oscuro y sin violaciones |
| RNF15 y RNF16 | Código modular y reutilizable | Un módulo por dominio y componentes compartidos |
| RNF21 | Calidad de los datos | Validación en las reglas de Firestore y validadores en los formularios |
| RNF23 | Integración continua | `.github/workflows/ci.yml` |
| RNF24 y RNFG07 | Separación de ambientes | Proyecto real, emuladores locales y modo demostración, cada uno con su archivo de ambiente (ver [implementación en Firebase](DESPLIEGUE.md)) |
| RNFG03 | Base de datos | Cloud Firestore |
| RNFG06 | Credenciales fuera del código | La única credencial privada, la cuenta de servicio de la semilla, nunca entra al repositorio; la clave de la IA la administra Firebase |


Segundo sprint: predios, evaluación, inteligencia artificial e informes
-----------------------------------------------------------------------

Este sprint atiende el documento *Requerimientos funcionales y técnicos del sistema*.

| Sección | Requerimiento | Estado | Ubicación |
|---|---|---|---|
| Gestión de usuarios | Rol Propietario, que consulta sus predios, los resultados, las observaciones y las recomendaciones | Implementado | `firebase/firestore.rules`, rol sembrado en `firebase/semilla.ts` |
| Registro y gestión de predios | Nombre, propietario, teléfono, dirección y ubicación, especies, cantidad de animales e información adicional, con consulta, edición y actualización | Implementado | `core/firebase/predios-evaluaciones.ts`, `features/farms` |
| Registro y gestión de predios | Relación entre especie, cantidad y tamaño del productor según la norma del ICA, con la muestra mínima | Implementado | `compartido/norma.ts` |
| Administración y evaluación de predios | Ficha del predio con *Editar finca*, *Realizar evaluación* y *Guardar cambios* | Implementado | `features/farms/farm-detail/` |
| Administración y evaluación de predios | Evaluación por especie con guardado automático, puntaje por libertad, puntaje total y nivel | Implementado | `core/firebase/predios-evaluaciones.ts`, `features/evaluations/`, `compartido/lista-chequeo.ts`, `compartido/calificacion.ts` |
| Informes | Informe técnico en PDF con la terminología de la norma | Implementado | `compartido/informes.ts` |
| Informes | Informe de recomendaciones para el propietario en lenguaje sencillo: problemas, causas, acciones, prioridades y aviso de que no reemplaza el concepto oficial | Implementado | `core/firebase/ia.ts`, `compartido/ia.ts`, `compartido/recomendaciones.ts`, `compartido/informes.ts` |
| Historial | Historial por predio separado en evaluaciones técnicas y recomendaciones de IA, en orden cronológico | Implementado | `features/farms/farm-detail/` |
| Base de datos | Firebase (Cloud Firestore) con integridad y control de acceso por reglas de seguridad | Implementado | `firebase/firestore.rules`, [diseño de la base de datos](base-de-datos/DISENO-BASE-DE-DATOS.md) |
| Autenticación | Registro de propietarios e ingreso con Google, Facebook y Microsoft mediante Firebase, separado de la autorización | Implementado | `core/services/sesion/sesion-firebase.ts`, `features/auth/external-login/`, `features/auth/register/` |
| Servidores | Firebase Hosting, configuración del proyecto, servicios de IA y autenticación, credenciales, seguridad, respaldos y pruebas de despliegue | Implementado | `firebase.json`, [DESPLIEGUE.md](DESPLIEGUE.md) |

Durante este sprint el sistema pasó a Firebase por decisión del equipo: los datos se guardan en Cloud Firestore, la autenticación es de Firebase Authentication y la interfaz se publica en Firebase Hosting. La lista de chequeo adoptó los 23 criterios de la norma que el equipo cargó en Firestore. La versión anterior, con servicio NestJS y MariaDB, quedó en el historial de Git (commit `0fc90a4`).

Los requerimientos del documento original que este sprint cubre son RF05 a RF08 (predios e inventario), RF13 a RF18 (evaluación con guardado parcial), RF20 a RF24 (puntaje, nivel, hallazgos y recomendaciones), RF28 (historial), RF31 (reporte en PDF) y RNF25 y RNF26 (la IA como apoyo, con respaldo cuando no está disponible).

**Pruebas que respaldan el sprint**

| Prueba | Alcance |
|---|---|
| `firebase/pruebas/reglas.test.ts` | Reglas de Firestore: acceso del propietario solo a sus predios verificados, registro solo como propietario, roles protegidos, validación, evaluación finalizada inmutable, nivel coherente con el puntaje, historial y bitácora |
| `frontend/src/app/core/norma/lista-chequeo.spec.ts` | Los 23 criterios, filtros por sistema productivo y tamaño, ponderación, recomendaciones por criterio y redondeo |
| `frontend/e2e/predios.spec.ts` | Registro de un predio, evaluación completa, resultado, descarga del informe e historial, en escritorio y teléfono, con accesibilidad |


Planeación de los sprints siguientes
------------------------------------

**Tercer sprint: catálogos y parametrización por especie**

- **RF35:** departamentos y municipios con la codificación DIVIPOLA y sistemas productivos como catálogos administrables.
- **RF09 a RF12 y RNF17:** listas de chequeo editables desde la aplicación para porcinos, aves y otras especies, con su versión (RNF28). Hoy los 23 criterios de bovinos y búfalos están en `compartido/lista-chequeo.ts`, versión `ICA-2023.1`, y en la colección `criterios`.
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
- Publicar las reglas de seguridad en el proyecto real y retirar el modo de prueba de Firestore.
- Habilitar Firebase AI Logic y App Check en la consola.
- Verificar el puntaje en el servidor con Cloud Functions, que requiere el plan Blaze; hoy las reglas verifican el nivel y la inmutabilidad.
- Respaldo programado de Firestore, también con el plan Blaze.
