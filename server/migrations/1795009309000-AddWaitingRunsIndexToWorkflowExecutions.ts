import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Counts a workspace's waiting runs (paused at a Human or Wait node) cheaply: the waiting-run cap
 * checks it each time a run is about to pause. Partial, so it holds only waiting rows and stays
 * small however long a workspace's run history grows.
 */
export class AddWaitingRunsIndexToWorkflowExecutions1795009309000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_workflow_executions_org_waiting
         ON workflow_executions (organization_id)
         WHERE status IN ('waiting', 'waiting_for_delay')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_workflow_executions_org_waiting');
  }
}
