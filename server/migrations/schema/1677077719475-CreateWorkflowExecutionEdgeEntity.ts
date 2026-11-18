import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateWorkflowExecutionEdgeEntity1677077719475 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'workflow_execution_edges',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'id_on_workflow_definition',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'source_workflow_execution_node_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'target_workflow_execution_node_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'source_handle',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'workflow_execution_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: true,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'workflow_execution_edges',
      new TableForeignKey({
        columnNames: ['workflow_execution_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_executions',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'workflow_execution_edges',
      new TableForeignKey({
        columnNames: ['source_workflow_execution_node_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_execution_nodes',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'workflow_execution_edges',
      new TableForeignKey({
        columnNames: ['target_workflow_execution_node_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_execution_nodes',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
