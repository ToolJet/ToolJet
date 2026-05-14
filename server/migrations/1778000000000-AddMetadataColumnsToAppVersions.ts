import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMetadataColumnsToAppVersions1778000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns to app_versions
    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'slug',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'app_name',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'icon',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'is_public',
        type: 'boolean',
        default: false,
        isNullable: true,
      })
    );

    // type mirrors apps.type so the partial unique indexes below can include it.
    // Apps and modules are different product surfaces — they should be allowed to
    // share names/slugs on the same branch. apps.type isn't reachable from a partial
    // index expression (only same-table columns are allowed), so we denormalize.
    // Stored as varchar (not an enum) so we don't have to keep the column's enum
    // in lockstep with apps.type values — the source of truth is apps.type, and the
    // trigger added later in this migration keeps the columns in sync.
    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        length: '50',
        isNullable: true,
      })
    );

    // Step 2: Backfill icon, is_public, slug, app_name on non-workflow versions, and
    // backfill the new `type` column on ALL versions (including workflows) so the
    // type-scoped partial unique indexes below have a value to filter on.
    await queryRunner.query(`
      UPDATE app_versions av
      SET
        icon = a.icon,
        is_public = a.is_public,
        slug = a.slug, app_name = a.name
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type IN ('front_end', 'module')
    `);
    await queryRunner.query(`
      UPDATE app_versions av
      SET type = a.type
      FROM apps a
      WHERE av.app_id = a.id
    `);

    // Step 2a: Defensive fallback before the branch-row CHECK constraint below — any
    // non-workflow version row with a branch_id but a NULL app_name/slug (e.g. legacy
    // rows whose source apps.name/slug were NULL) gets a placeholder so the CHECK doesn't
    // fail validation. Uses the app's id as a deterministic placeholder.
    await queryRunner.query(`
      UPDATE app_versions av
      SET
        app_name = COALESCE(av.app_name, av.app_id::text),
        slug = COALESCE(av.slug, av.app_id::text)
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type IN ('front_end', 'module')
        AND av.branch_id IS NOT NULL
        AND (av.app_name IS NULL OR av.slug IS NULL)
    `);

    // Step 2b: Enforce that branched version rows always carry metadata. branch_id IS NULL
    // rows (non-git-sync versions, workflows) are exempt — only branch-scoped rows must
    // have app_name and slug set. The constraint covers BRANCH-type sub-branch rows and
    // VERSION-type default-branch rows alike (both have branch_id IS NOT NULL when git is on).
    await queryRunner.query(`
      ALTER TABLE app_versions
        ADD CONSTRAINT chk_app_versions_branch_metadata
        CHECK (branch_id IS NULL OR (app_name IS NOT NULL AND slug IS NOT NULL));
    `);

    // Step 4a: Dedupe (slug, branch_id, type) among branch-type rows.
    // Partition by type so an app and a module on the same branch can keep the same
    // slug — they're different product surfaces and the partial unique index below
    // also includes type. Suffixes rename later duplicates within the same
    // (branch, type) scope.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, slug, branch_id, type
          FROM (
            SELECT id, slug, branch_id, type,
                   ROW_NUMBER() OVER (
                     PARTITION BY slug, branch_id, type
                     ORDER BY created_at ASC, id ASC
                   ) AS rn
            FROM app_versions
            WHERE version_type = 'branch' AND slug IS NOT NULL
          ) ranked
          WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_value := rec.slug || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1 FROM app_versions
              WHERE version_type = 'branch'
                AND slug = new_value
                AND branch_id IS NOT DISTINCT FROM rec.branch_id
                AND type IS NOT DISTINCT FROM rec.type
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET slug = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Step 4b: Dedupe (app_name, branch_id, type) among branch-type rows. Same
    // algorithm as Step 4a; app_name and slug can collide independently.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, app_name, branch_id, type
          FROM (
            SELECT id, app_name, branch_id, type,
                   ROW_NUMBER() OVER (
                     PARTITION BY app_name, branch_id, type
                     ORDER BY created_at ASC, id ASC
                   ) AS rn
            FROM app_versions
            WHERE version_type = 'branch' AND app_name IS NOT NULL
          ) ranked
          WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_value := rec.app_name || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1 FROM app_versions
              WHERE version_type = 'branch'
                AND app_name = new_value
                AND branch_id IS NOT DISTINCT FROM rec.branch_id
                AND type IS NOT DISTINCT FROM rec.type
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET app_name = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Step 4c: Type-scoped unique indexes — duplicates resolved above. Apps and
    // modules can share names/slugs on the same branch; only same-type clashes
    // are blocked.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "app_versions_slug_branch_id_unique"
      ON app_versions (slug, branch_id, type)
      WHERE version_type = 'branch'
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "app_versions_app_name_branch_id_unique"
      ON app_versions (app_name, branch_id, type)
      WHERE version_type = 'branch'
    `);

    // Step 4d: Trigger to keep app_versions.type in sync with apps.type. Fires
    // BEFORE INSERT/UPDATE on app_versions, looks up the parent apps row, and
    // writes its type into NEW.type. Avoids touching every code path that
    // creates an AppVersion row (subscriber + manager.create scattered widely)
    // and guarantees the column is non-stale for the partial indexes above.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sync_app_versions_type_from_apps()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.app_id IS NOT NULL THEN
          SELECT type INTO NEW.type FROM apps WHERE id = NEW.app_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_sync_type
      BEFORE INSERT OR UPDATE OF app_id ON app_versions
      FOR EACH ROW EXECUTE FUNCTION sync_app_versions_type_from_apps();
    `);
    

    // Step 5: Clean apps table for non-workflows (slug = id placeholder for existing constraint)
    await queryRunner.query(`
      UPDATE apps
      SET slug = id, name = NULL, icon = NULL, is_public = false
      WHERE type IN ('front_end', 'module')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
