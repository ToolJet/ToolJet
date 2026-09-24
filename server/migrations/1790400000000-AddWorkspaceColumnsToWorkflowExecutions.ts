import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

// Rows per backfill batch. workflow_executions is the highest-volume table in this module and its
// rows are fat (the `logs` json column), so a single UPDATE would mean heavy WAL, bloat and a long
// lock. ormconfig sets migrationsTransactionMode: 'all', so this still runs in one transaction —
// batching bounds the work per statement, not the transaction itself.
const BATCH_SIZE = 5000;

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

    // Backfill in batches. `updated_at` is deliberately NOT in the SET list and must never be:
    // it is an @UpdateDateColumn, and historical durations are derived from it for rows that
    // predate started_at/finished_at. Touching it here would corrupt them retroactively.
    let updated = 0;
    do {
      const result = await queryRunner.query(
        `
        WITH batch AS (
          SELECT e.id, a.organization_id AS org_id, a.id AS app_id
          FROM workflow_executions e
          JOIN app_versions av ON av.id = e.app_version_id
          JOIN apps a          ON a.id  = av.app_id
          WHERE e.organization_id IS NULL
          LIMIT ${BATCH_SIZE}
        )
        UPDATE workflow_executions e
        SET organization_id = batch.org_id,
            app_id          = batch.app_id,
            trigger_type    = CASE WHEN e.schedule_id IS NOT NULL THEN 'schedule' ELSE 'unknown' END,
            started_at      = e.created_at,
            finished_at     = CASE WHEN e.executed THEN e.updated_at ELSE NULL END
        FROM batch
        WHERE e.id = batch.id
        `
      );
      updated = result?.[1] ?? 0;
    } while (updated === BATCH_SIZE);

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
