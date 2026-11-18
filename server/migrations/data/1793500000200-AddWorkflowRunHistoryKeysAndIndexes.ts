import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'AddWorkflowRunHistoryKeysAndIndexes1793500000200';

type ForeignKey = { table: string; column: string; references: string; onDelete: 'CASCADE' | 'SET NULL' };

// Columns of CreateWorkflowApprovalRequests1793500000000 and AddWorkflowRunHistoryColumns1793500000100.
const FOREIGN_KEYS: ForeignKey[] = [
  { table: 'workflow_approval_requests', column: 'workflow_execution_id', references: 'workflow_executions', onDelete: 'CASCADE' },
  { table: 'workflow_approval_requests', column: 'execution_node_id', references: 'workflow_execution_nodes', onDelete: 'CASCADE' },
  { table: 'workflow_approval_requests', column: 'resolved_by_user_id', references: 'users', onDelete: 'SET NULL' },
  { table: 'workflow_approval_requests', column: 'organization_id', references: 'organizations', onDelete: 'CASCADE' },
  { table: 'workflow_approval_requests', column: 'app_id', references: 'apps', onDelete: 'CASCADE' },
  { table: 'workflow_executions', column: 'parent_execution_id', references: 'workflow_executions', onDelete: 'CASCADE' },
  { table: 'workflow_executions', column: 'parent_node_id', references: 'workflow_execution_nodes', onDelete: 'SET NULL' },
  { table: 'workflow_executions', column: 'schedule_id', references: 'workflow_schedules', onDelete: 'SET NULL' },
  { table: 'workflow_executions', column: 'organization_id', references: 'organizations', onDelete: 'CASCADE' },
  { table: 'workflow_executions', column: 'app_id', references: 'apps', onDelete: 'CASCADE' },
  { table: 'workflow_executions', column: 'trigger_source_app_id', references: 'apps', onDelete: 'SET NULL' },
  { table: 'workflow_schedules', column: 'app_id', references: 'apps', onDelete: 'CASCADE' },
];

// Postgres does not index the referencing side of a foreign key; without these, each cascaded delete of a run,
// workflow or app scans run history once per deleted row.
const INDEXES = [
  'idx_workflow_executions_parent_execution_id ON workflow_executions (parent_execution_id)',
  'idx_workflow_executions_parent_node_id ON workflow_executions (parent_node_id)',
  'idx_workflow_executions_schedule_id ON workflow_executions (schedule_id)',
  'idx_workflow_executions_trigger_source_app_id ON workflow_executions (trigger_source_app_id)',
  // WHERE organization_id = $1 [AND app_id = $2] ORDER BY created_at DESC LIMIT n
  'idx_workflow_executions_org_created ON workflow_executions (organization_id, created_at DESC)',
  'idx_workflow_executions_org_app_created ON workflow_executions (organization_id, app_id, created_at DESC)',
];

/**
 * Finishes CreateWorkflowApprovalRequests1793500000000 and AddWorkflowRunHistoryColumns1793500000100: fills schedules' app_id, then adds the foreign keys
 * and indexes. All of it runs in beforeCommit(): the index builds and keys lock workflow_executions, and old
 * pods keep writing runs and schedules during the data phase, so the locks are taken last and held briefly.
 * Safe to run again: keys are skipped when the column already has one, indexes use IF NOT EXISTS.
 */
export class AddWorkflowRunHistoryKeysAndIndexes1793500000200 implements MigrationInterface {
  public async up(): Promise<void> {
    console.log(`${MIGRATION_NAME}: [START] Workflow run history keys and indexes: deferred to before commit`);
  }

  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    const total = FOREIGN_KEYS.length + INDEXES.length + 2;
    let done = 0;
    const progress = () => {
      done += 1;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${Math.round((done / total) * 100)}%)`);
    };

    await queryRunner.query(`
      UPDATE workflow_schedules schedule
      SET app_id = version.app_id
      FROM app_versions version
      WHERE version.id = schedule.workflow_id AND schedule.app_id IS NULL
    `);
    progress();

    for (const { table, column, references, onDelete } of FOREIGN_KEYS) {
      const [{ exists }] = await queryRunner.query(
        `SELECT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
           WHERE c.contype = 'f' AND c.conrelid = $1::regclass AND a.attname = $2
         ) AS "exists"`,
        [table, column]
      );
      if (!exists) {
        const name = `fk_${table}_${column}`;
        await queryRunner.query(
          `ALTER TABLE ${table} ADD CONSTRAINT ${name} FOREIGN KEY (${column}) REFERENCES ${references} (id) ON DELETE ${onDelete} NOT VALID`
        );
        // SHARE UPDATE EXCLUSIVE: blocks neither reads nor writes.
        await queryRunner.query(`ALTER TABLE ${table} VALIDATE CONSTRAINT ${name}`);
      }
      progress();
    }

    for (const index of INDEXES) {
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS ${index}`);
      progress();
    }
    // Schedule names are unique per workflow, case and outer spaces ignored.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_schedules_app_name
      ON workflow_schedules (app_id, LOWER(BTRIM(name)))
      WHERE name IS NOT NULL
    `);
    progress();
    console.log(`${MIGRATION_NAME}: [SUCCESS] Workflow run history keys and indexes finished.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_workflow_schedules_app_name`);
    for (const index of [...INDEXES].reverse()) {
      await queryRunner.query(`DROP INDEX IF EXISTS ${index.split(' ')[0]}`);
    }
    for (const { table, column } of [...FOREIGN_KEYS].reverse()) {
      await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS fk_${table}_${column}`);
    }
  }
}
