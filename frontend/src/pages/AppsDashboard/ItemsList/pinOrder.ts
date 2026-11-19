import { arrayMove } from '@dnd-kit/sortable';

import type { ListItem } from '../dummyData/types';

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
