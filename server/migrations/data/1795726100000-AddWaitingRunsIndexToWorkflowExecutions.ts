import { QueryRunner } from 'typeorm';
import { DataMigration } from '../../src/migration-helpers/migration-mode';

const MIGRATION_NAME = 'AddWaitingRunsIndexToWorkflowExecutions1795726100000';

/**
 * Counts a workspace's waiting runs (paused at a Human or Wait node) cheaply: the waiting-run cap
 * checks it each time a run is about to pause. Partial, so it holds only waiting rows and stays
 * small however long a workspace's run history grows. The build runs in beforeCommit(): it locks
 * workflow_executions, which old pods keep writing during the data phase.
 */
export class AddWaitingRunsIndexToWorkflowExecutions1795726100000 implements DataMigration {
  public async up(): Promise<void> {
    console.log(`${MIGRATION_NAME}: [START] Waiting runs index: deferred to before commit`);
  }

  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_workflow_executions_org_waiting
         ON workflow_executions (organization_id)
         WHERE status IN ('waiting', 'waiting_for_delay')`
    );
    console.log(`${MIGRATION_NAME}: [PROGRESS] 1/1 (100%)`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Waiting runs index finished.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_workflow_executions_org_waiting');
  }
}
