/** @jest-environment node */
import type { DraftColumn } from '../../TableDrawer/types';
import { createColumn } from '../../TableDrawer/columnRules';
import { planColumnEdit, type SavedColumn } from '../editColumnRules';

const saved = (overrides: Partial<SavedColumn> = {}): SavedColumn => ({
  name: 'owner',
  dataType: 'character varying',
  columnDefault: null,
  constraints: { is_not_null: false, is_unique: false, is_primary_key: false },
  configurations: {},
  ...overrides,
});

const draft = (overrides: Partial<DraftColumn> = {}): DraftColumn =>
  createColumn({
    column_name: 'owner',
    data_type: 'character varying',
    constraints_type: { is_not_null: false, is_unique: false, is_primary_key: false },
    existing: true,
    ...overrides,
  });

describe('planColumnEdit', () => {
  describe('a rename', () => {
    const plan = planColumnEdit(saved(), draft({ column_name: 'author' }));

    it('is titled by both names and listed once', () => {
      expect(plan.isRenamed).toBe(true);
      expect(plan.title).toBe('Rename column "owner" to "author"');
      expect(plan.changes).toEqual([{ type: 'edit', name: 'author', oldName: 'owner' }]);
    });

    it('names the old column in the request and carries the new name', () => {
      expect(plan.request('m1')).toEqual({
        column: {
          column_name: 'owner',
          data_type: 'character varying',
          column_default: null,
          constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          configurations: {},
          new_column_name: 'author',
        },
        migration_name: 'm1',
      });
    });
  });

  it('is titled by the column when it is not renamed, and leaves the migration name out when there is none', () => {
    const plan = planColumnEdit(
      saved(),
      draft({ constraints_type: { is_not_null: true, is_unique: false, is_primary_key: false } })
    );
    expect(plan.isRenamed).toBe(false);
    expect(plan.title).toBe('Edit column "owner"');
    expect(plan.request('')).not.toHaveProperty('migration_name');
    expect(plan.request('').column).not.toHaveProperty('new_column_name');
  });

  it('lists each changed constraint and the default against the new name', () => {
    const plan = planColumnEdit(
      saved(),
      draft({
        column_name: 'author',
        column_default: 'nobody',
        constraints_type: { is_not_null: true, is_unique: true, is_primary_key: false },
      })
    );
    expect(plan.changes).toEqual([
      { type: 'edit', name: 'author', oldName: 'owner' },
      { type: 'edit', name: 'author', detail: 'add NOT NULL constraint' },
      { type: 'edit', name: 'author', detail: 'default nobody' },
      { type: 'edit', name: 'author', detail: 'add UNIQUE constraint' },
    ]);
  });

  it('says when a constraint is dropped', () => {
    const plan = planColumnEdit(
      saved({ constraints: { is_not_null: true, is_unique: true, is_primary_key: false } }),
      draft()
    );
    expect(plan.changes).toEqual([
      { type: 'edit', name: 'owner', detail: 'drop NOT NULL constraint' },
      { type: 'edit', name: 'owner', detail: 'drop UNIQUE constraint' },
    ]);
  });

  it('falls back to a plain line when only something unlisted changed', () => {
    const plan = planColumnEdit(saved(), draft({ configurations: { timezone: 'Asia/Kolkata' } }));
    expect(plan.changes).toEqual([{ type: 'edit', name: 'owner' }]);
  });

  describe('the default', () => {
    it('stays null when it was null and untouched', () => {
      expect(planColumnEdit(saved(), draft()).request('').column.column_default).toBeNull();
    });

    it('is sent empty when a stored default was cleared', () => {
      const plan = planColumnEdit(saved({ columnDefault: 'x' }), draft({ column_default: null }));
      expect(plan.request('').column.column_default).toBe('');
      expect(plan.changes).toEqual([{ type: 'edit', name: 'owner', detail: 'default ' }]);
    });

    it('is not sent for a serial column', () => {
      const plan = planColumnEdit(saved({ dataType: 'serial' }), draft({ data_type: 'serial' }));
      expect(plan.request('').column).not.toHaveProperty('column_default');
    });
  });

  describe('a type change', () => {
    it('sends a lossless cast in the request itself, with no SQL step', () => {
      const plan = planColumnEdit(saved({ dataType: 'integer' }), draft({ data_type: 'bigint' }));
      expect(plan.request('').column.data_type).toBe('bigint');
      expect(plan.changes).toEqual([{ type: 'edit', name: 'owner', detail: { from: 'integer', to: 'bigint' } }]);
      expect(plan.initialSql).toBeUndefined();
      expect(plan.sqlRequired).toBeUndefined();
    });

    it('sends every other cast as SQL and keeps the old type in the request', () => {
      const plan = planColumnEdit(saved({ columnDefault: '5' }), draft({ data_type: 'integer', column_default: '5' }));
      expect(plan.request('').column.data_type).toBe('character varying');
      expect(plan.sqlRequired).toBe(true);
      expect(plan.initialSql).toContain('ALTER COLUMN "owner" DROP DEFAULT');
      expect(plan.initialSql).toContain('ALTER COLUMN "owner" TYPE integer USING "owner"::integer');
    });

    it('names the new column in that SQL when the same save renames it', () => {
      const plan = planColumnEdit(saved(), draft({ column_name: 'author', data_type: 'integer' }));
      expect(plan.initialSql).toContain('ALTER COLUMN "author" TYPE integer');
    });
  });

  describe('the time zone', () => {
    it('is sent for a timestamp column, on top of what is stored', () => {
      const plan = planColumnEdit(
        saved({ dataType: 'timestamp with time zone', configurations: { other: 1, timezone: 'UTC' } }),
        draft({ data_type: 'timestamp with time zone', configurations: { other: 1, timezone: 'Asia/Kolkata' } })
      );
      expect(plan.request('').column.configurations).toEqual({ other: 1, timezone: 'Asia/Kolkata' });
    });

    it('is left out for any other column', () => {
      const plan = planColumnEdit(saved(), draft({ configurations: { timezone: 'Asia/Kolkata' } }));
      expect(plan.request('').column.configurations).toEqual({});
    });
  });

  it('keeps the primary key flag of the stored column', () => {
    const plan = planColumnEdit(
      saved({ constraints: { is_not_null: true, is_unique: true, is_primary_key: true } }),
      draft({ column_name: 'author', constraints_type: { is_not_null: true, is_unique: true, is_primary_key: true } })
    );
    expect(plan.request('').column.constraints_type.is_primary_key).toBe(true);
  });
});
