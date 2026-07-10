import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Merges enforce_app_versions_workflow_slug_unique (1782300000000) into
 * enforce_app_versions_default_branch_slug_unique (last touched by 1782400000000).
 *
 * Since 1782400000000 backfilled a real (default-branch) branch_id onto every
 * workflow app_versions row, the two triggers have been cooperating rather than
 * competing: enforce_app_versions_default_branch_slug_unique bails out immediately
 * for apps.type = 'workflow', deferring entirely to the dedicated workflow
 * function. That division of labor is correct but no longer buys anything now
 * that workflows share branch_id with every other type — it's two BEFORE
 * triggers on the same event where one exists solely to say "not my job."
 *
 * This collapses them into one function under the pre-existing name
 * (referenced in code comments at apps/repository.ts and apps/util.service.ts,
 * so keeping it avoids a doc-comment update sweep) with an internal branch:
 *   - type = 'workflow'    → exclude by app_id (siblings of the same workflow
 *                            intentionally share a slug), no branch_id/is_default
 *                            gate, raises 'app_versions_workflow_slug_unique'.
 *   - everything else      → unchanged: exclude by app_id + id, gated on the
 *                            default branch, raises
 *                            'app_versions_default_branch_slug_unique'.
 * Both exception names are preserved verbatim — apps/util.service.ts's
 * catchDbException matches on these strings, and
 * workflow-slug-trigger.e2e-spec.ts asserts on /app_versions_workflow_slug_unique/.
 *
 * Trigger column list is the superset (slug, branch_id, app_id) of the two
 * originals — trg_app_versions_workflow_slug_unique was slug-only, so this also
 * makes workflow slug re-validate on app_id reparenting, matching what
 * non-workflow rows already got from 1781741000000.
 *
 * No data changes — pure trigger consolidation.
 */
export class MergeWorkflowSlugUniqueTrigger1782500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_workflow_slug_unique ON app_versions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_workflow_slug_unique()`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_default_branch_slug_unique ON app_versions`);

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

    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_default_branch_slug_unique
        BEFORE INSERT OR UPDATE OF slug, branch_id, app_id
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_default_branch_slug_unique()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_default_branch_slug_unique ON app_versions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_default_branch_slug_unique()`);

    // Restore the pre-merge pair: the non-workflow function verbatim from
    // 1782400000000's up(), plus the dedicated workflow function/trigger verbatim
    // from 1782300000000's up().
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
        IF v_app_type IS NULL OR v_app_type = 'workflow' THEN
          RETURN NEW; -- workflows are handled exclusively by enforce_app_versions_workflow_slug_unique
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
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_default_branch_slug_unique
        BEFORE INSERT OR UPDATE OF slug, branch_id, app_id
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION enforce_app_versions_default_branch_slug_unique()
    `);

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
      CREATE TRIGGER trg_app_versions_workflow_slug_unique
        BEFORE INSERT OR UPDATE OF slug ON app_versions
        FOR EACH ROW EXECUTE FUNCTION enforce_app_versions_workflow_slug_unique()
    `);
  }
}
