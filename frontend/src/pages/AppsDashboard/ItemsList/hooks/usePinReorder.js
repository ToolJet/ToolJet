import { useMemo } from 'react';

import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { useReorderPins } from '@/_services/hooks/appsServiceHooks';
import { useRootAppsQueryOptions } from '@/pages/AppsDashboard/hooks/useRootAppsQuery';
import { canReorderPins, movePinnedItem } from '../pinOrder';

const isPinnedRow = (row) => row.original.pinned;
const getItemName = (row) => row.original.name;

// DataTable's `reorder` config for the root page's pinned rows. `pinnedTotal` is `counts.pinned` from the root response.
export function usePinReorder({ appType, items, pinnedTotal }) {
  const searchQuery = useSearchStore((state) => state.debouncedSearchQuery);
  const currentPage = useAppsStore((state) => state.currentPage);
  const { queryKey: rootQueryKey } = useRootAppsQueryOptions(appType);
  const { mutate: reorderPins } = useReorderPins();

  const pinnedRowCount = useMemo(() => items.filter((item) => item.pinned).length, [items]);
  const isEnabled = canReorderPins({ searchQuery, currentPage, pinnedRowCount, pinnedTotal });

  return useMemo(
    () => ({
      isEnabled,
      isRowReorderable: isPinnedRow,
      getRowLabel: getItemName,
      itemLabel: 'pinned item',
      onReorder: ({ fromIndex, toIndex }) =>
        reorderPins({ appType, rootQueryKey, items: movePinnedItem(items, fromIndex, toIndex) }),
    }),
    [isEnabled, reorderPins, appType, rootQueryKey, items]
  );
}
