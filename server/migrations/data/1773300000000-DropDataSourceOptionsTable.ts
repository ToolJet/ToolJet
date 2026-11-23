import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDataSourceOptionsTable1773300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // All data has been migrated to data_source_version_options via the seed migration.
    // All application code now reads/writes exclusively from data_source_version_options.
    await queryRunner.query(`DROP TABLE IF EXISTS "data_source_options" CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "data_source_options" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "data_source_id" uuid NOT NULL,
        "environment_id" uuid NOT NULL,
        "options" jsonb DEFAULT '{}',
        "co_relation_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_source_options" PRIMARY KEY ("id"),
        CONSTRAINT "FK_data_source_options_data_source" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_data_source_options_environment" FOREIGN KEY ("environment_id") REFERENCES "app_environments"("id") ON DELETE CASCADE
      )
    `);
  }
}
