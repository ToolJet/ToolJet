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

    // Step 2: Backfill icon, is_public, slug, app_name on non-workflow versions.
    //
    // Type comparison: the apps.type enum stores 'front-end' (with a hyphen) and
    // 'module'. Earlier revisions of this migration used the underscore form
    // ('front_end') which silently skipped every front-end app and left their
    // app_versions metadata NULL — that masked the bug until the CHECK below
    // started rejecting branched rows. Always use the canonical enum spelling.
    await queryRunner.query(`
      UPDATE app_versions av
      SET
        icon = a.icon,
        is_public = a.is_public,
        slug = a.slug, app_name = a.name
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type IN ('front-end', 'module')
    `);

    // Step 2a: Defensive fallback before the branch-row CHECK constraint below — any
    // non-workflow version row with a branch_id but a NULL app_name/slug (e.g. legacy
    // rows whose source apps.name/slug were NULL) gets a placeholder so the CHECK
    // doesn't fail validation. Uses the app's id as a deterministic placeholder.
    await queryRunner.query(`
      UPDATE app_versions av
      SET
        app_name = COALESCE(av.app_name, av.app_id::text),
        slug = COALESCE(av.slug, av.app_id::text)
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type IN ('front-end', 'module')
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

    // Step 4a: Dedupe (slug, branch_id, apps.type) among branch-type rows.
    // Partition by apps.type so an app and a module on the same branch can keep
    // the same slug — they're different product surfaces and the trigger below
    // also scopes by apps.type. Suffixes rename later duplicates within the
    // same (branch, type) scope.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, slug, branch_id, app_type
          FROM (
            SELECT av.id, av.slug, av.branch_id, a.type AS app_type,
                   ROW_NUMBER() OVER (
                     PARTITION BY av.slug, av.branch_id, a.type
                     ORDER BY av.created_at ASC, av.id ASC
                   ) AS rn
            FROM app_versions av
            JOIN apps a ON a.id = av.app_id
            WHERE av.version_type = 'branch' AND av.slug IS NOT NULL
          ) ranked
          WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_value := rec.slug || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1
              FROM app_versions av2
              JOIN apps a2 ON a2.id = av2.app_id
              WHERE av2.version_type = 'branch'
                AND av2.slug = new_value
                AND av2.branch_id IS NOT DISTINCT FROM rec.branch_id
                AND a2.type IS NOT DISTINCT FROM rec.app_type
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET slug = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Step 4b: Dedupe (app_name, branch_id, apps.type) among branch-type rows.
    // Same algorithm as Step 4a; app_name and slug can collide independently.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, app_name, branch_id, app_type
          FROM (
            SELECT av.id, av.app_name, av.branch_id, a.type AS app_type,
                   ROW_NUMBER() OVER (
                     PARTITION BY av.app_name, av.branch_id, a.type
                     ORDER BY av.created_at ASC, av.id ASC
                   ) AS rn
            FROM app_versions av
            JOIN apps a ON a.id = av.app_id
            WHERE av.version_type = 'branch' AND av.app_name IS NOT NULL
          ) ranked
          WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_value := rec.app_name || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1
              FROM app_versions av2
              JOIN apps a2 ON a2.id = av2.app_id
              WHERE av2.version_type = 'branch'
                AND av2.app_name = new_value
                AND av2.branch_id IS NOT DISTINCT FROM rec.branch_id
                AND a2.type IS NOT DISTINCT FROM rec.app_type
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET app_name = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Step 4c: Trigger-based uniqueness scoped by apps.type. Replaces the
    // partial unique indexes that previously included a denormalized type column
    // on app_versions — apps.type can't be referenced from an index predicate,
    // so we enforce via BEFORE INSERT/UPDATE triggers that join apps.
    //
    // pg_advisory_xact_lock on (branch_id, app_type, key_value) closes the
    // read-then-insert race that a naked EXISTS leaves open. Raised as ERRCODE
    // 23505 with the original index name so catchDbException's substring match
    // continues to work without changes to db_constraints.constants.ts.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_slug_branch_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
      BEGIN
        IF NEW.version_type::text <> 'branch' OR NEW.slug IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avs:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || NEW.slug,
          0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE av.version_type::text = 'branch'
            AND av.slug = NEW.slug
            AND av.branch_id IS NOT DISTINCT FROM NEW.branch_id
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_slug_branch_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_app_versions_slug_branch_unique
        ON app_versions
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_slug_branch_unique
        BEFORE INSERT OR UPDATE OF slug, branch_id, version_type, app_id
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_slug_branch_unique()
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_app_name_branch_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
      BEGIN
        IF NEW.version_type::text <> 'branch' OR NEW.app_name IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avn:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || NEW.app_name,
          0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE av.version_type::text = 'branch'
            AND av.app_name = NEW.app_name
            AND av.branch_id IS NOT DISTINCT FROM NEW.branch_id
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_app_name_branch_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_app_versions_app_name_branch_unique
        ON app_versions
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_app_name_branch_unique
        BEFORE INSERT OR UPDATE OF app_name, branch_id, version_type, app_id
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_app_name_branch_unique()
    `);

    // Step 5: Clean apps table for non-workflows (slug = id placeholder for existing
    // constraint). Same enum spelling as Step 2 — 'front-end' with a hyphen.
    await queryRunner.query(`
      UPDATE apps
      SET slug = id, name = NULL, icon = NULL, is_public = false
      WHERE type IN ('front-end', 'module')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
