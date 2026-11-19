import { useCallback, useMemo, useRef, useState } from 'react';
import type { GridColumn, GridRow } from '../../Table/Grid/useTableGrid';
import {
  hasBlankField,
  initialFieldState,
  isChanged,
  isLocked,
  orderRowColumns,
  type RowFieldState,
  type RowFormKind,
} from './rowRules';

const startStates = (columns: GridColumn[], kind: RowFormKind, row?: GridRow) =>
  Object.fromEntries(columns.map((column) => [column.accessor, initialFieldState(column, kind, row)]));

// The values of one row drawer: a state per column, what the server refused per column, and what is derived from them.
// The starting states are taken once (a timestamp starts at the time the drawer opened), and again on `reset`.
export function useRowDraft(allColumns: GridColumn[], kind: RowFormKind, row?: GridRow) {
  const columns = useMemo(() => orderRowColumns(allColumns), [allColumns]);
  const initial = useRef(startStates(columns, kind, row));
  const [states, setStates] = useState<Record<string, RowFieldState>>(initial.current);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invalidJson, setInvalidJson] = useState<Record<string, boolean>>({});
  // Bumped by `reset`: the fields are keyed on it, so the JSON editors (which read their value once) start over.
  const [round, setRound] = useState(0);

  const setField = useCallback((accessor: string, state: RowFieldState) => {
    setStates((previous) => ({ ...previous, [accessor]: state }));
    setErrors((previous) => {
      if (!(accessor in previous)) return previous;
      const { [accessor]: _cleared, ...rest } = previous;
      return rest;
    });
  }, []);

  const setInvalid = useCallback((accessor: string, invalid: boolean) => {
    setInvalidJson((previous) => (previous[accessor] === invalid ? previous : { ...previous, [accessor]: invalid }));
  }, []);

  const reset = useCallback(() => {
    initial.current = startStates(columns, kind, row);
    setStates(initial.current);
    setErrors({});
    setInvalidJson({});
    setRound((previous) => previous + 1);
  }, [columns, kind, row]);

  const dirty = columns.some(
    (column) => !isLocked(column, kind) && isChanged(states[column.accessor], initial.current[column.accessor])
  );
  const blocked = hasBlankField(columns, states) || Object.values(invalidJson).some(Boolean);

  return {
    columns,
    states,
    initial: initial.current,
    errors,
    setErrors,
    setField,
    setInvalid,
    reset,
    round,
    dirty,
    blocked,
  };
}
