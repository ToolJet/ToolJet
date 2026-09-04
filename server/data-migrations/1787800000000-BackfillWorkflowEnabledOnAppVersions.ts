import { MigrationProgress } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillWorkflowEnabledOnAppVersions1787800000000';
const BATCH_SIZE = 2000;

/**
 * Copies apps.workflow_enabled onto EVERY app_versions row of each workflow.
 *
 * All rows, not just the draft: today one app-level flag governs whichever version the webhook
 * resolves, so writing it everywhere is what keeps existing behaviour identical. Scoped to
 * apps.type = 'workflow' — no other app type has the concept.
 */
export class BackfillWorkflowEnabledOnAppVersions1787800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM app_versions av JOIN apps a ON a.id = av.app_id WHERE a.type = 'workflow'`
    );
    const total = parseInt(count, 10);
    if (total === 0) {
      console.log(`${MIGRATION_NAME}: no workflow versions found.`);
      return;
    }
    const progress = new MigrationProgress(MIGRATION_NAME, Math.ceil(total / BATCH_SIZE));

    // Keyset paging over a stable id order. Paging on the rows that still differ instead would
    // not terminate: propagate_workflow_enabled() fans each write across the branch's other
    // rows, so the set being paged changes underneath the cursor.
    let lastId = '00000000-0000-0000-0000-000000000000';
    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT av.id FROM app_versions av
           JOIN apps a ON a.id = av.app_id
           WHERE a.type = 'workflow' AND av.id > $1
           ORDER BY av.id ASC
           LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
      if (rows.length === 0) break;
      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE app_versions av
           SET workflow_enabled = a.workflow_enabled
           FROM apps a
           WHERE a.id = av.app_id
             AND av.id = ANY($1::uuid[])
             AND av.workflow_enabled IS DISTINCT FROM a.workflow_enabled`,
        [ids]
      );
      progress.show();
    }
  }

  public async down(): Promise<void> {
    // No down: apps.workflow_enabled is left intact by the schema migration, so it remains the
    // rollback source. Resetting the version column would discard per-branch divergence
    // created after the migration for no gain.
  }
}
