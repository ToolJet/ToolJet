import { useEffect, useState } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { readCell } from './tableModel';
import type { Editing, Edits, Entry, FireOption, LiveRef, Row, TableColumn } from './types';

interface UseTableEditsArgs {
  data: Row[];
  live: LiveRef;
  setExposedVariables: WidgetProps['setExposedVariables'];
  fireEvent: WidgetProps['fireEvent'];
}

/** Cell edits: an overlay on the data until it changes, the cell being edited, and the changeSet they publish. */
export const useTableEdits = ({ data, live, setExposedVariables, fireEvent }: UseTableEditsArgs) => {
  const [edits, setEdits] = useState<Edits>(() => new Map());
  useEffect(() => setEdits(new Map()), [data]);
  const withEdits = (entry: Entry): Row =>
    edits.has(entry.key) ? { ...entry.row, ...edits.get(entry.key) } : entry.row;

  const [editing, setEditing] = useState<Editing | null>(null);
  const exposeEdits = (next: Edits) => {
    const { entries: all } = live.current;
    const changeSet: Record<number, Row | undefined> = {};
    const dataUpdates: Row[] = [];
    all.forEach((entry) => {
      if (!next.has(entry.key)) return;
      changeSet[entry.index] = next.get(entry.key);
      dataUpdates.push({ ...entry.row, ...next.get(entry.key) });
    });
    setExposedVariables({
      changeSet,
      dataUpdates,
      updatedData: all.map((entry) => (next.has(entry.key) ? { ...entry.row, ...next.get(entry.key) } : entry.row)),
    });
  };
  const commitEdit = (entry: Entry, column: TableColumn, value: unknown) => {
    setEditing(null);
    const before = readCell(withEdits(entry), column.key);
    if (before === value || (before == null && (value === '' || value == null))) return; // eslint-disable-line eqeqeq
    const next = new Map(edits);
    next.set(entry.key, { ...(next.get(entry.key) ?? {}), [column.key]: value });
    setEdits(next);
    exposeEdits(next);
    fireEvent('onCellValueChanged');
  };
  const discard = ({ fire = true }: FireOption = {}) => {
    const next: Edits = new Map();
    setEdits(next);
    exposeEdits(next);
    if (fire) fireEvent('onCancelChanges');
  };

  return { edits, withEdits, editing, setEditing, commitEdit, discard };
};
