import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStatusToWorkflowExecution1722934934124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_executions',
      new TableColumn({
        name: 'status',
        type: 'varchar',
        isNullable: false,
        default: "'success'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workflow_executions', 'status');
  }
}
