import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Moves webhook enablement from apps.workflow_enabled to app_versions, so it is branch-scoped
 * and travels through git with the version. Mirrors the app_name/slug/icon/is_public mechanism:
 * a write lands on the default branch's DRAFT and a trigger fans it to that branch's other
 * version rows, published ones included — which is what lets an already-published version stay
 * triggerable after the switch is flipped.
 *
 * apps.workflow_enabled is deliberately left in place (unwritten, unread) so a rollback keeps
 * the old value; dropping it is tracked separately.
 *
 * The column and both triggers ship together on purpose: with the column present but no
 * propagation, every version published in the gap would be created false and the trigger would
 * later fan that across the workflow.
 */
export class AddWorkflowEnabledToAppVersions1787700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS workflow_enabled boolean NOT NULL DEFAULT false
    `);

    // Workflow-specific rather than an edit to propagate_app_version_metadata(): that function
    // is dropped and recreated by 1781741000000, so a CREATE OR REPLACE here would be reverted,
    // and it governs name/slug propagation for every app in the system.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.propagate_workflow_enabled() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          -- The UPDATE below re-fires this trigger at depth 2.
          IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
          IF NEW.version_type::text <> 'version' OR NEW.status::text <> 'DRAFT' OR NEW.is_stub THEN RETURN NEW; END IF;
          IF NOT EXISTS (SELECT 1 FROM apps WHERE id = NEW.app_id AND type = 'workflow') THEN RETURN NEW; END IF;
          UPDATE app_versions SET workflow_enabled = NEW.workflow_enabled
          WHERE app_id = NEW.app_id AND version_type = 'version' AND is_stub = false AND id <> NEW.id
            AND workflow_enabled IS DISTINCT FROM NEW.workflow_enabled;
          RETURN NEW; END; $$
    `);

    // BEFORE trigger that only mutates NEW, so it issues no writes and cannot recurse.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.sync_published_workflow_enabled_from_draft() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE d RECORD;
        BEGIN
          IF NEW.version_type::text <> 'version' OR NEW.status::text <> 'PUBLISHED' OR NEW.is_stub THEN RETURN NEW; END IF;
          IF NOT EXISTS (SELECT 1 FROM apps WHERE id = NEW.app_id AND type = 'workflow') THEN RETURN NEW; END IF;
          SELECT workflow_enabled INTO d FROM app_versions
          WHERE app_id = NEW.app_id AND version_type = 'version' AND status = 'DRAFT' AND is_stub = false
          ORDER BY is_synced DESC, updated_at DESC LIMIT 1;
          IF FOUND THEN NEW.workflow_enabled := d.workflow_enabled; END IF;
          RETURN NEW; END; $$
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_propagate_workflow_enabled
        AFTER UPDATE OF workflow_enabled, is_stub
        ON app_versions
        FOR EACH ROW
        WHEN (
          OLD.workflow_enabled IS DISTINCT FROM NEW.workflow_enabled OR
          OLD.is_stub          IS DISTINCT FROM NEW.is_stub
        )
        EXECUTE FUNCTION propagate_workflow_enabled()
    `);

    // A WHEN clause referencing OLD is invalid for INSERT, so the insert path needs its own
    // trigger. Covers a draft recreated after a published row already exists (revert, pull).
    await queryRunner.query(`
      CREATE TRIGGER trg_propagate_workflow_enabled_insert
        AFTER INSERT
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION propagate_workflow_enabled()
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_sync_published_workflow_enabled_from_draft
        BEFORE INSERT OR UPDATE OF workflow_enabled, status
        ON app_versions
        FOR EACH ROW
        EXECUTE FUNCTION sync_published_workflow_enabled_from_draft()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_sync_published_workflow_enabled_from_draft ON app_versions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_propagate_workflow_enabled_insert ON app_versions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_propagate_workflow_enabled ON app_versions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS sync_published_workflow_enabled_from_draft()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS propagate_workflow_enabled()`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS workflow_enabled`);
  }
}
