// migration-lint: allow-destructive app_version_scans is created by 1792460000000 in the same unreleased Code mode line, so no released code writes 'external'
import { MigrationInterface, QueryRunner } from 'typeorm';

// Uploaded CI results are called what they are: "ci" replaces "external" as a scan source.
export class AddCiScanSource1793600000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app_version_scans DROP CONSTRAINT IF EXISTS app_version_scans_source_check');
    await queryRunner.query("UPDATE app_version_scans SET source = 'ci' WHERE source = 'external'");
    await queryRunner.query(`
      ALTER TABLE app_version_scans ADD CONSTRAINT app_version_scans_source_check
        CHECK (source IN ('builder', 'dev', 'publish', 'ci', 'production'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app_version_scans DROP CONSTRAINT IF EXISTS app_version_scans_source_check');
    await queryRunner.query("UPDATE app_version_scans SET source = 'external' WHERE source = 'ci'");
    await queryRunner.query(`
      ALTER TABLE app_version_scans ADD CONSTRAINT app_version_scans_source_check
        CHECK (source IN ('builder', 'dev', 'publish', 'external', 'production'))
    `);
  }
}
