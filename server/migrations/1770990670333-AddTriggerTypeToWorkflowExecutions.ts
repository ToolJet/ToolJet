import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTriggerTypeToWorkflowExecutions1770990670333 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_executions',
      new TableColumn({
        name: 'trigger_type',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: "'manual'",
      })
    );

    await queryRunner.addColumn(
      'workflow_executions',
      new TableColumn({
        name: 'schedule_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Create index for better query performance
    await queryRunner.query(
      `CREATE INDEX "idx_workflow_executions_trigger_type" ON "workflow_executions" ("trigger_type")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workflow_executions_trigger_type"`);
    await queryRunner.dropColumn('workflow_executions', 'schedule_id');
    await queryRunner.dropColumn('workflow_executions', 'trigger_type');
  }
}
