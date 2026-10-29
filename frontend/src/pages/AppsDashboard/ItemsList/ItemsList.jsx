import React, { Fragment, useEffect, useMemo, useRef } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { NoMatchesFound } from '@/pages/AppsDashboard/components/EmptyStates';
import { ListViewLoading } from '@/pages/AppsDashboard/components/LoadingStates';
import PageFooter from '@/pages/AppsDashboard/components/PageFooter';
import { isInPinnedSection } from '@/pages/AppsDashboard/items';
import { useHasNoMatches } from '@/pages/AppsDashboard/useHasNoMatches';
import { ITEMS_PER_PAGE, getSelectedKind, useItemsListStore } from './store/itemsListStore';
import { useListQueryParams } from './hooks/useListQueryParams';
import { useRootItemsSync } from './hooks/useRootItemsSync';
import { useSharedRowSelection } from './hooks/useSharedRowSelection';
import { GRID_TEMPLATE_COLUMNS, columns, getRowId } from './columns';
import ItemRow, { DOCKED_EDGE_SHADOW_CLASS, DOCKED_GUTTER_CLASS, GUTTER_CLASS } from './ItemRow';
import FolderChildren from './FolderChildren';
import SelectionBar from './SelectionBar';
import SortMenu from './SortMenu';
import FilterMenu from './FilterMenu';
import './itemsList.scss';

const getRowCanExpand = (row) => row.original.kind === 'folder';
// Mirrors the @supports check in itemsList.scss.
const SUPPORTS_SCROLL_TIMELINE = CSS.supports('animation-timeline: scroll()');

// `isLoading` keeps the real column header and swaps the rows and footer for skeletons.
export default function ItemsList({ isLoading = false }) {
  const query = useItemsListStore((state) => state.query);
  const items = useItemsListStore((state) => state.root.items);
  const expanded = useItemsListStore((state) => state.expanded);
  const setExpanded = useItemsListStore((state) => state.setExpanded);
  const meta = useItemsListStore((state) => state.root.meta);
  const setPage = useItemsListStore((state) => state.setPage);
  const resetFolders = useItemsListStore((state) => state.resetFolders);
  const folders = useItemsListStore((state) => state.folders);
  const setRowSelection = useItemsListStore((state) => state.setRowSelection);
  const clearSelection = useItemsListStore((state) => state.clearSelection);
  const { rowSelection, onRowSelectionChange, enableRowSelection } = useSharedRowSelection();
  const { sort, filters, setSort, toggleFilter, clearFilters } = useListQueryParams();
  const scrollContainerRef = useRef(null);

  const { listParams } = useRootItemsSync();
  const hasNoMatches = useHasNoMatches();

  // Sorting only reorders, so open folders stay open and reload; filter/search can drop folders entirely.
  useEffect(() => {
    resetFolders({ collapse: false });
  }, [sort, resetFolders]);

  useEffect(() => {
    resetFolders({ collapse: true });
  }, [filters, query.searchKey, resetFolders]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [query.page, sort, filters]);

  // Selection is page-scoped, so any change to what the page shows clears it.
  useEffect(() => {
    clearSelection();
  }, [query, sort, filters, clearSelection]);

  const table = useReactTable({
    data: items,
    columns,
    getRowId,
    getRowCanExpand,
    getCoreRowModel: getCoreRowModel(),
    state: { expanded, rowSelection },
    onExpandedChange: setExpanded,
    onRowSelectionChange,
    enableRowSelection,
  });
  console.log('rowSelection', rowSelection);

  // Rows of the selected kind on this page: root rows, plus apps loaded inside this page's expanded folders.
  const selectedKind = getSelectedKind(rowSelection);
  const pageRowIdsOfKind = useMemo(() => {
    if (!selectedKind) return [];
    const rootIds = items.filter((item) => item.kind === selectedKind).map(getRowId);
    if (selectedKind === 'folder') return rootIds;
    const childIds = items
      .filter((item) => item.kind === 'folder' && expanded[getRowId(item)])
      .flatMap((folder) => folders[folder.id]?.items.map(getRowId) ?? []);
    return [...rootIds, ...childIds];
  }, [selectedKind, items, expanded, folders]);

  const selectedRowIds = Object.keys(rowSelection);
  const isPageFullySelected = pageRowIdsOfKind.length > 0 && pageRowIdsOfKind.every((rowId) => rowSelection[rowId]);
  const togglePageSelection = () => {
    if (isPageFullySelected) clearSelection();
    else
      setRowSelection((current) => ({
        ...current,
        ...Object.fromEntries(pageRowIdsOfKind.map((rowId) => [rowId, true])),
      }));
  };

  // The folder-row docking animation (itemsList.scss) maps its 0→1 progress onto this distance.
  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!SUPPORTS_SCROLL_TIMELINE || !scroller) return;
    const syncMaxScrollLeft = () =>
      scroller.style.setProperty('--list-max-scroll-left', `${scroller.scrollWidth - scroller.clientWidth}px`);
    const observer = new ResizeObserver(syncMaxScrollLeft);
    observer.observe(scroller);
    observer.observe(scroller.firstElementChild);
    return () => observer.disconnect();
  }, []);

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
                  <div className={cn(GUTTER_CLASS, 'tw-items-center', DOCKED_GUTTER_CLASS)}>
                    {/* Parent checkbox of the selection; Figma 3373-744. */}
                    {selectedKind && (
                      <span className="tw-flex tw-size-5 tw-items-center tw-justify-center">
                        <Checkbox
                          checked={isPageFullySelected ? true : 'indeterminate'}
                          onCheckedChange={togglePageSelection}
                          aria-label={`Select all ${selectedKind}s on this page`}
                        />
                      </span>
                    )}
                  </div>
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
            ) : hasNoMatches ? (
              <NoMatchesFound />
            ) : (
              table.getRowModel().rows.map((row, index, rows) => (
                <Fragment key={row.id}>
                  <ItemRow row={row} />
                  {row.getIsExpanded() && <FolderChildren folder={row.original} listParams={listParams} />}
                  {/* Pinned rows come first, so the divider goes after the last one (and its open folder children). */}
                  {isInPinnedSection(row.original) &&
                    rows[index + 1] &&
                    !isInPinnedSection(rows[index + 1].original) && <Separator decorative className="tw-my-2" />}
                </Fragment>
              ))
            )}
          </div>
        </div>
        {selectedKind && (
          <SelectionBar
            kind={selectedKind}
            selectedRowIds={selectedRowIds}
            pageState={isPageFullySelected ? 'all' : 'some'}
            onClear={clearSelection}
            className="tw-absolute tw-bottom-4 tw-left-1/2 tw-z-20 -tw-translate-x-1/2"
          />
        )}
      </div>
      <PageFooter
        isLoading={isLoading}
        page={query.page}
        pageSize={meta?.page_size ?? ITEMS_PER_PAGE}
        totalCount={meta?.total ?? 0}
        onPageChange={setPage}
        singularItemLabel="item"
      />
    </>
  );
}
