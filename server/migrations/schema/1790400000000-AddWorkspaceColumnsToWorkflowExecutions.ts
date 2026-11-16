// migration-lint: allow-destructive the foreign keys only cover nullable columns this migration adds
import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddWorkspaceColumnsToWorkflowExecutions1790400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('workflow_executions', [
      new TableColumn({ name: 'organization_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'app_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'trigger_type', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'started_at', type: 'timestamptz', isNullable: true }),
      new TableColumn({ name: 'finished_at', type: 'timestamptz', isNullable: true }),
    ]);

    await queryRunner.createForeignKeys('workflow_executions', [
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['app_id'],
        referencedTableName: 'apps',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    // Existing rows are filled by the data migration BackfillWorkspaceColumnsOnWorkflowExecutions1793450000000,
    // so this transaction only adds columns and indexes and its table lock stays short.

    // Supports: WHERE organization_id = $1 ORDER BY created_at DESC LIMIT n
    await queryRunner.query(`
      CREATE INDEX idx_workflow_executions_org_created
      ON workflow_executions(organization_id, created_at DESC)
    `);
    // The same, narrowed by workflow.
    await queryRunner.query(`
      CREATE INDEX idx_workflow_executions_org_app_created
      ON workflow_executions(organization_id, app_id, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_workflow_executions_org_app_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_workflow_executions_org_created`);

    const table = await queryRunner.getTable('workflow_executions');
    for (const col of ['organization_id', 'app_id']) {
      const fk = table.foreignKeys.find((f) => f.columnNames.includes(col));
      if (fk) await queryRunner.dropForeignKey('workflow_executions', fk);
    }
    await queryRunner.dropColumns('workflow_executions', [
      'organization_id',
      'app_id',
      'trigger_type',
      'started_at',
      'finished_at',
    ]);
  }
}
