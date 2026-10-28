import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEnvironmentIdToApprovalRequests1790500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_approval_requests',
      new TableColumn({ name: 'environment_id', type: 'uuid', isNullable: true })
    );

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
