import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { readCell } from './tableModel';
import type { Editing, Edits, Entry, FireOption, LiveRef, Row, TableColumn } from './types';

interface UseTableEditsArgs {
  data: Row[];
  columns: TableColumn[];
  isDisabled: boolean;
  live: LiveRef;
  setExposedVariables: WidgetProps['setExposedVariables'];
  fireEvent: WidgetProps['fireEvent'];
}

/** Cell edits: an overlay on the data until it changes, the cell being edited, and the changeSet they publish. */
export const useTableEdits = ({
  data,
  columns,
  isDisabled,
  live,
  setExposedVariables,
  fireEvent,
}: UseTableEditsArgs) => {
  const [edits, setEdits] = useState<Edits>(() => new Map());
  const editsRef = useRef(edits);
  editsRef.current = edits;
  // One merged row per entry for a set of edits: search, filter and sort match rows by reference, so an edited row
  // must be the same object on every call (a fresh merge dropped it from the filter and sorted it as NaN).
  const withEdits = useMemo(() => {
    const merged = new WeakMap<Entry, Row>();
    return (entry: Entry): Row => {
      const patch = edits.get(entry.key);
      if (!patch) return entry.row;
      let row = merged.get(entry);
      if (!row) {
        row = { ...entry.row, ...patch };
        merged.set(entry, row);
      }
      return row;
    };
  }, [edits]);

  // The open editor. Its draft is part of the edits: a discard, a switch of its column to read-only or a disabled table
  // closes it, and a commit applies only from the editor still open on a cell still editable (the editor stayed open
  // after a discard or a switch to read-only, and its blur wrote the draft back as a new change).
  const [editing, setEditing] = useState<Editing | null>(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const editable = (columnId: string) => !isDisabled && !!columns.find((c) => c.id === columnId)?.editable;
  const canEdit = useLatest(editable);
  const close = () => {
    editingRef.current = null;
    setEditing(null);
  };
  useEffect(() => {
    if (!editing || canEdit.current(editing.column)) return;
    editingRef.current = null;
    setEditing(null);
  }, [editing, columns, isDisabled, canEdit]);
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
  // New data drops the edits, and what they published with them: the cells showed the new data while changeSet,
  // dataUpdates and updatedData still held the old edits, for a save to replay. A passive refresh, so no event.
  const latestExpose = useLatest(exposeEdits);
  useEffect(() => {
    if (!editsRef.current.size) return;
    const next: Edits = new Map();
    setEdits(next);
    latestExpose.current(next);
  }, [data, latestExpose]);
  const commitEdit = (entry: Entry, column: TableColumn, value: unknown) => {
    const open = editingRef.current;
    if (!open || open.key !== entry.key || open.column !== column.id || !canEdit.current(column.id)) return;
    close();
    const before = readCell(withEdits(entry), column.key);
    if (before === value || (before == null && (value === '' || value == null))) return; // eslint-disable-line eqeqeq
    const next = new Map(edits);
    next.set(entry.key, { ...(next.get(entry.key) ?? {}), [column.key]: value });
    setEdits(next);
    exposeEdits(next);
    fireEvent('onCellValueChanged');
  };
  const discard = ({ fire = true }: FireOption = {}) => {
    close();
    const next: Edits = new Map();
    setEdits(next);
    exposeEdits(next);
    if (fire) fireEvent('onCancelChanges');
  };

  return { edits, withEdits, editing, setEditing, commitEdit, discard };
};
