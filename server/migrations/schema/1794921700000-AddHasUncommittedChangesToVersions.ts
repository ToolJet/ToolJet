import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Marks app and data source versions edited since their last git push. Defaults to false, so
 * existing versions read as "no uncommitted changes". IF NOT EXISTS because this migration was
 * first named AddHasUncommittedChangesToVersions1789000000000, and a database that already ran
 * it under that name runs it again under this one.
 */
export class AddHasUncommittedChangesToVersions1794921700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS has_uncommitted_changes BOOLEAN NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE data_source_versions ADD COLUMN IF NOT EXISTS has_uncommitted_changes BOOLEAN NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS has_uncommitted_changes`);
    await queryRunner.query(`ALTER TABLE data_source_versions DROP COLUMN IF EXISTS has_uncommitted_changes`);
  }
}
