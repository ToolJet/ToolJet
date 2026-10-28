import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddWorkflowExecutionIndexes1766135986762 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // workflow_executions indexes
    await queryRunner.createIndex(
      'workflow_executions',
      new TableIndex({
        name: 'idx_workflow_executions_app_version_id',
        columnNames: ['app_version_id'],
      })
    );

    await queryRunner.createIndex(
      'workflow_executions',
      new TableIndex({
        name: 'idx_workflow_executions_created_at',
        columnNames: ['created_at'],
      })
    );

    // Composite index for pagination queries with ORDER BY created_at DESC
    await queryRunner.query(`
      CREATE INDEX idx_workflow_executions_app_version_created
      ON workflow_executions(app_version_id, created_at DESC)
    `);

    // workflow_execution_nodes indexes
    await queryRunner.createIndex(
      'workflow_execution_nodes',
      new TableIndex({
        name: 'idx_workflow_execution_nodes_execution_id',
        columnNames: ['workflow_execution_id'],
      })
    );

    // Composite index for pagination with ORDER BY updated_at
    await queryRunner.query(`
      CREATE INDEX idx_workflow_execution_nodes_execution_updated
      ON workflow_execution_nodes(workflow_execution_id, updated_at ASC)
    `);

    // workflow_execution_edges indexes
    await queryRunner.createIndex(
      'workflow_execution_edges',
      new TableIndex({
        name: 'idx_workflow_execution_edges_execution_id',
        columnNames: ['workflow_execution_id'],
      })
    );

    await queryRunner.createIndex(
      'workflow_execution_edges',
      new TableIndex({
        name: 'idx_workflow_execution_edges_target_node',
        columnNames: ['target_workflow_execution_node_id'],
      })
    );

    await queryRunner.createIndex(
      'workflow_execution_edges',
      new TableIndex({
        name: 'idx_workflow_execution_edges_source_node',
        columnNames: ['source_workflow_execution_node_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.dropIndex('workflow_execution_edges', 'idx_workflow_execution_edges_source_node');
    await queryRunner.dropIndex('workflow_execution_edges', 'idx_workflow_execution_edges_target_node');
    await queryRunner.dropIndex('workflow_execution_edges', 'idx_workflow_execution_edges_execution_id');
    await queryRunner.dropIndex('workflow_execution_nodes', 'idx_workflow_execution_nodes_execution_updated');
    await queryRunner.dropIndex('workflow_execution_nodes', 'idx_workflow_execution_nodes_execution_id');
    await queryRunner.dropIndex('workflow_executions', 'idx_workflow_executions_app_version_created');
    await queryRunner.dropIndex('workflow_executions', 'idx_workflow_executions_created_at');
    await queryRunner.dropIndex('workflow_executions', 'idx_workflow_executions_app_version_id');
  }
}
