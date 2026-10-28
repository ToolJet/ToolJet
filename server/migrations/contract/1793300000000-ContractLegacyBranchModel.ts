import { MigrationInterface, QueryRunner } from 'typeorm';
import { setNotNull, withShortLock } from '../../src/migration-helpers/with-short-lock'; // migration-import-allowed: contract steps must go through the short-lock helper
import { branchlessRowFixes } from '../../src/migration-helpers/legacy-upgrade'; // migration-import-allowed: reruns the legacy backfills' own branch fixes
import { MakeDataSourceVersionBranchIdNotNullAndDropIsDefault1781740900000 } from '../backfill/1781740900000-MakeDataSourceVersionBranchIdNotNullAndDropIsDefault'; // migration-import-allowed: source of the branch fixes
import { MakeAppVersionBranchIdNotNullAndGitSyncFlags1781741000000 } from '../backfill/1781741000000-MakeAppVersionBranchIdNotNullAndGitSyncFlags'; // migration-import-allowed: source of the branch fixes
import { BackfillWorkflowBranchIdAndEnforceNotNull1782400000000 } from '../backfill/1782400000000-BackfillWorkflowBranchIdAndEnforceNotNull'; // migration-import-allowed: source of the branch fixes
import { BackfillFolderAppsDefaultBranchIdAndEnforceNotNull1785700000000 } from '../backfill/1785700000000-BackfillFolderAppsDefaultBranchIdAndEnforceNotNull'; // migration-import-allowed: source of the branch fixes

/** Rows 3.21.58 pods wrote without a branch after the backfill; NOT NULL would fail on them. */
const fixBranchlessRows = async (queryRunner: QueryRunner, table: string) =>
  withShortLock(
    queryRunner,
    await branchlessRowFixes(table, [
      new MakeDataSourceVersionBranchIdNotNullAndDropIsDefault1781740900000(),
      new MakeAppVersionBranchIdNotNullAndGitSyncFlags1781741000000(),
      new BackfillWorkflowBranchIdAndEnforceNotNull1782400000000(),
      new BackfillFolderAppsDefaultBranchIdAndEnforceNotNull1785700000000(),
    ])
  );

/** Recreates a 3.21.58 trigger with its final column list; skipped when it already has it. */
const finalTrigger = (name: string, columns: string, fn: string) => `DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'app_versions'::regclass AND tgname = '${name}'
      AND pg_get_triggerdef(oid) NOT LIKE '%UPDATE OF ${columns} ON %'
  ) THEN
    DROP TRIGGER IF EXISTS ${name} ON app_versions;
    CREATE TRIGGER ${name} BEFORE INSERT OR UPDATE OF ${columns} ON app_versions
      FOR EACH ROW EXECUTE FUNCTION ${fn}();
  END IF;
END $$`;

/**
 * Removes what the 3.21.58 branch model left behind after an async upgrade ran the lock-free backfill variants
 * (legacy-upgrade.ts). After a single-transaction upgrade the original migrations already did all of this, so every
 * step is a no-op there.
 */
export class ContractLegacyBranchModel1793300000000 implements MigrationInterface {
  transaction = false;
  // Waits one upgrade after the legacy backfill, like any removal.
  requires = 'MakeAppVersionBranchIdNotNullAndGitSyncFlags1781741000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // data_source_versions: the is_default fallback rows became default-branch rows.
    await fixBranchlessRows(queryRunner, 'data_source_versions');
    await withShortLock(queryRunner, [
      'DROP TRIGGER IF EXISTS trg_unique_active_default_dsv_name_per_org ON data_source_versions',
      'DROP FUNCTION IF EXISTS enforce_unique_active_default_dsv_name_per_org()',
    ]);
    await withShortLock(queryRunner, ['DROP INDEX IF EXISTS idx_data_source_versions_one_default']);
    await withShortLock(queryRunner, [
      `ALTER TABLE data_source_versions
         DROP CONSTRAINT IF EXISTS data_source_versions_default_branch_null_check,
         DROP CONSTRAINT IF EXISTS data_source_versions_default_must_be_active_check,
         DROP COLUMN IF EXISTS is_default,
         DROP COLUMN IF EXISTS meta_timestamp,
         DROP COLUMN IF EXISTS pulled_at`,
    ]);
    await setNotNull(queryRunner, 'data_source_versions', 'branch_id');

    // app_versions: the backfill's beforeCommit() swapped the branch key to CASCADE and added the branch CHECK, both NOT VALID.
    await withShortLock(queryRunner, ['ALTER TABLE app_versions VALIDATE CONSTRAINT fk_app_versions_branch']);
    await fixBranchlessRows(queryRunner, 'app_versions');
    await setNotNull(queryRunner, 'app_versions', 'branch_id');
    // The backfill emptied these two functions; the default-branch slug function covers both rules now.
    await withShortLock(queryRunner, [
      'DROP TRIGGER IF EXISTS trg_app_versions_slug_default_branch_unique ON app_versions',
      'DROP FUNCTION IF EXISTS enforce_app_versions_slug_default_branch_unique()',
    ]);
    await withShortLock(queryRunner, [
      'DROP TRIGGER IF EXISTS trg_app_versions_workflow_slug_unique ON app_versions',
      'DROP FUNCTION IF EXISTS enforce_app_versions_workflow_slug_unique()',
    ]);
    // The backfill replaced these bodies; their triggers still fire on 3.21.58's columns.
    await withShortLock(queryRunner, [
      finalTrigger(
        'trg_app_versions_app_name_branch_unique',
        'app_name, branch_id, app_id',
        'enforce_app_versions_app_name_branch_unique'
      ),
    ]);
    await withShortLock(queryRunner, [
      finalTrigger(
        'trg_app_versions_slug_branch_unique',
        'slug, branch_id, app_id',
        'enforce_app_versions_slug_branch_unique'
      ),
    ]);
    await withShortLock(queryRunner, [
      finalTrigger(
        'trg_app_versions_default_branch_slug_unique',
        'slug, branch_id, app_id',
        'enforce_app_versions_default_branch_slug_unique'
      ),
    ]);
    await withShortLock(queryRunner, [
      'ALTER TABLE app_versions DROP COLUMN IF EXISTS remote_updated_at, DROP COLUMN IF EXISTS pulled_at',
    ]);

    // Dead git-sync state.
    await withShortLock(queryRunner, [
      `ALTER TABLE organization_git_sync_branches
         DROP COLUMN IF EXISTS app_meta_hash,
         DROP COLUMN IF EXISTS module_meta_hash,
         DROP COLUMN IF EXISTS data_source_meta_hash`,
    ]);
    await withShortLock(queryRunner, ['DROP TABLE IF EXISTS organization_git_ssh']);

    // folder_apps: every row is on a branch now.
    await fixBranchlessRows(queryRunner, 'folder_apps');
    await setNotNull(queryRunner, 'folder_apps', 'branch_id');
    await withShortLock(queryRunner, ['DROP INDEX IF EXISTS uniq_folder_apps_app_no_branch']);

    // Saved by loosen for a restore, which a committed backfill refuses.
    await withShortLock(queryRunner, ['DROP TABLE IF EXISTS legacy_upgrade_dropped_rules']);
  }

  public async down(): Promise<void> {
    // Not reversible: is_default values were derived from rows the backfill deleted. Restore the pre-upgrade backup.
  }
}
