import { useEffect, useState } from 'react';
import { readCell } from './tableModel';

/** Cell edits: an overlay on the data until it changes, the cell being edited, and the changeSet they publish. */
export const useTableEdits = ({ data, live, setExposedVariables, fireEvent }) => {
  const [edits, setEdits] = useState(() => new Map());
  useEffect(() => setEdits(new Map()), [data]);
  const withEdits = (entry) => (edits.has(entry.key) ? { ...entry.row, ...edits.get(entry.key) } : entry.row);

  const [editing, setEditing] = useState(null);
  const exposeEdits = (next) => {
    const { entries: all } = live.current;
    const changeSet = {};
    const dataUpdates = [];
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
  const commitEdit = (entry, column, value) => {
    setEditing(null);
    const before = readCell(withEdits(entry), column.key);
    if (before === value || (before == null && (value === '' || value == null))) return; // eslint-disable-line eqeqeq
    const next = new Map(edits);
    next.set(entry.key, { ...(next.get(entry.key) ?? {}), [column.key]: value });
    setEdits(next);
    exposeEdits(next);
    fireEvent('onCellValueChanged');
  };
  const discard = ({ fire = true } = {}) => {
    const next = new Map();
    setEdits(next);
    exposeEdits(next);
    if (fire) fireEvent('onCancelChanges');
  };

  return { edits, withEdits, editing, setEditing, commitEdit, discard };
};
