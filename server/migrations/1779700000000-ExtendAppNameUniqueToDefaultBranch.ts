import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Extend enforce_app_versions_app_name_branch_unique to cover default-branch rows.
 *
 * 1778000000000 installed this trigger for BRANCH-type rows only — it early-returns
 * for everything else, so two different apps could land the same app_name on the
 * same default branch (version_type = 'version', branch_id = the default branch).
 * The slug side already had dedicated default-branch triggers
 * (enforce_app_versions_slug_default_branch_unique / _default_branch_slug_unique);
 * app_name had no equivalent. This closes that gap.
 *
 * New predicate (the rows the trigger now guards):
 *   app_name IS NOT NULL
 *   AND ( version_type = 'branch'
 *         OR (version_type = 'version' AND branch_id IS NOT NULL) )
 *
 * Uniqueness key stays (app_name, branch_id, apps.type) and remains branch-scoped
 * via `branch_id IS NOT DISTINCT FROM`. `av.id <> NEW.id` is sufficient (we don't
 * need `av.app_id <> NEW.app_id`) because an app keeps at most one version-type row
 * with a non-null branch_id: publishing detaches branch_id to NULL on the released
 * snapshot (versions/util.service.ts), so released versions fall outside the guard.
 * This mirrors the sibling enforce_app_versions_default_branch_slug_unique trigger.
 */
export class ExtendAppNameUniqueToDefaultBranch1779700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The dedupe loop probes app_versions by (app_name, branch_id) per iteration;
    // back it with a temp index and drop the statement_timeout so it doesn't degrade
    // into sequential scans and get cancelled (57014) on a large table. SET LOCAL
    // reverts on commit/rollback; the temp index is dropped below.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS tmp_idx_av_dedupe_def_branch_app_name
        ON app_versions (app_name, branch_id)
        WHERE app_name IS NOT NULL
    `);

    // Step 1: Dedupe (app_name, branch_id, apps.type) among the newly-covered set —
    // version-type default-branch rows. BRANCH-type rows were already deduped by
    // 1778000000000, and they never share a branch_id with version-type rows, so we
    // scope to version-type here. Keep the oldest row's name; rename later duplicates
    // with _N suffixes within the same type bucket. Without this, existing data could
    // be in a state where the trigger would fire on the next app_name update.
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
            WHERE av.version_type::text = 'version'
              AND av.branch_id IS NOT NULL
              AND av.app_name IS NOT NULL
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
              WHERE av2.app_name = new_value
                AND av2.branch_id IS NOT DISTINCT FROM rec.branch_id
                AND a2.type IS NOT DISTINCT FROM rec.app_type
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET app_name = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS tmp_idx_av_dedupe_def_branch_app_name`);

    // Step 2: Replace the function. Guard now admits version-type default-branch rows,
    // and the EXISTS predicate matches them so collisions among default-branch rows are
    // detected (not just BRANCH-type rows).
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
          'avn:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || NEW.app_name,
          0
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

    // The trigger (trg_app_versions_app_name_branch_unique) already fires
    // BEFORE INSERT OR UPDATE OF app_name, branch_id, version_type, app_id and
    // references the function by name, so it picks up the new body automatically —
    // no trigger re-creation needed.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the BRANCH-type-only function from 1778000000000.
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
  }
}
