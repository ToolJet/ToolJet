import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoRelationIdToAppEntities1763549159927 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // missing modules
        const tables = [
            'components',
            'pages',
            'data_queries',
            'data_sources',
            'data_source_options',
            'internal_tables',
            'app_versions',
            'event_handlers',
            'layouts'
        ];

        for (const table of tables) {
            await queryRunner.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "co_relation_id" uuid DEFAULT NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            'components',
            'pages',
            'data_queries',
            'data_sources',
            'data_source_options',
            'internal_tables',
            'app_versions',
            'event_handlers',
            'layouts'
        ];

        for (const table of tables) {
            await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "co_relation_id"`);
        }
    }

}
