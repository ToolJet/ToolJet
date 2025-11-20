import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoRelationIdToAppEntities1763549159927 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // missing modules and events
        const tables = [
            'apps',
            'components',
            'pages',
            'data_queries',
            'data_sources',
            'app_versions',
            'data_source_options',
            'internal_tables',
        ];

        for(const table of tables){
            await queryRunner.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "co_relation_id" uuid DEFAULT NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            'apps',
            'components',
            'pages',
            'queries',
            'data_sources',
            'versions',
            'data_source_options',
            'internal_tables',
        ];

        for (const table of tables) {
        await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "co_relation_id"`);
        }
    }

}
