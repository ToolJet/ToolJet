import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeAppVersionBranchIdNotNullAndGitSyncFlags1781741000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Goal for app_versions:
    //   • branch_id becomes mandatory (NOT NULL).
    //   • add is_synced  — static marker: the row originated from gitsync (set once
    //                      here from the pre-backfill branch_id state).
    //   • add is_git_sync — operational flag: under gitsync this is the active
    //                      default-branch row that runtime picks; toggled later by
    //                      the application. Initialised identically to is_synced.
    //   • backfill branch_id = org default branch for the few rows still NULL.
    //   • redefine the name/slug uniqueness triggers so the DEFAULT branch may hold
    //     multiple rows for the SAME app (gitsync-off versions), enforcing
    //     uniqueness only across apps; feature branches keep strict per-branch
    //     uniqueness. All scoped by app type, as before.
    //
    // Depends on every org having a default branch (EnsureDefaultBranchForAllOrganizations).
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // ── 1. Flag columns (set from the ORIGINAL branch_id state, before backfill) ──
    await queryRunner.query(`ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS is_synced boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS is_git_sync boolean NOT NULL DEFAULT false`);

    // Existing branch-associated rows are the synced/gitsync rows. The rows that
    // are still branch_id IS NULL here are the non-gitsync ones and stay false on
    // both flags even after we backfill their branch_id below. is_stub rows always
    // have a branch_id, so the is_git_sync requirement for stubs is covered.
    await queryRunner.query(`
      UPDATE app_versions
      SET is_synced = true, is_git_sync = true
      WHERE branch_id IS NOT NULL
    `);

    // ── 2. Drop the name/slug triggers + functions and the gating CHECK ──────────
    // Triggers are dropped before the backfill so the one-time branch_id assignment
    // is not re-validated by stale rules; the new rules are installed in step 4.
    // The bump-updated-at trigger is intentionally left in place.
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_app_name_branch_unique ON app_versions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_slug_branch_unique ON app_versions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_default_branch_slug_unique ON app_versions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_slug_default_branch_unique ON app_versions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_app_name_branch_unique()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_slug_branch_unique()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_default_branch_slug_unique()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_slug_default_branch_unique()`);

    // branch_id ⇒ DRAFT — blocks the PUBLISHED backfill below. Drop it.
    await queryRunner.query(`
      ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS chk_app_versions_branched_implies_draft
    `);

    // ── 3. Backfill branch_id = org default branch, then enforce NOT NULL ────────
    // Covers the remaining NULL rows: DRAFT version rows and PUBLISHED rows. All of
    // them already carry app_name/slug, so chk_app_versions_branch_metadata holds.
    await queryRunner.query(`
      UPDATE app_versions av
      SET branch_id = wb.id
      FROM apps a
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = a.organization_id AND wb.is_default = true
      WHERE av.app_id = a.id
        AND av.branch_id IS NULL
    `);

    await queryRunner.query(`ALTER TABLE app_versions ALTER COLUMN branch_id SET NOT NULL`);

    // branch_id is mandatory now, so ON DELETE SET NULL can no longer satisfy the
    // NOT NULL column. Switch the FK to CASCADE (matches data_source_versions):
    // deleting a branch deletes its app_versions.
    await queryRunner.query(`ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS fk_app_versions_branch`);
    await queryRunner.query(`
      ALTER TABLE app_versions
        ADD CONSTRAINT fk_app_versions_branch
        FOREIGN KEY (branch_id) REFERENCES organization_git_sync_branches(id) ON DELETE CASCADE
    `);

    // Tighten the single-draft-per-(app,branch) indexes to is_git_sync rows only.
    // Gitsync-off can keep multiple entries on the default branch; gitsync-on
    // operates a single row. So per (app_id, branch_id) there must be at most one
    // is_git_sync row for each is_stub value — one (is_git_sync, non-stub draft)
    // and one (is_git_sync, stub draft). Rows with is_git_sync = false are exempt.
    await queryRunner.query(`DROP INDEX IF EXISTS app_versions_app_default_branch_draft_unique`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX app_versions_app_default_branch_draft_unique
        ON app_versions (app_id, branch_id)
        WHERE status = 'DRAFT'::version_status_enum
          AND version_type = 'version'::app_version_type
          AND is_stub = false
          AND is_git_sync = true
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS app_versions_app_default_branch_draft_unique_ensure_single_stub`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX app_versions_app_default_branch_draft_unique_ensure_single_stub
        ON app_versions (app_id, branch_id)
        WHERE status = 'DRAFT'::version_status_enum
          AND version_type = 'version'::app_version_type
          AND is_stub = true
          AND is_git_sync = true
    `);

    // ── 4. New uniqueness rules ──────────────────────────────────────────────────

    // Name (app_name). Compared within the same branch_id (apps.name is unique per
    // org+type, and each org owns its default branch). On the DEFAULT branch the
    // same app may have many rows, so uniqueness is enforced only across apps
    // (app_id <> NEW.app_id). On FEATURE branches it stays strict (id <> NEW.id).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_app_name_branch_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
        v_is_default boolean;
      BEGIN
        IF NEW.app_name IS NULL OR NEW.branch_id IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT is_default INTO v_is_default
        FROM organization_git_sync_branches WHERE id = NEW.branch_id;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avn:' || NEW.branch_id::text || '|' || v_app_type || '|' || NEW.app_name, 0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE av.app_name = NEW.app_name
            AND av.branch_id = NEW.branch_id
            AND a.type = v_app_type
            AND (
              (v_is_default IS TRUE  AND av.app_id <> NEW.app_id) OR
              (v_is_default IS NOT TRUE AND av.id <> NEW.id)
            )
        ) THEN
          RAISE EXCEPTION 'app_versions_app_name_branch_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_app_name_branch_unique
        BEFORE INSERT OR UPDATE OF app_name, branch_id, app_id
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_app_name_branch_unique()
    `);

    // Slug on FEATURE branches: strict per-branch uniqueness (rule b), AND must not
    // collide with any OTHER app's slug on any default branch (rule e). Slugs are
    // global (apps.slug is globally unique), so the default-branch check spans all
    // default branches.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_slug_branch_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
        v_is_default boolean;
      BEGIN
        IF NEW.slug IS NULL OR NEW.branch_id IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT is_default INTO v_is_default
        FROM organization_git_sync_branches WHERE id = NEW.branch_id;
        IF v_is_default IS TRUE THEN
          RETURN NEW; -- default branch handled by enforce_app_versions_default_branch_slug_unique
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avs:' || NEW.branch_id::text || '|' || v_app_type || '|' || LOWER(NEW.slug), 0
        ));

        -- (b) unique within this feature branch
        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE LOWER(av.slug) = LOWER(NEW.slug)
            AND av.branch_id = NEW.branch_id
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_slug_branch_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        -- (e) must not exist on another app's default branch
        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          JOIN organization_git_sync_branches wb ON wb.id = av.branch_id AND wb.is_default = true
          WHERE LOWER(av.slug) = LOWER(NEW.slug)
            AND a.type = v_app_type
            AND av.app_id <> NEW.app_id
        ) THEN
          RAISE EXCEPTION 'app_versions_default_branch_slug_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_slug_branch_unique
        BEFORE INSERT OR UPDATE OF slug, branch_id, app_id
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_slug_branch_unique()
    `);

    // Slug on the DEFAULT branch (rule d): unique across apps only (same app may
    // have multiple default-branch rows). Spans all default branches (global slug).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_default_branch_slug_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
        v_is_default boolean;
      BEGIN
        IF NEW.slug IS NULL OR NEW.branch_id IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT is_default INTO v_is_default
        FROM organization_git_sync_branches WHERE id = NEW.branch_id;
        IF v_is_default IS NOT TRUE THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avdbs:' || v_app_type || '|' || LOWER(NEW.slug), 0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          JOIN organization_git_sync_branches wb ON wb.id = av.branch_id AND wb.is_default = true
          WHERE LOWER(av.slug) = LOWER(NEW.slug)
            AND a.type = v_app_type
            AND av.app_id <> NEW.app_id
        ) THEN
          RAISE EXCEPTION 'app_versions_default_branch_slug_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_default_branch_slug_unique
        BEFORE INSERT OR UPDATE OF slug, branch_id, app_id
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_default_branch_slug_unique()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort structural rollback. Backfilled branch_id values and the flag
    // columns' data are not recoverable; this restores the prior schema objects.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Drop new triggers/functions.
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_app_name_branch_unique ON app_versions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_slug_branch_unique ON app_versions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_default_branch_slug_unique ON app_versions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_app_name_branch_unique()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_slug_branch_unique()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_default_branch_slug_unique()`);

    // Restore FK to ON DELETE SET NULL and relax NOT NULL.
    await queryRunner.query(`ALTER TABLE app_versions ALTER COLUMN branch_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS fk_app_versions_branch`);
    await queryRunner.query(`
      ALTER TABLE app_versions
        ADD CONSTRAINT fk_app_versions_branch
        FOREIGN KEY (branch_id) REFERENCES organization_git_sync_branches(id) ON DELETE SET NULL
    `);

    // Restore the gating CHECK.
    await queryRunner.query(`
      ALTER TABLE app_versions
        ADD CONSTRAINT chk_app_versions_branched_implies_draft
        CHECK (branch_id IS NULL OR status = 'DRAFT'::version_status_enum)
    `);

    // Restore the single-draft-per-(app,branch) indexes to their original predicate
    // (without is_git_sync) before the column is dropped.
    await queryRunner.query(`DROP INDEX IF EXISTS app_versions_app_default_branch_draft_unique`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX app_versions_app_default_branch_draft_unique
        ON app_versions (app_id, branch_id)
        WHERE status = 'DRAFT'::version_status_enum
          AND version_type = 'version'::app_version_type
          AND is_stub = false
          AND branch_id IS NOT NULL
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS app_versions_app_default_branch_draft_unique_ensure_single_stub`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX app_versions_app_default_branch_draft_unique_ensure_single_stub
        ON app_versions (app_id, branch_id)
        WHERE status = 'DRAFT'::version_status_enum
          AND version_type = 'version'::app_version_type
          AND is_stub = true
          AND branch_id IS NOT NULL
    `);

    // Drop the flag columns.
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS is_git_sync`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS is_synced`);

    // Recreate the original four functions + triggers verbatim.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_app_name_branch_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
      BEGIN
        IF NEW.app_name IS NULL
           OR NOT (
             NEW.version_type::text = 'branch'
             OR (NEW.version_type::text = 'version' AND NEW.branch_id IS NOT NULL)
           ) THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avn:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || NEW.app_name, 0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE (
              av.version_type::text = 'branch'
              OR (av.version_type::text = 'version' AND av.branch_id IS NOT NULL)
            )
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
      CREATE TRIGGER trg_app_versions_app_name_branch_unique
        BEFORE INSERT OR UPDATE OF app_name, branch_id, version_type, app_id
        ON app_versions FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_app_name_branch_unique()
    `);

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
          'avs:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || LOWER(NEW.slug), 0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE av.version_type::text = 'branch'
            AND LOWER(av.slug) = LOWER(NEW.slug)
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
      CREATE TRIGGER trg_app_versions_slug_branch_unique
        BEFORE INSERT OR UPDATE OF slug, branch_id, version_type, app_id
        ON app_versions FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_slug_branch_unique()
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_default_branch_slug_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_is_default boolean;
        v_app_type varchar;
      BEGIN
        IF NEW.branch_id IS NULL OR NEW.slug IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT is_default INTO v_is_default
        FROM organization_git_sync_branches WHERE id = NEW.branch_id;
        IF v_is_default IS NOT TRUE THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avdbs:' || v_app_type || '|' || LOWER(NEW.slug), 0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          JOIN organization_git_sync_branches wb ON wb.id = av.branch_id AND wb.is_default = true
          WHERE LOWER(av.slug) = LOWER(NEW.slug)
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_default_branch_slug_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_default_branch_slug_unique
        BEFORE INSERT OR UPDATE OF slug
        ON app_versions FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_default_branch_slug_unique()
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_slug_default_branch_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
      BEGIN
        IF NEW.status::text <> 'DRAFT'
           OR NEW.branch_id IS NULL
           OR NEW.version_type::text <> 'version'
           OR NEW.slug IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avsdb:' || v_app_type || '|' || LOWER(NEW.slug), 0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE av.status::text = 'DRAFT'
            AND av.branch_id IS NOT NULL
            AND av.version_type::text = 'version'
            AND LOWER(av.slug) = LOWER(NEW.slug)
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_slug_default_branch_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_slug_default_branch_unique
        BEFORE INSERT OR UPDATE OF slug, status, branch_id, version_type, app_id
        ON app_versions FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_slug_default_branch_unique()
    `);
  }
}
