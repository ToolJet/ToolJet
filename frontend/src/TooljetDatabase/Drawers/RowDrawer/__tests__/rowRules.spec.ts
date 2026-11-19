import type { GridColumn } from '@/TooljetDatabase/Table/Grid/useTableGrid';
import {
  buildCreatePayload,
  buildEditPayload,
  canBeNull,
  hasBlankField,
  initialFieldState,
  isLocked,
  orderRowColumns,
  switchMode,
  type RowFieldState,
} from '../rowRules';

const column = (accessor: string, dataType: string, extra: Partial<GridColumn> = {}): GridColumn => ({
  Header: accessor,
  accessor,
  dataType,
  column_default: null,
  constraints_type: { is_primary_key: false, is_not_null: false },
  ...extra,
});

const pk = (accessor: string, dataType = 'serial') =>
  column(accessor, dataType, { constraints_type: { is_primary_key: true, is_not_null: true } });

const statesFor = (columns: GridColumn[], kind: 'create' | 'edit', row?: Record<string, unknown>) =>
  Object.fromEntries(columns.map((c) => [c.accessor, initialFieldState(c, kind, row)]));

describe('rowRules | modes', () => {
  it('offers NULL only for a nullable column that is not a key', () => {
    expect(canBeNull(column('title', 'character varying'))).toBe(true);
    expect(canBeNull(column('title', 'character varying', { constraints_type: { is_not_null: true } }))).toBe(false);
    expect(canBeNull(pk('id'))).toBe(false);
  });

  it('locks a serial column always and a primary key only when editing', () => {
    expect(isLocked(pk('id'), 'create')).toBe(true);
    expect(isLocked(pk('code', 'character varying'), 'create')).toBe(false);
    expect(isLocked(pk('code', 'character varying'), 'edit')).toBe(true);
    expect(isLocked(column('title', 'character varying'), 'edit')).toBe(false);
  });

  it('lists primary keys first', () => {
    const columns = [column('title', 'character varying'), pk('id')];
    expect(orderRowColumns(columns).map((c) => c.accessor)).toEqual(['id', 'title']);
  });
});

describe('rowRules | create', () => {
  it('starts a column with a default on Default and one without on Custom', () => {
    expect(initialFieldState(column('tag', 'character varying', { column_default: 'new' }), 'create').mode).toBe(
      'default'
    );
    expect(initialFieldState(column('tag', 'character varying'), 'create')).toEqual({ mode: 'custom', value: '' });
  });

  it('starts a key on Custom even when it has a default', () => {
    expect(initialFieldState(pk('code', 'character varying'), 'create').mode).toBe('custom');
  });

  it('starts a timestamp with no default at the current time, and a boolean at false', () => {
    const stamp = initialFieldState(column('at', 'timestamp with time zone'), 'create');
    expect(stamp.mode).toBe('custom');
    expect(Number.isNaN(Date.parse(String(stamp.value)))).toBe(false);
    expect(initialFieldState(column('ok', 'boolean'), 'create')).toEqual({ mode: 'custom', value: false });
  });

  it('leaves a column on its default and a serial column out of the request', () => {
    const columns = [
      pk('id'),
      column('title', 'character varying'),
      column('tag', 'character varying', { column_default: 'new' }),
    ];
    const states = statesFor(columns, 'create');
    states.title = { mode: 'custom', value: 'Hello' };
    expect(buildCreatePayload(columns, states)).toEqual({ title: 'Hello' });
  });

  it('sends an explicit null for a column on NULL', () => {
    const columns = [column('title', 'character varying'), column('ok', 'boolean')];
    const states = statesFor(columns, 'create');
    states.title = { mode: 'null', value: null };
    states.ok = { mode: 'null', value: null };
    expect(buildCreatePayload(columns, states)).toEqual({ title: null, ok: null });
  });

  it('keeps a typed empty string for a text column', () => {
    const columns = [column('title', 'character varying')];
    expect(buildCreatePayload(columns, statesFor(columns, 'create'))).toEqual({ title: '' });
  });

  it('flags a number, JSON or cleared time left empty, but not a text column', () => {
    const columns = [column('n', 'integer'), column('s', 'character varying')];
    expect(hasBlankField(columns, statesFor(columns, 'create'))).toBe(true);
    expect(hasBlankField([columns[1]], statesFor([columns[1]], 'create'))).toBe(false);
    const states = statesFor(columns, 'create');
    states.n = { mode: 'null', value: null };
    expect(hasBlankField(columns, states)).toBe(false);
  });

  it('does not flag a serial column', () => {
    const columns = [pk('id')];
    expect(hasBlankField(columns, statesFor(columns, 'create'))).toBe(false);
  });
});

describe('rowRules | edit', () => {
  const columns = [
    pk('id'),
    column('title', 'character varying'),
    column('n', 'integer'),
    column('tag', 'character varying', { column_default: 'new' }),
    column('doc', 'jsonb', { column_default: { a: 1 } as unknown as string }),
  ];
  const row = { id: 10, title: 'Hello', n: 0, tag: 'new', doc: { a: 1 } };

  it('reads each column from the row: null, default or custom', () => {
    const states = statesFor(columns, 'edit', { ...row, title: null });
    expect(states.title).toEqual({ mode: 'null', value: null });
    expect(states.tag.mode).toBe('default');
    expect(states.doc.mode).toBe('default');
    expect(states.n).toEqual({ mode: 'custom', value: '0' });
    expect(states.id).toEqual({ mode: 'custom', value: '10' });
  });

  it('sends nothing when nothing changed', () => {
    const initial = statesFor(columns, 'edit', row);
    expect(buildEditPayload(columns, initial, initial)).toEqual({});
  });

  it('sends only the changed columns, and never a locked one', () => {
    const initial = statesFor(columns, 'edit', row);
    const states: Record<string, RowFieldState> = { ...initial, title: { mode: 'custom', value: 'Bye' } };
    states.id = { mode: 'custom', value: '11' };
    expect(buildEditPayload(columns, states, initial)).toEqual({ title: 'Bye' });
  });

  it('sends null for NULL and the column default for Default', () => {
    const initial = statesFor(columns, 'edit', { ...row, tag: 'old' });
    const states: Record<string, RowFieldState> = { ...initial, title: { mode: 'null', value: null } };
    states.tag = switchMode(columns[3], initial.tag, 'default');
    expect(buildEditPayload(columns, states, initial)).toEqual({ title: null, tag: 'new' });
  });

  it('going back to Custom restores the stored value', () => {
    const initial = statesFor(columns, 'edit', row);
    const nulled = switchMode(columns[1], initial.title, 'null');
    expect(switchMode(columns[1], nulled, 'custom', 'Hello')).toEqual({ mode: 'custom', value: 'Hello' });
  });
});
