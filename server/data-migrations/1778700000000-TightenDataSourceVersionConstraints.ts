import { MigrationInterface, QueryRunner } from 'typeorm';

export class TightenDataSourceVersionConstraints1778700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Misleadingly named — it was keyed on (data_source_id) and fully subsumed by
    // idx_data_source_versions_one_default. Replaced below by a name-keyed index
    // that actually enforces unique default names.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_default_name`);

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
