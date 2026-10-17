Diccionario de datos
====================

Este diccionario se generó a partir del catálogo de PostgreSQL después de ejecutar [modelo-completo.sql](modelo-completo.sql) sobre una base vacía, de modo que tipos, nulidad, valores por defecto y llaves coinciden con el script. La columna **Llave** usa PK para llave primaria, FK para llave foránea y UK para restricción de unicidad.

Módulo de seguridad (implementado)
----------------------------------

**roles**

Roles del sistema y permisos que otorgan. Los roles de sistema no pueden inactivarse ni perder permisos esenciales.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `code` | varchar(40) | No |  | UK | Código único en mayúsculas |
| `name` | varchar(80) | No |  |  | Nombre |
| `description` | varchar(255) | Sí |  |  | Descripción |
| `permissions` | text[] | No | `'{}'` |  | Códigos de permiso otorgados |
| `is_system` | boolean | No | `false` |  | Rol del sistema, protegido |
| `active` | boolean | No | `true` |  | Indica si el registro está activo |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` |  | Fecha de la última modificación |

**users**

Personas con acceso a la plataforma. La contraseña se guarda como hash bcrypt.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `first_name` | varchar(80) | No |  |  | Nombres |
| `last_name` | varchar(80) | No |  |  | Apellidos |
| `email` | varchar(160) | No |  |  | Correo electrónico, en minúsculas |
| `document_number` | varchar(20) | Sí |  |  | Número de documento |
| `phone` | varchar(20) | Sí |  |  | Teléfono |
| `password_hash` | varchar(100) | No |  |  | Hash bcrypt de la contraseña |
| `role_id` | uuid | No |  | FK | Rol asignado |
| `active` | boolean | No | `true` |  | Indica si el registro está activo |
| `failed_login_attempts` | integer | No | `0` |  | Intentos fallidos consecutivos |
| `locked_until` | timestamptz | Sí |  |  | Bloqueo temporal hasta esta fecha |
| `last_login_at` | timestamptz | Sí |  |  | Último ingreso |
| `password_changed_at` | timestamptz | No | `now()` |  | Último cambio de contraseña; invalida tokens anteriores |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` |  | Fecha de la última modificación |

**password_reset_tokens**

Enlaces de un solo uso para recuperar la contraseña o activar una cuenta invitada. Solo se guarda el resumen SHA-256 del token.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `user_id` | uuid | No |  | FK | Usuario |
| `token_hash` | varchar(64) | No |  |  | Resumen SHA-256 del token |
| `expires_at` | timestamptz | No |  |  | Vencimiento |
| `used_at` | timestamptz | Sí |  |  | Fecha de uso |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |

**audit_logs**

Bitácora de auditoría de las acciones críticas (RF34, RNF08).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | bigint | No | `nextval('audit_logs_id_seq')` | PK | Consecutivo |
| `actor_id` | uuid | Sí |  |  | Usuario que ejecutó la acción |
| `action` | varchar(60) | No |  |  | Acción, por ejemplo user.created |
| `entity` | varchar(40) | No |  |  | Tipo de entidad afectada |
| `entity_id` | varchar(60) | Sí |  |  | Identificador de la entidad afectada |
| `detail` | jsonb | Sí |  |  | Datos adicionales en JSON |
| `ip` | varchar(64) | Sí |  |  | Dirección IP de origen |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |


Módulo de administración: catálogos
-----------------------------------

**departments**

Departamentos de Colombia según la codificación DANE.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `code` | varchar(2) | No |  | PK | Código único |
| `name` | varchar(80) | No |  |  | Nombre |

**municipalities**

Municipios según la codificación DANE.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `code` | varchar(5) | No |  | PK | Código único |
| `department_code` | varchar(2) | No |  | FK | Departamento |
| `name` | varchar(80) | No |  |  | Nombre |

**species**

Especies animales habilitadas en la plataforma (RF38 multiespecie).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `code` | varchar(30) | No |  | UK | Código único |
| `name` | varchar(80) | No |  |  | Nombre |
| `active` | boolean | No | `true` |  | Indica si el registro está activo |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |

**age_groups**

Grupos etarios por especie para el inventario (RF08).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `species_id` | uuid | No |  | FK, UK | Especie |
| `name` | varchar(80) | No |  | UK | Nombre |
| `min_months` | integer | Sí |  |  | Edad mínima en meses |
| `max_months` | integer | Sí |  |  | Edad máxima en meses |
| `sort_order` | integer | No | `0` |  | Orden de presentación |

