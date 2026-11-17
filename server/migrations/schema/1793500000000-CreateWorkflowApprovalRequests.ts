import { MigrationInterface, QueryRunner, Table } from 'typeorm';

// migration-lint: allow-destructive the indexes are on the table this migration creates
/**
 * The human-in-the-loop approval table, created in its final shape. Its foreign keys lock the tables they
 * reference, so AddWorkflowRunHistoryKeysAndIndexes1793500000200 adds them in the data phase. Indexes on the
 * referencing side of each run-history foreign key keep cascaded deletes of runs from scanning this table.
 * A database that already has the table (it ran the earlier development migrations) keeps it.
 */
export class CreateWorkflowApprovalRequests1793500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('workflow_approval_requests')) return;
    await queryRunner.createTable(
      new Table({
        name: 'workflow_approval_requests',
        columns: [
          { name: 'id', type: 'uuid', isGenerated: true, default: 'gen_random_uuid()', isPrimary: true },
          { name: 'workflow_execution_id', type: 'uuid', isNullable: false },
          { name: 'execution_node_id', type: 'uuid', isNullable: false },
          { name: 'token', type: 'varchar', isNullable: false },
          { name: 'status', type: 'varchar', isNullable: false, default: `'pending'` },
          { name: 'resolved_outcome', type: 'varchar', isNullable: true },
          { name: 'input', type: 'jsonb', isNullable: true },
          { name: 'resolved_by_user_id', type: 'uuid', isNullable: true },
          { name: 'approvers_snapshot', type: 'jsonb', isNullable: false },
          { name: 'expires_at', type: 'timestamptz', isNullable: true },
          { name: 'resolved_at', type: 'timestamptz', isNullable: true },
          // Denormalized from the run's app version so the approvals list filters on an index.
          { name: 'organization_id', type: 'uuid', isNullable: true },
          { name: 'app_id', type: 'uuid', isNullable: true },
          { name: 'environment_id', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        indices: [
          { name: 'IDX_workflow_approval_requests_token', columnNames: ['token'], isUnique: true },
          // One pending request per (run, node).
          {
            name: 'UQ_workflow_approval_requests_pending',
            columnNames: ['workflow_execution_id', 'execution_node_id'],
            isUnique: true,
            where: `status = 'pending'`,
          },
          { name: 'idx_workflow_approval_requests_workflow_execution_id', columnNames: ['workflow_execution_id'] },
          { name: 'idx_workflow_approval_requests_execution_node_id', columnNames: ['execution_node_id'] },
        ],
      }),
      true
    );
    // Expression and DESC columns: TableIndex cannot express them. The table is empty, so these are instant.
    await queryRunner.query(`
      CREATE INDEX idx_workflow_approval_requests_org_created
      ON workflow_approval_requests (organization_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_workflow_approval_requests_org_app_created
      ON workflow_approval_requests (organization_id, app_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_workflow_approval_requests_org_env_created
      ON workflow_approval_requests (organization_id, environment_id, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('workflow_approval_requests', true);
  }
}
