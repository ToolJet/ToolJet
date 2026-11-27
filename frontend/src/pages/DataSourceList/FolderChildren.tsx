import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';
import { dataSourcesInfiniteQueryOptions } from '@/_services/globalDatasource.queries';
import type { DataSourceListItem, FolderEntry } from '@/_services/types/globalDatasource.types';
import { FOLDER_PAGE_SIZE } from '@/pages/AppsDashboard/helper';

import { useDataSourceRowSelection } from './hooks/useDataSourceRowSelection';
import { dataSourceColumns, getDataSourceRowId } from './columns';
import DataSourceRow from './DataSourceRow';
import FolderStatusRow from './FolderStatusRow';

const ROW_HEIGHT = 40;
const STATUS_ROW_HEIGHT = 28;
// Start fetching the next page while this many loaded rows are still below the viewport.
const LOAD_MORE_THRESHOLD = 5;
const EMPTY_ITEMS: DataSourceListItem[] = [];
const POSITIONED_ROW_CLASS = 'tw-absolute tw-inset-x-0 tw-top-0';
// `depth` 1 marks data sources inside a folder; module constant so the table options stay stable between renders.
const CHILD_TABLE_META = { depth: 1 };

// Status names the render code below switches on.
const getStatus = ({
  isLoading,
  isFetchingNextPage,
  isError,
}: {
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
}) => {
  if (isLoading) return 'loading';
  if (isFetchingNextPage) return 'loadingMore';
  if (isError) return 'error';
  return 'success';
};

export default function FolderChildren({ folder }: { folder: FolderEntry }) {
  const branchId = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.activeBranchId);
  const folderQuery = useInfiniteQuery(
    dataSourcesInfiniteQueryOptions({ folderId: folder.id, pageSize: FOLDER_PAGE_SIZE, branchId })
  );
  const { data, hasNextPage, fetchNextPage, refetch } = folderQuery;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? EMPTY_ITEMS, [data]);
  const status = getStatus(folderQuery);
  // Shares the root table's selection, so data sources in different folders can be selected together.
  const { rowSelection, onRowSelectionChange, enableRowSelection } = useDataSourceRowSelection();
  const table = useReactTable<DataSourceListItem>({
    data: items,
    columns: dataSourceColumns,
    getRowId: getDataSourceRowId,
    getCoreRowModel: getCoreRowModel(),
    meta: CHILD_TABLE_META,
    state: { rowSelection },
    onRowSelectionChange,
    enableRowSelection,
  });
  const rows = table.getRowModel().rows;

  // A next-page load or failure shows one extra status row after the loaded rows.
  const trailingStatus = status === 'loadingMore' ? 'loading' : status === 'error' ? 'error' : undefined;
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
  const label = `Data sources in ${folder.name}`;

  if (status === 'loading') {
    return (
      <div role="rowgroup" aria-label={label}>
        <FolderStatusRow variant="loading" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div role="rowgroup" aria-label={label}>
        <FolderStatusRow variant={status === 'error' ? 'error' : 'empty'} onRetry={retry} />
      </div>
    );
  }

  // Focusable so keyboard users can scroll a folder taller than 600px. The negative margin + padding
  // extend the scroll box into the page gutter so the rows aren't clipped.
  return (
    <div
      ref={scrollContainerRef}
      role="rowgroup"
      tabIndex={0}
      aria-label={label}
      style={{ marginRight: -scrollbarWidth }}
      className="tw--ml-[70px] tw-max-h-[600px] tw-overflow-y-auto tw-hide-scrollbar tw-pl-[70px] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-interactive-focus-outline"
    >
      <div className="tw-relative" style={{ height: totalSize }}>
        {virtualItems.map((virtualItem) => {
          const row = rows[virtualItem.index];
          const style = { transform: `translateY(${virtualItem.start}px)` };
          return row ? (
            <DataSourceRow key={virtualItem.key} row={row} level={2} className={POSITIONED_ROW_CLASS} style={style} />
          ) : (
            <FolderStatusRow
              key={virtualItem.key}
              variant={trailingStatus ?? 'loading'}
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
