import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills branch_id on every workflow app_versions row with the org's default branch,
 * then drops the workflow exemption on branch_id NOT NULL (Task 0's
 * enforce_app_versions_branch_id_required trigger), replacing it with a plain
 * column-level NOT NULL.
 *
 * Safe now (wasn't when Task 0 ran): workflow app_versions rows carry app_name/slug as of
 * Task 1's backfill and Task 3's write-path unification, so chk_app_versions_branch_metadata
 * (branch_id IS NULL OR (app_name IS NOT NULL AND slug IS NOT NULL)) holds once branch_id
 * is populated. Every org already has a default organization_git_sync_branches row —
 * guaranteed by the earlier EnsureDefaultBranchForAllOrganizations migration — so no
 * WorkspaceBranch rows need to be created here.
 *
 * Side effect discovered while implementing this migration (not anticipated by the
 * originating plan text): giving workflows a real (default-branch) branch_id silently
 * activates `enforce_app_versions_default_branch_slug_unique` (from
 * 1781741000000-MakeAppVersionBranchIdNotNullAndGitSyncFlags) for workflow rows too — it
 * short-circuits on `NEW.branch_id IS NULL`, which was always true for workflows until
 * now. That generic, type-scoped trigger and Task 1's dedicated
 * `enforce_app_versions_workflow_slug_unique` (1782300000000-AddWorkflowSlugUniqueTrigger)
 * both fire BEFORE INSERT OR UPDATE OF slug and enforce materially the same invariant
 * (workflow slug unique across apps of type 'workflow'); Postgres runs BEFORE triggers in
 * trigger-name order, so `trg_app_versions_default_branch_slug_unique` (alphabetically
 * before `trg_app_versions_workflow_slug_unique`) now wins the race and raises its own
 * exception name first. Functionally harmless (both reject the same collision), but it's
 * a needless duplicate check and breaks callers matching on the specific exception name
 * (see workflow-slug-trigger.e2e-spec.ts). Fix: make the generic trigger defer to Task
 * 1's dedicated one for workflow rows, restoring the pre-Task-3.5 division of labor now
 * that workflows share the branch_id column with everything else.
 */
export class BackfillWorkflowBranchIdAndEnforceNotNull1782400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    await queryRunner.query(`
      UPDATE app_versions av
      SET branch_id = wb.id
      FROM apps a
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = a.organization_id AND wb.is_default = true
      WHERE av.app_id = a.id AND a.type = 'workflow' AND av.branch_id IS NULL
    `);

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_branch_id_required ON app_versions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_app_versions_branch_id_required()`);

    await queryRunner.query(`ALTER TABLE app_versions ALTER COLUMN branch_id SET NOT NULL`);

    // Defer to Task 1's dedicated workflow slug trigger — see the class doc above.
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_versions ALTER COLUMN branch_id DROP NOT NULL`);

    // Restore Task 0's trigger so a rollback returns to a working state.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_branch_id_required()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.branch_id IS NULL AND (SELECT type FROM apps WHERE id = NEW.app_id) <> 'workflow' THEN
          RAISE EXCEPTION 'null value in column "branch_id" violates not-null constraint'
            USING ERRCODE = 'not_null_violation';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_branch_id_required
        BEFORE INSERT OR UPDATE OF branch_id, app_id ON app_versions
        FOR EACH ROW EXECUTE FUNCTION enforce_app_versions_branch_id_required()
    `);
    // Does NOT re-null workflow branch_id — down() is a schema-only revert here, not a
    // data revert, matching the plan's established data-migration convention.

    // Restore the pre-Task-3.5 body of enforce_app_versions_default_branch_slug_unique
    // (without the workflow short-circuit) — verbatim from
    // 1781741000000-MakeAppVersionBranchIdNotNullAndGitSyncFlags's up().
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
