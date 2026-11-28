import { useCallback, useMemo, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  applyPrimaryKey,
  applyTypeChange,
  canBePrimaryKey,
  canBeUnique,
  canHaveRelation,
  createColumn,
  createDefaultColumns,
  createId,
  isPinnedPrimaryKey,
  isPrimaryKeyLocked,
  toColumnPayload,
} from './columnRules';
import { getColumnNameError } from '../ColumnDrawer/columnNameRules';
import { primaryKeyChange as diffPrimaryKey, toEditPayload as buildEditPayload } from './editTableRules';
import { isTableNameValid } from './tableNameRules';
import type { ColumnPayload, DraftColumn, DraftRelation, RelationPayload } from './types';

type EditableColumnFields = Pick<DraftColumn, 'column_name' | 'column_default' | 'configurations'>;

export type TablePayload = {
  tableName: string;
  columns: ColumnPayload[];
  foreignKeyDetails: RelationPayload[];
  checkingValues: boolean;
};

type Draft = {
  tableName: string;
  columns: DraftColumn[];
  relations: DraftRelation[];
  /** Column ids whose default the editor reports as invalid (bad JSON). */
  invalidDefaults: Record<string, true>;
};

const toRelationPayload = ({ id: _id, constraint_name: _name, ...relation }: DraftRelation): RelationPayload =>
  relation;

/** The stored table to edit. Its relations are saved as they are changed, so they never make the draft dirty. */
export type TableDraftInitial = { tableName: string; columns: DraftColumn[]; relations: DraftRelation[] };

const snapshot = (tableName: string, columns: DraftColumn[]) =>
  JSON.stringify({ tableName, columns: columns.map(toColumnPayload) });

/**
 * Everything a table drawer edits, with the rules that tie it together. Nothing here talks to the server.
 * Without `initial` it drafts a new table; with it, an edit of that stored table.
 */
