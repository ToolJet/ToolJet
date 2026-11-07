import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'ClearGitSyncStateForUnconfiguredOrgs1786900000000';

/**
 * Clears residual git-sync SYNC STATE (is_synced / git_tree_sha) from resources whose
 * organization has NO git-sync configuration.
 *
 * Why this is needed:
 *   The consolidated branch-model setup wipes git-sync CONFIG (organization_git_sync +
 *   providers) on the lts/fresh path so customers reconfigure from scratch. But it also
 *   backfills branch_id onto EVERY app_versions / data_source_versions row, and the kept
 *   migration MakeAppVersionBranchIdNotNullAndGitSyncFlags (1781741000000) does
 *   `SET is_synced = true WHERE branch_id IS NOT NULL` — so every row ends up flagged
 *   is_synced=true even though nothing is actually synced to a repo anymore.
 *
 *   That stale flag is harmful after the customer RECONFIGURES git sync: the first pull
 *   treats an is_synced resource that is absent from the (fresh, empty) repo as
 *   deleted-on-remote and DEACTIVATES it (data_source_versions.is_active=false / app
 *   version detach) — i.e. "all data sources disappear from the workspace".
 *
 * Semantics: a resource can only be "synced" if its org has git configured. Scoping the
 * reset to orgs WITHOUT an organization_git_sync row is therefore correct for both paths:
 *   - lts/fresh upgrade (config wiped): every org qualifies → all flags cleared.
 *   - beta/main (config preserved): orgs with real git config are untouched; only orgs
 *     that genuinely have no git config are cleaned.
 *
 * Runs after the is_synced backfills (1781741000000 / 1785800000000) by timestamp order.
 */
export class ClearGitSyncStateForUnconfiguredOrgs1786900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);
    console.log(`${MIGRATION_NAME}: [START] Clearing residual git-sync state for orgs without git config.`);

    const [, avCleared] = await queryRunner.query(`
      UPDATE app_versions av
      SET is_synced = false, git_tree_sha = NULL
      FROM apps a
      WHERE av.app_id = a.id
        AND NOT EXISTS (
          SELECT 1 FROM organization_git_sync ogs WHERE ogs.organization_id = a.organization_id
        )
        AND (av.is_synced = true OR av.git_tree_sha IS NOT NULL)
    `);
    console.log(`${MIGRATION_NAME}: [PROGRESS] Reset is_synced/git_tree_sha on ${avCleared ?? 0} app_versions.`);

    const [, dsvCleared] = await queryRunner.query(`
      UPDATE data_source_versions dsv
      SET is_synced = false, git_tree_sha = NULL
      FROM data_sources ds
      WHERE dsv.data_source_id = ds.id
        AND NOT EXISTS (
          SELECT 1 FROM organization_git_sync ogs WHERE ogs.organization_id = ds.organization_id
        )
        AND (dsv.is_synced = true OR dsv.git_tree_sha IS NOT NULL)
    `);
    console.log(
      `${MIGRATION_NAME}: [PROGRESS] Reset is_synced/git_tree_sha on ${dsvCleared ?? 0} data_source_versions.`
    );

    // Branch-level tree-sha caches are meaningless without git config either.
    await queryRunner.query(`
      UPDATE organization_git_sync_branches b
      SET last_synced_commit = NULL, apps_git_tree_sha = NULL, modules_git_tree_sha = NULL, data_sources_git_tree_sha = NULL
      WHERE NOT EXISTS (
        SELECT 1 FROM organization_git_sync ogs WHERE ogs.organization_id = b.organization_id
      )
        AND (b.last_synced_commit IS NOT NULL OR b.apps_git_tree_sha IS NOT NULL
             OR b.modules_git_tree_sha IS NOT NULL OR b.data_sources_git_tree_sha IS NOT NULL)
    `);

    console.log(`${MIGRATION_NAME}: [SUCCESS] Residual git-sync state cleared.`);
  }

  public async down(): Promise<void> {
    // Irreversible: the original is_synced/tree-sha values reflected a git state that no
    // longer exists (config wiped). Nothing to restore.
  }
}
