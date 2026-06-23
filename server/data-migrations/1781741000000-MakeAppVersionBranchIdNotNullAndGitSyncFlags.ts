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

    // ── 1. Flag backfill (set from the ORIGINAL branch_id state, before backfill) ──
    // The is_synced / is_git_sync columns are created up front by the schema migration
    // AddSyncFlagColumnsToVersions (migrations/) so they exist before any entity-based
    // data-migration runs; here we only backfill them.
    //
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

    // Slug uniqueness is INSTANCE-LEVEL but scoped by app type: a slug belongs to at
    // most one app of a given type across the entire instance (mirrors the global
    // apps.slug intent, but a module and a front-end app may share a slug). So the
    // check is "is this slug used by a DIFFERENT app of the SAME type anywhere?" —
    // independent of branch and default-ness. The same app may reuse its own slug
    // across all of its rows/branches.
    //
    // Two functions are kept (feature-branch rows vs default-branch rows) only so the
    // raised constraint name matches what the application maps; the check body is the
    // same instance-wide, type-scoped, cross-app lookup in both.
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

        -- instance-wide lock on (type, slug)
        PERFORM pg_advisory_xact_lock(hashtextextended('avslug:' || v_app_type || '|' || LOWER(NEW.slug), 0));

        -- instance-level, type-scoped: slug must not belong to another app of the same type
        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE LOWER(av.slug) = LOWER(NEW.slug)
            AND a.type = v_app_type
            AND av.app_id <> NEW.app_id
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
        BEFORE INSERT OR UPDATE OF slug, branch_id, app_id
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_slug_branch_unique()
    `);

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

        PERFORM pg_advisory_xact_lock(hashtextextended('avslug:' || v_app_type || '|' || LOWER(NEW.slug), 0));

        -- instance-level, type-scoped: slug must not belong to another app of the same type
        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
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

    // ── Metadata propagation across an app's version rows ────────────────
    // When the four user-facing fields (app_name, slug, is_public, icon) are edited
    // on a DRAFT version_type='version' row, copy them to all other version_type=
    // 'version' rows of the same app (so DRAFT and PUBLISHED snapshots stay in sync).
    // Applies regardless of gitsync state.
    //
    // Stubs are excluded entirely: a stub (is_stub = true) is neither a source nor a
    // target. When a stub is converted to non-stub (is_stub true -> false) the trigger
    // fires (is_stub is in the trigger columns / WHEN) and the now-real draft
    // propagates — so is_stub appears in the fire list even though it is not copied.
    //
    // Loop safety: the propagation UPDATE re-fires this AFTER trigger on each sibling.
    // pg_trigger_depth() > 1 short-circuits those cascaded fires, so it runs exactly
    // one level deep. The WHEN clause fires only on real changes, and the IS DISTINCT
    // FROM filter skips rows already in sync (avoids redundant writes). Same-app
    // copies never trip the slug/name uniqueness triggers (those are cross-app).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION propagate_app_version_metadata()
      RETURNS TRIGGER AS $$
      BEGIN
        IF pg_trigger_depth() > 1 THEN
          RETURN NEW; -- cascaded fire from our own UPDATE below; do not recurse
        END IF;

        -- source must be a NON-STUB DRAFT version row
        IF NEW.version_type::text <> 'version' OR NEW.status::text <> 'DRAFT' OR NEW.is_stub THEN
          RETURN NEW;
        END IF;

        UPDATE app_versions
        SET app_name  = NEW.app_name,
            slug      = NEW.slug,
            is_public = NEW.is_public,
            icon      = NEW.icon
        WHERE app_id = NEW.app_id
          AND version_type = 'version'
          AND is_stub = false          -- never overwrite stub rows
          AND id <> NEW.id
          AND (
            app_name  IS DISTINCT FROM NEW.app_name OR
            slug      IS DISTINCT FROM NEW.slug OR
            is_public IS DISTINCT FROM NEW.is_public OR
            icon      IS DISTINCT FROM NEW.icon
          );

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_propagate_app_version_metadata
        AFTER UPDATE OF app_name, slug, is_public, icon, is_stub
        ON app_versions
        FOR EACH ROW
        WHEN (
          OLD.app_name  IS DISTINCT FROM NEW.app_name OR
          OLD.slug      IS DISTINCT FROM NEW.slug OR
          OLD.is_public IS DISTINCT FROM NEW.is_public OR
          OLD.icon      IS DISTINCT FROM NEW.icon OR
          OLD.is_stub   IS DISTINCT FROM NEW.is_stub
        )
        EXECUTE FUNCTION propagate_app_version_metadata()
    `);
    // Also propagate when a DRAFT version row is INSERTED (e.g. a draft created/
    // recreated after a PUBLISHED row already exists — gitsync pull/import where rows
    // arrive in any order). Reuses the same function; a separate trigger is needed
    // because a WHEN clause referencing OLD is invalid for INSERT. The function's
    // depth guard + is_stub/IS DISTINCT FROM filters keep it loop-safe and a no-op for
    // the common case of a first/only version row (or a stub).
    await queryRunner.query(`
      CREATE TRIGGER trg_propagate_app_version_metadata_insert
        AFTER INSERT
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION propagate_app_version_metadata()
    `);

    // ── Published version rows pull metadata from the DRAFT (source of truth) ──
    // The reverse of the propagation above: the DRAFT version_type='version' row is
    // the ONLY source of truth for app_name/slug/is_public/icon. When a PUBLISHED
    // version_type='version' row is inserted or has those fields updated, overwrite
    // NEW with the draft's current values, so draft and published stay in sync.
    //
    // This is a BEFORE trigger that only mutates NEW (its own row) — it issues no
    // further writes, so it cannot recurse. The trigger name is prefixed
    // 'trg_app_versions_0_' so it fires BEFORE the name/slug uniqueness triggers
    // (BEFORE row triggers run in trigger-name order): they then validate the
    // draft-sourced values, not whatever was passed in.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sync_published_app_version_metadata_from_draft()
      RETURNS TRIGGER AS $$
      DECLARE
        d RECORD;
      BEGIN
        -- excluded for stubs; only a non-stub PUBLISHED version row pulls from draft
        IF NEW.version_type::text <> 'version' OR NEW.status::text <> 'PUBLISHED' OR NEW.is_stub THEN
          RETURN NEW;
        END IF;

        -- source of truth is the NON-STUB DRAFT version row
        SELECT app_name, slug, is_public, icon INTO d
        FROM app_versions
        WHERE app_id = NEW.app_id
          AND version_type = 'version'
          AND status = 'DRAFT'
          AND is_stub = false
        ORDER BY is_git_sync DESC, updated_at DESC
        LIMIT 1;

        IF FOUND THEN
          NEW.app_name  := d.app_name;
          NEW.slug      := d.slug;
          NEW.is_public := d.is_public;
          NEW.icon      := d.icon;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_0_sync_published_meta_from_draft
        BEFORE INSERT OR UPDATE OF app_name, slug, is_public, icon, is_stub
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION sync_published_app_version_metadata_from_draft()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort structural rollback. Backfilled branch_id values and the flag
    // columns' data are not recoverable; this restores the prior schema objects.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Drop new triggers/functions.
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_0_sync_published_meta_from_draft ON app_versions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS sync_published_app_version_metadata_from_draft()`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_propagate_app_version_metadata_insert ON app_versions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_propagate_app_version_metadata ON app_versions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS propagate_app_version_metadata()`);
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
