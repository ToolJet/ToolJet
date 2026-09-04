import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillWorkflowEnabledOnAppVersions1787800000000';
const BATCH_SIZE = 500;

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
      `SELECT COUNT(*) FROM app_versions av
       JOIN apps a ON a.id = av.app_id
       WHERE a.type = 'workflow' AND av.workflow_enabled IS DISTINCT FROM a.workflow_enabled`
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Workflow version rows to backfill: ${total}`);

    let totalUpdated = 0;
    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `UPDATE app_versions av
         SET workflow_enabled = a.workflow_enabled
         FROM apps a
         WHERE a.id = av.app_id
           AND a.type = 'workflow'
           AND av.workflow_enabled IS DISTINCT FROM a.workflow_enabled
           AND av.id IN (
             SELECT av_inner.id FROM app_versions av_inner
             JOIN apps a_inner ON a_inner.id = av_inner.app_id
             WHERE a_inner.type = 'workflow'
               AND av_inner.workflow_enabled IS DISTINCT FROM a_inner.workflow_enabled
             ORDER BY av_inner.id ASC
             LIMIT $1
           )
         RETURNING av.id`,
        [BATCH_SIZE]
      );
      if (rows.length === 0) break;
      totalUpdated += rows.length;
      const percentage = total > 0 ? Math.round((totalUpdated / total) * 100) : 100;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Migration finished. Updated: ${totalUpdated}`);
  }

  public async down(): Promise<void> {
    // No down: apps.workflow_enabled is left intact by the schema migration, so it remains the
    // rollback source. Resetting the version column would discard per-branch divergence
    // created after the migration for no gain.
  }
}
