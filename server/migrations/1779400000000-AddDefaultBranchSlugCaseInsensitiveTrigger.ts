import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Case-insensitive default-branch slug uniqueness, scoped by apps.type.
 *
 * Complements 1779000000000's trigger (which is DRAFT-only, case-sensitive) by
 * blocking same-LOWER(slug) collisions across ALL default-branch rows — any
 * status, any version_type — within a given apps.type bucket.
 *
 * Predicate (same as the user-stated condition):
 *   NEW.branch_id IS NOT NULL AND organization_git_sync_branches.is_default(NEW.branch_id) = true
 *
 * Enforcement lives in a BEFORE trigger because:
 *   - organization_git_sync_branches.is_default isn't a column on app_versions, so a
 *     partial unique index can't reference it.
 *   - apps.type lives on the apps table for the same reason.
 *
 * Race-safety: pg_advisory_xact_lock on (app_type, lower(slug)) closes the
 * read-then-insert window a naked EXISTS would leave open. Raised as ERRCODE
 * 23505 ('unique_violation') so TypeORM treats it identically to a real
 * unique-constraint hit; the message carries the constraint name for
 * catchDbException to match. Add a DataBaseConstraints entry pointing at
 * 'app_versions_default_branch_slug_unique' if you want a custom user-facing
 * message — otherwise it falls through as a plain ConflictException.
 *
 * Trigger column scope: BEFORE INSERT OR UPDATE OF slug. Per the design
 * decision, only slug writes pay the trigger cost; branch_id / status / app_id
 * changes that would also affect membership are not covered (rare paths).
 */
export class AddDefaultBranchSlugCaseInsensitiveTrigger1779400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The dedupe loop below probes app_versions by LOWER(slug) per iteration, and
    // uniqueness here is trigger-based (Step 2) so no real index helps. Disable the
    // statement_timeout for this transaction and back the probe with a temp index so
    // it doesn't degrade into sequential scans and get cancelled (57014) on a large
    // table. SET LOCAL reverts on commit/rollback; the temp index is dropped below.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS tmp_idx_av_dedupe_def_branch_slug
        ON app_versions (LOWER(slug))
        WHERE slug IS NOT NULL
    `);

    // Step 1: Dedupe LOWER(slug) within each apps.type bucket among all
    // default-branch rows. Keep the oldest row's slug; rename later duplicates
    // with _N suffixes within the same type bucket so app and module slug
    // namespaces stay independent. Without this, existing data could be in a
    // state where the trigger would fire on the next slug update.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, slug, app_type
          FROM (
            SELECT av.id, av.slug, a.type AS app_type,
                   ROW_NUMBER() OVER (
                     PARTITION BY LOWER(av.slug), a.type
                     ORDER BY av.created_at ASC, av.id ASC
                   ) AS rn
            FROM app_versions av
            JOIN apps a ON a.id = av.app_id
            JOIN organization_git_sync_branches wb ON wb.id = av.branch_id AND wb.is_default = true
            WHERE av.slug IS NOT NULL
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
              JOIN organization_git_sync_branches wb2 ON wb2.id = av2.branch_id AND wb2.is_default = true
              WHERE LOWER(av2.slug) = LOWER(new_value)
                AND a2.type IS NOT DISTINCT FROM rec.app_type
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET slug = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Dedupe done — drop the temp index (uniqueness is trigger-based, Step 2).
    await queryRunner.query(`DROP INDEX IF EXISTS tmp_idx_av_dedupe_def_branch_slug`);

    // Step 2: Trigger function.
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
        FROM organization_git_sync_branches
        WHERE id = NEW.branch_id;

        IF v_is_default IS NOT TRUE THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avdbs:' || v_app_type || '|' || LOWER(NEW.slug),
          0
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

    // Step 3: Trigger — slug-only column scope per the design decision.
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_app_versions_default_branch_slug_unique
        ON app_versions
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_default_branch_slug_unique
        BEFORE INSERT OR UPDATE OF slug
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_default_branch_slug_unique()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_app_versions_default_branch_slug_unique
        ON app_versions
    `);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_default_branch_slug_unique()`);
  }
}
