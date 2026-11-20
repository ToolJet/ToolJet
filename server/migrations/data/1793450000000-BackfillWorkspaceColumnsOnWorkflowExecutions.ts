import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillWorkspaceColumnsOnWorkflowExecutions1793450000000';
const BATCH_SIZE = 5000;

/**
 * Fills the columns AddWorkflowRunHistoryColumns1793500000100 adds, for runs created before them.
 * Runs in beforeCommit(): old pods keep writing runs during the data phase (the gate lets workflow runs
 * through), and an updated row stays locked until commit, so the update goes last to keep that lock short.
 * Only rows with no organization_id are touched, so a re-run is a no-op.
 */
export class BackfillWorkspaceColumnsOnWorkflowExecutions1793450000000 implements MigrationInterface {
  public async up(): Promise<void> {
    console.log(`${MIGRATION_NAME}: [START] Backfilling workflow_executions: deferred to before commit`);
  }

  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    // Never SET updated_at: historical durations derive from it.
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM workflow_executions WHERE organization_id IS NULL`
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Backfilling workflow_executions: ${total}`);

    let totalUpdated = 0;
    let updated = 0;
    do {
      const result = await queryRunner.query(
        `
        WITH batch AS (
          SELECT e.id, a.organization_id AS org_id, a.id AS app_id
          FROM workflow_executions e
          JOIN app_versions av ON av.id = e.app_version_id
          JOIN apps a          ON a.id  = av.app_id
          WHERE e.organization_id IS NULL
          LIMIT ${BATCH_SIZE}
        )
        UPDATE workflow_executions e
        SET organization_id = batch.org_id,
            app_id          = batch.app_id,
            trigger_type    = CASE WHEN e.schedule_id IS NOT NULL THEN 'schedule' ELSE 'unknown' END,
            started_at      = e.created_at,
            finished_at     = CASE WHEN e.executed THEN e.updated_at ELSE NULL END
        FROM batch
        WHERE e.id = batch.id
        `
      );
      updated = result?.[1] ?? 0;
      totalUpdated += updated;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '100.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    } while (updated === BATCH_SIZE);

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill finished. Updated: ${totalUpdated}/${total}`);
  }

  public async down(): Promise<void> {
    // Nothing to undo: the schema migration's down() drops the backfilled columns.
  }
}
