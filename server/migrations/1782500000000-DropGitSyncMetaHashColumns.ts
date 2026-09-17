import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Git-sync no longer stores `.meta/*.json` manifests in the repo, so the
 * meta-hash / content-hash change-detection columns they fed are now dead:
 *   - organization_git_sync_branches.app_meta_hash / module_meta_hash / data_source_meta_hash
 *     (sha256 of the whole appMeta.json / moduleMeta.json / dataSourceMeta.json,
 *     used for the "skip entire pull" optimization — dropped along with meta).
 *   - data_source_versions.meta_timestamp (misnamed: held a truncated sha256 of
 *     the DS's git JSON for per-DS pull dedup — datasources are now deserialized
 *     idempotently every pull, so it is unused).
 *
 * Change detection is now git-native: apps/modules carry an `updatedAt` inside
 * `app/app.json` compared against app_versions.remote_updated_at.
 *
 * down() re-adds the columns (nullable, no backfill) — matching this migration
 * family's convention of not reverting data on rollback.
 */
export class DropGitSyncMetaHashColumns1782500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches DROP COLUMN IF EXISTS app_meta_hash`);
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches DROP COLUMN IF EXISTS module_meta_hash`);
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches DROP COLUMN IF EXISTS data_source_meta_hash`);
    await queryRunner.query(`ALTER TABLE data_source_versions DROP COLUMN IF EXISTS meta_timestamp`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches ADD COLUMN IF NOT EXISTS app_meta_hash VARCHAR(64)`);
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches ADD COLUMN IF NOT EXISTS module_meta_hash VARCHAR(64)`);
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches ADD COLUMN IF NOT EXISTS data_source_meta_hash VARCHAR(64)`);
    await queryRunner.query(
      `ALTER TABLE data_source_versions ADD COLUMN IF NOT EXISTS meta_timestamp NUMERIC(15) DEFAULT NULL`
    );
  }
}
