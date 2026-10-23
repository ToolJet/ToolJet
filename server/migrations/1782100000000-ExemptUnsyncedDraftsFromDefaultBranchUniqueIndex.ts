import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `AddDefaultBranchDraftUniquePerApp` (1779200000000) enforces at most one DRAFT
 * VERSION row per (app_id, branch_id) via two partial indexes split on is_stub,
 * with no exception for unsynced apps.
 *
 * Unsynced apps (isSynced=false — never pushed to git) are now allowed to hold
 * multiple DRAFT versions at once (see `createVersion` in versions/util.service.ts,
 * which now permits this for unsynced apps only). Those rows still carry a
 * non-null branch_id (set during the original git-sync backfill), so without this
 * change the partial unique index would reject the second/third unsynced draft
 * insert with a raw DB constraint violation instead of the intended behavior.
 *
 * The single-draft invariant applies regardless of stub status — we only ever
 * want one DRAFT per (app_id, branch_id), stub or not — so the two indexes
 * collapse into one without the is_stub split. Scoping it to `is_synced = TRUE`
 * keeps the single-draft invariant for synced apps (git sync's normal operating
 * mode) while exempting unsynced apps entirely — matching the pre-git-sync
 * workspace behavior.
 */
export class ExemptUnsyncedDraftsFromDefaultBranchUniqueIndex1782100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "app_versions_app_default_branch_draft_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "app_versions_app_default_branch_draft_unique_ensure_single_stub"`);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "app_versions_app_default_branch_draft_unique"
      ON app_versions (app_id, branch_id)
      WHERE status = 'DRAFT'
        AND version_type = 'version'
        AND branch_id IS NOT NULL
        AND is_synced = TRUE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "app_versions_app_default_branch_draft_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "app_versions_app_default_branch_draft_unique_ensure_single_stub"`);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "app_versions_app_default_branch_draft_unique"
      ON app_versions (app_id, branch_id)
      WHERE status = 'DRAFT'
        AND version_type = 'version'
        AND is_stub = FALSE
        AND branch_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "app_versions_app_default_branch_draft_unique_ensure_single_stub"
      ON app_versions (app_id, branch_id)
      WHERE status = 'DRAFT'
        AND version_type = 'version'
        AND is_stub = TRUE
        AND branch_id IS NOT NULL
    `);
  }
}
