import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import type { GridColumn, GridRow } from './useTableGrid';

// Serial values are generated, and the cell has no editor for jsonb (a JSON string would be saved) or timestamps
// (shown in the column's time zone, stored as ISO).
const UNEDITABLE_TYPES = ['serial', 'jsonb', 'timestamp with time zone'];
const NUMERIC_TYPES = ['integer', 'bigint', 'double precision'];

export const isEditableColumn = (column: GridColumn): boolean =>
  !column.constraints_type?.is_primary_key && !UNEDITABLE_TYPES.includes(column.dataType);

// The row filter needs a key, and jsonb has no filter text.
export const hasEditableKey = (primaryKeys: string[], columns: GridColumn[]): boolean =>
  primaryKeys.length > 0 &&
  !columns.some((column) => primaryKeys.includes(column.accessor) && column.dataType === 'jsonb');

// A key past 2^53 has already lost digits when the row was parsed, so its filter could match another row.
export const hasExactKeyValues = (primaryKeys: string[], row: GridRow): boolean =>
  primaryKeys.every((key) => {
    const value = row[key];
    return typeof value !== 'number' || !Number.isInteger(value) || Number.isSafeInteger(value);
  });

export type CellValue = string | boolean | null;
type StoredValue = CellValue | number;

// The value as the rows will hold it after a refetch, so the cached cell reads the same either way.
export const toStoredValue = (dataType: string, value: CellValue): StoredValue => {
  if (typeof value !== 'string' || !NUMERIC_TYPES.includes(dataType)) return value;
  const parsed = Number(value);
  return value.trim() !== '' && Number.isFinite(parsed) ? parsed : value;
};

// One `key=eq.value` per key column, so a composite key matches its whole tuple.
export const buildRowFilter = (primaryKeys: string[], row: GridRow): string => {
  const params = new URLSearchParams();
  primaryKeys.forEach((key) => params.append(key, `eq.${row[key]}`));
  return params.toString();
};

type SaveCellArgs = {
  tableId: string;
  tableName: string;
  primaryKeys: string[];
  row: GridRow;
  columnName: string;
  value: CellValue;
};

// Resolves true once the cell is saved. Anything else has already been toasted.
export const saveCellValue = async ({ tableId, tableName, primaryKeys, row, columnName, value }: SaveCellArgs) => {
  // Without every key value there is no filter to send, and a PATCH without one would rewrite every row.
  if (primaryKeys.length === 0 || primaryKeys.some((key) => row[key] == null) || !hasExactKeyValues(primaryKeys, row)) {
    toast.error('Something went wrong - Record Id is incorrect');
    return false;
  }

  const { error } = await tooljetDatabaseService.updateRows(
    tableId,
    { [columnName]: value },
    buildRowFilter(primaryKeys, row)
  );
  if (error) {
    toast.error(error?.message ?? `Failed to update table "${tableName}"`);
    return false;
  }

  toast.success('Column edited successfully');
  return true;
};
