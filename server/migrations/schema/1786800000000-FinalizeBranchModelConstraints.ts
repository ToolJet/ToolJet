import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'FinalizeBranchModelConstraints1786800000000';

/**
 * Final half of the consolidated branch-model setup: adds the
 * chk_app_versions_branch_metadata CHECK constraint.
 *
 * Deferred out of 1773500000000-ConsolidatedBranchModelSetup because kept migrations that
 * run after it (EnsureDefaultBranchDraftVersion, CloneDefaultBranchDraftFromPublished)
 * create draft/stub rows with temporarily-NULL app_name/slug, which SET-2's
 * MakeAppVersionBranchIdNotNullAndGitSyncFlags (1781741000000) heals. This runs after all
 * of that, matching main's original ordering.
 *
 * Idempotent + beta-safe: beta customers already have this constraint (added on main by
 * AddMetadataColumnsToAppVersions), so the DO block below is a no-op for them.
 */
export class FinalizeBranchModelConstraints1786800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);
    console.log(`${MIGRATION_NAME}: [START] Finalizing branch-model metadata constraint.`);

    // Heal branched rows that still carry NULL app_name/slug — stub / cloned draft rows from
    // EnsureDefaultBranchDraftVersion & CloneDefaultBranchDraftFromPublished (branch_id IS NOT
    // NULL, so SET-2's branch_id-IS-NULL heal doesn't reach them). av.app_id::text is a
    // globally-unique placeholder, so it cannot collide across apps and won't trip the name/slug
    // uniqueness triggers. Matches main's AddMetadataColumns step 2a.
    console.log(`${MIGRATION_NAME}: [START] Healing branched rows with NULL app_name/slug.`);
    const [, healed] = await queryRunner.query(`
      UPDATE app_versions
      SET app_name = COALESCE(app_name, app_id::text),
          slug     = COALESCE(slug, app_id::text)
      WHERE branch_id IS NOT NULL AND (app_name IS NULL OR slug IS NULL)
    `);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Healed ${healed ?? 0} rows.`);

    console.log(`${MIGRATION_NAME}: [START] Adding chk_app_versions_branch_metadata (if absent).`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'chk_app_versions_branch_metadata'
            AND conrelid = 'app_versions'::regclass
        ) THEN
          ALTER TABLE app_versions
            ADD CONSTRAINT chk_app_versions_branch_metadata
            CHECK ((branch_id IS NULL) OR ((app_name IS NOT NULL) AND (slug IS NOT NULL)));
        END IF;
      END $$;
    `);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Branch-model metadata constraint finalized.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS chk_app_versions_branch_metadata`);
  }
}
