/*
  ICA Bienestar Animal: modelo físico completo de la base de datos (PostgreSQL 16).

  El bloque de seguridad corresponde a las tablas en producción, creadas por la
  migración backend/src/database/migrations/1792014831263-InitialSecurity.ts.
  Los bloques siguientes son el diseño aprobado para los módulos de los próximos
  sprints; cada uno se incorporará al código mediante su propia migración.

  Ejecución sobre una base vacía:
    psql -d ica_bienestar_modelo -f docs/base-de-datos/modelo-completo.sql
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* ======================================================================
   Módulo de seguridad (RF01 a RF04, RF34, RNF05, RNF07, RNF08)
   ====================================================================== */

CREATE TABLE roles (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        varchar(40)  NOT NULL UNIQUE,
  name        varchar(80)  NOT NULL,
  description varchar(255),
  permissions text[]       NOT NULL DEFAULT '{}',
  is_system   boolean      NOT NULL DEFAULT false,
  active      boolean      NOT NULL DEFAULT true,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name            varchar(80)  NOT NULL,
  last_name             varchar(80)  NOT NULL,
  email                 varchar(160) NOT NULL,
  document_number       varchar(20),
  phone                 varchar(20),
  password_hash         varchar(100) NOT NULL,
  role_id               uuid         NOT NULL REFERENCES roles (id),
  active                boolean      NOT NULL DEFAULT true,
  failed_login_attempts integer      NOT NULL DEFAULT 0,
  locked_until          timestamptz,
  last_login_at         timestamptz,
  password_changed_at   timestamptz  NOT NULL DEFAULT now(),
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_users_email ON users (email);

CREATE TABLE password_reset_tokens (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_password_reset_tokens_hash ON password_reset_tokens (token_hash);

CREATE TABLE audit_logs (
  id         bigserial PRIMARY KEY,
  actor_id   uuid,
  action     varchar(60) NOT NULL,
  entity     varchar(40) NOT NULL,
  entity_id  varchar(60),
  detail     jsonb,
  ip         varchar(64),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX ix_audit_logs_created ON audit_logs (created_at);

/* ======================================================================
   Módulo de administración: catálogos (RF35, RF38 multiespecie)
   ====================================================================== */

CREATE TABLE departments (
  code varchar(2)  PRIMARY KEY,           -- código DANE
  name varchar(80) NOT NULL
);

CREATE TABLE municipalities (
  code            varchar(5)  PRIMARY KEY, -- código DANE
  department_code varchar(2)  NOT NULL REFERENCES departments (code),
  name            varchar(80) NOT NULL
);
CREATE INDEX ix_municipalities_department ON municipalities (department_code);

CREATE TABLE species (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       varchar(30)  NOT NULL UNIQUE,
  name       varchar(80)  NOT NULL,
  active     boolean      NOT NULL DEFAULT true,
  created_at timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE age_groups (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_id uuid        NOT NULL REFERENCES species (id),
  name       varchar(80) NOT NULL,
  min_months integer     CHECK (min_months >= 0),
  max_months integer     CHECK (max_months IS NULL OR max_months >= min_months),
  sort_order integer     NOT NULL DEFAULT 0,
  UNIQUE (species_id, name)
);

CREATE TABLE producer_types (
  id     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name   varchar(80) NOT NULL UNIQUE,
  active boolean     NOT NULL DEFAULT true
);

CREATE TABLE production_systems (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_id uuid REFERENCES species (id), -- nulo: aplica a todas las especies
  name       varchar(80) NOT NULL,
  active     boolean     NOT NULL DEFAULT true,
  UNIQUE (species_id, name)
);

/* ======================================================================
   Módulo de gestión de fincas (RF05 a RF08)
   ====================================================================== */

CREATE TABLE farms (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 varchar(120)  NOT NULL,
  ica_registry         varchar(40)   UNIQUE,  -- registro sanitario del predio
  owner_name           varchar(160)  NOT NULL,
  owner_document       varchar(20),
  owner_phone          varchar(20),
  owner_email          varchar(160),
  producer_type_id     uuid          REFERENCES producer_types (id),
  production_system_id uuid          REFERENCES production_systems (id),
  municipality_code    varchar(5)    NOT NULL REFERENCES municipalities (code),
  vereda               varchar(120),
  address              varchar(200),
  latitude             numeric(9, 6) CHECK (latitude BETWEEN -90 AND 90),
  longitude            numeric(9, 6) CHECK (longitude BETWEEN -180 AND 180),
  area_hectares        numeric(10, 2) CHECK (area_hectares > 0),
  created_by           uuid          NOT NULL REFERENCES users (id),
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now(),
  deleted_at           timestamptz             -- eliminación lógica (RF05)
);
CREATE INDEX ix_farms_municipality ON farms (municipality_code);
CREATE INDEX ix_farms_name ON farms (lower(name));

CREATE TABLE farm_species (
  farm_id    uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
  species_id uuid NOT NULL REFERENCES species (id),
  PRIMARY KEY (farm_id, species_id)
);

CREATE TABLE farm_inventory (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id      uuid        NOT NULL,
  species_id   uuid        NOT NULL,
  age_group_id uuid        NOT NULL REFERENCES age_groups (id),
  quantity     integer     NOT NULL CHECK (quantity >= 0),
  recorded_at  date        NOT NULL DEFAULT current_date,
  FOREIGN KEY (farm_id, species_id) REFERENCES farm_species (farm_id, species_id) ON DELETE CASCADE,
  UNIQUE (farm_id, age_group_id, recorded_at)
);

/* ======================================================================
   Módulo de parametrización de especies (RF09 a RF12, RNF17, RNF28)
   ====================================================================== */

CREATE TABLE checklists (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_id   uuid        NOT NULL REFERENCES species (id),
  version      integer     NOT NULL CHECK (version > 0),
  name         varchar(120) NOT NULL,
  status       varchar(12) NOT NULL DEFAULT 'BORRADOR'
               CHECK (status IN ('BORRADOR', 'PUBLICADA', 'RETIRADA')),
  source       varchar(200),           -- manual de bienestar animal de referencia
  published_at timestamptz,
  created_by   uuid        NOT NULL REFERENCES users (id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (species_id, version)
);
-- Solo una versión publicada por especie.
CREATE UNIQUE INDEX ux_checklists_published ON checklists (species_id) WHERE status = 'PUBLICADA';

CREATE TABLE criteria (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id uuid          NOT NULL REFERENCES checklists (id) ON DELETE CASCADE,
  parent_id    uuid          REFERENCES criteria (id) ON DELETE CASCADE, -- subcriterio
  dimension    varchar(20)   NOT NULL
               CHECK (dimension IN ('NUTRICION', 'AMBIENTE', 'SALUD', 'COMPORTAMIENTO', 'MANEJO')),
  code         varchar(20)   NOT NULL,
  name         varchar(160)  NOT NULL,
  weight       numeric(5, 2) NOT NULL CHECK (weight > 0),
  sort_order   integer       NOT NULL DEFAULT 0,
  UNIQUE (checklist_id, code)
);

CREATE TABLE indicators (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  criterion_id uuid         NOT NULL REFERENCES criteria (id) ON DELETE CASCADE,
  name        varchar(160)  NOT NULL,
  weight      numeric(5, 2) NOT NULL CHECK (weight > 0),
  is_critical boolean       NOT NULL DEFAULT false, -- su incumplimiento genera alerta crítica
  sort_order  integer       NOT NULL DEFAULT 0
);

CREATE TABLE questions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id  uuid          NOT NULL REFERENCES indicators (id) ON DELETE CASCADE,
  text          varchar(400)  NOT NULL,
  help_text     varchar(400),
  response_type varchar(16)   NOT NULL
                CHECK (response_type IN ('SI_NO', 'UNICA', 'MULTIPLE', 'ESCALA', 'NUMERICA', 'TEXTO', 'EVIDENCIA')),
  required      boolean       NOT NULL DEFAULT true,
  weight        numeric(5, 2) NOT NULL DEFAULT 1 CHECK (weight >= 0),
  scale_min     integer,
  scale_max     integer,
  sort_order    integer       NOT NULL DEFAULT 0,
  CHECK (response_type <> 'ESCALA' OR (scale_min IS NOT NULL AND scale_max > scale_min))
);

CREATE TABLE question_options (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id uuid          NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  label       varchar(160)  NOT NULL,
  score       numeric(5, 2) NOT NULL DEFAULT 0,
  sort_order  integer       NOT NULL DEFAULT 0
);

CREATE TABLE welfare_levels (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id uuid          NOT NULL REFERENCES checklists (id) ON DELETE CASCADE,
  name         varchar(60)   NOT NULL,
  min_score    numeric(5, 2) NOT NULL CHECK (min_score BETWEEN 0 AND 100),
  max_score    numeric(5, 2) NOT NULL CHECK (max_score BETWEEN 0 AND 100),
  certifiable  boolean       NOT NULL DEFAULT false, -- habilita la certificación (RF38)
  CHECK (max_score >= min_score)
);

/* ======================================================================
   Módulo de evaluación (RF13 a RF21, RF36)
   ====================================================================== */

CREATE TABLE evaluations (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id             uuid          NOT NULL REFERENCES farms (id),
  species_id          uuid          NOT NULL REFERENCES species (id),
  checklist_id        uuid          NOT NULL REFERENCES checklists (id),
  evaluator_id        uuid          NOT NULL REFERENCES users (id),
  status              varchar(12)   NOT NULL DEFAULT 'BORRADOR'
                      CHECK (status IN ('BORRADOR', 'EN_PROCESO', 'FINALIZADA', 'VALIDADA', 'CERRADA')),
  visit_date          date          NOT NULL,
  general_observation text,
  total_score         numeric(5, 2) CHECK (total_score BETWEEN 0 AND 100),
  welfare_level_id    uuid          REFERENCES welfare_levels (id),
  last_saved_at       timestamptz   NOT NULL DEFAULT now(), -- guardado parcial (RF16)
  finished_at         timestamptz,
  validated_by        uuid          REFERENCES users (id),
  validated_at        timestamptz,
  closed_at           timestamptz,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  FOREIGN KEY (farm_id, species_id) REFERENCES farm_species (farm_id, species_id)
);
CREATE INDEX ix_evaluations_farm ON evaluations (farm_id, visit_date DESC);
CREATE INDEX ix_evaluations_status ON evaluations (status);
CREATE INDEX ix_evaluations_evaluator ON evaluations (evaluator_id);

CREATE TABLE evaluation_status_history (
  id            bigserial PRIMARY KEY,
  evaluation_id uuid        NOT NULL REFERENCES evaluations (id) ON DELETE CASCADE,
  from_status   varchar(12),
  to_status     varchar(12) NOT NULL,
  changed_by    uuid        NOT NULL REFERENCES users (id),
  changed_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evaluation_answers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id uuid          NOT NULL REFERENCES evaluations (id) ON DELETE CASCADE,
  question_id   uuid          NOT NULL REFERENCES questions (id),
  value         jsonb         NOT NULL, -- sí/no, opción, opciones, número o texto
  score         numeric(5, 2),
  observation   text,
  answered_at   timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, question_id)
);

CREATE TABLE criterion_scores (
  evaluation_id uuid          NOT NULL REFERENCES evaluations (id) ON DELETE CASCADE,
  criterion_id  uuid          NOT NULL REFERENCES criteria (id),
  score         numeric(5, 2) NOT NULL,
  max_score     numeric(5, 2) NOT NULL CHECK (max_score > 0),
  observation   text,
  PRIMARY KEY (evaluation_id, criterion_id)
);

CREATE TABLE evidences (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id uuid         NOT NULL REFERENCES evaluations (id) ON DELETE CASCADE,
  question_id   uuid         REFERENCES questions (id),
  criterion_id  uuid         REFERENCES criteria (id),
  storage_path  varchar(300) NOT NULL, -- objeto en Cloud Storage
  file_name     varchar(200) NOT NULL,
  mime_type     varchar(80)  NOT NULL,
  size_bytes    bigint       NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 52428800),
  uploaded_by   uuid         NOT NULL REFERENCES users (id),
  uploaded_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX ix_evidences_evaluation ON evidences (evaluation_id);

/* ======================================================================
   Módulos de diagnóstico y recomendaciones con IA (RF22 a RF27, RNF25, RNF26)
   ====================================================================== */

CREATE TABLE findings (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id uuid         NOT NULL REFERENCES evaluations (id) ON DELETE CASCADE,
  criterion_id  uuid         REFERENCES criteria (id),
  indicator_id  uuid         REFERENCES indicators (id),
  kind          varchar(16)  NOT NULL
                CHECK (kind IN ('FORTALEZA', 'INCUMPLIMIENTO', 'ALERTA_CRITICA', 'OPORTUNIDAD')),
  description   varchar(500) NOT NULL,
  severity      smallint     NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5)
);
CREATE INDEX ix_findings_evaluation ON findings (evaluation_id, severity DESC);

CREATE TABLE recommendations (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id uuid        NOT NULL REFERENCES evaluations (id) ON DELETE CASCADE,
  finding_id    uuid        REFERENCES findings (id) ON DELETE SET NULL,
  source        varchar(10) NOT NULL CHECK (source IN ('IA', 'REGLA', 'EVALUADOR')),
  original_text text,        -- texto tal como lo devolvió la IA
  text          text        NOT NULL, -- texto revisado por el evaluador (RF26)
  ai_model      varchar(60),
  edited_by     uuid        REFERENCES users (id),
  edited_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE improvement_actions (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id     uuid         NOT NULL REFERENCES evaluations (id) ON DELETE CASCADE,
  recommendation_id uuid         REFERENCES recommendations (id) ON DELETE SET NULL,
  description       varchar(500) NOT NULL,
  responsible       varchar(160) NOT NULL,
  priority          varchar(6)   NOT NULL CHECK (priority IN ('ALTA', 'MEDIA', 'BAJA')),
  due_date          date         NOT NULL,
  status            varchar(12)  NOT NULL DEFAULT 'PENDIENTE'
                    CHECK (status IN ('PENDIENTE', 'EN_CURSO', 'CUMPLIDA'))
);

/* ======================================================================
   Módulo de reportes, certificación y notificaciones (RF31, RF38, RF40)
   ====================================================================== */

CREATE TABLE certificates (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id uuid         NOT NULL UNIQUE REFERENCES evaluations (id),
  code          varchar(30)  NOT NULL UNIQUE, -- código verificable impreso en el PDF
  issued_at     timestamptz  NOT NULL DEFAULT now(),
  valid_until   date         NOT NULL,
  pdf_path      varchar(300) NOT NULL,
  sent_to       varchar(160),
  sent_at       timestamptz
);

CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  evaluation_id uuid         REFERENCES evaluations (id) ON DELETE CASCADE,
  kind          varchar(20)  NOT NULL CHECK (kind IN ('PENDIENTE', 'APROBACION', 'OBSERVACION', 'SISTEMA')),
  title         varchar(120) NOT NULL,
  body          varchar(500),
  read_at       timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX ix_notifications_unread ON notifications (user_id) WHERE read_at IS NULL;
