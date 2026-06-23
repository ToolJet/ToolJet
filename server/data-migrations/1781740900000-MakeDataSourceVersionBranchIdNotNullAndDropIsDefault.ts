import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDataSourceVersionBranchIdNotNullAndDropIsDefault1781740900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Goal: remove the is_default column from data_source_versions and make
    // branch_id NOT NULL. Pre-migration, the gitsync-off fallback DSV was the
    // is_default = true / is_active = true row (always branch_id IS NULL). That
    // role is now carried by the row on the organization's default branch.
    //
    // Depends on every organization already having a default branch
    // (organization_git_sync_branches.is_default = true) — guaranteed by the
    // EnsureDefaultBranchForAllOrganizations migration that runs before this one.
    //
    // The backfill/delete below is small in practice but is a one-shot pass over
    // the whole table; disable statement_timeout for this transaction so a large
    // dataset can't cancel it mid-way (57014). SET LOCAL reverts on commit/rollback.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // ── Phase 0: is_synced marker backfill (set from the ORIGINAL branch_id state) ─
    // The is_synced column is created up front by the schema migration
    // AddSyncFlagColumnsToVersions (migrations/) so it exists before any entity-based
    // data-migration runs; here we only backfill it. Static marker mirroring
    // app_versions.is_synced: the row originated from gitsync. Set true for rows that
    // already sit on a branch BEFORE the Phase B backfill — the is_default fallback rows
    // (branch_id IS NULL) stay false, so non-gitsync data sources remain is_synced = false
    // even after their branch_id is backfilled below.
    await queryRunner.query(`UPDATE data_source_versions SET is_synced = true WHERE branch_id IS NOT NULL`);

    // ── Phase A: drop the constraints/objects that gate the backfill ─────
    // The is_default COLUMN is kept until Phase C — Phase B still identifies the
    // gitsync-off fallback rows by is_default = true / is_active = true. We only
    // drop the dependent objects that would otherwise block the backfill or are
    // tied to is_default semantics.

    // Trigger + function reference NEW.is_default in their body — Postgres does
    // not track that as a column dependency, so DROP COLUMN would leave a broken
    // function behind. Drop them explicitly.
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_unique_active_default_dsv_name_per_org
        ON data_source_versions
    `);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_unique_active_default_dsv_name_per_org()`);

    // "one default per data_source" — meaningless once is_default is gone.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_data_source_versions_one_default`);

    // CHECK (NOT is_default OR branch_id IS NULL) MUST be dropped before Phase B —
    // the backfill assigns a non-null branch_id to rows that still carry
    // is_default = true, which this constraint would reject. Drop the
    // default-must-be-active CHECK alongside it (also is_default-bound).
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        DROP CONSTRAINT IF EXISTS data_source_versions_default_branch_null_check
    `);
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        DROP CONSTRAINT IF EXISTS data_source_versions_default_must_be_active_check
    `);

    // Old unique index has an is_default = false predicate; drop it now and
    // recreate without is_default in Phase C.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_active_name_branch`);

    // ── Phase B: settle the default branch on the fallback rows ──────────
    // Background: when data_source_versions was first seeded, each data source got
    // a fallback DSV with is_default = true, is_active = true, branch_id IS NULL,
    // and name copied from data_sources.name. That row is what gitsync-off reads.
    //
    // We now route that role onto the organization's default branch. The decision
    // is made per data source, on the number of DSV rows it has:
    //
    //   • The fallback is the ONLY DSV row for the data source. The data lives
    //     nowhere else, so move it onto the default branch (update in place).
    //   • The data source has MORE THAN ONE DSV row — i.e. it already has a
    //     default-branch row (org uses gitsync) and/or a feature-branch row (the
    //     data source was only ever added to a feature branch). In either case the
    //     data already exists on a branch, so no default-branch row needs creating;
    //     the is_default fallback is a redundant leftover, left for the delete below.
    //
    // Backfill the first case only: set branch_id = org default branch on every
    // is_default fallback that is the sole row of its data source.
    await queryRunner.query(`
      UPDATE data_source_versions f
      SET branch_id = wb.id
      FROM data_sources ds
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = ds.organization_id AND wb.is_default = true
      WHERE f.data_source_id = ds.id
        AND f.is_default = true
        AND f.is_active = true
        AND f.branch_id IS NULL
        AND (
          SELECT count(*) FROM data_source_versions d
          WHERE d.data_source_id = f.data_source_id
        ) = 1
    `);

    // Delete the redundant leftovers. After the backfill above, the only
    // is_default fallback rows still carrying branch_id IS NULL are those whose
    // data source has more than one DSV row — the data already lives on a default
    // or feature branch, so the NULL-branch fallback is safe to drop. Cascade
    // removes its data_source_version_options.
    await queryRunner.query(`
      DELETE FROM data_source_versions
      WHERE is_default = true
        AND is_active = true
        AND branch_id IS NULL
    `);

    // ── Phase C: drop is_default, enforce NOT NULL, rebuild the index ────
    await queryRunner.query(`ALTER TABLE data_source_versions DROP COLUMN is_default`);

    await queryRunner.query(`ALTER TABLE data_source_versions ALTER COLUMN branch_id SET NOT NULL`);

    // Recreate the active-name-per-branch unique index without the is_default
    // predicate. branch_id is now NOT NULL, so the previous
    // "AND branch_id IS NOT NULL" / COALESCE-to-zero handling is no longer needed.
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_active_name_branch
        ON data_source_versions (LOWER(name), branch_id)
        WHERE is_active = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort structural rollback. The deleted duplicate rows and the original
    // is_default flags cannot be recovered; this restores the schema objects so a
    // re-run of the up() (or older code) sees the expected structure. Re-added
    // is_default defaults to false for every row, which satisfies all the
    // recreated constraints.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Drop the is_synced marker column.
    await queryRunner.query(`ALTER TABLE data_source_versions DROP COLUMN IF EXISTS is_synced`);

    // Drop the is_default-free unique index and relax NOT NULL first.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_active_name_branch`);
    await queryRunner.query(`ALTER TABLE data_source_versions ALTER COLUMN branch_id DROP NOT NULL`);

    // Re-add the column.
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false
    `);

    // Recreate "one default per data_source".
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_data_source_versions_one_default
        ON data_source_versions (data_source_id)
        WHERE is_default = true
    `);

    // Recreate the original active-name-per-branch unique index (with is_default).
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_name_branch
        ON data_source_versions (
          LOWER(name),
          COALESCE(branch_id, '00000000-0000-0000-0000-000000000000')
        )
        WHERE is_active = true AND is_default = false
    `);

    // Recreate the CHECK constraints.
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        DROP CONSTRAINT IF EXISTS data_source_versions_default_must_be_active_check
    `);
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        ADD CONSTRAINT data_source_versions_default_must_be_active_check
        CHECK (NOT is_default OR is_active)
    `);
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        DROP CONSTRAINT IF EXISTS data_source_versions_default_branch_null_check
    `);
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        ADD CONSTRAINT data_source_versions_default_branch_null_check
        CHECK (NOT is_default OR branch_id IS NULL)
    `);

    // Recreate the per-organization default-name uniqueness function + trigger.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_unique_active_default_dsv_name_per_org()
      RETURNS TRIGGER AS $$
      DECLARE
        v_org_id uuid;
      BEGIN
        IF NEW.is_active IS NOT TRUE OR NEW.is_default IS NOT TRUE THEN
          RETURN NEW;
        END IF;

        SELECT organization_id INTO v_org_id
        FROM data_sources
        WHERE id = NEW.data_source_id;

        IF v_org_id IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(
          hashtextextended(v_org_id::text || '|' || LOWER(NEW.name), 0)
        );

        IF EXISTS (
          SELECT 1
          FROM data_source_versions dsv
          JOIN data_sources ds ON ds.id = dsv.data_source_id
          WHERE ds.organization_id = v_org_id
            AND LOWER(dsv.name) = LOWER(NEW.name)
            AND dsv.is_active = true
            AND dsv.is_default = true
            AND dsv.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'data_source_version_default_name_organization_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_unique_active_default_dsv_name_per_org
        ON data_source_versions
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_unique_active_default_dsv_name_per_org
        BEFORE INSERT OR UPDATE OF name, is_active, is_default, data_source_id
        ON data_source_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_unique_active_default_dsv_name_per_org()
    `);
  }
}
