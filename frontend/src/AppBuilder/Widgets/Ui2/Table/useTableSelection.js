import { useEffect, useState } from 'react';
import { readCell } from './tableModel';

/** Row selection: single or bulk, the default selected row, kept on the same records across a reload. */
export const useTableSelection = ({
  properties,
  entries,
  paged,
  isDisabled,
  live,
  withEdits,
  fireEvent,
  setExposedVariables,
}) => {
  const allowSelection = properties.allowSelection !== false;
  const bulk = allowSelection && properties.showBulkSelector === true;
  const [selected, setSelected] = useState(() => new Set());
  const [focusKey, setFocusKey] = useState(null);

  const exposeSelection = (keys, focus) => {
    const { entries: all } = live.current;
    const picked = all.filter((entry) => keys.has(entry.key));
    const focusEntry = all.find((entry) => entry.key === focus);
    setExposedVariables({
      selectedRow: focusEntry ? withEdits(focusEntry) : {},
      selectedRowId: focusEntry ? focusEntry.index : null,
      selectedRows: picked.map(withEdits),
      selectedRowsId: picked.map((entry) => entry.index),
    });
  };
  const select = (keys, focus) => {
    setSelected(keys);
    setFocusKey(focus);
    exposeSelection(keys, focus);
  };

  // Default selected row, and keeping the selection on the same records across a reload.
  useEffect(() => {
    const keys = new Set(entries.map((entry) => entry.key));
    const kept = new Set([...live.current.selected].filter((key) => keys.has(key)));
    let focus = keys.has(live.current.focusKey) ? live.current.focusKey : null;
    const wanted = properties.defaultSelectedRow;
    if (!kept.size && wanted && typeof wanted === 'object' && Object.keys(wanted).length && allowSelection) {
      const [k, v] = Object.entries(wanted)[0];
      const match = entries.find((entry) => readCell(entry.row, k) == v); // eslint-disable-line eqeqeq
      if (match) {
        kept.add(match.key);
        focus = match.key;
      }
    }
    setSelected(kept);
    setFocusKey(focus);
    exposeSelection(kept, focus);
  }, [entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const clickRow = (entry) => {
    if (isDisabled) return;
    if (allowSelection && !bulk) {
      const already = selected.has(entry.key);
      // A click keeps the row selected unless deselection is turned on (an unset property reads as its default, on).
      if (already && properties.disableRowDeselection !== false) {
        fireEvent('onRowClicked');
        return;
      }
      const keys = already ? new Set() : new Set([entry.key]);
      select(keys, already ? null : entry.key);
      // A deselecting click is a selection change, not a row click: onRowClicked would open a sheet bound to
      // selectedRow with nothing in it.
      if (!already) fireEvent('onRowClicked');
      fireEvent('onSelectionChanged');
      return;
    }
    // Bulk mode or no selection: the clicked row is still exposed for the handler.
    setFocusKey(entry.key);
    setExposedVariables({ selectedRow: withEdits(entry), selectedRowId: entry.index });
    fireEvent('onRowClicked');
  };
  const toggleBulk = (entry) => {
    const keys = new Set(selected);
    if (keys.has(entry.key)) keys.delete(entry.key);
    else keys.add(entry.key);
    select(keys, entry.key);
    fireEvent('onSelectionChanged');
  };
  const pageKeys = paged.items.map((entry) => entry.key);
  const allOnPage = pageKeys.length > 0 && pageKeys.every((key) => selected.has(key));
  const someOnPage = pageKeys.some((key) => selected.has(key));
  const togglePage = () => {
    const keys = new Set(selected);
    pageKeys.forEach((key) => (allOnPage ? keys.delete(key) : keys.add(key)));
    select(keys, focusKey);
    fireEvent('onSelectionChanged');
  };
  return {
    allowSelection,
    bulk,
    selected,
    focusKey,
    select,
    clickRow,
    toggleBulk,
    pageKeys,
    allOnPage,
    someOnPage,
    togglePage,
  };
};
