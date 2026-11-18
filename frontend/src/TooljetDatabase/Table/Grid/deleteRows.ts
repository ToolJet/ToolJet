import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import type { GridColumn, GridRow } from './useTableGrid';

// PostgREST reserves , ( ) and quotes inside filter values: such a value must be double-quoted.
const quote = (value: unknown) => {
  const text = String(value);
  return text === '' || /[,()"\\\s]/.test(text) ? `"${text.replace(/["\\]/g, '\\$&')}"` : text;
};

// One key column: `id=in.(1,2)`. A composite key must match whole tuples, never one column on its own, or a row that
// shares a single key value with a selected row would be deleted too.
export const buildDeleteQuery = (primaryKeys: string[], rows: GridRow[]): string => {
  const params = new URLSearchParams();
  if (primaryKeys.length === 1) {
    const [key] = primaryKeys;
    params.append(key, `in.(${rows.map((row) => quote(row[key])).join(',')})`);
  } else {
    const tuples = rows.map((row) => `and(${primaryKeys.map((key) => `${key}.eq.${quote(row[key])}`).join(',')})`);
    params.append('or', `(${tuples.join(',')})`);
  }
  return params.toString();
};

// bigint values lose precision once JSON is parsed (past 2^53 another row would match), and jsonb values have no
// filter text. Either way the delete could hit the wrong rows, so it is not offered.
const UNSAFE_KEY_TYPES = ['bigint', 'jsonb'];

export const getDeleteBlockedReason = (primaryKeys: string[], columns: GridColumn[]): string | undefined => {
  if (primaryKeys.length === 0) return 'Rows can only be deleted from a table with a primary key';
  const unsafe = columns.find(
    (column) => primaryKeys.includes(column.accessor) && UNSAFE_KEY_TYPES.includes(column.dataType)
  );
  return unsafe && `Rows cannot be deleted from a table whose primary key is a ${unsafe.dataType}`;
};

type DeleteRowsArgs = { tableId: string; tableName: string; primaryKeys: string[]; rows: GridRow[] };

// Resolves true once the rows are gone. Anything else has already been toasted.
export const deleteRowsByPrimaryKey = async ({ tableId, tableName, primaryKeys, rows }: DeleteRowsArgs) => {
  // Without every key value there is no filter to send, and a DELETE without one must never go out.
  if (
    primaryKeys.length === 0 ||
    rows.length === 0 ||
    rows.some((row) => primaryKeys.some((key) => row[key] == null))
  ) {
    toast.error('Something went wrong - Record Id is incorrect');
    return false;
  }

  const { error } = await tooljetDatabaseService.deleteRows(tableId, buildDeleteQuery(primaryKeys, rows));
  if (error) {
    toast.error(error?.message ?? `Error deleting rows from table "${tableName}"`);
    return false;
  }

  toast.success(`Deleted ${rows.length} rows from table "${tableName}"`);
  return true;
};