export function useTableDraft(existingTableNames: string[] = [], initial?: TableDraftInitial) {
  const [draft, setDraft] = useState<Draft>(() => ({
    tableName: initial?.tableName ?? '',
    columns: initial?.columns ?? createDefaultColumns(),
    relations: initial?.relations ?? [],
    invalidDefaults: {},
  }));
  const { tableName, columns, relations, invalidDefaults } = draft;
  // A stored table's relations are saved as they change, so they keep the column names the server has until the edit
  // is saved: a rename or a removal in the draft does not touch them.
  const isEdit = !!initial;

  const start = useRef({
    columns: initial?.columns ?? [],
    snapshot: initial ? snapshot(initial.tableName, initial.columns) : snapshot('', createDefaultColumns()),
  }).current;

  const update = useCallback((change: (current: Draft) => Draft) => setDraft(change), []);

  const mapColumn = useCallback(
    (id: string, change: (column: DraftColumn, all: DraftColumn[]) => DraftColumn) =>
      update((current) => ({
        ...current,
        columns: current.columns.map((column) => (column.id === id ? change(column, current.columns) : column)),
      })),
    [update]
  );

  const setTableName = useCallback((name: string) => update((current) => ({ ...current, tableName: name })), [update]);

  const addColumn = useCallback(
    () => update((current) => ({ ...current, columns: [...current.columns, createColumn()] })),
    [update]
  );

  const removeColumn = useCallback(
    (id: string) =>
      update((current) => {
        const column = current.columns.find((item) => item.id === id);
        if (!column || isPinnedPrimaryKey(column, current.columns)) return current;
        const { [id]: _removed, ...invalid } = current.invalidDefaults;
        return {
          ...current,
          columns: current.columns.filter((item) => item.id !== id),
          relations: isEdit
            ? current.relations
            : current.relations.filter((relation) => relation.column_names[0] !== column.column_name),
          invalidDefaults: invalid,
        };
      }),
    [update, isEdit]
  );

  const updateColumn = useCallback(
    (id: string, patch: Partial<EditableColumnFields>) =>
      update((current) => {
        const column = current.columns.find((item) => item.id === id);
        if (!column) return current;
        const renamed = !isEdit && patch.column_name !== undefined && patch.column_name !== column.column_name;
        return {
          ...current,
          columns: current.columns.map((item) => (item.id === id ? { ...item, ...patch } : item)),
          relations: renamed
            ? current.relations.map((relation) =>
                relation.column_names[0] === column.column_name
                  ? { ...relation, column_names: [patch.column_name as string] }
                  : relation
              )
            : current.relations,
        };
      }),
    [update, isEdit]
  );

  const changeType = useCallback(
    (id: string, type: string) =>
      update((current) => {
        const column = current.columns.find((item) => item.id === id);
        // A stored column's type changes from its own edit drawer: a cast depends on the rows.
        if (!column || column.existing) return current;
        const { [id]: _cleared, ...invalid } = current.invalidDefaults;
        return {
          ...current,
          columns: current.columns.map((item) => (item.id === id ? applyTypeChange(item, type) : item)),
          relations: canHaveRelation(type)
            ? current.relations
            : current.relations.filter((relation) => relation.column_names[0] !== column.column_name),
          invalidDefaults: invalid,
        };
      }),
    [update]
  );

  const togglePrimaryKey = useCallback(
    (id: string, checked: boolean) =>
      mapColumn(id, (column, all) => {
        if (checked ? !canBePrimaryKey(column.data_type) : isPrimaryKeyLocked(column, all)) return column;
        return applyPrimaryKey(column, checked);
      }),
    [mapColumn]
  );

  // A primary key is always not null and unique, serial is always not null, and some types cannot be unique: those switches are fixed.
  const toggleNotNull = useCallback(
    (id: string, checked: boolean) =>
      mapColumn(id, (column) =>
        column.constraints_type.is_primary_key || column.data_type === 'serial'
          ? column
          : { ...column, constraints_type: { ...column.constraints_type, is_not_null: checked } }
      ),
    [mapColumn]
  );

  const toggleUnique = useCallback(
    (id: string, checked: boolean) =>
      mapColumn(id, (column) =>
        column.constraints_type.is_primary_key || !canBeUnique(column.data_type)
          ? column
          : { ...column, constraints_type: { ...column.constraints_type, is_unique: checked } }
      ),
    [mapColumn]
  );

  const setDefaultInvalid = useCallback(
    (id: string, invalid: boolean) =>
      update((current) => {
        if (!!current.invalidDefaults[id] === invalid) return current;
        const { [id]: _cleared, ...rest } = current.invalidDefaults;
        return { ...current, invalidDefaults: invalid ? { ...rest, [id]: true } : rest };
      }),
    [update]
  );

  // The pinned primary key stays first: it is not moved, and nothing is moved above it.
  const moveColumn = useCallback(
    (activeId: string, overId: string) =>
      update((current) => {
        const from = current.columns.findIndex((column) => column.id === activeId);
        const to = current.columns.findIndex((column) => column.id === overId);
        if (from < 0 || to < 0 || from === to) return current;
        if (
          isPinnedPrimaryKey(current.columns[from], current.columns) ||
          isPinnedPrimaryKey(current.columns[to], current.columns)
        ) {
          return current;
        }
        return { ...current, columns: arrayMove(current.columns, from, to) };
      }),
    [update]
  );

  const addRelation = useCallback(
    (relation: RelationPayload) =>
      update((current) => ({
        ...current,
        relations: [...current.relations, { ...relation, id: createId('relation') }],
      })),
    [update]
  );

  const updateRelation = useCallback(
    (id: string, relation: RelationPayload) =>
      update((current) => ({
        ...current,
        relations: current.relations.map((item) => (item.id === id ? { ...relation, id } : item)),
      })),
    [update]
  );

  const removeRelation = useCallback(
    (id: string) =>
      update((current) => ({ ...current, relations: current.relations.filter((relation) => relation.id !== id) })),
    [update]
  );

  const replaceRelations = useCallback(
    (next: DraftRelation[]) => update((current) => ({ ...current, relations: next })),
    [update]
  );

  // What is wrong with each new column's name, by column id. A stored column keeps the name it already has.
  const columnNameErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const column of columns) {
      if (column.existing) continue;
      const others = columns.filter((other) => other.id !== column.id).map((other) => other.column_name);
      const error = getColumnNameError(column.column_name, others);
      if (error) errors[column.id] = error;
    }
    return errors;
  }, [columns]);

  const canSubmit = useMemo(
    () =>
      isTableNameValid(tableName, existingTableNames) &&
      columns.some((column) => column.constraints_type.is_primary_key) &&
      columns.every((column) => column.column_name.trim() !== '' && column.data_type !== null) &&
      Object.keys(columnNameErrors).length === 0 &&
      Object.keys(invalidDefaults).length === 0,
    [tableName, columns, columnNameErrors, invalidDefaults, existingTableNames]
  );

  const isDirty = useMemo(
    () => snapshot(tableName, columns) !== start.snapshot || (!initial && relations.length > 0),
    [tableName, columns, relations, start, initial]
  );

  const toEditPayload = useCallback(() => buildEditPayload(columns, start.columns), [columns, start]);
  const primaryKeyChange = useMemo(() => diffPrimaryKey(columns, start.columns), [columns, start]);

  const toPayload = useCallback(
    (): TablePayload => ({
      tableName,
      columns: columns.map(toColumnPayload),
      foreignKeyDetails: relations.map(toRelationPayload),
      checkingValues: relations.length > 0,
    }),
    [tableName, columns, relations]
  );

  return {
    tableName,
    columns,
    relations,
    columnNameErrors,
    canSubmit,
    isDirty,
    setTableName,
    addColumn,
    removeColumn,
    updateColumn,
    changeType,
    togglePrimaryKey,
    toggleNotNull,
    toggleUnique,
    setDefaultInvalid,
    moveColumn,
    addRelation,
    updateRelation,
    removeRelation,
    replaceRelations,
    toPayload,
    toEditPayload,
    primaryKeyChange,
  };
}
