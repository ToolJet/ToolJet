import { useEffect, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useLatest } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
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
  idField: string;
  setExposedVariables: WidgetProps['setExposedVariables'];
  fireEvent: WidgetProps['fireEvent'];
}

/** The List view's selection, kept by item key (its idField, else its position on the page), so it survives a
 *  refetch that reorders or reloads the data. A click picks a row (onRecordClicked); a data change (an edit, a removal,
 *  a reorder) re-publishes the selection from the fresh record at its new row and clears it when the item is gone,
 *  with no event (README, "Selection after a data change"). */
export const useListSelection = (args: ListSelectionArgs) => {
  const { data, items, idField } = args;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const keys = items.map((item, index) => itemKey(item, idField, index));
  const selectedIndex = selectedKey === null ? -1 : keys.indexOf(selectedKey);
  const live = useLatest({ ...args, keys });
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
  // Runs for data changes only, not for a page turn.
  const reconcile = useLatest(() => {
    if (selectedKey === null) return;
    const all = list(data);
    const shownAt = keys.indexOf(selectedKey);
    const at = all.findIndex((item, index) => itemKey(item, idField, index) === selectedKey);
    const item = shownAt >= 0 ? items[shownAt] : at >= 0 ? all[at] : undefined;
    if (item === undefined) {
      clearSelection();
      return;
    }
    live.current.setExposedVariables({
      selectedItem: item,
      selectedItemId: idOf(item),
      selectedRecord: shownAt >= 0 ? recordAt(shownAt) : {},
      selectedRecordId: shownAt >= 0 ? shownAt : null,
    });
  });
  useEffect(() => reconcile.current(), [data, reconcile]);
  return { keys, selectedIndex, pick, clearSelection };
};
