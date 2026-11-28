import { act, renderHook } from '@testing-library/react';
import { useTableDraft } from '../useTableDraft';
import { buildEditColumns, buildEditRelations } from '../editTableRules';
import type { DraftRelation } from '../types';

const relation = (overrides: Partial<DraftRelation> = {}): Omit<DraftRelation, 'id'> => ({
  column_names: ['owner'],
  referenced_table_name: 'users',
  referenced_table_id: 'users-id',
  referenced_column_names: ['id'],
  on_delete: 'RESTRICT',
  on_update: 'RESTRICT',
  ...overrides,
});

const setup = (existingTableNames: string[] = []) => renderHook(() => useTableDraft(existingTableNames));

// Adds a column named `name`, returns its id.
const addNamed = (hook: ReturnType<typeof setup>, name: string, type = 'character varying') => {
  act(() => hook.result.current.addColumn());
  const added = hook.result.current.columns[hook.result.current.columns.length - 1];
  act(() => hook.result.current.updateColumn(added.id, { column_name: name }));
  act(() => hook.result.current.changeType(added.id, type));
  return added.id;
};

describe('useTableDraft', () => {
  it('starts clean with the id column and cannot submit', () => {
    const { result } = setup();
    expect(result.current.tableName).toBe('');
    expect(result.current.columns.map((c) => c.column_name)).toEqual(['id']);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canSubmit).toBe(false);
  });

  describe('enablement', () => {
    it('cannot submit while a column name is a reserved keyword, a duplicate or malformed', () => {
      const hook = setup();
      act(() => hook.result.current.setTableName('orders'));
      const id = addNamed(hook, 'add');
      expect(hook.result.current.canSubmit).toBe(false);

      act(() => hook.result.current.updateColumn(id, { column_name: 'id' }));
      expect(hook.result.current.canSubmit).toBe(false);

      act(() => hook.result.current.updateColumn(id, { column_name: 'my column' }));
      expect(hook.result.current.canSubmit).toBe(false);

      act(() => hook.result.current.updateColumn(id, { column_name: 'title' }));
      expect(hook.result.current.canSubmit).toBe(true);
    });

    it('submits once the name is valid and every column is named', () => {
      const hook = setup();
      act(() => hook.result.current.setTableName('orders'));
      expect(hook.result.current.canSubmit).toBe(true);
      expect(hook.result.current.isDirty).toBe(true);
    });

    it('blocks a table name that is already taken', () => {
      const { result } = setup(['orders']);
      act(() => result.current.setTableName('orders'));
      expect(result.current.canSubmit).toBe(false);
      act(() => result.current.setTableName('orders_2'));
      expect(result.current.canSubmit).toBe(true);
    });

    it('blocks an invalid table name', () => {
      const { result } = setup();
      act(() => result.current.setTableName('1orders'));
      expect(result.current.canSubmit).toBe(false);
    });

    it('blocks a column with an empty name', () => {
      const hook = setup();
      act(() => hook.result.current.setTableName('orders'));
      act(() => hook.result.current.addColumn());
      expect(hook.result.current.canSubmit).toBe(false);
    });

    it('blocks while a column default is flagged invalid, and clears when it is fixed', () => {
      const hook = setup();
      act(() => hook.result.current.setTableName('orders'));
      const id = addNamed(hook, 'meta', 'jsonb');
      act(() => hook.result.current.setDefaultInvalid(id, true));
      expect(hook.result.current.canSubmit).toBe(false);
      act(() => hook.result.current.setDefaultInvalid(id, false));
      expect(hook.result.current.canSubmit).toBe(true);
    });

    it('needs at least one primary key', () => {
      const hook = setup();
      act(() => hook.result.current.setTableName('orders'));
      // A type that cannot be a primary key takes the sole one away.
      act(() => hook.result.current.changeType(hook.result.current.columns[0].id, 'boolean'));
      expect(hook.result.current.canSubmit).toBe(false);
    });

    it('needs a type on every column', () => {
      const hook = setup();
      act(() => hook.result.current.setTableName('orders'));
      act(() => hook.result.current.addColumn());
      act(() => hook.result.current.updateColumn(hook.result.current.columns[1].id, { column_name: 'email' }));
      expect(hook.result.current.canSubmit).toBe(false);
    });
  });

  describe('columns', () => {
    it('adds a blank column and removes it by id', () => {
      const hook = setup();
      const id = addNamed(hook, 'email');
      expect(hook.result.current.columns).toHaveLength(2);
      act(() => hook.result.current.removeColumn(id));
      expect(hook.result.current.columns.map((c) => c.column_name)).toEqual(['id']);
    });

    it('does not remove the pinned primary key', () => {
      const hook = setup();
      addNamed(hook, 'email');
      act(() => hook.result.current.removeColumn(hook.result.current.columns[0].id));
      expect(hook.result.current.columns.map((c) => c.column_name)).toEqual(['id', 'email']);
    });

    it('toggles not null and unique on a plain column', () => {
      const hook = setup();
      const id = addNamed(hook, 'email');
      act(() => hook.result.current.toggleNotNull(id, true));
      act(() => hook.result.current.toggleUnique(id, true));
      expect(hook.result.current.columns[1].constraints_type).toEqual({
        is_not_null: true,
        is_unique: true,
        is_primary_key: false,
      });
    });

    it('ignores not null and unique toggles on a primary key', () => {
      const hook = setup();
      const pk = hook.result.current.columns[0].id;
      act(() => hook.result.current.toggleNotNull(pk, false));
      act(() => hook.result.current.toggleUnique(pk, false));
      expect(hook.result.current.columns[0].constraints_type).toMatchObject({ is_not_null: true, is_unique: false });
    });

    it.each(['boolean', 'jsonb', 'timestamp with time zone'])('ignores a unique toggle on a %s column', (type) => {
      const hook = setup();
      const id = addNamed(hook, 'flag', type);
      act(() => hook.result.current.toggleUnique(id, true));
      expect(hook.result.current.columns[1].constraints_type.is_unique).toBe(false);
    });

    it('gives a timestamp column the browser time zone, and lets it be changed', () => {
      const hook = setup();
      const id = addNamed(hook, 'created', 'timestamp with time zone');
      expect(hook.result.current.columns[1].configurations.timezone).toBe(
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      act(() => hook.result.current.updateColumn(id, { configurations: { timezone: 'Asia/Kolkata' } }));
      expect(hook.result.current.columns[1].configurations.timezone).toBe('Asia/Kolkata');
    });

    it('drops the time zone when the type is no longer a timestamp', () => {
      const hook = setup();
      const id = addNamed(hook, 'created', 'timestamp with time zone');
      act(() => hook.result.current.changeType(id, 'integer'));
      expect(hook.result.current.columns[1].configurations).toEqual({});
    });

    it('ignores a primary key toggle on a type that cannot be one', () => {
      const hook = setup();
      const id = addNamed(hook, 'active', 'boolean');
      act(() => hook.result.current.togglePrimaryKey(id, true));
      expect(hook.result.current.columns[1].constraints_type.is_primary_key).toBe(false);
    });

    it('ignores unchecking the sole primary key', () => {
      const hook = setup();
      act(() => hook.result.current.togglePrimaryKey(hook.result.current.columns[0].id, false));
      expect(hook.result.current.columns[0].constraints_type.is_primary_key).toBe(true);
    });
  });

  describe('reorder', () => {
    it('moves a column over another by id', () => {
      const hook = setup();
      const a = addNamed(hook, 'a');
      const b = addNamed(hook, 'b');
      act(() => hook.result.current.moveColumn(b, a));
      expect(hook.result.current.columns.map((c) => c.column_name)).toEqual(['id', 'b', 'a']);
    });

    it('never moves the pinned primary key, nor anything above it', () => {
      const hook = setup();
      const pk = hook.result.current.columns[0].id;
      const a = addNamed(hook, 'a');
      act(() => hook.result.current.moveColumn(pk, a));
      act(() => hook.result.current.moveColumn(a, pk));
      expect(hook.result.current.columns.map((c) => c.column_name)).toEqual(['id', 'a']);
    });

    it('reorders freely when no primary key is pinned', () => {
      const hook = setup();
      const pk = hook.result.current.columns[0].id;
      const a = addNamed(hook, 'a');
      act(() => hook.result.current.togglePrimaryKey(a, true));
      act(() => hook.result.current.moveColumn(a, pk));
      expect(hook.result.current.columns.map((c) => c.column_name)).toEqual(['a', 'id']);
    });
  });

  describe('relations', () => {
    it('adds, updates and removes a relation', () => {
      const hook = setup();
      addNamed(hook, 'owner', 'integer');
      act(() => hook.result.current.addRelation(relation()));
      const [added] = hook.result.current.relations;
      expect(added).toMatchObject({ column_names: ['owner'], referenced_table_name: 'users' });
      expect(added.id).toEqual(expect.any(String));

      act(() => hook.result.current.updateRelation(added.id, relation({ on_delete: 'CASCADE' })));
      expect(hook.result.current.relations[0]).toMatchObject({ id: added.id, on_delete: 'CASCADE' });

      act(() => hook.result.current.removeRelation(added.id));
      expect(hook.result.current.relations).toEqual([]);
    });

    it('rewrites the relation when its source column is renamed', () => {
      const hook = setup();
      const id = addNamed(hook, 'owner', 'integer');
      act(() => hook.result.current.addRelation(relation()));
      act(() => hook.result.current.updateColumn(id, { column_name: 'owner_id' }));
      expect(hook.result.current.relations[0].column_names).toEqual(['owner_id']);
    });

    it('drops the relation when its source column is removed', () => {
      const hook = setup();
      const id = addNamed(hook, 'owner', 'integer');
      act(() => hook.result.current.addRelation(relation()));
      act(() => hook.result.current.removeColumn(id));
      expect(hook.result.current.relations).toEqual([]);
    });

    it.each(['boolean', 'serial', 'jsonb', 'timestamp with time zone'])(
      'drops the relation when the source column becomes %s',
      (type) => {
        const hook = setup();
        const id = addNamed(hook, 'owner', 'integer');
        act(() => hook.result.current.addRelation(relation()));
        act(() => hook.result.current.changeType(id, type));
        expect(hook.result.current.relations).toEqual([]);
      }
    );
  });

  describe('editing a stored table', () => {
    const PK = { is_primary_key: true, is_not_null: true, is_unique: true };
    const PLAIN = { is_primary_key: false, is_not_null: false, is_unique: false };
    const initialFor = () => ({
      tableName: 'orders',
      columns: buildEditColumns(
        [
          { Header: 'id', dataType: 'serial', constraints_type: PK, column_default: null },
          { Header: 'title', dataType: 'character varying', constraints_type: PLAIN, column_default: null },
        ],
        {}
      ),
      relations: buildEditRelations([
        {
          constraint_name: 'fk_1',
          column_names: ['title'],
          referenced_table_name: 'users',
          referenced_table_id: 'users-id',
          referenced_column_names: ['name'],
          on_delete: 'RESTRICT',
          on_update: 'RESTRICT',
        },
      ]),
    });
    const setupEdit = () => {
      const initial = initialFor();
      return { initial, hook: renderHook(() => useTableDraft([], initial)) };
    };

    it('starts as the stored table: not dirty, and ready to save', () => {
      const { hook } = setupEdit();
      expect(hook.result.current.tableName).toBe('orders');
      expect(hook.result.current.columns.map((c) => c.column_name)).toEqual(['id', 'title']);
      expect(hook.result.current.isDirty).toBe(false);
      expect(hook.result.current.canSubmit).toBe(true);
    });

    it('is dirty after a rename, a column edit or a removed column, and clean again when undone', () => {
      const { hook } = setupEdit();
      act(() => hook.result.current.setTableName('orders_2'));
      expect(hook.result.current.isDirty).toBe(true);
      act(() => hook.result.current.setTableName('orders'));
      expect(hook.result.current.isDirty).toBe(false);

      const title = hook.result.current.columns[1].id;
      act(() => hook.result.current.updateColumn(title, { column_default: 'x' }));
      expect(hook.result.current.isDirty).toBe(true);
      act(() => hook.result.current.updateColumn(title, { column_default: null }));
      expect(hook.result.current.isDirty).toBe(false);

      act(() => hook.result.current.removeColumn(title));
      expect(hook.result.current.isDirty).toBe(true);
    });

    it('keeps the type of a stored column, and lets a new column pick one', () => {
      const { hook } = setupEdit();
      act(() => hook.result.current.changeType(hook.result.current.columns[1].id, 'integer'));
      expect(hook.result.current.columns[1].data_type).toBe('character varying');

      const added = addNamed(hook, 'notes', 'bigint');
      expect(hook.result.current.columns.find((c) => c.id === added)?.data_type).toBe('bigint');
    });

    it('does not count its relations as unsaved, because they are saved as they are changed', () => {
      const { hook } = setupEdit();
      act(() => hook.result.current.replaceRelations([]));
      expect(hook.result.current.relations).toEqual([]);
      expect(hook.result.current.isDirty).toBe(false);
    });

    // A stored relation is saved as it is changed, so it names the column as the server knows it until the edit is saved.
    it('keeps a stored relation on the column name the server has when the column is renamed or removed', () => {
      const { hook } = setupEdit();
      const title = hook.result.current.columns[1].id;
      act(() => hook.result.current.updateColumn(title, { column_name: 'heading' }));
      expect(hook.result.current.relations[0].column_names).toEqual(['title']);
      act(() => hook.result.current.removeColumn(title));
      expect(hook.result.current.relations).toHaveLength(1);
    });

    it('builds the edit_table columns from the changes', () => {
      const { hook } = setupEdit();
      act(() => hook.result.current.updateColumn(hook.result.current.columns[1].id, { column_name: 'heading' }));
      addNamed(hook, 'notes');
      const entries = hook.result.current.toEditPayload();
      expect(entries.map((e) => [e.old_column?.column_name, e.new_column?.column_name])).toEqual([
        ['id', 'id'],
        ['title', 'heading'],
        [undefined, 'notes'],
      ]);
    });

    it('reports a changed primary key', () => {
      const { hook } = setupEdit();
      expect(hook.result.current.primaryKeyChange).toBeNull();
      const title = hook.result.current.columns[1].id;
      act(() => hook.result.current.togglePrimaryKey(title, true));
      expect(hook.result.current.primaryKeyChange?.next.map((c) => c.columnName)).toEqual(['id', 'title']);
    });
  });

  describe('toPayload', () => {
    it('matches the create_table arguments, without draft ids', () => {
      const hook = setup();
      act(() => hook.result.current.setTableName('orders'));
      addNamed(hook, 'owner', 'integer');
      act(() => hook.result.current.addRelation(relation()));

      const payload = hook.result.current.toPayload();
      expect(payload.tableName).toBe('orders');
      expect(payload.columns.map((c) => c.column_name)).toEqual(['id', 'owner']);
      expect(payload.columns[0]).not.toHaveProperty('id');
      expect(payload.foreignKeyDetails).toEqual([relation()]);
      expect(payload.checkingValues).toBe(true);
    });

    it('has checkingValues false and no relations when there are none', () => {
      const hook = setup();
      act(() => hook.result.current.setTableName('orders'));
      const payload = hook.result.current.toPayload();
      expect(payload.foreignKeyDetails).toEqual([]);
      expect(payload.checkingValues).toBe(false);
    });
  });
});
