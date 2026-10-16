import { useEffect, useState } from 'react';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { readCell } from './tableModel';
import type { Entry, LiveRef, Paged, WithEdits } from './types';

interface UseTableSelectionArgs {
  properties: Resolved;
  entries: Entry[];
  paged: Paged;
  isDisabled: boolean;
  live: LiveRef;
  withEdits: WithEdits;
  fireEvent: WidgetProps['fireEvent'];
  setExposedVariables: WidgetProps['setExposedVariables'];
}

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
}: UseTableSelectionArgs) => {
  const allowSelection = properties.allowSelection !== false;
  const bulk = allowSelection && properties.showBulkSelector === true;
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const exposeSelection = (keys: Set<string>, focus: string | null) => {
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
  const select = (keys: Set<string>, focus: string | null) => {
    setSelected(keys);
    setFocusKey(focus);
    exposeSelection(keys, focus);
  };

  // Default selected row, and keeping the selection on the same records across a reload.
  useEffect(() => {
    const keys = new Set(entries.map((entry) => entry.key));
    const kept = new Set([...live.current.selected].filter((key) => keys.has(key)));
    let focus = live.current.focusKey !== null && keys.has(live.current.focusKey) ? live.current.focusKey : null;
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

  const clickRow = (entry: Entry) => {
    if (isDisabled) return;
    if (allowSelection && !bulk) {
      const already = selected.has(entry.key);
      // A click keeps the row selected unless deselection is turned on (an unset property reads as its default, on).
      if (already && properties.disableRowDeselection !== false) {
        fireEvent('onRowClicked');
        return;
      }
      const keys = already ? new Set<string>() : new Set([entry.key]);
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
  const toggleBulk = (entry: Entry) => {
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
