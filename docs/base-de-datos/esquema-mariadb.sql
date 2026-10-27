-- Esquema de la base de datos de ICA Bienestar Animal en MariaDB 10.11 o posterior.
-- Generado con mariadb-dump --no-data después de aplicar las migraciones de
-- backend/src/database/migrations. Es material de consulta: la base se crea y se
-- actualiza siempre con las migraciones (npm run migration:run), no con este archivo.
--
-- La base debe crearse con utf8mb4:
--   CREATE DATABASE ica_bienestar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Las tablas van en orden alfabético; las llaves foráneas se validan al final.
SET FOREIGN_KEY_CHECKS = 0;


CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `actor_id` uuid DEFAULT NULL,
  `action` varchar(60) NOT NULL,
  `entity` varchar(40) NOT NULL,
  `entity_id` varchar(60) DEFAULT NULL,
  `detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detail`)),
  `ip` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `IDX_177183f29f438c488b5e8510cd` (`actor_id`),
  KEY `IDX_2cd10fda8276bb995288acfbfb` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evaluation_answers` (
  `id` uuid NOT NULL,
  `indicator_code` varchar(10) NOT NULL,
  `indicator_text` varchar(300) NOT NULL,
  `freedom` varchar(20) NOT NULL,
  `answer` varchar(12) NOT NULL,
  `observation` text DEFAULT NULL,
  `evaluation_id` uuid NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_2de4e3f10997aa0dab93baa546` (`evaluation_id`,`indicator_code`),
  CONSTRAINT `FK_d5faf0767edf0dda1fc366eeb82` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evaluations` (
  `id` uuid NOT NULL,
  `farm_id` uuid NOT NULL,
  `species_id` uuid NOT NULL,
  `evaluator_id` uuid NOT NULL,
  `status` varchar(12) NOT NULL DEFAULT 'BORRADOR',
  `checklist_version` varchar(20) NOT NULL,
  `visit_date` date NOT NULL,
  `calves` int(11) NOT NULL,
  `young` int(11) NOT NULL,
  `adults` int(11) NOT NULL,
  `producer_type` varchar(10) NOT NULL,
  `sample_size` int(11) DEFAULT NULL,
  `general_observation` text DEFAULT NULL,
  `score` decimal(3,2) DEFAULT NULL,
  `level` varchar(10) DEFAULT NULL,
  `results` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`results`)),
  `last_saved_at` datetime(3) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `IDX_28e3fc601f45b638714b8410aa` (`farm_id`,`created_at`),
  KEY `FK_ae6ae93889187023b727df8dac1` (`species_id`),
  KEY `FK_04b7768cb02bd4bfd08d3d37e3d` (`evaluator_id`),
  CONSTRAINT `FK_04b7768cb02bd4bfd08d3d37e3d` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_ae6ae93889187023b727df8dac1` FOREIGN KEY (`species_id`) REFERENCES `species` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_df13bbe068f3fe05895cfb4cba7` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `farm_species` (
  `id` uuid NOT NULL,
  `species_id` uuid NOT NULL,
  `calves` int(11) NOT NULL DEFAULT 0,
  `young` int(11) NOT NULL DEFAULT 0,
  `adults` int(11) NOT NULL DEFAULT 0,
  `farm_id` uuid NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_785f574c4fde55f4bd1c7d3c8e` (`farm_id`,`species_id`),
  KEY `FK_390cf2e83967f655b61b047f52e` (`species_id`),
  CONSTRAINT `FK_390cf2e83967f655b61b047f52e` FOREIGN KEY (`species_id`) REFERENCES `species` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_59a75f5501f3b35272812f7a299` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `farms` (
  `id` uuid NOT NULL,
  `name` varchar(120) NOT NULL,
  `owner_name` varchar(160) NOT NULL,
  `owner_document` varchar(20) DEFAULT NULL,
  `owner_phone` varchar(20) NOT NULL,
  `owner_email` varchar(160) DEFAULT NULL,
  `owner_user_id` uuid DEFAULT NULL,
  `department` varchar(80) NOT NULL,
  `municipality` varchar(80) NOT NULL,
  `vereda` varchar(120) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `area_hectares` decimal(10,2) DEFAULT NULL,
  `production_system` varchar(80) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` uuid NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `IDX_875a28c6cf6e348fc49b3cf87c` (`name`),
  KEY `IDX_6278572a18366cbc04e1c4ebd9` (`owner_email`),
  KEY `FK_a5b0ea6ebf8fcd0ab879b7bb15b` (`owner_user_id`),
  KEY `FK_de01b73953046906ea45b09ca6c` (`created_by`),
  CONSTRAINT `FK_a5b0ea6ebf8fcd0ab879b7bb15b` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_de01b73953046906ea45b09ca6c` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `id` uuid NOT NULL,
  `user_id` uuid NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_91185d86d5d7557b19abbb2868` (`token_hash`),
  KEY `FK_52ac39dd8a28730c63aeb428c9c` (`user_id`),
  CONSTRAINT `FK_52ac39dd8a28730c63aeb428c9c` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recommendations` (
  `id` uuid NOT NULL,
  `evaluation_id` uuid NOT NULL,
  `source` varchar(10) NOT NULL,
  `model` varchar(60) DEFAULT NULL,
  `summary` text NOT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `FK_9411741c2ffc460d3e84862f6e9` (`evaluation_id`),
  CONSTRAINT `FK_9411741c2ffc460d3e84862f6e9` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reports` (
  `id` uuid NOT NULL,
  `evaluation_id` uuid NOT NULL,
  `kind` varchar(12) NOT NULL,
  `file_name` varchar(160) NOT NULL,
  `size_bytes` int(11) NOT NULL,
  `content` longblob NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `FK_ab0327734e91cb32aeaa0051441` (`evaluation_id`),
  CONSTRAINT `FK_ab0327734e91cb32aeaa0051441` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `roles` (
  `id` uuid NOT NULL,
  `code` varchar(40) NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `permissions` text NOT NULL,
  `is_system` tinyint(4) NOT NULL DEFAULT 0,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_f6d54f95c31b73fb1bdd8e91d0` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `species` (
  `id` uuid NOT NULL,
  `code` varchar(30) NOT NULL,
  `name` varchar(80) NOT NULL,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_068d559281b77da1a564fcc778` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` uuid NOT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) NOT NULL,
  `email` varchar(160) NOT NULL,
  `document_number` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(100) NOT NULL,
  `role_id` uuid NOT NULL,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` datetime(3) DEFAULT NULL,
  `last_login_at` datetime(3) DEFAULT NULL,
  `password_changed_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  KEY `FK_a2cecd1a3531c0b041e29ba46e1` (`role_id`),
  CONSTRAINT `FK_a2cecd1a3531c0b041e29ba46e1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
