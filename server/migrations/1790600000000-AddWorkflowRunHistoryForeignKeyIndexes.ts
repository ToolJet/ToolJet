import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

// Indexes the referencing side of the foreign keys 1787000000000 added. Postgres does not create
// these on its own, so each cascaded delete of a run or a run node (deleting a workflow, an app
// version, or pruning history) sequential-scanned these tables once per deleted row, and the
// schedule overlap guard's `schedule_id` lookup scanned run history on every fire. The existing
// partial pending-only unique index on approval requests cannot serve those lookups.
const INDEXES: Array<[table: string, column: string]> = [
  ['workflow_executions', 'parent_execution_id'],
  ['workflow_executions', 'parent_node_id'],
  ['workflow_executions', 'schedule_id'],
  ['workflow_approval_requests', 'workflow_execution_id'],
  ['workflow_approval_requests', 'execution_node_id'],
];

const indexName = (table: string, column: string) => `idx_${table}_${column}`;

export class AddWorkflowRunHistoryForeignKeyIndexes1790600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of INDEXES) {
      await queryRunner.createIndex(table, new TableIndex({ name: indexName(table, column), columnNames: [column] }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of [...INDEXES].reverse()) {
      await queryRunner.dropIndex(table, indexName(table, column));
    }
  }
}
