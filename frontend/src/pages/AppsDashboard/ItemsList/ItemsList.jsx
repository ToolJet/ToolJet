import React, { Fragment, useEffect, useMemo, useRef } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { NoMatchesFound } from '@/pages/AppsDashboard/components/EmptyStates';
import { ListViewLoading } from '@/pages/AppsDashboard/components/LoadingStates';
import PageFooter from '@/pages/AppsDashboard/components/PageFooter';
import { ROOT_PAGE_SIZE } from '@/pages/AppsDashboard/helper';
import { useRootAppsQuery } from '@/pages/AppsDashboard/hooks/useRootAppsQuery';
import { getSelectedKind, isInPinnedSection } from '@/pages/AppsDashboard/items';
import { useListQueryParams } from './hooks/useListQueryParams';
import { useSharedRowSelection } from './hooks/useSharedRowSelection';
import { GRID_TEMPLATE_COLUMNS, columns, getRowId } from './columns';
import { DropIndicator, PinReorderProvider, SortableItemRow } from './PinReorder';
import { DOCKED_EDGE_SHADOW_CLASS, DOCKED_GUTTER_CLASS, GUTTER_CLASS } from './ItemRow';
import FolderChildren from './FolderChildren';
import SelectionBar from './SelectionBar';
import SortMenu from './SortMenu';
import FilterMenu from './FilterMenu';
import './itemsList.scss';

