import React, { useEffect, useMemo } from 'react';

import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { NoMatchesFound } from '@/pages/AppsDashboard/components/EmptyStates';
import { ListViewLoading } from '@/pages/AppsDashboard/components/LoadingStates';
import PageFooter from '@/pages/AppsDashboard/components/PageFooter';
import { ROOT_PAGE_SIZE } from '@/pages/AppsDashboard/helper';
import { useRootAppsQuery } from '@/pages/AppsDashboard/hooks/useRootAppsQuery';
import { getSelectedKind, isInPinnedSection } from '@/pages/AppsDashboard/items';
import { DataTable } from '@/pages/components/DataTable/DataTable';
import { useListQueryParams } from './hooks/useListQueryParams';
import { usePinReorder } from './hooks/usePinReorder';
import { useSharedRowSelection } from './hooks/useSharedRowSelection';
import { columns, getRowId } from './columns';
import SortableItemRow from './SortableItemRow';
import FolderChildren from './FolderChildren';
import SelectionBar from './SelectionBar';
import SortMenu from './SortMenu';
import FilterMenu from './FilterMenu';

const getRowCanExpand = (row) => row.original.kind === 'folder';

// Selectable rows of `kind` on this page, from counts in the root response: no folder page has to be loaded.
// For apps: root app rows plus every expanded folder's `app_count`. A pinned app inside an expanded folder is
// listed at root and counted in its folder's `app_count`, under one row id, so the root row is skipped.
function countPageRowsOfKind(items, expanded, kind) {
  if (kind === 'folder') return items.filter((item) => item.kind === 'folder').length;
  if (kind !== 'app') return 0;

  const isExpandedFolderId = (folderId) => Boolean(expanded[`folder:${folderId}`]);
  return items.reduce((count, item) => {
    if (item.kind === 'folder') return isExpandedFolderId(item.id) ? count + item.app_count : count;
    return item.folder && isExpandedFolderId(item.folder.id) ? count : count + 1;
  }, 0);
}

const EMPTY_ITEMS = [];

// While loading, the real column header stays and the rows and footer become skeletons.
export default function ItemsList({ appType }) {
  // Same params as `index.tsx` and the grid, so this reads their cache entry rather than sending another request.
  const { data, isLoading } = useRootAppsQuery(appType);
  const searchQuery = useSearchStore((state) => state.debouncedSearchQuery);
  const isSearching = searchQuery.trim() !== '';
  const responseItems = data?.items ?? EMPTY_ITEMS;
  // Search has no Pinned group: every matching app (stray and nested) comes first, folders last.
  const items = useMemo(
    () =>
      isSearching
        ? [
            ...responseItems.filter((item) => item.kind === 'app'),
            ...responseItems.filter((item) => item.kind === 'folder'),
          ]
        : responseItems,
    [isSearching, responseItems]
  );
  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const expanded = useAppsStore((state) => state.expanded);
  const setExpanded = useAppsStore((state) => state.setExpanded);
  const clearSelection = useAppsStore((state) => state.clearSelection);
  const { rowSelection, onRowSelectionChange, enableRowSelection } = useSharedRowSelection();
  const { sort, filters, setSort, toggleFilter, clearFilters } = useListQueryParams();

  // An empty workspace never reaches here: `index.tsx` shows its empty state instead.
  const hasNoMatches = !isLoading && (data?.total ?? 0) === 0 && searchQuery.trim() !== '';

  // A search can drop folders from the page, so open folders collapse.
  useEffect(() => {
    setExpanded({});
  }, [searchQuery, appType, setExpanded]);

  // Selection is page-scoped, so any change to what the page shows clears it.
  useEffect(() => {
    clearSelection();
  }, [currentPage, searchQuery, appType, clearSelection]);

  // Memoized so the table options stay stable between renders.
  const tableMeta = useMemo(() => ({ appType }), [appType]);
  const reorder = usePinReorder({ appType, items, pinnedTotal: data?.counts.pinned ?? 0 });
  const selectedKind = getSelectedKind(rowSelection);
  const selectedRowIds = Object.keys(rowSelection);
  const pageRowCountOfKind = useMemo(
    () => countPageRowsOfKind(items, expanded, selectedKind),
    [items, expanded, selectedKind]
  );
  const isPageFullySelected = pageRowCountOfKind > 0 && selectedRowIds.length === pageRowCountOfKind;

  // e.g. "modified_desc" → field "modified", direction "desc"; "activity" has no column, so no indicator.
  const [sortField, sortDirection] = sort.split('_');

  return (
    <>
      {/* <div className="tw-mb-2.5 tw-flex tw-h-10 tw-shrink-0 tw-items-center tw-justify-end tw-gap-1 tw-px-[4.375rem]">
        <FilterMenu filters={filters} onToggleFilter={toggleFilter} onClearFilters={clearFilters} />
        <SortMenu sort={sort} onSortChange={setSort} />
      </div> */}

      <DataTable
        columns={columns}
        data={items}
        getRowId={getRowId}
        ariaLabel="Apps and folders"
        tableMeta={tableMeta}
        sort={{ field: sortField, direction: sortDirection }}
        scrollResetKey={currentPage}
        isLoading={isLoading}
        loadingState={<ListViewLoading />}
        emptyState={hasNoMatches ? <NoMatchesFound /> : null}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        enableRowSelection={enableRowSelection}
        getRowCanExpand={getRowCanExpand}
        expanded={expanded}
        onExpandedChange={setExpanded}
        renderExpandedRow={(row) => <FolderChildren folder={row.original} appType={appType} />}
        renderRow={(row) => <SortableItemRow key={row.id} row={row} />}
        // Pinned rows come first, so the divider goes after the last one (and its open folder children).
        renderRowSeparator={(row, nextRow) =>
          !isSearching && isInPinnedSection(row.original) && nextRow && !isInPinnedSection(nextRow.original) ? (
            <Separator decorative className="tw-my-2" />
          ) : null
        }
        reorder={reorder}
        overlay={
          selectedKind && (
            <SelectionBar
              appType={appType}
              kind={selectedKind}
              selectedRowIds={selectedRowIds}
              pageState={isPageFullySelected ? 'all' : 'some'}
              onClear={clearSelection}
              className="tw-absolute tw-bottom-4 tw-left-1/2 tw-z-20 -tw-translate-x-1/2"
            />
          )
        }
        footer={
          <PageFooter
            isLoading={isLoading}
            page={currentPage}
            pageSize={data?.page_size ?? ROOT_PAGE_SIZE}
            totalCount={data?.total ?? 0}
            onPageChange={setCurrentPage}
            singularItemLabel="item"
          />
        }
      />
    </>
  );
}
