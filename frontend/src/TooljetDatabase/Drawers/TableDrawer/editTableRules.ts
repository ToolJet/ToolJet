import { isEqual } from 'lodash';
import { createColumn, createId, toColumnPayload } from './columnRules';
import type { ColumnPayload, DraftColumn, DraftRelation } from './types';

/** A column as the page holds it: `Header` is the column name. */
export type StoredColumn = {
  Header: string;
  dataType: string;
  constraints_type?: unknown;
  column_default?: string | null;
};

type StoredConfigurations = {
  columns?: { column_names?: Record<string, string>; configurations?: Record<string, Record<string, unknown>> };
};

type StoredRelation = {
  /** The server sends more fields than the form uses. */
  [field: string]: unknown;
  constraint_name?: string;
  column_names: string[];
  referenced_table_name: string;
  referenced_table_id?: string;
  referenced_column_names: string[];
  on_delete: string;
  on_update: string;
};

/** The table's stored columns as draft columns. Each keeps its own id, so a rename still pairs with what it was. */
export const buildEditColumns = (columns: StoredColumn[], configurations: StoredConfigurations = {}): DraftColumn[] =>
  columns.map((column) => {
    const uuid = configurations?.columns?.column_names?.[column.Header];
    return createColumn({
      column_name: column.Header,
      data_type: column.dataType,
      column_default: column.column_default ?? null,
      constraints_type: { ...(column.constraints_type as DraftColumn['constraints_type']) },
      configurations: { ...((uuid && configurations?.columns?.configurations?.[uuid]) || {}) },
      existing: true,
    });
  });

export const buildEditRelations = (relations: StoredRelation[]): DraftRelation[] =>
  relations.map((relation) => ({
    id: createId('relation'),
    constraint_name: relation.constraint_name,
    column_names: relation.column_names,
    referenced_table_name: relation.referenced_table_name,
    referenced_table_id: relation.referenced_table_id,
    referenced_column_names: relation.referenced_column_names,
    on_delete: relation.on_delete,
    on_update: relation.on_update,
  }));

export type EditColumnChange = {
  old_column?: Omit<ColumnPayload, 'configurations'>;
  new_column?: ColumnPayload;
};

/**
 * The `edit_table` columns: the request is the diff. A stored column still there pairs old with new, one that was
 * removed has only old, and one that was added has only new. Pairs and additions come in the draft's order.
 */
export const toEditPayload = (columns: DraftColumn[], initial: DraftColumn[]): EditColumnChange[] => {
  const stored = new Map(initial.map((column) => [column.id, column]));
  const oldSide = (column: DraftColumn): EditColumnChange['old_column'] => {
    const { configurations: _configurations, ...rest } = toColumnPayload(column);
    return rest;
  };
  const current = columns.map((column) => {
    const before = stored.get(column.id);
    return before
      ? { old_column: oldSide(before), new_column: toColumnPayload(column) }
      : { new_column: toColumnPayload(column) };
  });
  const removed = initial
    .filter((column) => !columns.some((item) => item.id === column.id))
    .map((column) => ({ old_column: oldSide(column) }));
  return [...current, ...removed];
};

export type KeyColumn = { columnName: string; icon: string | null };
export type PrimaryKeyChange = { current: KeyColumn[]; next: KeyColumn[] };

const keyColumns = (columns: DraftColumn[]): KeyColumn[] =>
  columns
    .filter((column) => column.constraints_type.is_primary_key)
    .map((column) => ({ columnName: column.column_name, icon: column.data_type }));

/** The stored and the new primary key, or null while they are the same. Saving a change drops the old key. */
export const primaryKeyChange = (columns: DraftColumn[], initial: DraftColumn[]): PrimaryKeyChange | null => {
  const current = keyColumns(initial);
  const next = keyColumns(columns);
  const same =
    current.length === next.length && current.every((key, index) => key.columnName === next[index].columnName);
  return same ? null : { current, next };
};

export type EditChange = { type: 'add' | 'edit' | 'remove'; name: string };

/** What saving would do, one line per column that changes: the list the confirmation shows. */
export const describeEditChanges = (columns: DraftColumn[], initial: DraftColumn[]): EditChange[] => {
  const stored = new Map(initial.map((column) => [column.id, column]));
  const changes: EditChange[] = [];
  columns.forEach((column) => {
    const before = stored.get(column.id);
    if (!before) changes.push({ type: 'add', name: column.column_name });
    else if (!isEqual(toColumnPayload(before), toColumnPayload(column))) {
      changes.push({ type: 'edit', name: before.column_name });
    }
  });
  initial.forEach((column) => {
    if (!columns.some((item) => item.id === column.id)) changes.push({ type: 'remove', name: column.column_name });
  });
  return changes;
};
