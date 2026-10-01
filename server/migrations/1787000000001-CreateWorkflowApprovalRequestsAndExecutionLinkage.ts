import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class CreateWorkflowApprovalRequestsAndExecutionLinkage1787000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
        ],
      }),
      true
    );

    await queryRunner.createForeignKeys('workflow_approval_requests', [
      new TableForeignKey({ columnNames: ['workflow_execution_id'], referencedTableName: 'workflow_executions', referencedColumnNames: ['id'], onDelete: 'CASCADE' }),
      new TableForeignKey({ columnNames: ['execution_node_id'], referencedTableName: 'workflow_execution_nodes', referencedColumnNames: ['id'], onDelete: 'CASCADE' }),
      new TableForeignKey({ columnNames: ['resolved_by_user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'SET NULL' }),
    ]);

    await queryRunner.createIndex('workflow_approval_requests', new TableIndex({ name: 'IDX_workflow_approval_requests_token', columnNames: ['token'], isUnique: true }));

    await queryRunner.createIndex('workflow_approval_requests', new TableIndex({
      name: 'UQ_workflow_approval_requests_pending',
      columnNames: ['workflow_execution_id', 'execution_node_id'],
      isUnique: true,
      where: `status = 'pending'`,
    }));

    await queryRunner.addColumns('workflow_executions', [
      new TableColumn({ name: 'parent_execution_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'parent_node_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'schedule_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'environment_id', type: 'uuid', isNullable: true }),
    ]);
    await queryRunner.createForeignKeys('workflow_executions', [
      new TableForeignKey({ columnNames: ['parent_execution_id'], referencedTableName: 'workflow_executions', referencedColumnNames: ['id'], onDelete: 'CASCADE' }),
      new TableForeignKey({ columnNames: ['parent_node_id'], referencedTableName: 'workflow_execution_nodes', referencedColumnNames: ['id'], onDelete: 'SET NULL' }),
      new TableForeignKey({ columnNames: ['schedule_id'], referencedTableName: 'workflow_schedules', referencedColumnNames: ['id'], onDelete: 'SET NULL' }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const execTable = await queryRunner.getTable('workflow_executions');
    for (const col of ['parent_execution_id', 'parent_node_id', 'schedule_id']) {
      const fk = execTable.foreignKeys.find((f) => f.columnNames.includes(col));
      if (fk) await queryRunner.dropForeignKey('workflow_executions', fk);
    }
    await queryRunner.dropColumns('workflow_executions', [
      'parent_execution_id',
      'parent_node_id',
      'schedule_id',
      'environment_id',
    ]);
    await queryRunner.dropTable('workflow_approval_requests', true);
  }
}
