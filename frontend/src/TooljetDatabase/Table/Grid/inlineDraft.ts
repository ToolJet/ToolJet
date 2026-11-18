import { postgresErrorCode } from '../../constants';
import type { GridColumn } from './useTableGrid';

// The add row at the foot of the grid. A column the user has not touched has no entry in `values`: it is left out of
// the request, so the database default (or NULL) applies. A cell that is cleared goes back to that state.
export type InlineDraft = {
  status: 'idle' | 'drafting' | 'saving';
  values: Record<string, string>;
  /** Server refusals that belong to one cell, by column name. */
  errors: Record<string, string>;
  /** A refusal that belongs to no cell (a plan limit, a lost connection). */
  rowError: string | null;
  /** Bumped when a fresh draft opens, so its first cell takes the focus again. */
  round: number;
};

export type InlineDraftAction =
  | { type: 'start' }
  | { type: 'edit'; column: string; value: string }
  | { type: 'save' }
  | { type: 'saveOk' }
  | { type: 'saveErr'; errors: Record<string, string>; rowError: string | null }
  | { type: 'cancel' }
  | { type: 'reset' };

export const IDLE_DRAFT: InlineDraft = { status: 'idle', values: {}, errors: {}, rowError: null, round: 0 };

// Every transition names the state it starts from and ignores anything else, so a save result that arrives after the
// draft was cancelled or reset cannot bring it back.
export const inlineDraftReducer = (state: InlineDraft, action: InlineDraftAction): InlineDraft => {
  switch (action.type) {
    case 'start':
      return state.status === 'idle' ? { ...IDLE_DRAFT, status: 'drafting', round: state.round + 1 } : state;
    case 'edit': {
      if (state.status !== 'drafting') return state;
      const { [action.column]: _previous, ...values } = state.values;
      const { [action.column]: _error, ...errors } = state.errors;
      return {
        ...state,
        values: action.value === '' ? values : { ...values, [action.column]: action.value },
        errors,
        rowError: null,
      };
    }
    case 'save':
      return state.status === 'drafting' ? { ...state, status: 'saving', errors: {}, rowError: null } : state;
    case 'saveOk':
      return state.status === 'saving' ? { ...IDLE_DRAFT, status: 'drafting', round: state.round + 1 } : state;
    case 'saveErr':
      return state.status === 'saving'
        ? { ...state, status: 'drafting', errors: action.errors, rowError: action.rowError }
        : state;
    case 'cancel':
      return state.status === 'drafting' ? { ...IDLE_DRAFT, round: state.round } : state;
    case 'reset':
      return { ...IDLE_DRAFT, round: state.round };
  }
};

// What an untouched cell stands for: the value the database will store, or that it needs one.
export const unsetLabel = (column: GridColumn): string => {
  if (column.dataType === 'serial') return 'Auto';
  const fallback: unknown = column.column_default;
  if (fallback != null) return typeof fallback === 'object' ? JSON.stringify(fallback) : String(fallback);
  const required = column.constraints_type?.is_primary_key || column.constraints_type?.is_not_null;
  return required ? 'Required' : 'NULL';
};

// Typed text goes as typed (the server casts it), a boolean as a boolean. A serial column is generated, never sent.
export const buildRowPayload = (columns: GridColumn[], values: Record<string, string>) =>
  Object.fromEntries(
    columns
      .filter((column) => column.dataType !== 'serial' && values[column.accessor] !== undefined)
      .map((column) => [
        column.accessor,
        column.dataType === 'boolean' ? values[column.accessor] === 'true' : values[column.accessor],
      ])
  );

type RowError = { code?: string; message?: string };

// The server names the offending column as the second dot-separated part of its message (`table.column`), the same way
// the create row drawer reads it. A refusal that names no known column becomes a row error.
export const mapRowError = (
  error: RowError,
  columns: GridColumn[],
  values: Record<string, string>
): { errors: Record<string, string>; rowError: string | null } => {
  const message = error?.message ?? 'Failed to add the row';
  const named = columns.find((column) => column.accessor === message.split('.')[1]);
  if (error?.code === postgresErrorCode.UniqueViolation && named) {
    return { errors: { [named.accessor]: 'Value already exists' }, rowError: null };
  }
  if (error?.code === postgresErrorCode.NotNullViolation && named) {
    return { errors: { [named.accessor]: 'Cannot be null' }, rowError: null };
  }
  if (message.includes('Invalid input syntax for type')) {
    const [head, rejected = ''] = message.split(':');
    const type = head.split('type ').pop();
    const value = rejected.slice(2, -1).toLowerCase();
    const errors = Object.fromEntries(
      columns
        .filter((column) => column.dataType === type && String(values[column.accessor]).toLowerCase() === value)
        .map((column) => [column.accessor, 'Data type mismatch'])
    );
    if (Object.keys(errors).length > 0) return { errors, rowError: null };
  }
  return { errors: {}, rowError: message };
};
