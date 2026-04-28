import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAppVersionIdFromDataSourceVersions1776600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM data_source_versions
      WHERE is_default = false
        AND branch_id IS NULL
        AND app_version_id IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE data_source_versions DROP CONSTRAINT IF EXISTS fk_data_source_versions_app_version_id
    `);

    await queryRunner.query(`
      ALTER TABLE data_source_versions DROP COLUMN IF EXISTS app_version_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE data_source_versions ADD COLUMN IF NOT EXISTS app_version_id uuid
    `);

    await queryRunner.query(`
      ALTER TABLE data_source_versions
        ADD CONSTRAINT fk_data_source_versions_app_version_id
        FOREIGN KEY (app_version_id) REFERENCES app_versions(id) ON DELETE CASCADE
    `);
  }
}
