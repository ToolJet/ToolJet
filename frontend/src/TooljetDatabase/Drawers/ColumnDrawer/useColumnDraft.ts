import { useCallback, useMemo, useRef, useState } from 'react';
import { applyTypeChange, canBeUnique, canHaveRelation, createColumn } from '../TableDrawer/columnRules';
import type { DraftColumn, DraftRelation, RelationPayload } from '../TableDrawer/types';
import { isColumnNameValid } from './columnNameRules';

const RELATION_BLOCKED: Record<string, string> = {
  serial: 'Foreign key relation cannot be created for serial type column',
  boolean: 'Foreign key relation cannot be created for boolean type column',
  jsonb: 'Foreign key relation cannot be created for JSON type column',
  'timestamp with time zone': 'Foreign key relation cannot be created for this data type',
};

/** Why the column cannot start a relation yet, or null when it can. */
export const relationBlockedReason = (column: DraftColumn, otherNames: string[]): string | null => {
  if (!isColumnNameValid(column.column_name, otherNames)) {
    return 'Fill in column details to create a foreign key relation';
  }
  return canHaveRelation(column.data_type) ? null : (RELATION_BLOCKED[column.data_type ?? ''] ?? null);
};

/** The stored column being edited, and the relations it already has (those are saved as they change). */
export type ColumnDraftInitial = { column: DraftColumn; relations: DraftRelation[] };

/** What `tooljetDatabaseService.createColumn` takes. */
export type NewColumnPayload = {
  columnName: string;
  dataType: string;
  defaultValue: string;
  isNotNull: boolean;
  isUnique: boolean;
  isSerial: boolean;
  checkingValues: boolean;
  foreignKeyDetails: RelationPayload[];
  configurations: Record<string, unknown>;
};

const stripRelation = ({ id: _id, constraint_name: _name, ...relation }: DraftRelation): RelationPayload => relation;

const snapshot = ({ column_name, data_type, column_default, constraints_type, configurations }: DraftColumn) =>
  JSON.stringify({ column_name, data_type, column_default: column_default ?? '', constraints_type, configurations });

/**
 * Everything the column drawers edit: one column and at most one relation, with the rules that tie them together.
 * Nothing here talks to the server. Without `initial` it drafts a new column; with it, an edit of that stored one.
 * `otherNames` are the table's other columns, for the duplicate check.
 */
export function useColumnDraft(otherNames: string[] = [], initial?: ColumnDraftInitial) {
  const isEdit = !!initial;
  const [column, setColumn] = useState<DraftColumn>(
    () => initial?.column ?? createColumn({ data_type: 'character varying' })
  );
  const [relations, setRelations] = useState<DraftRelation[]>(initial?.relations ?? []);
  const [defaultInvalid, setDefaultInvalid] = useState(false);
  const start = useRef({
    snapshot: snapshot(initial?.column ?? createColumn({ data_type: 'character varying' })),
    notNull: initial?.column.constraints_type.is_not_null ?? false,
  }).current;

  const change = useCallback((patch: (current: DraftColumn) => DraftColumn) => setColumn(patch), []);

  // A new column's relation is part of the draft, so it follows a rename. A stored column's relations are saved as they
  // change: they keep the name the server has until the edit is saved.
  const setName = useCallback(
    (name: string) => {
      setColumn((current) => ({ ...current, column_name: name }));
      if (!isEdit) {
        setRelations((current) => current.map((relation) => ({ ...relation, column_names: [name] })));
      }
    },
    [isEdit]
  );

  const setType = useCallback(
    (type: string) => {
      setDefaultInvalid(false);
      // A stored column keeps its other constraints across a type change, except unique where the new type cannot have it.
      if (isEdit) {
        return change((current) => ({
          ...current,
          data_type: type,
          constraints_type: {
            ...current.constraints_type,
            is_unique:
              current.constraints_type.is_unique && (current.constraints_type.is_primary_key || canBeUnique(type)),
          },
        }));
      }
      change((current) => {
        const next = applyTypeChange(current, type);
        // A serial column is unique as well as not null.
        return type === 'serial' ? { ...next, constraints_type: { ...next.constraints_type, is_unique: true } } : next;
      });
      if (!canHaveRelation(type)) setRelations([]);
    },
    [isEdit, change]
  );

  const setDefault = useCallback(
    (value: string | null) => change((current) => ({ ...current, column_default: value })),
    [change]
  );

  const setTimezone = useCallback(
    (timezone: string) =>
      change((current) => ({ ...current, configurations: { ...current.configurations, timezone } })),
    [change]
  );

  // A primary key is not null and unique, serial is not null and (new) unique, and some types cannot be unique: those
  // switches are fixed.
  const setNotNull = useCallback(
    (checked: boolean) =>
      change((current) =>
        current.constraints_type.is_primary_key || current.data_type === 'serial'
          ? current
          : { ...current, constraints_type: { ...current.constraints_type, is_not_null: checked } }
      ),
    [change]
  );

  const setUnique = useCallback(
    (checked: boolean) =>
      change((current) =>
        current.constraints_type.is_primary_key || current.data_type === 'serial' || !canBeUnique(current.data_type)
          ? current
          : { ...current, constraints_type: { ...current.constraints_type, is_unique: checked } }
      ),
    [change]
  );

  // One relation per column: a new one replaces the old.
  const addRelation = useCallback(
    (relation: RelationPayload) => setRelations([{ ...relation, id: `relation-${column.id}` }]),
    [column.id]
  );
  const updateRelation = useCallback(
    (id: string, relation: RelationPayload) =>
      setRelations((current) => current.map((item) => (item.id === id ? { ...relation, id } : item))),
    []
  );
  const removeRelation = useCallback(
    (id: string) => setRelations((current) => current.filter((relation) => relation.id !== id)),
    []
  );
  const replaceRelations = useCallback((next: DraftRelation[]) => setRelations(next), []);

  const { is_not_null: notNull } = column.constraints_type;
  // NOT NULL needs a default for the rows already there, but only when it is being switched on: a column that already
  // is not null holds a value in every row. Serial fills itself.
  const requiresDefault = notNull && !start.notNull && column.data_type !== 'serial' && !column.column_default;

  const canSubmit = useMemo(
    () =>
      isColumnNameValid(column.column_name, otherNames) &&
      column.data_type !== null &&
      !defaultInvalid &&
      !requiresDefault,
    [column.column_name, column.data_type, otherNames, defaultInvalid, requiresDefault]
  );

  const isDirty = useMemo(() => snapshot(column) !== start.snapshot, [column, start]);

  const toPayload = useCallback(
    (): NewColumnPayload => ({
      columnName: column.column_name,
      dataType: column.data_type as string,
      defaultValue: column.column_default ?? '',
      isNotNull: column.constraints_type.is_not_null,
      isUnique: column.constraints_type.is_unique,
      isSerial: column.data_type === 'serial',
      checkingValues: relations.length > 0,
      foreignKeyDetails: relations.map(stripRelation),
      configurations:
        column.data_type === 'timestamp with time zone' ? { timezone: column.configurations.timezone } : {},
    }),
    [column, relations]
  );

  return {
    column,
    // The shape the relation list reads.
    columns: useMemo(() => [column], [column]),
    relations,
    canSubmit,
    isDirty,
    requiresDefault,
    setName,
    setType,
    setDefault,
    setTimezone,
    setNotNull,
    setUnique,
    setDefaultInvalid,
    addRelation,
    updateRelation,
    removeRelation,
    replaceRelations,
    toPayload,
  };
}
