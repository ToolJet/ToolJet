import { MigrationInterface, QueryRunner } from 'typeorm';

export class TightenDataSourceVersionConstraints1778700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Misleadingly named — it was keyed on (data_source_id) and fully subsumed by
    // idx_data_source_versions_one_default. Replaced below by a name-keyed index
    // that actually enforces unique default names.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_default_name`);

    // Pre-CREATE dedupe: collapse pre-existing (LOWER(name), COALESCE(branch_id, '00…'))
    // duplicates among active non-default DSVs. Without this, the new index below
    // fails with `23505 unique_violation` on the first colliding pair (e.g. two
    // branchless 'fna-fact-repository' rows left over from before the column
    // dropped via 1776700000000's CASCADE). Keep the oldest row's name; suffix
    // later duplicates with _N until the new value is also unique within the
    // same (LOWER(name), branch_id) bucket. The inner NOT EXISTS check guards
    // against suffix collisions when several originals share the same base name.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, name, branch_id
          FROM (
            SELECT id, name, branch_id,
                   ROW_NUMBER() OVER (
                     PARTITION BY LOWER(name),
                                  COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)
                     ORDER BY created_at ASC, id ASC
                   ) AS rn
            FROM data_source_versions
            WHERE is_active = true AND is_default = false AND name IS NOT NULL
          ) ranked
          WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_value := rec.name || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1
              FROM data_source_versions dsv2
              WHERE LOWER(dsv2.name) = LOWER(new_value)
                AND COALESCE(dsv2.branch_id, '00000000-0000-0000-0000-000000000000'::uuid)
                    = COALESCE(rec.branch_id, '00000000-0000-0000-0000-000000000000'::uuid)
                AND dsv2.is_active = true
                AND dsv2.is_default = false
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE data_source_versions SET name = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Moved here from 1776700000000-RemoveAppVersionIdFromDataSourceVersions so
    // all data_source_versions constraint changes live in one migration.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_name_branch
        ON data_source_versions (
          LOWER(name),
          COALESCE(branch_id, '00000000-0000-0000-0000-000000000000')
        )
        WHERE is_active = true AND is_default = false
    `);

    // Per-organization unique name across active defaults. data_source_versions has
    // no organization_id column, so this can't be a plain unique index — enforce via
    // a BEFORE trigger that joins through data_sources. pg_advisory_xact_lock on
    // (org, lower(name)) closes the read-then-insert race that a naked EXISTS would
    // leave open. Raised as ERRCODE 23505 so callers handle it identically to a
    // real unique-violation; the message carries the constraint name for
    // catchDbException to match (see db_constraints.constants.ts).
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

    // Pre-CHECK cleanup #1: drop the default flag on any soft-deleted default
    // rows (is_default=true AND is_active=false). Reactivating them would
    // un-delete the DSV, which is too aggressive; instead we drop the default
    // flag so the partial unique index idx_data_source_versions_one_default
    // frees up the slot and application code can re-seed a default on next
    // access. Without this, the CHECK below would reject those rows at ALTER
    // TABLE time.
    await queryRunner.query(`
      UPDATE data_source_versions
      SET is_default = false
      WHERE is_default = true AND is_active = false
    `);

    // Pre-CHECK cleanup #2: defaults are workspace-wide / branch-agnostic.
    // Any legacy row with is_default=true AND branch_id IS NOT NULL is a
    // contradiction — treat it as branch-scoped (drop the default flag) so
    // the second CHECK below validates cleanly. The branch DSV remains usable
    // as a regular (non-default) row.
    await queryRunner.query(`
      UPDATE data_source_versions
      SET is_default = false
      WHERE is_default = true AND branch_id IS NOT NULL
    `);

    // A soft-deleted default would leave the data_source with no live default while
    // still satisfying idx_data_source_versions_one_default — block that state.
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        ADD CONSTRAINT data_source_versions_default_must_be_active_check
        CHECK (NOT is_default OR is_active)
    `);

    // Defaults are branch-agnostic. Branch-scoped rows are never the default.
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        ADD CONSTRAINT data_source_versions_default_branch_null_check
        CHECK (NOT is_default OR branch_id IS NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        DROP CONSTRAINT IF EXISTS data_source_versions_default_branch_null_check
    `);
    await queryRunner.query(`
      ALTER TABLE data_source_versions
        DROP CONSTRAINT IF EXISTS data_source_versions_default_must_be_active_check
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_unique_active_default_dsv_name_per_org
        ON data_source_versions
    `);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_unique_active_default_dsv_name_per_org()`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_active_name_branch`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_default_name
        ON data_source_versions (data_source_id)
        WHERE is_active = true AND is_default = true
    `);
  }
}
