import { arrayMove } from '@dnd-kit/sortable';

import type { ListItem } from '../dummyData/types';

/** Which side of the row under the pointer the insertion line sits on. */
export type DropSide = 'before' | 'after';

// Index the active row lands at when dropped on `side` of `overId`; null when the order wouldn't change.
export function getDropIndex(ids: string[], activeId: string, overId: string, side: DropSide): number | null {
  const fromIndex = ids.indexOf(activeId);
  const overIndex = ids.indexOf(overId);
  if (fromIndex === -1 || overIndex === -1) return null;

  const slot = side === 'before' ? overIndex : overIndex + 1;
  // Lifting the active row out shifts every later slot up by one.
  const toIndex = slot > fromIndex ? slot - 1 : slot;
  return toIndex === fromIndex ? null : toIndex;
}

interface ReorderGateInput {
  searchQuery: string;
  currentPage: number;
  /** Pinned rows on this page. */
  pinnedRowCount: number;
  /** `counts.pinned` from the root response: pins across all pages. */
  pinnedTotal: number;
}

// `PUT /v2/pins/order` rejects anything but the complete pin set, so drag is offered only while all of it is loaded.
export const canReorderPins = ({ searchQuery, currentPage, pinnedRowCount, pinnedTotal }: ReorderGateInput): boolean =>
  searchQuery.trim() === '' && currentPage === 1 && pinnedRowCount > 1 && pinnedRowCount === pinnedTotal;

// Pinned rows lead the root page, so moving one reorders that prefix and leaves the rest as is.
export function movePinnedItem(items: ListItem[], fromIndex: number, toIndex: number): ListItem[] {
  const pinned = items.filter((item) => item.pinned);
  const unpinned = items.filter((item) => !item.pinned);
  return [...arrayMove(pinned, fromIndex, toIndex), ...unpinned];
}
