import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the missing `av.id <> NEW.id` self-exclusion to the WORKFLOW branch of
 * enforce_app_versions_default_branch_slug_unique (1782500000000).
 *
 * That migration widened the trigger to fire on app_id. In a BEFORE UPDATE the row still
 * carries its OLD app_id, so `av.app_id <> NEW.app_id` alone makes the row collide with
 * itself. The two predicates are both needed: app_id exempts sibling rows of the same
 * workflow (which intentionally share a slug), id exempts the row being updated. The
 * non-workflow branch has had both since 1781741000000.
 *
 * Impact: hydration re-parents an imported version onto the real app, so every workflow
 * pulled from git failed to hydrate and stayed is_stub = true.
 *
 * Exception name and lock key unchanged — apps/util.service.ts matches on the string and
 * workflow-slug-trigger.e2e-spec.ts asserts on it.
 *
 * In data-migrations/ (not migrations/) for the reason 1782500000000 documents:
 * 1781741000000 also does CREATE OR REPLACE on this function, and all schema migrations run
 * before any data migration, so an earlier-phase fix would be clobbered on a fresh install.
 */
export class FixWorkflowSlugTriggerSelfCollision1787900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_default_branch_slug_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
        v_is_default boolean;
      BEGIN
        IF NEW.slug IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        IF v_app_type = 'workflow' THEN
          PERFORM pg_advisory_xact_lock(hashtextextended('avws:' || LOWER(NEW.slug), 0));

          IF EXISTS (
            SELECT 1
            FROM app_versions av
            JOIN apps a ON a.id = av.app_id
            WHERE LOWER(av.slug) = LOWER(NEW.slug)
              AND a.type = 'workflow'
              AND av.app_id <> NEW.app_id
              AND av.id <> NEW.id
          ) THEN
            RAISE EXCEPTION 'app_versions_workflow_slug_unique'
              USING ERRCODE = 'unique_violation';
          END IF;

          RETURN NEW;
        END IF;

        IF NEW.branch_id IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT is_default INTO v_is_default
        FROM organization_git_sync_branches WHERE id = NEW.branch_id;
        IF v_is_default IS NOT TRUE THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended('avdbs:' || v_app_type || '|' || LOWER(NEW.slug), 0));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE LOWER(av.slug) = LOWER(NEW.slug)
            AND a.type = v_app_type
            AND av.app_id <> NEW.app_id
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_default_branch_slug_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restores 1782500000000's body verbatim (workflow branch without the self-exclusion).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_default_branch_slug_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
        v_is_default boolean;
      BEGIN
        IF NEW.slug IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        IF v_app_type = 'workflow' THEN
          PERFORM pg_advisory_xact_lock(hashtextextended('avws:' || LOWER(NEW.slug), 0));

          IF EXISTS (
            SELECT 1
            FROM app_versions av
            JOIN apps a ON a.id = av.app_id
            WHERE LOWER(av.slug) = LOWER(NEW.slug)
              AND a.type = 'workflow'
              AND av.app_id <> NEW.app_id
          ) THEN
            RAISE EXCEPTION 'app_versions_workflow_slug_unique'
              USING ERRCODE = 'unique_violation';
          END IF;

          RETURN NEW;
        END IF;

        IF NEW.branch_id IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT is_default INTO v_is_default
        FROM organization_git_sync_branches WHERE id = NEW.branch_id;
        IF v_is_default IS NOT TRUE THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended('avdbs:' || v_app_type || '|' || LOWER(NEW.slug), 0));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE LOWER(av.slug) = LOWER(NEW.slug)
            AND a.type = v_app_type
            AND av.app_id <> NEW.app_id
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_default_branch_slug_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }
}
