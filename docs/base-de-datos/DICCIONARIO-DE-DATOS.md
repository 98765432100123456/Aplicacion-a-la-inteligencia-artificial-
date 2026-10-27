Diccionario de datos
====================

Este diccionario se generó del catálogo de MariaDB (`information_schema`) después de aplicar las migraciones del servicio de aplicación, de modo que tipos, nulidad, valores por defecto y llaves coinciden con [esquema-mariadb.sql](esquema-mariadb.sql). La columna **Llave** usa PK para llave primaria, FK para llave foránea y UK para restricción de unicidad. Las columnas JSON se guardan como `longtext` con la validación `json_valid`; las booleanas, como `tinyint`.

Seguridad y acceso
------------------

**roles**

Roles del sistema y permisos que otorgan. Los roles base no pueden inactivarse.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `code` | varchar(40) | No |  | UK | Código único en mayúsculas |
| `name` | varchar(80) | No |  |  | Nombre |
| `description` | varchar(255) | Sí |  |  | Descripción |
| `permissions` | text | No |  |  | Códigos de permiso separados por comas |
| `is_system` | boolean | No | `0` |  | Rol base del sistema, protegido |
| `active` | boolean | No | `1` |  | Indica si el registro está activo |
| `created_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de creación |
| `updated_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de la última modificación |

**users**

Personas con acceso a la plataforma. La contraseña se guarda como hash bcrypt.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `first_name` | varchar(80) | No |  |  | Nombres |
| `last_name` | varchar(80) | No |  |  | Apellidos |
| `email` | varchar(160) | No |  | UK | Correo, único y en minúsculas |
| `document_number` | varchar(20) | Sí |  |  | Número de documento |
| `phone` | varchar(20) | Sí |  |  | Teléfono |
| `password_hash` | varchar(100) | No |  |  | Hash bcrypt de la contraseña |
| `role_id` | uuid | No |  | FK → roles | Rol asignado |
| `active` | boolean | No | `1` |  | Indica si el registro está activo |
| `failed_login_attempts` | int | No | `0` |  | Intentos fallidos consecutivos |
| `locked_until` | datetime(3) | Sí |  |  | Bloqueo temporal por intentos fallidos |
| `last_login_at` | datetime(3) | Sí |  |  | Último ingreso |
| `password_changed_at` | datetime(3) | No | `current_timestamp(3)` |  | Último cambio de contraseña |
| `created_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de creación |
| `updated_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de la última modificación |

**password_reset_tokens**

Enlaces de un solo uso para crear o restablecer la contraseña. Solo se guarda el hash SHA-256 del token.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `user_id` | uuid | No |  | FK → users (cascade) | Usuario dueño del enlace |
| `token_hash` | varchar(64) | No |  | UK | Hash SHA-256 del token |
| `expires_at` | datetime(3) | No |  |  | Vencimiento |
| `used_at` | datetime(3) | Sí |  |  | Momento en que se usó |
| `created_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de creación |

**audit_logs**

Bitácora de auditoría de las acciones relevantes.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | bigint | No |  | PK | Identificador |
| `actor_id` | uuid | Sí |  |  | Usuario que realizó la acción |
| `action` | varchar(60) | No |  |  | Acción, por ejemplo evaluation.finalized |
| `entity` | varchar(40) | No |  |  | Tipo de registro afectado |
| `entity_id` | varchar(60) | Sí |  |  | Identificador del registro afectado |
| `detail` | json | Sí |  |  | Detalle en JSON |
| `ip` | varchar(64) | Sí |  |  | Dirección IP de origen |
| `created_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de creación |

Predios
-------

**species**

Especies habilitadas para evaluar; cada una tiene su lista de chequeo.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `code` | varchar(30) | No |  | UK | Código único, por ejemplo BOVINO |
| `name` | varchar(80) | No |  |  | Nombre |
| `active` | boolean | No | `1` |  | Indica si el registro está activo |

**farms**

