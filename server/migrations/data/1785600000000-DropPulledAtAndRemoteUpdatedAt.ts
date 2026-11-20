import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'DropPulledAtAndRemoteUpdatedAt1785600000000';

/**
 * Drops the timestamp-based git-sync change-tracking columns:
 *   - app_versions.remote_updated_at
 *   - app_versions.pulled_at
 *   - data_source_versions.pulled_at
 *
 * These powered the old lazy-hydration staleness gate (remote_updated_at > pulled_at).
 * Change detection is now driven entirely by git_tree_sha: pull classifies a version
 * as outdated when its stored git_tree_sha differs from git's current tree SHA, and the
 * app-open path re-hydrates by comparing the freshly-cloned tree SHA against the stored
 * one. data_source_versions.pulled_at was write-only (never read) — pure dead weight.
 *
 * Runs as a DATA migration (after all schema migrations, and after the earlier
 * data migrations that still reference pulled_at — e.g. CleanupStaleDraftVersions),
 * so those columns are guaranteed to exist while every migration that reads them runs.
 */
export class DropPulledAtAndRemoteUpdatedAt1785600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`${MIGRATION_NAME}: [START] Dropping pulled_at / remote_updated_at columns`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS remote_updated_at`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS pulled_at`);
    await queryRunner.query(`ALTER TABLE data_source_versions DROP COLUMN IF EXISTS pulled_at`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Columns dropped`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS pulled_at TIMESTAMP DEFAULT NULL`);
    await queryRunner.query(
      `ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS remote_updated_at TIMESTAMP DEFAULT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE data_source_versions ADD COLUMN IF NOT EXISTS pulled_at TIMESTAMP DEFAULT NULL`
    );
  }
}
