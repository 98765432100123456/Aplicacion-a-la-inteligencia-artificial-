import { MigrationInterface, QueryRunner } from "typeorm";

export class EsquemaSeguridad1793109976277 implements MigrationInterface {
    name = 'EsquemaSeguridad1793109976277'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` uuid NOT NULL, \`code\` varchar(40) NOT NULL, \`name\` varchar(80) NOT NULL, \`description\` varchar(255) NULL, \`permissions\` text NOT NULL, \`is_system\` tinyint NOT NULL DEFAULT 0, \`active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` uuid NOT NULL, \`first_name\` varchar(80) NOT NULL, \`last_name\` varchar(80) NOT NULL, \`email\` varchar(160) NOT NULL, \`document_number\` varchar(20) NULL, \`phone\` varchar(20) NULL, \`password_hash\` varchar(100) NOT NULL, \`role_id\` uuid NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`failed_login_attempts\` int NOT NULL DEFAULT '0', \`locked_until\` datetime(3) NULL, \`last_login_at\` datetime(3) NULL, \`password_changed_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`audit_logs\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`actor_id\` uuid NULL, \`action\` varchar(60) NOT NULL, \`entity\` varchar(40) NOT NULL, \`entity_id\` varchar(60) NULL, \`detail\` json NULL, \`ip\` varchar(64) NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_177183f29f438c488b5e8510cd\` (\`actor_id\`), INDEX \`IDX_2cd10fda8276bb995288acfbfb\` (\`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`password_reset_tokens\` (\`id\` uuid NOT NULL, \`user_id\` uuid NOT NULL, \`token_hash\` varchar(64) NOT NULL, \`expires_at\` datetime(3) NOT NULL, \`used_at\` datetime(3) NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_91185d86d5d7557b19abbb2868\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`password_reset_tokens\` ADD CONSTRAINT \`FK_52ac39dd8a28730c63aeb428c9c\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`password_reset_tokens\` DROP FOREIGN KEY \`FK_52ac39dd8a28730c63aeb428c9c\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``);
        await queryRunner.query(`DROP INDEX \`IDX_91185d86d5d7557b19abbb2868\` ON \`password_reset_tokens\``);
        await queryRunner.query(`DROP TABLE \`password_reset_tokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_2cd10fda8276bb995288acfbfb\` ON \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_177183f29f438c488b5e8510cd\` ON \`audit_logs\``);
        await queryRunner.query(`DROP TABLE \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
    }

}
