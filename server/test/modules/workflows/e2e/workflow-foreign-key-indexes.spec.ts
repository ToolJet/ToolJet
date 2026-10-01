import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, getDefaultDataSource } from 'test-helper';

// Postgres does not index the referencing side of a foreign key. Without one, every cascaded
// delete (a workflow's run history, a run's nodes) and every lookup by these columns
// sequential-scans the referencing table once per deleted parent row.
const CASCADE_PATH_FOREIGN_KEYS = [
  ['workflow_executions', 'parent_execution_id'],
  ['workflow_executions', 'parent_node_id'],
  ['workflow_executions', 'schedule_id'],
  ['workflow_approval_requests', 'workflow_execution_id'],
  ['workflow_approval_requests', 'execution_node_id'],
];

/** @group workflows */
describe('Workflow run history foreign keys', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it.each(CASCADE_PATH_FOREIGN_KEYS)('should have a non-partial index leading with %s.%s', async (table, column) => {
    // A partial index (e.g. the pending-only unique index) cannot serve referential-integrity
    // lookups, so only indexes without a predicate count.
    const rows: Array<{ indexname: string }> = await getDefaultDataSource().query(
      `SELECT ic.relname AS indexname
           FROM pg_index i
           JOIN pg_class ic ON ic.oid = i.indexrelid
           JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
          WHERE i.indrelid = $1::regclass AND i.indpred IS NULL AND a.attname = $2`,
      [table, column]
    );
    expect(rows).not.toHaveLength(0);
  });
});
