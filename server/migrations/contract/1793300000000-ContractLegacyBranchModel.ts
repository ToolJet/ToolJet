import { MigrationInterface, QueryRunner } from 'typeorm';
import { setNotNull, withShortLock } from '../../src/migration-helpers/with-short-lock'; // migration-import-allowed: contract steps must go through the short-lock helper

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
    await withShortLock(queryRunner, [
      'DROP TRIGGER IF EXISTS trg_unique_active_default_dsv_name_per_org ON data_source_versions',
      'DROP FUNCTION IF EXISTS enforce_unique_active_default_dsv_name_per_org()',
    ]);
    await withShortLock(queryRunner, ['DROP INDEX IF EXISTS idx_data_source_versions_one_default']);
    await withShortLock(queryRunner, [
      `ALTER TABLE data_source_versions
         DROP CONSTRAINT IF EXISTS data_source_versions_default_branch_null_check,
         DROP CONSTRAINT IF EXISTS data_source_versions_default_must_be_active_check,
         DROP COLUMN IF EXISTS is_default`,
    ]);
    await setNotNull(queryRunner, 'data_source_versions', 'branch_id');
  }

  public async down(): Promise<void> {
    // Not reversible: is_default values were derived from rows the backfill deleted. Restore the pre-upgrade backup.
  }
}