const getRowCanExpand = (row) => row.original.kind === 'folder';
// Mirrors the @supports check in itemsList.scss.
const SUPPORTS_SCROLL_TIMELINE = CSS.supports('animation-timeline: scroll()');

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
  const scrollContainerRef = useRef(null);

  // An empty workspace never reaches here: `index.tsx` shows its empty state instead.
  const hasNoMatches = !isLoading && (data?.total ?? 0) === 0 && searchQuery.trim() !== '';

  // A search can drop folders from the page, so open folders collapse.
  useEffect(() => {
    setExpanded({});
  }, [searchQuery, appType, setExpanded]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [currentPage]);

  // Selection is page-scoped, so any change to what the page shows clears it.
  useEffect(() => {
    clearSelection();
  }, [currentPage, searchQuery, appType, clearSelection]);

  // Memoized so the table options stay stable between renders.
  const tableMeta = useMemo(() => ({ appType }), [appType]);
  const table = useReactTable({
    data: items,
    columns,
    getRowId,
    getRowCanExpand,
    getCoreRowModel: getCoreRowModel(),
    meta: tableMeta,
    state: { expanded, rowSelection },
    onExpandedChange: setExpanded,
    onRowSelectionChange,
    enableRowSelection,
  });
  const selectedKind = getSelectedKind(rowSelection);
  const selectedRowIds = Object.keys(rowSelection);
  const pageRowCountOfKind = useMemo(
    () => countPageRowsOfKind(items, expanded, selectedKind),
    [items, expanded, selectedKind]
  );
  const isPageFullySelected = pageRowCountOfKind > 0 && selectedRowIds.length === pageRowCountOfKind;

  // The folder-row docking animation (itemsList.scss) maps its 0→1 progress onto this distance.
  // Re-runs on `hasNoMatches` because the no-matches state unmounts the scroller.
  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!SUPPORTS_SCROLL_TIMELINE || !scroller) return;
    const syncMaxScrollLeft = () =>
      scroller.style.setProperty('--list-max-scroll-left', `${scroller.scrollWidth - scroller.clientWidth}px`);
    const observer = new ResizeObserver(syncMaxScrollLeft);
    observer.observe(scroller);
    observer.observe(scroller.firstElementChild);
    return () => observer.disconnect();
  }, [hasNoMatches]);

  // Written to the DOM rather than React state so sideways scrolling doesn't re-render every row;
  // data-scrolled-x shows the docked column's edge shadow.
  const syncHorizontalScroll = (event) => {
    const scroller = event.currentTarget;
    if (!SUPPORTS_SCROLL_TIMELINE) scroller.style.setProperty('--list-scroll-left', `${scroller.scrollLeft}px`);
    scroller.toggleAttribute('data-scrolled-x', scroller.scrollLeft > 0);
  };

  // e.g. "modified_desc" → field "modified", direction "desc"; "activity" has no column, so no indicator.
  const [sortField, sortDirection] = sort.split('_');
  const SortDirectionIcon = sortDirection === 'asc' ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  return (
    <>
      {/* <div className="tw-mb-2.5 tw-flex tw-h-10 tw-shrink-0 tw-items-center tw-justify-end tw-gap-1 tw-px-[4.375rem]">
        <FilterMenu filters={filters} onToggleFilter={toggleFilter} onClearFilters={clearFilters} />
        <SortMenu sort={sort} onSortChange={setSort} />
      </div> */}

      {/* Replaces the whole table, header included, so it centers in the panel's free space. */}
      {hasNoMatches ? (
        <NoMatchesFound />
      ) : (
        <div className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
          <div
            ref={scrollContainerRef}
            onScroll={syncHorizontalScroll}
            // Right gutter is a margin, not padding: content shows through a scroller's padding when scrolled.
            className="items-list-scroller tw-group/list tw-mr-[70px] tw-min-h-0 tw-flex-1 tw-overflow-auto tw-hide-scrollbar tw-pb-10 tw-pl-[70px]"
          >
            {/* min-w-min: never narrower than the columns' minimums, so the scroller scrolls sideways instead. */}
            <div
              role="treegrid"
              aria-label="Apps and folders"
              aria-multiselectable
              aria-busy={isLoading}
              className="tw-min-w-min"
            >
              <div className="tw-sticky tw-top-0 tw-z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <div key={headerGroup.id} role="row" className="tw--ml-[70px] tw-flex tw-h-9">
                    {/* Docked page-colored spacer: hides checkboxes of rows scrolled under the header. */}
                    <div className={cn(GUTTER_CLASS, 'tw-items-center', DOCKED_GUTTER_CLASS)} />
                    <div
                      className="tw-grid tw-flex-1 tw-items-center tw-rounded-md tw-bg-background-surface-layer-02 tw-pr-2"
                      style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
                    >
                      {headerGroup.headers.map((header) => {
                        const isSorted = header.column.columnDef.meta.sortField === sortField;
                        const isNameHeader = header.column.id === 'name';
                        return (
                          <div
                            key={header.id}
                            role="columnheader"
                            aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                            className={cn(
                              'tw-flex tw-h-full tw-items-center tw-font-title-default tw-text-text-default',
                              isNameHeader && [
                                'tw-sticky tw-left-0 tw-z-[1] tw-rounded-l-md tw-bg-background-surface-layer-02 tw-pl-8',
                                DOCKED_EDGE_SHADOW_CLASS,
                              ]
                            )}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {isSorted && (
                              <span className="tw-flex tw-p-1">
                                <SortDirectionIcon size={12} className="tw-text-icon-strong" aria-hidden />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {isLoading ? (
                <ListViewLoading />
              ) : (
                <PinReorderProvider appType={appType} items={items} pinnedTotal={data?.counts.pinned ?? 0}>
                  {table.getRowModel().rows.map((row, index, rows) => (
                    <Fragment key={row.id}>
                      <DropIndicator rowId={row.id} side="before" />
                      <SortableItemRow row={row} />
                      {row.getIsExpanded() && <FolderChildren folder={row.original} appType={appType} />}
                      {/* After the folder's open children, since that's where a drop below the folder lands. */}
                      <DropIndicator rowId={row.id} side="after" />
                      {/* Pinned rows come first, so the divider goes after the last one (and its open folder children). */}
                      {!isSearching &&
                        isInPinnedSection(row.original) &&
                        rows[index + 1] &&
                        !isInPinnedSection(rows[index + 1].original) && <Separator decorative className="tw-my-2" />}
                    </Fragment>
                  ))}
                </PinReorderProvider>
              )}
            </div>
          </div>
          {selectedKind && (
            <SelectionBar
              appType={appType}
              kind={selectedKind}
              selectedRowIds={selectedRowIds}
              pageState={isPageFullySelected ? 'all' : 'some'}
              onClear={clearSelection}
              className="tw-absolute tw-bottom-4 tw-left-1/2 tw-z-20 -tw-translate-x-1/2"
            />
          )}
        </div>
      )}
      <PageFooter
        isLoading={isLoading}
        page={currentPage}
        pageSize={data?.page_size ?? ROOT_PAGE_SIZE}
        totalCount={data?.total ?? 0}
        onPageChange={setCurrentPage}
        singularItemLabel="item"
      />
    </>
  );
}
