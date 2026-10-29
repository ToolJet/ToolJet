import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import { useItemsListStore } from './store/itemsListStore';
import { useSharedRowSelection } from './hooks/useSharedRowSelection';
import { columns, getRowId } from './columns';
import ItemRow from './ItemRow';
import { FolderSkeletonRow, FolderStatusRow } from './FolderStatusRow';

const ROW_HEIGHT = 40;
const STATUS_ROW_HEIGHT = 28;
// Start fetching the next page while this many loaded rows are still below the viewport.
const LOAD_MORE_THRESHOLD = 5;
const EMPTY_ITEMS = [];
const FOLDER_TABLE_META = { depth: 1 };
const POSITIONED_ROW_CLASS = 'tw-absolute tw-inset-x-0 tw-top-0';

export default function FolderChildren({ folder, listParams }) {
  const folderState = useItemsListStore((state) => state.folders[folder.id]);
  const fetchFolderItems = useItemsListStore((state) => state.fetchFolderItems);
  const { rowSelection, onRowSelectionChange, enableRowSelection } = useSharedRowSelection();
  const scrollContainerRef = useRef(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // Runs on first expand and again after resetFolders drops the cache (e.g. on a sort change).
  const isCached = Boolean(folderState);
  useEffect(() => {
    if (!isCached) fetchFolderItems(folder.id, listParams);
  }, [isCached, folder.id, listParams, fetchFolderItems]);

  const items = folderState?.items ?? EMPTY_ITEMS;
  const status = folderState?.status ?? 'loading';
  const table = useReactTable({
    data: items,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    meta: FOLDER_TABLE_META,
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

  const shouldLoadMore =
    status === 'success' && folderState.hasMore && lastRenderedIndex >= rows.length - LOAD_MORE_THRESHOLD;
  useEffect(() => {
    if (shouldLoadMore) fetchFolderItems(folder.id, listParams, { nextPage: true });
  }, [shouldLoadMore, folder.id, listParams, fetchFolderItems]);

  const retry = () => fetchFolderItems(folder.id, listParams, { nextPage: rows.length > 0 });

  if (status === 'loading') {
    return (
      <div role="rowgroup" aria-label={`Apps in ${folder.name}`}>
        <FolderSkeletonRow />
        <FolderStatusRow variant="loading" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div role="rowgroup" aria-label={`Apps in ${folder.name}`}>
        <FolderStatusRow variant={status === 'error' ? 'error' : 'empty'} onRetry={retry} />
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
