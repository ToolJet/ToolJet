import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces two invariants on `app_versions` at the DB level:
 *
 *   1. `version_type='branch'` implies `status='DRAFT'` AND `branch_id IS NOT NULL`.
 *      Sub-branch BRANCH-type rows must be branched DRAFTs.
 *   2. `branch_id IS NOT NULL` implies `status='DRAFT'`.
 *      Any branched row must be a DRAFT. Strictly stronger than the existing
 *      `chk_app_versions_published_branch_id_null` (which only forbade
 *      PUBLISHED on a branch) — this also forbids RELEASED on a branch.
 *
 * The old `chk_app_versions_published_branch_id_null` is dropped because the
 * new "branched → DRAFT" constraint is the contrapositive and strictly
 * stronger. Keeping both would mean two CHECKs saying the same thing.
 *
 * Workflows are unaffected — their version rows always have `branch_id=NULL`
 * (workflows don't participate in branching) so neither new constraint bites.
 *
 * The "branch_id IS NULL → status=PUBLISHED AND version_type=version" rule is
 * intentionally NOT added. Workflows and any other legitimate branchless
 * DRAFT rows are preserved.
 *
 * Data migration runs FIRST (steps 1-3) so the ALTER TABLE in steps 4-5
 * doesn't reject existing rows that violate the new predicates.
 */
export class EnforceBranchedAppVersionInvariants1779300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The cleanup UPDATEs and the ADD CONSTRAINT validations below each scan the
    // whole app_versions table — slow enough to trip statement_timeout (57014) on a
    // large instance. Disable it for this transaction; SET LOCAL reverts on
    // commit/rollback.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Step 1: Convert orphan BRANCH-type rows (no branch_id) to VERSION + PUBLISHED.
    // version_type='branch' AND branch_id IS NULL means the FK was set NULL by the
    // ON DELETE SET NULL on `fk_app_versions_branch` after the workspace branch
    // was removed. Without a branch, these can't satisfy the new constraint —
    // promote them to branchless published snapshots so they still surface as
    // history.
    await queryRunner.query(`
      DO $$
      DECLARE
        affected INT;
      BEGIN
        WITH updated AS (
          UPDATE app_versions
          SET version_type = 'version', status = 'PUBLISHED'
          WHERE version_type = 'branch' AND branch_id IS NULL
          RETURNING id
        )
        SELECT COUNT(*) INTO affected FROM updated;

        IF affected > 0 THEN
          RAISE NOTICE 'Step 1: Converted % orphan BRANCH-type row(s) (branch_id NULL) to VERSION + PUBLISHED.', affected;
        END IF;
      END $$;
    `);

    // Step 2: Force BRANCH-type rows to DRAFT.
    // A BRANCH-type row on a sub-branch can only be a DRAFT in the new model.
    // Pre-migration data may have legacy PUBLISHED/RELEASED on a BRANCH row;
    // flip the status. branch_id is preserved.
    await queryRunner.query(`
      DO $$
      DECLARE
        affected INT;
      BEGIN
        WITH updated AS (
          UPDATE app_versions
          SET status = 'DRAFT'
          WHERE version_type = 'branch'
            AND branch_id IS NOT NULL
            AND status <> 'DRAFT'
          RETURNING id
        )
        SELECT COUNT(*) INTO affected FROM updated;

        IF affected > 0 THEN
          RAISE NOTICE 'Step 2: Forced % BRANCH-type row(s) to status=DRAFT.', affected;
        END IF;
      END $$;
    `);

    // Step 3: Detach any branched non-DRAFT VERSION-type rows.
    // The existing chk_app_versions_published_branch_id_null already forbids
    // PUBLISHED rows on a branch, so this catches the remaining case: RELEASED
    // rows on a branch. Detach them (branch_id=NULL) and normalise to
    // PUBLISHED so they remain valid branchless snapshots.
    await queryRunner.query(`
      DO $$
      DECLARE
        affected INT;
      BEGIN
        WITH updated AS (
          UPDATE app_versions
          SET branch_id = NULL, status = 'PUBLISHED'
          WHERE branch_id IS NOT NULL
            AND status NOT IN ('DRAFT')
          RETURNING id
        )
        SELECT COUNT(*) INTO affected FROM updated;

        IF affected > 0 THEN
          RAISE NOTICE 'Step 3: Detached % branched non-DRAFT row(s) to branchless PUBLISHED.', affected;
        END IF;
      END $$;
    `);

    // Step 4: Drop the now-redundant published-branchless CHECK.
    // The new "branched → DRAFT" constraint in step 5b is the contrapositive
    // and strictly stronger.
    await queryRunner.query(`
      ALTER TABLE app_versions
      DROP CONSTRAINT IF EXISTS chk_app_versions_published_branch_id_null;
    `);

    // Step 5a: BRANCH-type rows must be branched DRAFTs.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'chk_app_versions_branch_type_implies_draft_branched'
            AND conrelid = 'app_versions'::regclass
        ) THEN
          ALTER TABLE app_versions
          ADD CONSTRAINT chk_app_versions_branch_type_implies_draft_branched
          CHECK (version_type <> 'branch' OR (status = 'DRAFT' AND branch_id IS NOT NULL));
        END IF;
      END $$;
    `);

    // Step 5b: Any branched row must be a DRAFT (replaces the dropped CHECK).
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'chk_app_versions_branched_implies_draft'
            AND conrelid = 'app_versions'::regclass
        ) THEN
          ALTER TABLE app_versions
          ADD CONSTRAINT chk_app_versions_branched_implies_draft
          CHECK (branch_id IS NULL OR status = 'DRAFT');
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new CHECKs.
    await queryRunner.query(`
      ALTER TABLE app_versions
      DROP CONSTRAINT IF EXISTS chk_app_versions_branched_implies_draft;
    `);
    await queryRunner.query(`
      ALTER TABLE app_versions
      DROP CONSTRAINT IF EXISTS chk_app_versions_branch_type_implies_draft_branched;
    `);

    // Restore the old published-branchless CHECK so downgrades stay consistent
    // with the pre-migration schema dump.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'chk_app_versions_published_branch_id_null'
            AND conrelid = 'app_versions'::regclass
        ) THEN
          ALTER TABLE app_versions
          ADD CONSTRAINT chk_app_versions_published_branch_id_null
          CHECK (status <> 'PUBLISHED' OR branch_id IS NULL);
        END IF;
      END $$;
    `);

    // No reverse for the data migrations in steps 1-3 — the original
    // version_type / status / branch_id values aren't recoverable from the
    // surviving column data.
  }
}
