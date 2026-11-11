import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * folder_apps rows created while gitsync was OFF — and every pre-branch-column row,
 * workflows included — carry branch_id = NULL. Since EnsureDefaultBranchForAllOrganizations
 * (1781740800000) every org has a default branch, and app_versions was backfilled onto it
 * (1781741000000 / 1782400000000), but folder_apps was never re-backfilled. The
 * branch-filtered read path (branch_id = :defaultBranch) therefore can no longer see these
 * NULL rows, silently dropping the folder<->app relation once a default branch exists.
 *
 * Fix, mirroring where app_versions ended up: promote every NULL row onto the org's default
 * branch, then make branch_id mandatory. Unlike app_versions there is NO workflow exemption —
 * workflows are pinned to the default branch too — so a plain column-level NOT NULL is correct.
 */
export class BackfillFolderAppsDefaultBranchIdAndEnforceNotNull1785700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Step 1: Promote branchless rows to the org's default branch. Guarded by NOT EXISTS so we
    // never create a duplicate (app_id, default_branch) pair — that would trip
    // uniq_folder_apps_app_branch (app_id, branch_id) WHERE branch_id IS NOT NULL. folder_id is
    // preserved so the folder mapping survives. All app types are included (workflows too).
    await queryRunner.query(`
      UPDATE folder_apps fa
      SET branch_id = wb.id, updated_at = now()
      FROM folders f
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = f.organization_id AND wb.is_default = true
      WHERE fa.folder_id = f.id
        AND fa.branch_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM folder_apps existing
          WHERE existing.app_id = fa.app_id
            AND existing.branch_id = wb.id
        )
    `);

    // Step 2: Delete any branchless rows that could not be promoted (the app is already mapped on
    // the default branch, in some folder) — they are stale duplicates the branch-scoped row wins
    // over. Guarded on the org actually having a default branch so an org somehow missing one
    // keeps its rows and surfaces the problem loudly at Step 3 instead of losing data here.
    await queryRunner.query(`
      DELETE FROM folder_apps fa
      USING folders f
      WHERE fa.folder_id = f.id
        AND fa.branch_id IS NULL
        AND EXISTS (
          SELECT 1 FROM organization_git_sync_branches wb
          WHERE wb.organization_id = f.organization_id AND wb.is_default = true
        )
    `);

    // Step 3: branch_id is now populated for every row (every org has a default branch), so make
    // it mandatory. A plain NOT NULL (no exemption trigger) — workflows are branched onto the
    // default branch just like front-end apps and modules.
    await queryRunner.query(`ALTER TABLE folder_apps ALTER COLUMN branch_id SET NOT NULL`);

    // Step 4: The partial index enforcing one folder per app for the NULL-branch convention can
    // never match a row again — drop it. uniq_folder_apps_app_branch continues to enforce one
    // folder per app per branch for every row.
    await queryRunner.query(`DROP INDEX IF EXISTS uniq_folder_apps_app_no_branch`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Structural revert only. Backfilled branch_id values are indistinguishable from natively
    // branched rows, so they are not re-nulled — matching the app_versions data-migration
    // convention (1782400000000).
    await queryRunner.query(`ALTER TABLE folder_apps ALTER COLUMN branch_id DROP NOT NULL`);

    // Restore the NULL-branch partial unique index (one folder per app for the NULL key).
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_folder_apps_app_no_branch
        ON folder_apps (app_id)
        WHERE branch_id IS NULL
    `);
  }
}
