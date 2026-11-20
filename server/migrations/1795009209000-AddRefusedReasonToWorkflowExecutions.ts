import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Marks a run that was refused before it started (for example a schedule firing over the execution
 * quota). Such a row is shown in the run history with its reason but is excluded from the quota
 * count. NULL for every run that actually started.
 */
export class AddRefusedReasonToWorkflowExecutions1795009209000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_executions',
      new TableColumn({ name: 'refused_reason', type: 'varchar', isNullable: true })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workflow_executions', 'refused_reason');
  }
}
