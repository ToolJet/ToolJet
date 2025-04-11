import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGlobalDataSources1743058812003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Set app_version_id to NULL for existing global data sources
    await queryRunner.query(`
        UPDATE data_sources
        SET app_version_id = NULL
        WHERE scope = 'global'
      `);

    // Step 2: Add a check constraint to ensure app_version_id is NULL for global data sources
    await queryRunner.query(`
        ALTER TABLE data_sources
        ADD CONSTRAINT chk_global_data_source_app_version_id
        CHECK (scope != 'global' OR app_version_id IS NULL)
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
