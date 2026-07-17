import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Copies workflow-app metadata (name/slug/icon/is_public) from apps.* onto
 * app_versions.*, then zeroes out apps.* — the same placeholder pattern
 * 1778000000000 already used for front-end/module. Split out of
 * 1782300000000 (which originally bundled this with trigger installation)
 * so the data-copy concern and the slug-uniqueness-trigger concern each
 * live in their own migration.
 *
 * Ordering: dedupe apps.slug -> backfill app_versions from apps -> zero out
 * apps.*. 1782300000000 installs the uniqueness trigger AFTER this runs, so
 * the trigger never fires during this migration's own UPDATEs (CREATE
 * TRIGGER doesn't validate existing rows, only future writes).
 *
 * apps.slug keeps its existing entity-level UNIQUE constraint (APP_SLUG_UNIQUE
 * / "UQ_35eef0fb1f3f2b435b8b6d82ba0", from `@Column({ unique: true })` on
 * App.slug — present in every edition, not Cloud-only). It is NOT dropped
 * here: setting `apps.slug = id` (below) is itself unique (every app has a
 * distinct id), so it never collides.
 *
 * down() is a schema-only no-op, matching this migration family's
 * established convention of not reverting data on rollback.
 */
export class CopyWorkflowAppMetaToAppVersions1782250000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Step 1: Dedupe apps.slug among workflow apps, instance-wide (not org-scoped —
    // the org-scoped eviction check being removed in the write-path tasks never saw
    // cross-org collisions, so they can't be ruled out here).
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, slug
          FROM (
            SELECT id, slug,
                   ROW_NUMBER() OVER (PARTITION BY LOWER(slug) ORDER BY created_at ASC, id ASC) AS rn
            FROM apps
            WHERE type = 'workflow' AND slug IS NOT NULL
          ) ranked
          WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_value := rec.slug || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1 FROM apps WHERE type = 'workflow' AND LOWER(slug) = LOWER(new_value)
            );
            suffix := suffix + 1;
          END LOOP;
          RAISE NOTICE 'Deduping workflow app % slug % -> %', rec.id, rec.slug, new_value;
          UPDATE apps SET slug = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Step 2: Backfill app_versions from the now-deduped apps row. Every version row
    // of a given workflow app gets the same slug/name/icon/is_public — there is no
    // per-row divergence to reconcile (workflows have only ever had one apps.slug value).
    await queryRunner.query(`
      UPDATE app_versions av
      SET slug = a.slug, app_name = a.name, icon = a.icon, is_public = a.is_public
      FROM apps a
      WHERE av.app_id = a.id AND a.type = 'workflow'
    `);

    // Step 3: Zero out apps.* for workflows, same placeholder pattern as front-end/module
    // in 1778000000000 step 5. slug=id satisfies APP_SLUG_UNIQUE (every id is distinct),
    // so the entity-level constraint is left in place, not dropped. Must run after step 2
    // (which reads apps.* before it's zeroed).
    await queryRunner.query(`
      UPDATE apps
      SET slug = id, name = NULL, icon = NULL, is_public = false
      WHERE type = 'workflow'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No data revert — matches this migration family's established convention
    // (e.g. BackfillWorkflowBranchIdAndEnforceNotNull's down()).
  }
}
