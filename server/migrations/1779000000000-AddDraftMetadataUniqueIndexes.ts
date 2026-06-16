import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces an instance-wide unique-slug invariant on default-branch DRAFT app
 * version rows, scoped by apps.type:
 *
 *   For status='DRAFT' AND branch_id IS NOT NULL AND version_type='version',
 *   (slug, apps.type) must be globally unique.
 *
 * Rationale: slug-only lookups (no branch context) fall back to the workspace's
 * default branch via AppsRepository.findAppBySlug / findBySlug. Default-branch
 * editor rows are version_type='version' + branch_id IS NOT NULL + status=DRAFT.
 * Making the slug globally unique among those rows guarantees the fallback
 * resolves to exactly one row.
 *
 * apps.type is included so apps and modules can share slugs — they're different
 * product surfaces with separate dashboards. Since apps.type isn't a column on
 * app_versions and can't be referenced from a partial unique index predicate,
 * enforcement lives in a BEFORE INSERT/UPDATE trigger that joins apps. The
 * trigger raises with ERRCODE 23505 and the original index name
 * (app_versions_slug_default_branch_unique) so catchDbException's substring
 * match continues to work unchanged.
 *
 * Sub-branch DRAFT rows (version_type='branch') keep their per-branch uniqueness
 * via the trigger added in AddMetadataColumnsToAppVersions1778000000000. Tags /
 * releases (status PUBLISHED/RELEASED) are intentionally excluded — historical
 * snapshots can carry duplicated slugs.
 *
 * Before installing the trigger, dedupe any pre-existing rows that would
 * violate it (same algorithm as Step 4a in AddMetadataColumnsToAppVersions,
 * partitioned by (slug, apps.type) for the default-branch scope).
 */
export class AddDraftMetadataUniqueIndexes1779000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The dedupe loop below probes app_versions by LOWER(slug) per iteration, and
    // uniqueness here is trigger-based (Step 2) so no real index helps. Disable the
    // statement_timeout for this transaction and back the probe with a temp index so
    // it doesn't degrade into sequential scans and get cancelled (57014) on a large
    // table. SET LOCAL reverts on commit/rollback; the temp index is dropped below.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS tmp_idx_av_dedupe_draft_slug
        ON app_versions (LOWER(slug))
        WHERE status = 'DRAFT' AND branch_id IS NOT NULL AND version_type = 'version'
    `);

    // Step 1: Dedupe (slug, apps.type) globally among default-branch DRAFT rows.
    // Keep the oldest row's slug; rename later duplicates with _N suffixes within
    // the same type bucket so app and module slug spaces are independent.
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
            WHERE av.status = 'DRAFT'
              AND av.branch_id IS NOT NULL
              AND av.version_type = 'version'
              AND av.slug IS NOT NULL
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
              WHERE av2.status = 'DRAFT'
                AND av2.branch_id IS NOT NULL
                AND av2.version_type = 'version'
                AND LOWER(av2.slug) = LOWER(new_value)
                AND a2.type IS NOT DISTINCT FROM rec.app_type
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET slug = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Dedupe done — drop the temp index (uniqueness is trigger-based, Step 2).
    await queryRunner.query(`DROP INDEX IF EXISTS tmp_idx_av_dedupe_draft_slug`);

    // Step 2: Trigger-based enforcement. Mirrors the pattern used by the
    // per-branch slug/app_name triggers in 1778000000000. Advisory lock keyed
    // on (apps.type, slug) closes the read-then-insert race window. Constraint
    // name preserved so existing db_constraints.constants.ts entries keep
    // working with catchDbException.
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
          'avsdb:' || v_app_type || '|' || LOWER(NEW.slug),
          0
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
      DROP TRIGGER IF EXISTS trg_app_versions_slug_default_branch_unique
        ON app_versions
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_slug_default_branch_unique
        BEFORE INSERT OR UPDATE OF slug, status, branch_id, version_type, app_id
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_slug_default_branch_unique()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_app_versions_slug_default_branch_unique
        ON app_versions
    `);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_slug_default_branch_unique()`);
  }
}
