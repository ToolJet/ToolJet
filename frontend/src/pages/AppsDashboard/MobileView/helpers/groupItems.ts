import type { AppItem, FolderItem, ListItem, ListResponse } from '../../dummyData/types';
import { isAppItem, isFolderItem, isInPinnedSection } from '../../items';
import { canReorderPins } from '../../ItemsList/pinOrder';

export interface GroupedItems {
  pinned: ListItem[];
  folders: FolderItem[];
  apps: AppItem[];
}

interface GroupOptions {
  /** Edit mode lists only items carrying the `pinned` flag under Pinned, since those are the ones that can be moved. */
  editing?: boolean;
}

// Flattens the loaded pages into the three sections, in page order.
export function groupItems(pages: ListResponse[], { editing = false }: GroupOptions = {}): GroupedItems {
  const grouped: GroupedItems = { pinned: [], folders: [], apps: [] };
  // A pin change between page fetches can shift a row onto two pages.
  const seen = new Set<string>();

  pages.forEach((page) =>
    page.items.forEach((item) => {
      const key = `${item.kind}:${item.id}`;
      if (seen.has(key)) return;
      seen.add(key);

      if (editing ? item.pinned : isInPinnedSection(item)) grouped.pinned.push(item);
      else if (isFolderItem(item)) grouped.folders.push(item);
      else if (isAppItem(item)) grouped.apps.push(item);
    })
  );

  return grouped;
}

interface DragGateInput {
  searchQuery: string;
  pinned: ListItem[];
  /** `counts.pinned`: pins across all pages. */
  pinnedTotal: number;
}

// Reordering sends the complete pin set, so drag waits until every pin has loaded.
export const canDragPinnedItems = ({ searchQuery, pinned, pinnedTotal }: DragGateInput): boolean =>
  canReorderPins({
    searchQuery,
    currentPage: 1,
    pinnedRowCount: pinned.filter((item) => item.pinned).length,
    pinnedTotal,
  });
