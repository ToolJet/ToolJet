import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEnvironmentIdToApprovalRequests1790500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // No FK, deliberately: `workflow_executions.environment_id` — the column this backfills
    // from — carries none either (see 1787000000000). Matching the source column's own
    // constraint rather than introducing a stricter one on the denormalized copy.
    await queryRunner.addColumn(
      'workflow_approval_requests',
      new TableColumn({ name: 'environment_id', type: 'uuid', isNullable: true })
    );

    // Backfill through the join chain the column replaces, same shape as organization_id/app_id
    // in 1787800000000. Approval requests are created at most once per (execution, node), so
    // this table is orders of magnitude smaller than workflow_executions — a single unbatched
    // UPDATE is fine here, unlike the batched backfill 1790400000000 needed for that table.
    await queryRunner.query(`
      UPDATE workflow_approval_requests r
      SET environment_id = e.environment_id
      FROM workflow_executions e
      WHERE e.id = r.workflow_execution_id
    `);

    // Supports: WHERE organization_id = $1 AND environment_id = $2 ORDER BY created_at DESC LIMIT n
    await queryRunner.query(`
      CREATE INDEX idx_workflow_approval_requests_org_env_created
      ON workflow_approval_requests(organization_id, environment_id, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_workflow_approval_requests_org_env_created`);
    await queryRunner.dropColumn('workflow_approval_requests', 'environment_id');
  }
}
