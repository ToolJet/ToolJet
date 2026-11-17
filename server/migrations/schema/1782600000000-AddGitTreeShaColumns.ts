import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Git-native change detection for git-sync, using git's own tree SHAs (a tree
 * object's SHA changes iff anything beneath it changed — a free, per-folder
 * content hash). Three levels of skip:
 *
 *   organization_git_sync_branches
 *     - last_synced_commit          → branch HEAD (git ls-remote); equal ⇒ skip the whole pull, no clone
 *     - apps_git_tree_sha           → tree SHA of apps/;          equal ⇒ skip all apps
 *     - modules_git_tree_sha        → tree SHA of modules/;       equal ⇒ skip all modules
 *     - data_sources_git_tree_sha   → tree SHA of data-sources/;  equal ⇒ skip all datasources
 *
 *   app_versions.git_tree_sha        → tree SHA of apps/<app>/;   equal ⇒ skip that app
 *   data_source_versions.git_tree_sha→ tree SHA of data-sources/<ds>/; equal ⇒ skip that datasource
 *
 * Each token is written only after the matching import succeeds (per-resource
 * inside the import transaction; category/commit only when that whole level had
 * zero errors), so a failure leaves the old value and the next pull retries.
 *
 * Replaces the interim data_source_versions.git_content_hash (an in-process
 * sha256) with git's tree SHA for a single, uniform mechanism. down() reverses.
 */
export class AddGitTreeShaColumns1782600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Per-resource tokens.
    await queryRunner.query(`ALTER TABLE data_source_versions DROP COLUMN IF EXISTS git_content_hash`);
    await queryRunner.query(
      `ALTER TABLE data_source_versions ADD COLUMN IF NOT EXISTS git_tree_sha VARCHAR(64) DEFAULT NULL`
    );
    await queryRunner.query(`ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS git_tree_sha VARCHAR(64) DEFAULT NULL`);

    // Branch-level tokens.
    await queryRunner.query(
      `ALTER TABLE organization_git_sync_branches ADD COLUMN IF NOT EXISTS last_synced_commit VARCHAR(64) DEFAULT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE organization_git_sync_branches ADD COLUMN IF NOT EXISTS apps_git_tree_sha VARCHAR(64) DEFAULT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE organization_git_sync_branches ADD COLUMN IF NOT EXISTS modules_git_tree_sha VARCHAR(64) DEFAULT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE organization_git_sync_branches ADD COLUMN IF NOT EXISTS data_sources_git_tree_sha VARCHAR(64) DEFAULT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE organization_git_sync_branches DROP COLUMN IF EXISTS data_sources_git_tree_sha`
    );
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches DROP COLUMN IF EXISTS modules_git_tree_sha`);
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches DROP COLUMN IF EXISTS apps_git_tree_sha`);
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches DROP COLUMN IF EXISTS last_synced_commit`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS git_tree_sha`);
    await queryRunner.query(`ALTER TABLE data_source_versions DROP COLUMN IF EXISTS git_tree_sha`);
  }
}
