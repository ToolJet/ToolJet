import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWorkflowExecutionNodeInputState1789300000200 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('workflow_execution_nodes', 'input_state')) return;

    await queryRunner.addColumn(
      'workflow_execution_nodes',
      new TableColumn({
        name: 'input_state',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workflow_execution_nodes', 'input_state');
  }
}
