import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

const MIGRATION_NAME = 'AddWorkspaceColumnsToWorkflowExecutions1790400000000';

// Rows per backfill batch. workflow_executions is the highest-volume table in this module and its
// rows are fat (the `logs` json column). ormconfig sets migrationsTransactionMode: 'all', so the
// whole migration — every batch below included — runs inside one Postgres transaction: batching
// does NOT shorten lock duration or let other transactions interleave. Every row lock taken by
// every batch is held until the final COMMIT, exactly as a single unbatched UPDATE would hold it.
// What batching actually buys is bounded peak memory/work_mem and sort cost per statement, plus
// (with the progress logging below) visible incremental progress instead of one opaque, silent,
// multi-minute UPDATE on the module's highest-volume table.
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
    const [{ count: eligibleCount }] = await queryRunner.query(
      `SELECT COUNT(*) FROM workflow_executions WHERE organization_id IS NULL`
    );
    const total = parseInt(eligibleCount, 10);
    console.log(`${MIGRATION_NAME}: [START] Backfilling workflow_executions: ${total}`);

    let totalUpdated = 0;
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
      totalUpdated += updated;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    } while (updated === BATCH_SIZE);

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill finished. Updated: ${totalUpdated}/${total}`);

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
