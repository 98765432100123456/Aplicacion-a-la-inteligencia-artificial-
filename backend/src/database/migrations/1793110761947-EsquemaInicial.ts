import { MigrationInterface, QueryRunner } from "typeorm";

export class EsquemaInicial1793110761947 implements MigrationInterface {
    name = 'EsquemaInicial1793110761947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` uuid NOT NULL, \`code\` varchar(40) NOT NULL, \`name\` varchar(80) NOT NULL, \`description\` varchar(255) NULL, \`permissions\` text NOT NULL, \`is_system\` tinyint NOT NULL DEFAULT 0, \`active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), UNIQUE INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` uuid NOT NULL, \`first_name\` varchar(80) NOT NULL, \`last_name\` varchar(80) NOT NULL, \`email\` varchar(160) NOT NULL, \`document_number\` varchar(20) NULL, \`phone\` varchar(20) NULL, \`password_hash\` varchar(100) NOT NULL, \`role_id\` uuid NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`failed_login_attempts\` int NOT NULL DEFAULT '0', \`locked_until\` datetime(3) NULL, \`last_login_at\` datetime(3) NULL, \`password_changed_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`species\` (\`id\` uuid NOT NULL, \`code\` varchar(30) NOT NULL, \`name\` varchar(80) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_068d559281b77da1a564fcc778\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`farm_species\` (\`id\` uuid NOT NULL, \`species_id\` uuid NOT NULL, \`calves\` int NOT NULL DEFAULT '0', \`young\` int NOT NULL DEFAULT '0', \`adults\` int NOT NULL DEFAULT '0', \`farm_id\` uuid NOT NULL, UNIQUE INDEX \`IDX_785f574c4fde55f4bd1c7d3c8e\` (\`farm_id\`, \`species_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`farms\` (\`id\` uuid NOT NULL, \`name\` varchar(120) NOT NULL, \`owner_name\` varchar(160) NOT NULL, \`owner_document\` varchar(20) NULL, \`owner_phone\` varchar(20) NOT NULL, \`owner_email\` varchar(160) NULL, \`owner_user_id\` uuid NULL, \`department\` varchar(80) NOT NULL, \`municipality\` varchar(80) NOT NULL, \`vereda\` varchar(120) NULL, \`address\` varchar(200) NULL, \`latitude\` decimal(9,6) NULL, \`longitude\` decimal(9,6) NULL, \`area_hectares\` decimal(10,2) NULL, \`production_system\` varchar(80) NULL, \`notes\` text NULL, \`created_by\` uuid NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), INDEX \`IDX_875a28c6cf6e348fc49b3cf87c\` (\`name\`), INDEX \`IDX_6278572a18366cbc04e1c4ebd9\` (\`owner_email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`evaluation_answers\` (\`id\` uuid NOT NULL, \`indicator_code\` varchar(10) NOT NULL, \`indicator_text\` varchar(300) NOT NULL, \`freedom\` varchar(20) NOT NULL, \`answer\` varchar(12) NOT NULL, \`observation\` text NULL, \`evaluation_id\` uuid NOT NULL, UNIQUE INDEX \`IDX_2de4e3f10997aa0dab93baa546\` (\`evaluation_id\`, \`indicator_code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`evaluations\` (\`id\` uuid NOT NULL, \`farm_id\` uuid NOT NULL, \`species_id\` uuid NOT NULL, \`evaluator_id\` uuid NOT NULL, \`status\` varchar(12) NOT NULL DEFAULT 'BORRADOR', \`checklist_version\` varchar(20) NOT NULL, \`visit_date\` date NOT NULL, \`calves\` int NOT NULL, \`young\` int NOT NULL, \`adults\` int NOT NULL, \`producer_type\` varchar(10) NOT NULL, \`sample_size\` int NULL, \`general_observation\` text NULL, \`score\` decimal(3,2) NULL, \`level\` varchar(10) NULL, \`results\` json NULL, \`last_saved_at\` datetime(3) NOT NULL, \`finished_at\` datetime(3) NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), INDEX \`IDX_28e3fc601f45b638714b8410aa\` (\`farm_id\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`reports\` (\`id\` uuid NOT NULL, \`evaluation_id\` uuid NOT NULL, \`kind\` varchar(12) NOT NULL, \`file_name\` varchar(160) NOT NULL, \`size_bytes\` int NOT NULL, \`content\` longblob NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`recommendations\` (\`id\` uuid NOT NULL, \`evaluation_id\` uuid NOT NULL, \`source\` varchar(10) NOT NULL, \`model\` varchar(60) NULL, \`summary\` text NOT NULL, \`items\` json NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`password_reset_tokens\` (\`id\` uuid NOT NULL, \`user_id\` uuid NOT NULL, \`token_hash\` varchar(64) NOT NULL, \`expires_at\` datetime(3) NOT NULL, \`used_at\` datetime(3) NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE INDEX \`IDX_91185d86d5d7557b19abbb2868\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`audit_logs\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`actor_id\` uuid NULL, \`action\` varchar(60) NOT NULL, \`entity\` varchar(40) NOT NULL, \`entity_id\` varchar(60) NULL, \`detail\` json NULL, \`ip\` varchar(64) NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), INDEX \`IDX_177183f29f438c488b5e8510cd\` (\`actor_id\`), INDEX \`IDX_2cd10fda8276bb995288acfbfb\` (\`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`farm_species\` ADD CONSTRAINT \`FK_59a75f5501f3b35272812f7a299\` FOREIGN KEY (\`farm_id\`) REFERENCES \`farms\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`farm_species\` ADD CONSTRAINT \`FK_390cf2e83967f655b61b047f52e\` FOREIGN KEY (\`species_id\`) REFERENCES \`species\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`farms\` ADD CONSTRAINT \`FK_a5b0ea6ebf8fcd0ab879b7bb15b\` FOREIGN KEY (\`owner_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`farms\` ADD CONSTRAINT \`FK_de01b73953046906ea45b09ca6c\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`evaluation_answers\` ADD CONSTRAINT \`FK_d5faf0767edf0dda1fc366eeb82\` FOREIGN KEY (\`evaluation_id\`) REFERENCES \`evaluations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`evaluations\` ADD CONSTRAINT \`FK_df13bbe068f3fe05895cfb4cba7\` FOREIGN KEY (\`farm_id\`) REFERENCES \`farms\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`evaluations\` ADD CONSTRAINT \`FK_ae6ae93889187023b727df8dac1\` FOREIGN KEY (\`species_id\`) REFERENCES \`species\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`evaluations\` ADD CONSTRAINT \`FK_04b7768cb02bd4bfd08d3d37e3d\` FOREIGN KEY (\`evaluator_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reports\` ADD CONSTRAINT \`FK_ab0327734e91cb32aeaa0051441\` FOREIGN KEY (\`evaluation_id\`) REFERENCES \`evaluations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`recommendations\` ADD CONSTRAINT \`FK_9411741c2ffc460d3e84862f6e9\` FOREIGN KEY (\`evaluation_id\`) REFERENCES \`evaluations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`password_reset_tokens\` ADD CONSTRAINT \`FK_52ac39dd8a28730c63aeb428c9c\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`password_reset_tokens\` DROP FOREIGN KEY \`FK_52ac39dd8a28730c63aeb428c9c\``);
        await queryRunner.query(`ALTER TABLE \`recommendations\` DROP FOREIGN KEY \`FK_9411741c2ffc460d3e84862f6e9\``);
        await queryRunner.query(`ALTER TABLE \`reports\` DROP FOREIGN KEY \`FK_ab0327734e91cb32aeaa0051441\``);
        await queryRunner.query(`ALTER TABLE \`evaluations\` DROP FOREIGN KEY \`FK_04b7768cb02bd4bfd08d3d37e3d\``);
        await queryRunner.query(`ALTER TABLE \`evaluations\` DROP FOREIGN KEY \`FK_ae6ae93889187023b727df8dac1\``);
        await queryRunner.query(`ALTER TABLE \`evaluations\` DROP FOREIGN KEY \`FK_df13bbe068f3fe05895cfb4cba7\``);
        await queryRunner.query(`ALTER TABLE \`evaluation_answers\` DROP FOREIGN KEY \`FK_d5faf0767edf0dda1fc366eeb82\``);
        await queryRunner.query(`ALTER TABLE \`farms\` DROP FOREIGN KEY \`FK_de01b73953046906ea45b09ca6c\``);
        await queryRunner.query(`ALTER TABLE \`farms\` DROP FOREIGN KEY \`FK_a5b0ea6ebf8fcd0ab879b7bb15b\``);
        await queryRunner.query(`ALTER TABLE \`farm_species\` DROP FOREIGN KEY \`FK_390cf2e83967f655b61b047f52e\``);
        await queryRunner.query(`ALTER TABLE \`farm_species\` DROP FOREIGN KEY \`FK_59a75f5501f3b35272812f7a299\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``);
        await queryRunner.query(`DROP INDEX \`IDX_2cd10fda8276bb995288acfbfb\` ON \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_177183f29f438c488b5e8510cd\` ON \`audit_logs\``);
        await queryRunner.query(`DROP TABLE \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_91185d86d5d7557b19abbb2868\` ON \`password_reset_tokens\``);
        await queryRunner.query(`DROP TABLE \`password_reset_tokens\``);
        await queryRunner.query(`DROP TABLE \`recommendations\``);
        await queryRunner.query(`DROP TABLE \`reports\``);
        await queryRunner.query(`DROP INDEX \`IDX_28e3fc601f45b638714b8410aa\` ON \`evaluations\``);
        await queryRunner.query(`DROP TABLE \`evaluations\``);
        await queryRunner.query(`DROP INDEX \`IDX_2de4e3f10997aa0dab93baa546\` ON \`evaluation_answers\``);
        await queryRunner.query(`DROP TABLE \`evaluation_answers\``);
        await queryRunner.query(`DROP INDEX \`IDX_6278572a18366cbc04e1c4ebd9\` ON \`farms\``);
        await queryRunner.query(`DROP INDEX \`IDX_875a28c6cf6e348fc49b3cf87c\` ON \`farms\``);
        await queryRunner.query(`DROP TABLE \`farms\``);
        await queryRunner.query(`DROP INDEX \`IDX_785f574c4fde55f4bd1c7d3c8e\` ON \`farm_species\``);
        await queryRunner.query(`DROP TABLE \`farm_species\``);
        await queryRunner.query(`DROP INDEX \`IDX_068d559281b77da1a564fcc778\` ON \`species\``);
        await queryRunner.query(`DROP TABLE \`species\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
    }

}
