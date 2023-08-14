import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateWorkflowExecutionNodeEntity1676987682532 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'workflow_execution_nodes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'type',
            type: 'varchar',
            default: false,
            isNullable: false,
          },
          {
            name: 'id_on_workflow_definition',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'definition',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'executed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'result',
            type: 'varchar',
            default: false,
            isNullable: true,
          },
          {
            name: 'state',
            type: 'json',
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
      'workflow_execution_nodes',
      new TableForeignKey({
        columnNames: ['workflow_execution_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_executions',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('workflow_nodes');
  }
}
