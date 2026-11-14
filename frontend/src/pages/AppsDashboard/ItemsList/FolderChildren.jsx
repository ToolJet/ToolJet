import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import { useSearchStore } from '@/_stores/searchStore';
import { appsV2InfiniteQueryOptions } from '@/_services/hooks/appsServiceHooks';
import { FOLDER_PAGE_SIZE } from '@/pages/AppsDashboard/helper';
import { isAppItem } from '@/pages/AppsDashboard/items';
import { useSharedRowSelection } from './hooks/useSharedRowSelection';
import { columns, getRowId } from './columns';
import ItemRow from './ItemRow';
import { FolderSkeletonRow, FolderStatusRow } from './FolderStatusRow';

const ROW_HEIGHT = 40;
const STATUS_ROW_HEIGHT = 28;
// Start fetching the next page while this many loaded rows are still below the viewport.
const LOAD_MORE_THRESHOLD = 5;
const EMPTY_ITEMS = [];
const POSITIONED_ROW_CLASS = 'tw-absolute tw-inset-x-0 tw-top-0';

// Status names the render code below switches on.
const getStatus = ({ isLoading, isFetchingNextPage, isError }) => {
  if (isLoading) return 'loading';
  if (isFetchingNextPage) return 'loadingMore';
  if (isError) return 'error';
  return 'success';
};

export default function FolderChildren({ folder, appType }) {
  // `depth` 1 marks apps inside a folder; memoized so the table options stay stable between renders.
  const tableMeta = useMemo(() => ({ depth: 1, appType }), [appType]);
  const searchQuery = useSearchStore((state) => state.debouncedSearchQuery);
  const folderQuery = useInfiniteQuery(
    appsV2InfiniteQueryOptions({ appType, folderId: folder.id, searchQuery, pageSize: FOLDER_PAGE_SIZE })
  );
  const { data, hasNextPage, fetchNextPage, refetch } = folderQuery;
  const { rowSelection, onRowSelectionChange, enableRowSelection } = useSharedRowSelection();
  const scrollContainerRef = useRef(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  const items = useMemo(() => data?.pages.flatMap((page) => page.items).filter(isAppItem) ?? EMPTY_ITEMS, [data]);
  const status = getStatus(folderQuery);
  const table = useReactTable({
    data: items,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    meta: tableMeta,
    state: { rowSelection },
    onRowSelectionChange,
    enableRowSelection,
  });
  const rows = table.getRowModel().rows;

  // A next-page load or failure shows one extra status row after the loaded apps.
  const trailingStatus = { loadingMore: 'loading', error: 'error' }[status];
  const virtualizer = useVirtualizer({
    count: rows.length + (trailingStatus ? 1 : 0),
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => (index < rows.length ? ROW_HEIGHT : STATUS_ROW_HEIGHT),
    getItemKey: (index) => rows[index]?.id ?? 'status',
    overscan: 5,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // A classic (non-overlay) scrollbar narrows the rows and shifts their columns left of the header's;
  // pulling the scroll box out by the scrollbar width puts the scrollbar in the page padding instead.
  useLayoutEffect(() => {
    const element = scrollContainerRef.current;
    if (element) setScrollbarWidth(element.offsetWidth - element.clientWidth);
  }, [totalSize]);
  const lastRenderedIndex = virtualItems[virtualItems.length - 1]?.index ?? -1;

  const shouldLoadMore = status === 'success' && hasNextPage && lastRenderedIndex >= rows.length - LOAD_MORE_THRESHOLD;
  useEffect(() => {
    if (shouldLoadMore) fetchNextPage();
  }, [shouldLoadMore, fetchNextPage]);

  const retry = () => (rows.length > 0 ? fetchNextPage() : refetch());

  if (status === 'loading') {
    return (
      <div role="rowgroup" aria-label={`Apps in ${folder.name}`}>
        <FolderSkeletonRow />
        <FolderStatusRow variant="loading" appType={appType} />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div role="rowgroup" aria-label={`Apps in ${folder.name}`}>
        <FolderStatusRow variant={status === 'error' ? 'error' : 'empty'} appType={appType} onRetry={retry} />
      </div>
    );
  }

  // Focusable so keyboard users can scroll a folder taller than 600px. The negative margin + padding
  // extend the scroll box into the page gutter so the rows' selection checkboxes aren't clipped.
  return (
    <div
      ref={scrollContainerRef}
      role="rowgroup"
      tabIndex={0}
      aria-label={`Apps in ${folder.name}`}
      style={{ marginRight: -scrollbarWidth }}
      className="tw--ml-[70px] tw-max-h-[600px] tw-overflow-y-auto tw-hide-scrollbar tw-pl-[70px] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-interactive-focus-outline"
    >
      <div className="tw-relative" style={{ height: totalSize }}>
        {virtualItems.map((virtualItem) => {
          const row = rows[virtualItem.index];
          const style = { transform: `translateY(${virtualItem.start}px)` };
          return row ? (
            <ItemRow key={virtualItem.key} row={row} level={2} className={POSITIONED_ROW_CLASS} style={style} />
          ) : (
            <FolderStatusRow
              key={virtualItem.key}
              variant={trailingStatus}
              appType={appType}
              onRetry={retry}
              className={POSITIONED_ROW_CLASS}
              style={style}
            />
          );
        })}
      </div>
    </div>
  );
}
