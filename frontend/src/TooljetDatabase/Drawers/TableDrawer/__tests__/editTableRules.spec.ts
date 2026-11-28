/** @jest-environment node */
import {
  buildEditColumns,
  buildEditRelations,
  describeEditChanges,
  primaryKeyChange,
  toEditPayload,
} from '../editTableRules';
import { createColumn } from '../columnRules';

const PK = { is_primary_key: true, is_not_null: true, is_unique: true };
const PLAIN = { is_primary_key: false, is_not_null: false, is_unique: false };

const stored = [
  { Header: 'id', dataType: 'serial', constraints_type: PK, column_default: 'nextval(...)' },
  { Header: 'title', dataType: 'character varying', constraints_type: PLAIN, column_default: null },
  { Header: 'created', dataType: 'timestamp with time zone', constraints_type: PLAIN, column_default: null },
];
const configurations = {
  columns: { column_names: { created: 'uuid-1' }, configurations: { 'uuid-1': { timezone: 'UTC' } } },
};

const setup = () => buildEditColumns(stored, configurations);

describe('buildEditColumns', () => {
  it('turns each stored column into an existing draft column with its own id', () => {
    const columns = setup();
    expect(columns.map((c) => [c.column_name, c.data_type, c.existing])).toEqual([
      ['id', 'serial', true],
      ['title', 'character varying', true],
      ['created', 'timestamp with time zone', true],
    ]);
    expect(new Set(columns.map((c) => c.id)).size).toBe(3);
    expect(columns[0].constraints_type).toEqual(PK);
  });

  it("reads a column's configurations through its uuid, and gives the others none", () => {
    const columns = setup();
    expect(columns[2].configurations).toEqual({ timezone: 'UTC' });
    expect(columns[1].configurations).toEqual({});
  });

  it('does not share constraint objects with its input', () => {
    const columns = setup();
    columns[0].constraints_type.is_primary_key = false;
    expect(stored[0].constraints_type.is_primary_key).toBe(true);
  });
});

describe('buildEditRelations', () => {
  it('keeps what the form edits and the constraint name needed to change it later', () => {
    const [relation] = buildEditRelations([
      {
        constraint_name: 'fk_1',
        column_names: ['owner'],
        referenced_table_name: 'users',
        referenced_table_id: 'users-id',
        referenced_column_names: ['id'],
        on_delete: 'CASCADE',
        on_update: 'RESTRICT',
        extra: 'dropped',
      },
    ]);
    expect(relation).toMatchObject({
      constraint_name: 'fk_1',
      column_names: ['owner'],
      referenced_table_name: 'users',
      on_delete: 'CASCADE',
    });
    expect(relation).not.toHaveProperty('extra');
    expect(relation.id).toEqual(expect.any(String));
  });
});

describe('toEditPayload', () => {
  it('pairs an untouched column with itself', () => {
    const initial = setup();
    const [first] = toEditPayload(initial, initial);
    expect(first.old_column).toMatchObject({ column_name: 'id', data_type: 'serial' });
    expect(first.new_column).toMatchObject({ column_name: 'id', data_type: 'serial' });
  });

  it('pairs an edited column: old is what was stored, new is what it is now', () => {
    const initial = setup();
    const edited = initial.map((c) =>
      c.column_name === 'title' ? { ...c, column_name: 'heading', column_default: 'x' } : c
    );
    const entry = toEditPayload(edited, initial)[1];
    expect(entry.old_column).toMatchObject({ column_name: 'title' });
    expect(entry.old_column).not.toHaveProperty('column_default');
    expect(entry.new_column).toMatchObject({ column_name: 'heading', column_default: 'x' });
  });

  it('sends a removed column as old only, after the others', () => {
    const initial = setup();
    const entries = toEditPayload(
      initial.filter((c) => c.column_name !== 'title'),
      initial
    );
    expect(entries.map((e) => [e.old_column?.column_name, e.new_column?.column_name])).toEqual([
      ['id', 'id'],
      ['created', 'created'],
      ['title', undefined],
    ]);
  });

  it('sends an added column as new only', () => {
    const initial = setup();
    const added = createColumn({ column_name: 'notes', data_type: 'character varying' });
    const entry = toEditPayload([...initial, added], initial)[3];
    expect(entry.old_column).toBeUndefined();
    expect(entry.new_column).toMatchObject({ column_name: 'notes' });
  });

  it('leaves draft-only fields out of both sides', () => {
    const initial = setup();
    const [entry] = toEditPayload(initial, initial);
    for (const side of [entry.old_column, entry.new_column]) {
      expect(side).not.toHaveProperty('id');
      expect(side).not.toHaveProperty('existing');
    }
    expect(entry.old_column).not.toHaveProperty('configurations');
  });
});

describe('primaryKeyChange', () => {
  it('is null while the primary key is as stored', () => {
    const initial = setup();
    expect(primaryKeyChange(initial, initial)).toBeNull();
  });

  it('lists the stored and the new primary key columns once they differ', () => {
    const initial = setup();
    const changed = initial.map((c) =>
      c.column_name === 'title'
        ? { ...c, constraints_type: PK }
        : c.column_name === 'id'
          ? { ...c, constraints_type: PLAIN }
          : c
    );
    expect(primaryKeyChange(changed, initial)).toEqual({
      current: [{ columnName: 'id', icon: 'serial' }],
      next: [{ columnName: 'title', icon: 'character varying' }],
    });
  });

  it('counts a primary key that is removed', () => {
    const initial = setup();
    expect(
      primaryKeyChange(
        initial.filter((c) => c.column_name !== 'id'),
        initial
      )?.next
    ).toEqual([]);
  });
});

describe('describeEditChanges', () => {
  it('is empty while nothing changed', () => {
    const initial = setup();
    expect(describeEditChanges(initial, initial)).toEqual([]);
  });

  it('names an edited column by what it was called, an added one and a removed one by their own name', () => {
    const initial = setup();
    const edited = initial
      .filter((c) => c.column_name !== 'created')
      .map((c) => (c.column_name === 'title' ? { ...c, column_name: 'heading' } : c));
    const added = createColumn({ column_name: 'notes', data_type: 'character varying' });
    expect(describeEditChanges([...edited, added], initial)).toEqual([
      { type: 'edit', name: 'title' },
      { type: 'add', name: 'notes' },
      { type: 'remove', name: 'created' },
    ]);
  });

  it('counts a changed time zone as an edit', () => {
    const initial = setup();
    const changed = initial.map((c) =>
      c.column_name === 'created' ? { ...c, configurations: { timezone: 'Asia/Kolkata' } } : c
    );
    expect(describeEditChanges(changed, initial)).toEqual([{ type: 'edit', name: 'created' }]);
  });
});
