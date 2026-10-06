import { TooljetDbMigrationSqlCompilerService } from '@modules/tooljet-db/services/tooljet-db-migration-sql-compiler.service';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';

describe('TooljetDbMigrationSqlCompilerService', () => {
  const service = new TooljetDbMigrationSqlCompilerService();

  function migration(overrides: Partial<InternalTableMigration>): InternalTableMigration {
    return { id: 'm1', kind: 'structured', payload: {}, resultingSchema: null, name: null } as InternalTableMigration;
    // overrides applied by callers via object spread below — kept simple, no builder abstraction for one field set.
  }

  it('should return the stored SQL verbatim for a raw_sql migration', () => {
    const m = {
      ...migration({}),
      kind: 'raw_sql',
      payload: { sql: 'DELETE FROM users WHERE id = 1;', refs: {} },
    } as InternalTableMigration;
    expect(service.compile(m)).toBe('DELETE FROM users WHERE id = 1;');
  });

  it('should return null for a baseline migration', () => {
    const m = {
      ...migration({}),
      kind: 'baseline',
      payload: { action: 'create_table', request: {} },
    } as InternalTableMigration;
    expect(service.compile(m)).toBeNull();
  });

  it('should compile create_table with columns and a foreign key', () => {
    const m = {
      ...migration({}),
      kind: 'structured',
      payload: {
        action: 'create_table',
        request: {
          table_name: 'orders',
          columns: [
            { column_name: 'id', data_type: 'integer', constraints_type: { is_not_null: true } },
            { column_name: 'user_id', data_type: 'integer' },
          ],
          foreign_keys: [
            {
              column_names: ['user_id'],
              referenced_table_name: 'users',
              referenced_column_names: ['id'],
              on_delete: 'CASCADE',
            },
          ],
        },
      },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe(
      'CREATE TABLE orders (\n  id integer NOT NULL,\n  user_id integer\n);\n' +
        'ALTER TABLE orders ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;'
    );
  });

  it('should compile drop_table', () => {
    const m = {
      ...migration({}),
      payload: { action: 'drop_table', request: { table_name: 'orders' } },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe('DROP TABLE orders;');
  });

  it('should compile add_column with a default and NOT NULL, matching the numeric-default-unquoted convention', () => {
    const m = {
      ...migration({}),
      payload: {
        action: 'add_column',
        request: {
          table_name: 'test_users',
          column: {
            column_name: 'age',
            data_type: 'int4',
            column_default: '0',
            constraints_type: { is_not_null: true },
          },
        },
      },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe('ALTER TABLE test_users\n  ADD COLUMN age int4 DEFAULT 0 NOT NULL;');
  });

  it('should quote a non-numeric default on add_column', () => {
    const m = {
      ...migration({}),
      payload: {
        action: 'add_column',
        request: {
          table_name: 'orders',
          column: { column_name: 'status', data_type: 'text', column_default: 'pending' },
        },
      },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe("ALTER TABLE orders\n  ADD COLUMN status text DEFAULT 'pending';");
  });

  it('should compile drop_column', () => {
    const m = {
      ...migration({}),
      payload: { action: 'drop_column', request: { table_name: 'orders', column: { column_name: 'status' } } },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe('ALTER TABLE orders DROP COLUMN status;');
  });

  it('should compile edit_column covering rename, type change, default, and not-null', () => {
    const m = {
      ...migration({}),
      payload: {
        action: 'edit_column',
        request: {
          table_name: 'orders',
          column: {
            column_name: 'status',
            new_column_name: 'order_status',
            data_type: 'text',
            column_default: 'pending',
            constraints_type: { is_not_null: true },
          },
        },
      },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe(
      'ALTER TABLE orders RENAME COLUMN status TO order_status;\n' +
        'ALTER TABLE orders ALTER COLUMN order_status TYPE text;\n' +
        "ALTER TABLE orders ALTER COLUMN order_status SET DEFAULT 'pending';\n" +
        'ALTER TABLE orders ALTER COLUMN order_status SET NOT NULL;'
    );
  });

  it('should compile edit_table covering table rename, a renamed column, an added column, and a dropped column', () => {
    const m = {
      ...migration({}),
      payload: {
        action: 'edit_table',
        request: {
          table_name: 'orders',
          new_table_name: 'purchase_orders',
          columns: [
            {
              old_column: { column_name: 'status', data_type: 'text' },
              new_column: { column_name: 'order_status', data_type: 'text' },
            },
            { new_column: { column_name: 'notes', data_type: 'text' } },
            { old_column: { column_name: 'legacy_flag', data_type: 'boolean' } },
          ],
        },
      },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe(
      'ALTER TABLE orders RENAME TO purchase_orders;\n' +
        'ALTER TABLE purchase_orders RENAME COLUMN status TO order_status;\n' +
        'ALTER TABLE purchase_orders ALTER COLUMN order_status TYPE text;\n' +
        'ALTER TABLE purchase_orders\n  ADD COLUMN notes text;\n' +
        'ALTER TABLE purchase_orders DROP COLUMN legacy_flag;'
    );
  });

  it('should compile create_foreign_key for one or more foreign keys', () => {
    const m = {
      ...migration({}),
      payload: {
        action: 'create_foreign_key',
        request: {
          table_name: 'orders',
          foreign_keys: [
            { column_names: ['user_id'], referenced_table_name: 'users', referenced_column_names: ['id'] },
          ],
        },
      },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe('ALTER TABLE orders ADD FOREIGN KEY (user_id) REFERENCES users(id);');
  });

  it('should compile update_foreign_key as the replacement definition with an explanatory comment', () => {
    const m = {
      ...migration({}),
      payload: {
        action: 'update_foreign_key',
        request: {
          table_name: 'orders',
          foreign_key_id: 'fk-1',
          foreign_keys: [
            {
              column_names: ['user_id'],
              referenced_table_name: 'users',
              referenced_column_names: ['id'],
              on_delete: 'SET NULL',
            },
          ],
        },
      },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe(
      '-- Updates foreign key constraint fk-1\n' +
        'ALTER TABLE orders ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;'
    );
  });

  it('should compile delete_foreign_key as a comment naming the constraint id', () => {
    const m = {
      ...migration({}),
      payload: { action: 'delete_foreign_key', request: { table_name: 'orders', foreign_key_id: 'fk-1' } },
    } as unknown as InternalTableMigration;
    expect(service.compile(m)).toBe('-- Foreign key constraint removed (id: fk-1)');
  });
});
