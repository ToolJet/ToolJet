import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

const INDEX_NAME = 'idx_workflow_executions_trigger_source_app_id';

export class AddTriggerSourceAppIdToWorkflowExecutions1792500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_executions',
      new TableColumn({ name: 'trigger_source_app_id', type: 'uuid', isNullable: true })
    );

    await queryRunner.createForeignKey(
      'workflow_executions',
      new TableForeignKey({
        columnNames: ['trigger_source_app_id'],
        referencedTableName: 'apps',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Avoids a full scan of run history on every app delete.
    await queryRunner.createIndex(
      'workflow_executions',
      new TableIndex({ name: INDEX_NAME, columnNames: ['trigger_source_app_id'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS ${INDEX_NAME}`);
    const table = await queryRunner.getTable('workflow_executions');
    const fk = table.foreignKeys.find((f) => f.columnNames.includes('trigger_source_app_id'));
    if (fk) await queryRunner.dropForeignKey('workflow_executions', fk);
    await queryRunner.dropColumn('workflow_executions', 'trigger_source_app_id');
  }
}
