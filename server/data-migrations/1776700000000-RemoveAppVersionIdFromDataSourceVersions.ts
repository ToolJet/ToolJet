import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAppVersionIdFromDataSourceVersions1776700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete legacy version-scoped DSVs (non-default, branchless rows tied to an app_version).
    // These were created by 1773229180000-SeedDefaultDataSourceVersionsForAll for non-branch
    // app versions. With workspace-branch DSVs now in place, version-scoped DSVs are obsolete.
    await queryRunner.query(`
      DELETE FROM data_source_versions
      WHERE is_default = false
        AND branch_id IS NULL
        AND app_version_id IS NOT NULL
    `);

    // Drop the column. CASCADE removes the auto-generated FK to app_versions.
    await queryRunner.query(`
      ALTER TABLE data_source_versions DROP COLUMN IF EXISTS app_version_id CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        ADD COLUMN IF NOT EXISTS app_version_id UUID REFERENCES app_versions(id) ON DELETE CASCADE
    `);
  }
}
