import { hasExactKeyValues } from './cellEditing';
import { UNSAFE_KEY_TYPES } from './deleteRows';
import type { GridColumn, GridRow } from './useTableGrid';

// The drawer saves with a filter built from the row's key, so the same rows that cannot be deleted safely cannot be
// edited: no key to match on, a bigint or jsonb key (no exact filter text), or a key already rounded past 2^53.
export const getEditBlockedReason = (
  primaryKeys: string[],
  columns: GridColumn[],
  row: GridRow
): string | undefined => {
  if (primaryKeys.length === 0) return 'Rows can only be edited in a table with a primary key';
  const unsafe = columns.find(
    (column) => primaryKeys.includes(column.accessor) && UNSAFE_KEY_TYPES.includes(column.dataType)
  );
  if (unsafe) return `Rows cannot be edited in a table whose primary key is a ${unsafe.dataType}`;
  if (!hasExactKeyValues(primaryKeys, row))
    return 'This row cannot be edited: its primary key is too large to match exactly';
  return undefined;
};
