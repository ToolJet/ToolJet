import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Workflow app_versions slug uniqueness — instance-wide, case-insensitive, scoped to
 * apps.type = 'workflow'. Mirrors 1779400000000's default-branch trigger pattern, with
 * one critical scoping difference: the collision check excludes by av.app_id, not av.id.
 *
 * Why: a single workflow has multiple app_versions rows over its lifetime (draft,
 * published, released — createVersion never branches for workflows), and after the
 * backfill below they all carry the SAME slug (copied from the one apps.slug value).
 * Front-end/module's triggers can scope by av.id because publish detaches branch_id
 * from the just-published row, leaving at most one qualifying row per app at a time.
 * Workflows have no such detachment, so av.id-scoping would make a workflow's own
 * createVersion calls collide with their own sibling rows. av.app_id-scoping fixes this
 * (reject only when a DIFFERENT app holds the slug).
 *
 * Ordering: dedupe apps.slug -> backfill app_versions from apps -> zero out apps.* ->
 * install the trigger LAST, so it never fires during this migration's own data
 * manipulation.
 *
 * apps.slug keeps its existing entity-level UNIQUE constraint (APP_SLUG_UNIQUE /
 * "UQ_35eef0fb1f3f2b435b8b6d82ba0", from `@Column({ unique: true })` on App.slug —
 * present in every edition, not Cloud-only). It is NOT dropped here: setting
 * `apps.slug = id` (Step 3 below) is itself unique (every app has a distinct id), so it
 * never collides — the exact same placeholder pattern 1778000000000 already used for
 * front-end/module without touching this constraint.
 */
export class AddWorkflowSlugUniqueTrigger1782300000000 implements MigrationInterface {
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

    // Step 4: Install the trigger LAST — CREATE TRIGGER does not validate existing rows,
    // only future writes, so installing it after data is already consistent means it
    // never fires during this migration's own UPDATEs above.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_workflow_slug_unique()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.slug IS NULL THEN RETURN NEW; END IF;
        IF (SELECT type FROM apps WHERE id = NEW.app_id) <> 'workflow' THEN RETURN NEW; END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended('avws:' || LOWER(NEW.slug), 0));

        IF EXISTS (
          SELECT 1 FROM app_versions av JOIN apps a ON a.id = av.app_id
          WHERE LOWER(av.slug) = LOWER(NEW.slug) AND a.type = 'workflow' AND av.app_id <> NEW.app_id
        ) THEN
          RAISE EXCEPTION 'app_versions_workflow_slug_unique' USING ERRCODE = 'unique_violation';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_app_versions_workflow_slug_unique ON app_versions
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_workflow_slug_unique
        BEFORE INSERT OR UPDATE OF slug ON app_versions
        FOR EACH ROW EXECUTE FUNCTION enforce_app_versions_workflow_slug_unique()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_workflow_slug_unique ON app_versions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_workflow_slug_unique()`);
  }
}
