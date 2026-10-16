import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { referencedTablesOf } from '@modules/tooljet-db/services/tooljet-db-promote.service';

const migration = (kind: InternalTableMigration['kind'], payload: unknown) =>
  ({ kind, payload }) as unknown as InternalTableMigration;

describe('referencedTablesOf', () => {
  it('should collect foreign key parents by name from structured migrations that carry foreign keys', () => {
    const migrations = [
      migration('structured', {
        action: 'create_table',
        request: { foreign_keys: [{ referenced_table_name: 'parent' }, { referenced_table_name: 'owner' }] },
      }),
      migration('structured', {
        action: 'create_foreign_key',
        request: { foreign_keys: [{ referenced_table_name: 'parent' }] },
      }),
    ];

    expect(referencedTablesOf(migrations)).toEqual({ tableNames: ['parent', 'owner'], coRelationIds: [] });
  });

  it('should collect co_relation_ids from the refs of baseline and raw SQL migrations', () => {
    const migrations = [
      migration('baseline', { ddl: 'CREATE TABLE {{self}} ()', refs: { ref_1: 'co-1' } }),
      migration('raw_sql', { sql: 'SELECT 1', refs: { a: 'co-2', b: 'co-1' } }),
    ];

    expect(referencedTablesOf(migrations)).toEqual({ tableNames: [], coRelationIds: ['co-1', 'co-2'] });
  });

  it('should report nothing for migrations that reference no other table', () => {
    const migrations = [
      migration('structured', { action: 'add_column', request: { column: { column_name: 'title' } } }),
      migration('structured', { action: 'delete_foreign_key', request: { foreign_key_id: 'fk-1' } }),
      migration('raw_sql', { sql: 'SELECT 1' }),
    ];

    expect(referencedTablesOf(migrations)).toEqual({ tableNames: [], coRelationIds: [] });
  });
});
