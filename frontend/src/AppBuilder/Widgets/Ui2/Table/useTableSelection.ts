import { useEffect, useRef, useState } from 'react';
import { missingIsGone, useLatest } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
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

  // Default selected row, and keeping the selection on the same records across a reload. It runs for new rows only:
  // the default and the publisher are read at that moment, so a re-evaluated default does not reselect a row.
  const latest = useLatest({ wanted: properties.defaultSelectedRow, allowSelection, exposeSelection });
  useEffect(() => {
    const { wanted, allowSelection: selectable, exposeSelection: expose } = latest.current;
    if (!missingIsGone(entries.length)) {
      // Nothing to show yet: the selection is kept for the rows that come back.
      expose(new Set(), null);
      return;
    }
    const keys = new Set(entries.map((entry) => entry.key));
    const kept = new Set([...live.current.selected].filter((key) => keys.has(key)));
    let focus = live.current.focusKey !== null && keys.has(live.current.focusKey) ? live.current.focusKey : null;
    if (!kept.size && wanted && typeof wanted === 'object' && Object.keys(wanted).length && selectable) {
      const [k, v] = Object.entries(wanted)[0];
      const match = entries.find((entry) => readCell(entry.row, k) == v); // eslint-disable-line eqeqeq
      if (match) {
        kept.add(match.key);
        focus = match.key;
      }
    }
    setSelected(kept);
    setFocusKey(focus);
    expose(kept, focus);
  }, [entries, live, latest]);

  // An edit or a discard changes the values of the selected rows: they publish again (the selection showed the rows as
  // they were). Edits run in runNow, so this has run before their event fires. The first render has nothing to redo.
  const shownEdits = useRef(withEdits);
  useEffect(() => {
    if (shownEdits.current === withEdits) return;
    shownEdits.current = withEdits;
    latest.current.exposeSelection(live.current.selected, live.current.focusKey);
  }, [withEdits, live, latest]);

  // A click on a row, or on something in it that acts on the row (an action button, an editable cell): `keep` never
  // deselects, since pressing a button or editing a cell on the selected row is not a click to deselect it.
  const clickRow = (entry: Entry, { keep = false }: { keep?: boolean } = {}) => {
    if (isDisabled) return;
    if (allowSelection && !bulk) {
      const already = selected.has(entry.key);
      // A click keeps the row selected unless deselection is turned on (an unset property reads as its default, on).
      if (already && (keep || properties.disableRowDeselection !== false)) {
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
