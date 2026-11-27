import { useMemo } from 'react';
import type { Row } from '@tanstack/react-table';

import { useReorderDataSourcePins } from '@/_services/globalDatasource.mutations';
import type { DataSourceListItem } from '@/_services/types/globalDatasource.types';
import { canReorderPins, movePinnedItem } from '@/pages/AppsDashboard/ItemsList/pinOrder';
import type { DataTableReorder } from '@/pages/components/DataTable/types';

const isPinnedRow = (row: Row<DataSourceListItem>) => row.original.pinned;
const getItemName = (row: Row<DataSourceListItem>) => row.original.name;

interface UseDataSourcePinReorderParams {
  /** Rows of the root page on screen. */
  items: DataSourceListItem[];
  /** `counts.pinned` from the root response: pins across all pages. */
  pinnedTotal: number;
  currentPage: number;
  search: string;
  rootQueryKey: readonly unknown[];
}

// DataTable's `reorder` config for the root page's pinned rows (same gate as the apps dashboard).
export function useDataSourcePinReorder({
  items,
  pinnedTotal,
  currentPage,
  search,
  rootQueryKey,
}: UseDataSourcePinReorderParams): DataTableReorder<DataSourceListItem> {
  const { mutate: reorderPins } = useReorderDataSourcePins();

  const pinnedRowCount = useMemo(() => items.filter((item) => item.pinned).length, [items]);
  const isEnabled = canReorderPins({ searchQuery: search, currentPage, pinnedRowCount, pinnedTotal });

  return useMemo(
    () => ({
      isEnabled,
      isRowReorderable: isPinnedRow,
      getRowLabel: getItemName,
      itemLabel: 'pinned item',
      onReorder: ({ fromIndex, toIndex }) =>
        reorderPins({ rootQueryKey, items: movePinnedItem(items, fromIndex, toIndex) }),
    }),
    [isEnabled, reorderPins, rootQueryKey, items]
  );
}
