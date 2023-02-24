import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStartNodeToWorkflowExecution1677232734374 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_executions',
      new TableColumn({
        name: 'start_node_id',
        type: 'uuid',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workflow_executions', 'start_node_id');
  }
}
