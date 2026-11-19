import { isEqual } from 'lodash';
import type { GridColumn, GridRow } from '../../Table/Grid/useTableGrid';

// How one column of the create / edit row drawer stands. `null` stores NULL, `default` leaves the column to the database
// default, `custom` sends the typed value.
export type RowMode = 'null' | 'default' | 'custom';
export type RowFieldState = { mode: RowMode; value: unknown };
export type RowFormKind = 'create' | 'edit';

const TIMESTAMP = 'timestamp with time zone';
const BLANK_NOT_ALLOWED = (dataType: string) => dataType !== 'character varying' && dataType !== 'serial';

export const isPrimaryKey = (column: GridColumn) => column.constraints_type?.is_primary_key === true;
export const isSerial = (column: GridColumn) => column.dataType === 'serial';
export const hasDefault = (column: GridColumn) => column.column_default != null;

// A serial value is generated, and a key is never rewritten from the edit drawer: these show their value, no toggle.
export const isLocked = (column: GridColumn, kind: RowFormKind) =>
  isSerial(column) || (kind === 'edit' && isPrimaryKey(column));

// NULL is only offered for a nullable column that is not a key.
export const canBeNull = (column: GridColumn) => !isPrimaryKey(column) && column.constraints_type?.is_not_null !== true;

// The primary keys first, as the old forms listed them.
export const orderRowColumns = (columns: GridColumn[]): GridColumn[] => [
  ...columns.filter(isPrimaryKey),
  ...columns.filter((column) => !isPrimaryKey(column)),
];

// What "Custom" holds before anything is typed. A timestamp starts at the time the drawer opened.
export const customStart = (column: GridColumn): unknown => {
  if (column.dataType === TIMESTAMP) return new Date().toISOString();
  if (column.dataType === 'boolean') return false;
  return '';
};

const jsonEquals = (stored: unknown, fallback: unknown): boolean => {
  try {
    let parsed = stored;
    while (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return isEqual(parsed, fallback);
  } catch {
    return false;
  }
};

const matchesDefault = (column: GridColumn, stored: unknown) => {
  if (!hasDefault(column)) return false;
  return column.dataType === 'jsonb'
    ? jsonEquals(stored, column.column_default)
    : String(stored ?? '') === column.column_default && stored !== null;
};

// Text inputs hold strings, so a number from the database is shown as text. A boolean or a JSON value keeps its type.
const toFieldValue = (stored: unknown): unknown => {
  if (stored === null || stored === undefined) return '';
  if (typeof stored === 'number') return String(stored);
  return stored;
};

export const initialFieldState = (column: GridColumn, kind: RowFormKind, row?: GridRow): RowFieldState => {
  if (kind === 'create') {
    if (hasDefault(column) && !isPrimaryKey(column) && !isSerial(column)) {
      return { mode: 'default', value: column.dataType === 'boolean' ? column.column_default === 'true' : '' };
    }
    return { mode: 'custom', value: customStart(column) };
  }
  const stored = row?.[column.accessor];
  if (stored === null || stored === undefined) return { mode: 'null', value: null };
  if (!isLocked(column, 'edit') && matchesDefault(column, stored))
    return { mode: 'default', value: toFieldValue(stored) };
  return { mode: 'custom', value: toFieldValue(stored) };
};

// The state after the user picks a mode. Back to Custom from Null or Default starts from the stored value when there
// is one (edit), else from `customStart`.
export const switchMode = (
  column: GridColumn,
  state: RowFieldState,
  mode: RowMode,
  stored?: unknown
): RowFieldState => {
  if (mode === state.mode) return state;
  if (mode === 'null') return { mode, value: null };
  if (mode === 'default') return { mode, value: column.dataType === 'boolean' ? column.column_default === 'true' : '' };
  const restored = toFieldValue(stored);
  return { mode, value: restored === '' ? customStart(column) : restored };
};

// A column that must hold a typed value but holds none: a number, a JSON document or a time cleared out.
export const isBlank = (column: GridColumn, state: RowFieldState): boolean =>
  state.mode === 'custom' && state.value === '' && BLANK_NOT_ALLOWED(column.dataType);

export const hasBlankField = (columns: GridColumn[], states: Record<string, RowFieldState>): boolean =>
  columns.some(
    (column) => !isLocked(column, 'create') && states[column.accessor] && isBlank(column, states[column.accessor])
  );

const sendable = (column: GridColumn, state: RowFieldState): unknown => {
  if (state.mode === 'null') return null;
  return state.value;
};

// A column left on its default is not sent, so the database applies it; a serial column is generated.
export const buildCreatePayload = (columns: GridColumn[], states: Record<string, RowFieldState>) =>
  Object.fromEntries(
    columns
      .filter((column) => !isSerial(column) && states[column.accessor] && states[column.accessor].mode !== 'default')
      .map((column) => [column.accessor, sendable(column, states[column.accessor])])
  );

export const isChanged = (state: RowFieldState, initial: RowFieldState): boolean =>
  state.mode !== initial.mode || (state.mode === 'custom' && !isEqual(state.value, initial.value));

// Only the columns that changed are sent: a text input holds a JSON document or a timestamp as text, and writing an
// untouched one back could change how it is stored.
export const buildEditPayload = (
  columns: GridColumn[],
  states: Record<string, RowFieldState>,
  initial: Record<string, RowFieldState>
) =>
  Object.fromEntries(
    columns
      .filter((column) => !isLocked(column, 'edit') && isChanged(states[column.accessor], initial[column.accessor]))
      .map((column) => {
        const state = states[column.accessor];
        if (state.mode === 'default') {
          return [
            column.accessor,
            column.dataType === 'boolean' ? column.column_default === 'true' : column.column_default,
          ];
        }
        return [column.accessor, sendable(column, state)];
      })
  );