Predios con su propietario y ubicación.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `name` | varchar(120) | No |  |  | Nombre de la finca o predio |
| `owner_name` | varchar(160) | No |  |  | Nombre del propietario |
| `owner_document` | varchar(20) | Sí |  |  | Documento del propietario |
| `owner_phone` | varchar(20) | No |  |  | Teléfono de contacto |
| `owner_email` | varchar(160) | Sí |  |  | Correo con el que el propietario consulta el predio |
| `owner_user_id` | uuid | Sí |  | FK → users (set null) | Cuenta del propietario, si existe |
| `department` | varchar(80) | No |  |  | Departamento |
| `municipality` | varchar(80) | No |  |  | Municipio |
| `vereda` | varchar(120) | Sí |  |  | Vereda |
| `address` | varchar(200) | Sí |  |  | Dirección o indicaciones |
| `latitude` | decimal(9,6) | Sí |  |  | Latitud |
| `longitude` | decimal(9,6) | Sí |  |  | Longitud |
| `area_hectares` | decimal(10,2) | Sí |  |  | Área en hectáreas |
| `production_system` | varchar(80) | Sí |  |  | Sistema productivo |
| `notes` | text | Sí |  |  | Información adicional |
| `created_by` | uuid | No |  | FK → users | Usuario que registró el predio |
| `created_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de creación |
| `updated_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de la última modificación |

**farm_species**

Inventario del predio por especie y grupo de edad; define el tipo de productor y la muestra.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `species_id` | uuid | No |  | FK → species, UK | Especie |
| `calves` | int | No | `0` |  | Número de crías |
| `young` | int | No | `0` |  | Número de jóvenes |
| `adults` | int | No | `0` |  | Número de adultos |
| `farm_id` | uuid | No |  | FK → farms (cascade), UK | Predio |

Evaluaciones e informes
-----------------------

**evaluations**

Evaluaciones de bienestar animal de una especie en un predio. Guardan una copia del inventario y del resultado.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `farm_id` | uuid | No |  | FK → farms (cascade) | Predio evaluado |
| `species_id` | uuid | No |  | FK → species | Especie evaluada |
| `evaluator_id` | uuid | No |  | FK → users | Evaluador |
| `status` | varchar(12) | No | `'BORRADOR'` |  | BORRADOR o FINALIZADA |
| `checklist_version` | varchar(20) | No |  |  | Versión de la lista de chequeo aplicada |
| `visit_date` | date | No |  |  | Fecha de la visita |
| `calves` | int | No |  |  | Número de crías |
| `young` | int | No |  |  | Número de jóvenes |
| `adults` | int | No |  |  | Número de adultos |
| `producer_type` | varchar(10) | No |  |  | PEQUENO, MEDIANO o GRANDE |
| `sample_size` | int | Sí |  |  | Muestra mínima de animales |
| `general_observation` | text | Sí |  |  | Observación general |
| `score` | decimal(3,2) | Sí |  |  | Puntaje total de 0 a 5 |
| `level` | varchar(10) | Sí |  |  | BAJO, MEDIO, ALTO o EXCELENTE |
| `results` | json | Sí |  |  | Puntajes por libertad y hallazgos en JSON |
| `last_saved_at` | datetime(3) | No |  |  | Último guardado |
| `finished_at` | datetime(3) | Sí |  |  | Fecha de finalización |
| `created_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de creación |

**evaluation_answers**

Respuesta a cada indicador de la lista de chequeo.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `indicator_code` | varchar(10) | No |  | UK | Código del indicador, por ejemplo N1 |
| `indicator_text` | varchar(300) | No |  |  | Texto del indicador al momento de responder |
| `freedom` | varchar(20) | No |  |  | Libertad a la que pertenece |
| `answer` | varchar(12) | No |  |  | CUMPLE, PARCIAL, NO_CUMPLE o NO_APLICA |
| `observation` | text | Sí |  |  | Observación del evaluador |
| `evaluation_id` | uuid | No |  | FK → evaluations (cascade), UK | Evaluación |

**recommendations**

Recomendaciones para el propietario; se guarda cada versión generada.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `evaluation_id` | uuid | No |  | FK → evaluations (cascade) | Evaluación |
| `source` | varchar(10) | No |  |  | IA o REGLAS |
| `model` | varchar(60) | Sí |  |  | Modelo de IA que las generó |
| `summary` | text | No |  |  | Resumen en lenguaje sencillo |
| `items` | json | No |  |  | Recomendaciones con prioridad, problema, causa y acciones en JSON |
| `created_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de creación |

**reports**

Informes PDF generados al finalizar la evaluación.

| Columna | Tipo | Nulo | Por defecto | Llave | Descripción |
|---|---|---|---|---|---|
| `id` | uuid | No |  | PK | Identificador |
| `evaluation_id` | uuid | No |  | FK → evaluations (cascade) | Evaluación |
| `kind` | varchar(12) | No |  |  | TECNICO o PROPIETARIO |
| `file_name` | varchar(160) | No |  |  | Nombre del archivo |
| `size_bytes` | int | No |  |  | Tamaño en bytes |
| `content` | longblob | No |  |  | Contenido del PDF |
| `created_at` | datetime(3) | No | `current_timestamp(3)` |  | Fecha de creación |
