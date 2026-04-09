import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionTypeColumn1761828800001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE app_version_type AS ENUM ('version', 'branch')
        `);

        await queryRunner.query(`
            ALTER TABLE "app_versions"
            ADD COLUMN "version_type" app_version_type NOT NULL DEFAULT 'version'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_versions" 
            DROP COLUMN IF EXISTS "version_type"
        `);
        await queryRunner.query(`
            DROP TYPE IF EXISTS app_version_type
        `);
    }
}