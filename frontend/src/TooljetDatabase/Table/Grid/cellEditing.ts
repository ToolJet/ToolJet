import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import type { CellPayload } from './cells/cellDraft';
import type { GridColumn, GridRow } from './useTableGrid';

// Serial values are generated.
const UNEDITABLE_TYPES = ['serial'];
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

// The value as the rows will hold it after a refetch, so the cached cell reads the same either way.
export const toStoredValue = (dataType: string, value: unknown): unknown => {
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
  payload: CellPayload;
  /** Where the server runs a "use the default" save; a PATCH reads the environment itself. */
  organizationId?: string | null;
  environmentId?: string | null;
};

// Resolves with the value the cell now holds once it is saved, or null when it was not. A refusal has been toasted.
export const saveCellValue = async ({
  tableId,
  tableName,
  primaryKeys,
  row,
  columnName,
  payload,
  organizationId,
  environmentId,
}: SaveCellArgs): Promise<{ stored: unknown } | null> => {
  // Without every key value there is no filter to send, and a PATCH without one would rewrite every row.
  if (primaryKeys.length === 0 || primaryKeys.some((key) => row[key] == null) || !hasExactKeyValues(primaryKeys, row)) {
    toast.error('Something went wrong - Record Id is incorrect');
    return null;
  }

  let stored: unknown = payload.kind === 'value' ? payload.value : undefined;
  let failure: { message?: string } | null | undefined;
  if (payload.kind === 'default') {
    if (!organizationId || !environmentId) {
      toast.error('Something went wrong - the environment is not selected');
      return null;
    }
    const where = Object.fromEntries(primaryKeys.map((key) => [key, row[key]]));
    const { data, error } = await tooljetDatabaseService.setCellToDefault(organizationId, tableId, {
      environment_id: environmentId,
      column: columnName,
      where,
    });
    failure = error;
    stored = data?.result?.value ?? null;
  } else {
    const { error } = await tooljetDatabaseService.updateRows(
      tableId,
      { [columnName]: payload.value },
      buildRowFilter(primaryKeys, row)
    );
    failure = error;
  }
  if (failure) {
    toast.error(failure?.message ?? `Failed to update table "${tableName}"`);
    return null;
  }

  toast.success('Column edited successfully');
  return { stored };
};
