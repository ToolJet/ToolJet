import { useEffect, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { missingIsGone, useLatest } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { itemKey } from '@/AppBuilder/Widgets/Ui2/_shared/listModel';
import { list } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export interface ListSelectionArgs {
  id: string;
  moduleId: string;
  parentIndices: number[];
  /** All the list's records, and the rows shown (this page, up to "Show more"). */
  data: unknown;
  items: unknown[];
  /** The shown rows' item keys (itemKey: the idField, else the position on the page). */
  keys: string[];
  idField: string;
  setExposedVariables: WidgetProps['setExposedVariables'];
  fireEvent: WidgetProps['fireEvent'];
}

/** The List view's selection, kept by item key (its idField, else its position on the page), so it survives a
 *  refetch that reorders or reloads the data. A click picks a row (onRecordClicked); a data change (an edit, a removal,
 *  a reorder) or a page turn re-publishes the selection from the fresh record at its new row, with no record while the
 *  item is on another page, and clears it when the item is gone, with no event (README, "Selection after a data
 *  change"). */
export const useListSelection = (args: ListSelectionArgs) => {
  const { data, items, keys, idField } = args;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedIndex = selectedKey === null ? -1 : keys.indexOf(selectedKey);
  const live = useLatest(args);
  /** The components' values of the shown row `index`, as the store holds them. */
  const recordAt = (index: number) => {
    const { id, moduleId, parentIndices } = live.current;
    let exposed = useStore.getState().resolvedStore.modules[moduleId]?.exposedValues?.components?.[id];
    for (const outer of parentIndices) exposed = Array.isArray(exposed) ? exposed?.[outer] : exposed;
    return exposed?.children?.[index] ?? {};
  };
  const idOf = (item: unknown) =>
    item && typeof item === 'object' ? (item as Resolved)[live.current.idField] ?? null : null;
  const pick = (index: number, { fire = true }: { fire?: boolean } = {}) => {
    const { items: now, keys: nowKeys, setExposedVariables, fireEvent } = live.current;
    if (index < 0 || index >= now.length) return;
    setSelectedKey(nowKeys[index]);
    setExposedVariables({
      selectedItem: now[index],
      selectedItemId: idOf(now[index]),
      selectedRecord: recordAt(index),
      selectedRecordId: index,
    });
    if (fire) fireEvent('onRecordClicked');
  };
  const clearSelection = () => {
    setSelectedKey(null);
    live.current.setExposedVariables({
      selectedItem: {},
      selectedItemId: null,
      selectedRecord: {},
      selectedRecordId: null,
    });
  };
  // Runs when the data or the shown rows change (a page turn, "Show more"). selectedRecordId is a row on this page:
  // off its page, the selected item has no row, so it has no record either (the row there belonged to another item).
  const reconcile = useLatest(() => {
    if (selectedKey === null) return;
    const all = list(data);
    const shownAt = keys.indexOf(selectedKey);
    const at = all.findIndex((item, index) => itemKey(item, idField, index) === selectedKey);
    const item = shownAt >= 0 ? items[shownAt] : at >= 0 ? all[at] : undefined;
    if (item === undefined) {
      if (missingIsGone(all.length)) clearSelection();
      else
        live.current.setExposedVariables({
          selectedItem: {},
          selectedItemId: null,
          selectedRecord: {},
          selectedRecordId: null,
        });
      return;
    }
    live.current.setExposedVariables({
      selectedItem: item,
      selectedItemId: idOf(item),
      selectedRecord: shownAt >= 0 ? recordAt(shownAt) : {},
      selectedRecordId: shownAt >= 0 ? shownAt : null,
    });
  });
  useEffect(() => reconcile.current(), [data, items, reconcile]);
  return { selectedIndex, pick, clearSelection };
};
