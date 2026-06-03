import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces two related invariants at the DB level:
 *
 *   1. At most one DRAFT VERSION row per (app, default-branch). The publish
 *      hook (`versions/util.service.ts:handleDefaultBranchPublish`) maintains
 *      this in code by detaching `branch_id` on the just-published row and
 *      inserting a new DRAFT in the same transaction. The partial unique
 *      index below catches any path that bypasses the hook.
 *   2. PUBLISHED VERSION rows are branchless. Released snapshots have
 *      `branch_id IS NULL` after the publish hook detaches them; the CHECK
 *      constraint below ensures no future write can re-attach.
 *
 * Legacy data handling:
 *
 *   - Apps with multiple DRAFT VERSION rows on the same (app_id, branch_id):
 *     keep the most-recently-updated as DRAFT; convert the older rows to
 *     PUBLISHED with `branch_id = NULL`. This preserves history (each older
 *     row becomes a historical snapshot the user can still browse via the
 *     version manager) without destroying data.
 *   - Any PUBLISHED VERSION rows still attached to a branch (legacy) get
 *     `branch_id` NULLed before the CHECK constraint is added — otherwise the
 *     ALTER TABLE would fail.
 *
 * The CHECK constraint is added idempotently (`IF NOT EXISTS`) so re-running
 * this migration on a partially-applied database is safe.
 */
export class AddDefaultBranchDraftUniquePerApp1779200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The set-based dedupe UPDATE and the two partial-index builds below each scan
    // the whole app_versions table — slow enough to trip statement_timeout (57014)
    // on a large instance. Disable it for this transaction; SET LOCAL reverts on
    // commit/rollback.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Step 1: Convert legacy duplicate DRAFTs to PUBLISHED snapshots.
    //
    // For each (app_id, branch_id) partition with multiple DRAFT VERSION-type
    // rows, keep the most-recently-updated as the canonical DRAFT and convert
    // the rest to PUBLISHED with branch_id = NULL. The older rows become
    // historical snapshots — they're still visible in the version manager but
    // no longer occupy the branch's "current editor state" slot.
    //
    // RAISE NOTICE logs how many rows were converted so the operator can
    // verify the legacy duplicate count post-migration.
    await queryRunner.query(`
      DO $$
      DECLARE
        converted_count INT;
      BEGIN
        WITH ranked AS (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY app_id, branch_id
                   ORDER BY updated_at DESC, id ASC
                 ) AS rn
          FROM app_versions
          WHERE status = 'DRAFT'
            AND version_type = 'version'
            AND branch_id IS NOT NULL
        ),
        to_convert AS (
          SELECT id FROM ranked WHERE rn > 1
        ),
        updated AS (
          UPDATE app_versions
          SET status = 'PUBLISHED',
              branch_id = NULL
          WHERE id IN (SELECT id FROM to_convert)
          RETURNING id
        )
        SELECT COUNT(*) INTO converted_count FROM updated;

        IF converted_count > 0 THEN
          RAISE NOTICE 'Converted % legacy duplicate DRAFT row(s) to PUBLISHED (branch_id detached).', converted_count;
        END IF;
      END $$;
    `);

    // Step 2: Belt-and-suspenders — any PUBLISHED row still on a branch (e.g.
    // hand-edited rows, partial pre-existing migrations) gets branch_id NULLed
    // before the CHECK is added. Otherwise ALTER TABLE would fail validation.
    await queryRunner.query(`
      UPDATE app_versions
      SET branch_id = NULL, version_type = 'version'
      WHERE status = 'PUBLISHED' AND branch_id IS NOT NULL;
    `);

    // Step 3: Partial unique index — invariant #1 (single DRAFT per app/branch).
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

    // Step 4: CHECK constraint — invariant #2 (PUBLISHED is branchless).
    // Added idempotently so re-runs don't fail. Scoped to PUBLISHED only —
    // RELEASED tag rows are handled by a different flow and intentionally
    // left out of scope here.
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app_versions
      DROP CONSTRAINT IF EXISTS chk_app_versions_published_branch_id_null;
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "app_versions_app_default_branch_draft_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "app_versions_app_default_branch_draft_unique_ensure_single_stub"`);
    // No reverse for the legacy DRAFT → PUBLISHED conversion in step 1, or the
    // branch_id detach in step 2 — the original associations aren't
    // recoverable from the surviving column data.
  }
}
