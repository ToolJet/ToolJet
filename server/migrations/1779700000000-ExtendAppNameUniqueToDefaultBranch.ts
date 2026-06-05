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
 * Uniqueness key stays (LOWER(app_name), branch_id, apps.type) and remains
 * branch-scoped via `branch_id IS NOT DISTINCT FROM`. Matching is case-insensitive
 * (LOWER) to mirror the sibling default-branch slug trigger — "Dashboard" and
 * "dashboard" collide. `av.id <> NEW.id` is sufficient (we don't
 * need `av.app_id <> NEW.app_id`) because an app keeps at most one version-type row
 * with a non-null branch_id: publishing detaches branch_id to NULL on the released
 * snapshot (versions/util.service.ts), so released versions fall outside the guard.
 * This mirrors the sibling enforce_app_versions_default_branch_slug_unique trigger.
 */
export class ExtendAppNameUniqueToDefaultBranch1779700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the statement_timeout for this transaction: Step 0's per-app loop and
    // the Step 1 dedupe loop below each touch the whole app_versions table and
    // could otherwise be cancelled (57014) on a large instance. Detaching rather
    // than deleting in Step 0 keeps it cheap (no cascade). SET LOCAL reverts on
    // commit/rollback.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Step 0: Normalise BRANCH-type rows that are sitting on the default branch.
    // The model never puts version_type='branch' rows on the default branch
    // (branch rows belong to sub-branches), but malformed/legacy data could.
    // Such a row shares the default branch_id namespace with the version-type
    // default-branch rows, so Step 1's rename (which ranks only version-type
    // rows) and the trigger would otherwise leave a latent cross-type collision.
    //
    // Per app, on the default branch:
    //   - If a DRAFT version-type row already exists, the branch-type row(s) are
    //     redundant -> detach them to branchless PUBLISHED snapshots
    //     (version_type='version', status='PUBLISHED', branch_id=NULL) so their
    //     history survives without occupying the default-branch namespace.
    //   - Otherwise, promote the most-recently-updated branch-type row to a
    //     DRAFT version-type row and detach the rest the same way. Only one is
    //     promoted so app_versions_app_default_branch_draft_unique (one DRAFT
    //     version per app/branch, from 1779200000000) still holds.
    // Detaching (vs deleting) avoids the ON DELETE CASCADE cost on child entities
    // and mirrors how 1779200000000 / 1779300000000 retire branched rows.
    // Postcondition: the default branch holds at most one DRAFT version-type row
    // per affected app and no branch-type rows, so Step 1's rename then covers
    // any app_name duplication uniformly across version-type rows.
    await queryRunner.query(`
      DO $$
      DECLARE
        app_rec RECORD;
        keep_id UUID;
        row_cnt INT;
        promoted INT := 0;
        detached INT := 0;
      BEGIN
        FOR app_rec IN
          SELECT av.app_id, wb.id AS default_branch_id
          FROM app_versions av
          JOIN organization_git_sync_branches wb
            ON wb.id = av.branch_id AND wb.is_default = true
          WHERE av.version_type::text = 'branch'
          GROUP BY av.app_id, wb.id
        LOOP
          IF EXISTS (
            SELECT 1 FROM app_versions av
            WHERE av.app_id = app_rec.app_id
              AND av.branch_id = app_rec.default_branch_id
              AND av.version_type::text = 'version'
              AND av.status = 'DRAFT'
          ) THEN
            -- A canonical DRAFT already exists; detach the branch-type rows to
            -- branchless PUBLISHED snapshots.
            UPDATE app_versions
            SET version_type = 'version', status = 'PUBLISHED', branch_id = NULL
            WHERE app_id = app_rec.app_id
              AND branch_id = app_rec.default_branch_id
              AND version_type::text = 'branch';
            GET DIAGNOSTICS row_cnt = ROW_COUNT;
            detached := detached + row_cnt;
          ELSE
            -- No DRAFT version-type row yet: keep the most-recently-updated
            -- branch-type row, detach the rest, then promote the keeper.
            SELECT id INTO keep_id
            FROM app_versions
            WHERE app_id = app_rec.app_id
              AND branch_id = app_rec.default_branch_id
              AND version_type::text = 'branch'
            ORDER BY updated_at DESC, id ASC
            LIMIT 1;

            UPDATE app_versions
            SET version_type = 'version', status = 'PUBLISHED', branch_id = NULL
            WHERE app_id = app_rec.app_id
              AND branch_id = app_rec.default_branch_id
              AND version_type::text = 'branch'
              AND id <> keep_id;
            GET DIAGNOSTICS row_cnt = ROW_COUNT;
            detached := detached + row_cnt;

            UPDATE app_versions
            SET version_type = 'version', status = 'DRAFT'
            WHERE id = keep_id;
            promoted := promoted + 1;
          END IF;
        END LOOP;

        IF promoted > 0 OR detached > 0 THEN
          RAISE NOTICE 'Step 0: normalised default-branch branch-type rows (promoted % to DRAFT version, detached % to branchless PUBLISHED).', promoted, detached;
        END IF;
      END $$;
    `);

    // The dedupe loop probes app_versions by LOWER(app_name) per iteration; back it
    // with a temp index so it doesn't degrade into sequential scans and get
    // cancelled (57014) on a large table. The temp index is dropped below.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS tmp_idx_av_dedupe_def_branch_app_name
        ON app_versions (LOWER(app_name), branch_id)
        WHERE app_name IS NOT NULL
    `);

    // Step 1: Dedupe (LOWER(app_name), branch_id, apps.type) among the newly-covered
    // set — version-type default-branch rows. BRANCH-type rows were already deduped by
    // 1778000000000, and after Step 0 none remain on the default branch, so they never
    // share a branch_id with the version-type rows scoped here. Keep the oldest row's
    // name; rename later duplicates with _N suffixes within the same type bucket.
    // Without this, existing data could be in a state where the trigger would fire on
    // the next app_name update.
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
                     PARTITION BY LOWER(av.app_name), av.branch_id, a.type
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
              WHERE LOWER(av2.app_name) = LOWER(new_value)
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
          'avn:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || LOWER(NEW.app_name),
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
            AND LOWER(av.app_name) = LOWER(NEW.app_name)
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
