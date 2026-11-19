import { act, renderHook } from '@testing-library/react';
import type { DraftColumn, DraftRelation } from '../../TableDrawer/types';
import { createColumn } from '../../TableDrawer/columnRules';
import { relationBlockedReason, useColumnDraft } from '../useColumnDraft';

const relation = (column: string): DraftRelation => ({
  id: 'relation-1',
  column_names: [column],
  referenced_table_name: 'users',
  referenced_column_names: ['id'],
  on_update: 'RESTRICT',
  on_delete: 'RESTRICT',
});

const stored = (overrides: Partial<DraftColumn> = {}): DraftColumn =>
  createColumn({ column_name: 'owner', data_type: 'character varying', existing: true, ...overrides });

describe('useColumnDraft | add', () => {
  const setup = (others: string[] = ['id']) => renderHook(() => useColumnDraft(others));

  it('starts as an empty varchar column that cannot be submitted', () => {
    const { result } = setup();
    expect(result.current.column).toMatchObject({ column_name: '', data_type: 'character varying' });
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('can be submitted once the name is valid, and not while it is taken or malformed', () => {
    const { result } = setup();
    act(() => result.current.setName('title'));
    expect(result.current.canSubmit).toBe(true);
    act(() => result.current.setName('id'));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setName('1title'));
    expect(result.current.canSubmit).toBe(false);
  });

  it('demands a default for a not null column, except serial', () => {
    const { result } = setup();
    act(() => result.current.setName('title'));
    act(() => result.current.setNotNull(true));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setDefault('untitled'));
    expect(result.current.canSubmit).toBe(true);
    act(() => result.current.setType('serial'));
    expect(result.current.canSubmit).toBe(true);
  });

  it('blocks submit while the json default is invalid', () => {
    const { result } = setup();
    act(() => result.current.setName('meta'));
    act(() => result.current.setType('jsonb'));
    act(() => result.current.setDefaultInvalid(true));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setDefaultInvalid(false));
    expect(result.current.canSubmit).toBe(true);
  });

  it('makes a serial column not null and unique, and clears the default', () => {
    const { result } = setup();
    act(() => result.current.setDefault('x'));
    act(() => result.current.setType('serial'));
    expect(result.current.column.constraints_type).toMatchObject({ is_not_null: true, is_unique: true });
    expect(result.current.column.column_default).toBeNull();
  });

  it('follows a rename with its relation', () => {
    const { result } = setup();
    act(() => result.current.setName('owner'));
    act(() => result.current.addRelation(relation('owner')));
    act(() => result.current.setName('owner_id'));
    expect(result.current.relations[0].column_names).toEqual(['owner_id']);
  });

  it('drops the relation when the type cannot have one', () => {
    const { result } = setup();
    act(() => result.current.setName('owner'));
    act(() => result.current.addRelation(relation('owner')));
    act(() => result.current.setType('boolean'));
    expect(result.current.relations).toEqual([]);
  });

  it('keeps at most one relation', () => {
    const { result } = setup();
    act(() => result.current.setName('owner'));
    act(() => result.current.addRelation(relation('owner')));
    act(() => result.current.addRelation({ ...relation('owner'), referenced_table_name: 'teams' }));
    expect(result.current.relations).toHaveLength(1);
    expect(result.current.relations[0].referenced_table_name).toBe('teams');
  });

  it('builds the createColumn arguments', () => {
    const { result } = setup();
    act(() => result.current.setName('owner'));
    act(() => result.current.setUnique(true));
    act(() => result.current.addRelation(relation('owner')));
    expect(result.current.toPayload()).toEqual({
      columnName: 'owner',
      dataType: 'character varying',
      defaultValue: '',
      isNotNull: false,
      isUnique: true,
      isSerial: false,
      checkingValues: true,
      foreignKeyDetails: [
        {
          column_names: ['owner'],
          referenced_table_name: 'users',
          referenced_column_names: ['id'],
          on_update: 'RESTRICT',
          on_delete: 'RESTRICT',
        },
      ],
      configurations: {},
    });
  });

  it('sends the time zone of a timestamp column', () => {
    const { result } = setup();
    act(() => result.current.setName('seen_at'));
    act(() => result.current.setType('timestamp with time zone'));
    act(() => result.current.setTimezone('Asia/Kolkata'));
    expect(result.current.toPayload().configurations).toEqual({ timezone: 'Asia/Kolkata' });
  });
});