**producer_types**

Tipos de productor (RF35).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `name` | varchar(80) | No |  | UK | Nombre |
| `active` | boolean | No | `true` |  | Indica si el registro está activo |

**production_systems**

Sistemas productivos, generales o propios de una especie (RF25, RF35).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `species_id` | uuid | Sí |  | FK, UK | Especie |
| `name` | varchar(80) | No |  | UK | Nombre |
| `active` | boolean | No | `true` |  | Indica si el registro está activo |


Módulo de gestión de fincas
---------------------------

**farms**

Información básica y ubicación de cada finca (RF05, RF06). La eliminación es lógica.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `name` | varchar(120) | No |  |  | Nombre de la finca |
| `ica_registry` | varchar(40) | Sí |  | UK | Registro sanitario del predio ante el ICA |
| `owner_name` | varchar(160) | No |  |  | Nombre del propietario |
| `owner_document` | varchar(20) | Sí |  |  | Documento del propietario |
| `owner_phone` | varchar(20) | Sí |  |  | Teléfono del propietario |
| `owner_email` | varchar(160) | Sí |  |  | Correo del propietario |
| `producer_type_id` | uuid | Sí |  | FK | Tipo de productor |
| `production_system_id` | uuid | Sí |  | FK | Sistema productivo |
| `municipality_code` | varchar(5) | No |  | FK | Municipio |
| `vereda` | varchar(120) | Sí |  |  | Vereda |
| `address` | varchar(200) | Sí |  |  | Dirección |
| `latitude` | numeric(9,6) | Sí |  |  | Latitud, opcional |
| `longitude` | numeric(9,6) | Sí |  |  | Longitud, opcional |
| `area_hectares` | numeric(10,2) | Sí |  |  | Área en hectáreas |
| `created_by` | uuid | No |  | FK | Usuario que creó el registro |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` |  | Fecha de la última modificación |
| `deleted_at` | timestamptz | Sí |  |  | Fecha de eliminación lógica |

**farm_species**

Especies que se crían en cada finca (RF07).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `farm_id` | uuid | No |  | FK, PK | Finca |
| `species_id` | uuid | No |  | FK, PK | Especie |

**farm_inventory**

Número de animales por especie y grupo etario en una fecha (RF08).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `farm_id` | uuid | No |  | FK, UK | Finca |
| `species_id` | uuid | No |  | FK | Especie |
| `age_group_id` | uuid | No |  | FK, UK | Grupo etario |
| `quantity` | integer | No |  |  | Número de animales |
| `recorded_at` | date | No | `CURRENT_DATE` | UK | Fecha del conteo |


Módulo de parametrización de especies
-------------------------------------

**checklists**

Listas de chequeo versionadas por especie (RF09, RNF28). Solo una versión publicada por especie.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `species_id` | uuid | No |  | FK, UK | Especie |
| `version` | integer | No |  | UK | Número de versión |
| `name` | varchar(120) | No |  |  | Nombre |
| `status` | varchar(12) | No | `'BORRADOR'` |  | BORRADOR, PUBLICADA o RETIRADA |
| `source` | varchar(200) | Sí |  |  | Manual de bienestar animal de referencia |
| `published_at` | timestamptz | Sí |  |  | Fecha de publicación |
| `created_by` | uuid | No |  | FK | Usuario que creó el registro |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |

**criteria**

Criterios y subcriterios de evaluación con su dimensión de bienestar y ponderación (RF10, RF11).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `checklist_id` | uuid | No |  | FK, UK | Lista de chequeo |
| `parent_id` | uuid | Sí |  | FK | Criterio padre, para subcriterios |
| `dimension` | varchar(20) | No |  |  | NUTRICION, AMBIENTE, SALUD, COMPORTAMIENTO o MANEJO |
| `code` | varchar(20) | No |  | UK | Código único |
| `name` | varchar(160) | No |  |  | Nombre |
| `weight` | numeric(5,2) | No |  |  | Ponderación |
| `sort_order` | integer | No | `0` |  | Orden de presentación |

**indicators**

Indicadores de cada criterio, con ponderación y marca de criticidad.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `criterion_id` | uuid | No |  | FK | Criterio |
| `name` | varchar(160) | No |  |  | Nombre |
| `weight` | numeric(5,2) | No |  |  | Ponderación |
| `is_critical` | boolean | No | `false` |  | Su incumplimiento genera alerta crítica |
| `sort_order` | integer | No | `0` |  | Orden de presentación |

**questions**

Preguntas de cada indicador y su tipo de respuesta (RF12).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `indicator_id` | uuid | No |  | FK | Indicador |
| `text` | varchar(400) | No |  |  | Enunciado de la pregunta |
| `help_text` | varchar(400) | Sí |  |  | Ayuda para el evaluador |
| `response_type` | varchar(16) | No |  |  | SI_NO, UNICA, MULTIPLE, ESCALA, NUMERICA, TEXTO o EVIDENCIA |
| `required` | boolean | No | `true` |  | Respuesta obligatoria |
| `weight` | numeric(5,2) | No | `1` |  | Ponderación de la pregunta |
| `scale_min` | integer | Sí |  |  | Valor mínimo de la escala |
| `scale_max` | integer | Sí |  |  | Valor máximo de la escala |
| `sort_order` | integer | No | `0` |  | Orden de presentación |

**question_options**

Opciones de las preguntas de selección y su puntaje.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `question_id` | uuid | No |  | FK | Pregunta |
| `label` | varchar(160) | No |  |  | Texto de la opción |
| `score` | numeric(5,2) | No | `0` |  | Puntaje que otorga la opción |
| `sort_order` | integer | No | `0` |  | Orden de presentación |

**welfare_levels**

Rangos de puntaje que definen los niveles de bienestar (RF21).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `checklist_id` | uuid | No |  | FK | Lista de chequeo |
| `name` | varchar(60) | No |  |  | Nombre |
| `min_score` | numeric(5,2) | No |  |  | Puntaje mínimo del nivel |
| `max_score` | numeric(5,2) | No |  |  | Puntaje máximo |
| `certifiable` | boolean | No | `false` |  | Habilita la certificación |


Módulo de evaluación
--------------------

**evaluations**

Evaluación de una especie en una finca con una versión de lista de chequeo (RF13 a RF21, RF36).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `farm_id` | uuid | No |  | FK | Finca |
| `species_id` | uuid | No |  | FK | Especie |
| `checklist_id` | uuid | No |  | FK | Lista de chequeo |
| `evaluator_id` | uuid | No |  | FK | Evaluador responsable |
| `status` | varchar(12) | No | `'BORRADOR'` |  | BORRADOR, EN_PROCESO, FINALIZADA, VALIDADA o CERRADA |
| `visit_date` | date | No |  |  | Fecha de la visita |
| `general_observation` | text | Sí |  |  | Observación general |
| `total_score` | numeric(5,2) | Sí |  |  | Puntaje total de 0 a 100 |
| `welfare_level_id` | uuid | Sí |  | FK | Nivel de bienestar obtenido |
| `last_saved_at` | timestamptz | No | `now()` |  | Último guardado parcial |
| `finished_at` | timestamptz | Sí |  |  | Fecha de finalización |
| `validated_by` | uuid | Sí |  | FK | Usuario que validó |
| `validated_at` | timestamptz | Sí |  |  | Fecha de validación |
| `closed_at` | timestamptz | Sí |  |  | Fecha de cierre |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |

**evaluation_status_history**

Historial de cambios de estado de cada evaluación (RF34, RF36).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | bigint | No | `nextval('evaluation_status_history_id_seq')` | PK | Consecutivo |
| `evaluation_id` | uuid | No |  | FK | Evaluación |
| `from_status` | varchar(12) | Sí |  |  | Estado anterior |
| `to_status` | varchar(12) | No |  |  | Estado nuevo |
| `changed_by` | uuid | No |  | FK | Usuario que cambió el estado |
| `changed_at` | timestamptz | No | `now()` |  | Fecha del cambio |

**evaluation_answers**

Respuesta a cada pregunta con su puntaje y observación (RF15, RF18).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `evaluation_id` | uuid | No |  | FK, UK | Evaluación |
| `question_id` | uuid | No |  | FK, UK | Pregunta |
| `value` | jsonb | No |  |  | Respuesta en JSON según el tipo |
| `score` | numeric(5,2) | Sí |  |  | Puntaje obtenido |
| `observation` | text | Sí |  |  | Observación textual |
| `answered_at` | timestamptz | No | `now()` |  | Fecha de la respuesta |

**criterion_scores**

Puntaje parcial obtenido en cada criterio (RF20).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `evaluation_id` | uuid | No |  | FK, PK | Evaluación |
| `criterion_id` | uuid | No |  | FK, PK | Criterio |
| `score` | numeric(5,2) | No |  |  | Puntaje obtenido |
| `max_score` | numeric(5,2) | No |  |  | Puntaje máximo posible |
| `observation` | text | Sí |  |  | Observación textual |

**evidences**

Fotografías, documentos o videos adjuntos, almacenados en Cloud Storage (RF19, RNF11).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `evaluation_id` | uuid | No |  | FK | Evaluación |
| `question_id` | uuid | Sí |  | FK | Pregunta |
| `criterion_id` | uuid | Sí |  | FK | Criterio |
| `storage_path` | varchar(300) | No |  |  | Ruta del objeto en Cloud Storage |
| `file_name` | varchar(200) | No |  |  | Nombre original del archivo |
| `mime_type` | varchar(80) | No |  |  | Tipo de contenido |
| `size_bytes` | bigint | No |  |  | Tamaño en bytes, máximo 50 MB |
| `uploaded_by` | uuid | No |  | FK | Usuario que cargó el archivo |
| `uploaded_at` | timestamptz | No | `now()` |  | Fecha de carga |


Módulos de diagnóstico y recomendaciones
----------------------------------------

**findings**

Fortalezas, incumplimientos, alertas críticas y oportunidades de mejora (RF22, RF23).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `evaluation_id` | uuid | No |  | FK | Evaluación |
| `criterion_id` | uuid | Sí |  | FK | Criterio |
| `indicator_id` | uuid | Sí |  | FK | Indicador |
| `kind` | varchar(16) | No |  |  | FORTALEZA, INCUMPLIMIENTO, ALERTA_CRITICA u OPORTUNIDAD |
| `description` | varchar(500) | No |  |  | Descripción del hallazgo |
| `severity` | smallint | No | `1` |  | Severidad de 1 a 5 |

**recommendations**

Recomendaciones generadas por IA, por reglas o por el evaluador, con el texto original conservado (RF24 a RF26, RNF25).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `evaluation_id` | uuid | No |  | FK | Evaluación |
| `finding_id` | uuid | Sí |  | FK | Hallazgo que origina la recomendación |
| `source` | varchar(10) | No |  |  | Origen: IA, REGLA o EVALUADOR |
| `original_text` | text | Sí |  |  | Texto tal como lo generó la IA |
| `text` | text | No |  |  | Texto revisado por el evaluador |
| `ai_model` | varchar(60) | Sí |  |  | Modelo de IA utilizado |
| `edited_by` | uuid | Sí |  | FK | Usuario que editó |
| `edited_at` | timestamptz | Sí |  |  | Fecha de edición |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |

**improvement_actions**

Plan de mejora con responsable, prioridad y plazo (RF27).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `evaluation_id` | uuid | No |  | FK | Evaluación |
| `recommendation_id` | uuid | Sí |  | FK | Recomendación de origen |
| `description` | varchar(500) | No |  |  | Acción de mejora |
| `responsible` | varchar(160) | No |  |  | Responsable de la acción |
| `priority` | varchar(6) | No |  |  | ALTA, MEDIA o BAJA |
| `due_date` | date | No |  |  | Plazo |
| `status` | varchar(12) | No | `'PENDIENTE'` |  | PENDIENTE, EN_CURSO o CUMPLIDA |


Módulo de reportes y notificaciones
-----------------------------------

**certificates**

Certificados emitidos para las evaluaciones con nivel certificable (RF38).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `evaluation_id` | uuid | No |  | FK, UK | Evaluación |
| `code` | varchar(30) | No |  | UK | Código verificable impreso en el certificado |
| `issued_at` | timestamptz | No | `now()` |  | Fecha de emisión |
| `valid_until` | date | No |  |  | Vigencia |
| `pdf_path` | varchar(300) | No |  |  | Ruta del PDF en Cloud Storage |
| `sent_to` | varchar(160) | Sí |  |  | Correo de destino |
| `sent_at` | timestamptz | Sí |  |  | Fecha de envío |

**notifications**

Notificaciones dentro de la plataforma (RF40).

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK | Identificador |
| `user_id` | uuid | No |  | FK | Usuario |
| `evaluation_id` | uuid | Sí |  | FK | Evaluación |
| `kind` | varchar(20) | No |  |  | PENDIENTE, APROBACION, OBSERVACION o SISTEMA |
| `title` | varchar(120) | No |  |  | Título |
| `body` | varchar(500) | Sí |  |  | Contenido |
| `read_at` | timestamptz | Sí |  |  | Fecha de lectura |
| `created_at` | timestamptz | No | `now()` |  | Fecha de creación |
