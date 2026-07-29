import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Workflow app_versions slug uniqueness — instance-wide, case-insensitive, scoped to
 * apps.type = 'workflow'. Mirrors 1779400000000's default-branch trigger pattern, with
 * one critical scoping difference: the collision check excludes by av.app_id, not av.id.
 *
 * Why: a single workflow has multiple app_versions rows over its lifetime (draft,
 * published, released — createVersion never branches for workflows), and after
 * 1782250000000's backfill they all carry the SAME slug (copied from the one apps.slug
 * value). Front-end/module's triggers can scope by av.id because publish detaches
 * branch_id from the just-published row, leaving at most one qualifying row per app at
 * a time. Workflows have no such detachment, so av.id-scoping would make a workflow's
 * own createVersion calls collide with their own sibling rows. av.app_id-scoping fixes
 * this (reject only when a DIFFERENT app holds the slug).
 *
 * Depends on 1782250000000 (dedupe apps.slug -> backfill app_versions from apps -> zero
 * out apps.*) having already run — CREATE TRIGGER does not validate existing rows, only
 * future writes, so this only works cleanly if the data is already consistent by the
 * time the trigger goes live.
 */
export class AddWorkflowSlugUniqueTrigger1782300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