describe('useColumnDraft | edit', () => {
  const setup = (column = stored(), relations: DraftRelation[] = []) =>
    renderHook(() => useColumnDraft(['id'], { column, relations }));

  it('starts clean and submittable, with the column as stored', () => {
    const { result } = setup();
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canSubmit).toBe(true);
  });

  it('does not count its own saved name as taken', () => {
    const { result } = setup();
    act(() => result.current.setName('owner'));
    expect(result.current.canSubmit).toBe(true);
    act(() => result.current.setName('id'));
    expect(result.current.canSubmit).toBe(false);
  });

  it('is dirty once anything differs from the stored column', () => {
    const { result } = setup();
    act(() => result.current.setName('owner_2'));
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.setName('owner'));
    expect(result.current.isDirty).toBe(false);
  });

  it('lets a rename of a not null column through without a default', () => {
    const { result } = setup(
      stored({ constraints_type: { is_not_null: true, is_unique: false, is_primary_key: false } })
    );
    act(() => result.current.setName('owner_2'));
    expect(result.current.canSubmit).toBe(true);
  });

  it('demands a default only when not null is switched on', () => {
    const { result } = setup();
    act(() => result.current.setNotNull(true));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setDefault('nobody'));
    expect(result.current.canSubmit).toBe(true);
  });

  it('keeps the other constraints when the type changes', () => {
    const { result } = setup(
      stored({ constraints_type: { is_not_null: true, is_unique: true, is_primary_key: false } })
    );
    act(() => result.current.setType('integer'));
    expect(result.current.column.data_type).toBe('integer');
    expect(result.current.column.constraints_type).toMatchObject({ is_not_null: true, is_unique: true });
  });

  it.each(['boolean', 'jsonb', 'timestamp with time zone'])(
    'clears unique when the column becomes %s, a type that cannot be unique',
    (type) => {
      const { result } = setup(
        stored({ constraints_type: { is_not_null: false, is_unique: true, is_primary_key: false } })
      );
      act(() => result.current.setType(type));
      expect(result.current.column.constraints_type.is_unique).toBe(false);
    }
  );

  it('keeps unique when the column becomes a type that can be unique', () => {
    const { result } = setup(
      stored({ constraints_type: { is_not_null: false, is_unique: true, is_primary_key: false } })
    );
    act(() => result.current.setType('integer'));
    expect(result.current.column.constraints_type.is_unique).toBe(true);
  });

  it('leaves the primary key switches alone', () => {
    const { result } = setup(
      stored({ constraints_type: { is_not_null: true, is_unique: true, is_primary_key: true } })
    );
    act(() => result.current.setNotNull(false));
    act(() => result.current.setUnique(false));
    expect(result.current.column.constraints_type).toMatchObject({ is_not_null: true, is_unique: true });
  });

  it('does not rewrite saved relations on a rename: they keep the name the server has', () => {
    const { result } = setup(stored(), [relation('owner')]);
    act(() => result.current.setName('owner_2'));
    expect(result.current.relations[0].column_names).toEqual(['owner']);
  });
});

describe('relationBlockedReason', () => {
  const draftColumn = (name: string, type: string) => createColumn({ column_name: name, data_type: type });

  it('asks for the column details first', () => {
    expect(relationBlockedReason(draftColumn('', 'integer'), [])).toBe(
      'Fill in column details to create a foreign key relation'
    );
    expect(relationBlockedReason(draftColumn('id', 'integer'), ['id'])).toBe(
      'Fill in column details to create a foreign key relation'
    );
  });

  it.each([
    ['serial', 'Foreign key relation cannot be created for serial type column'],
    ['boolean', 'Foreign key relation cannot be created for boolean type column'],
    ['jsonb', 'Foreign key relation cannot be created for JSON type column'],
    ['timestamp with time zone', 'Foreign key relation cannot be created for this data type'],
  ])('names the type that cannot have one: %s', (type, reason) => {
    expect(relationBlockedReason(draftColumn('owner', type), [])).toBe(reason);
  });

  it('allows a named column of another type', () => {
    expect(relationBlockedReason(draftColumn('owner', 'integer'), [])).toBeNull();
  });
});
