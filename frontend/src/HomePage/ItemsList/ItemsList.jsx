import React, { Fragment, useEffect, useMemo, useRef } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';

import { cn } from '@/lib/utils';
import { FooterLoading, ListViewLoading } from '@/pages/AppsDashboard/components/LoadingStates';
import { getSelectedKind, useItemsListStore } from './store/itemsListStore';
import { useListQueryParams } from './hooks/useListQueryParams';
import { useRootItemsSync } from './hooks/useRootItemsSync';
import { useSharedRowSelection } from './hooks/useSharedRowSelection';
import { GRID_TEMPLATE_COLUMNS, columns, getRowId } from './columns';
import ItemRow from './ItemRow';
import FolderChildren from './FolderChildren';
import SelectionBar from './SelectionBar';
import ListFooter from './ListFooter';
import SortMenu from './SortMenu';
import FilterMenu from './FilterMenu';

const getRowCanExpand = (row) => row.original.kind === 'folder';

// `isLoading` keeps the real column header and swaps the rows and footer for skeletons.
export default function ItemsList({ isLoading = false }) {
  const query = useItemsListStore((state) => state.query);
  const items = useItemsListStore((state) => state.root.items);
  const expanded = useItemsListStore((state) => state.expanded);
  const setExpanded = useItemsListStore((state) => state.setExpanded);
  const resetFolders = useItemsListStore((state) => state.resetFolders);
  const folders = useItemsListStore((state) => state.folders);
  const setRowSelection = useItemsListStore((state) => state.setRowSelection);
  const clearSelection = useItemsListStore((state) => state.clearSelection);
  const { rowSelection, onRowSelectionChange, enableRowSelection } = useSharedRowSelection();
  const { sort, filters, setSort, toggleFilter, clearFilters } = useListQueryParams();
  const scrollContainerRef = useRef(null);

  const { listParams } = useRootItemsSync();

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

  const selectedCount = Object.keys(rowSelection).length;
  const isPageFullySelected = pageRowIdsOfKind.length > 0 && pageRowIdsOfKind.every((rowId) => rowSelection[rowId]);
  const togglePageSelection = () => {
    if (isPageFullySelected) clearSelection();
    else
      setRowSelection((current) => ({
        ...current,
        ...Object.fromEntries(pageRowIdsOfKind.map((rowId) => [rowId, true])),
      }));
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

      <div ref={scrollContainerRef} className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-[4.375rem] tw-pb-10">
        {selectedKind && (
          // Page-colored backdrop + bottom padding cover rows scrolling under the bar and its gap to the header.
          <SelectionBar
            kind={selectedKind}
            selectedCount={selectedCount}
            pageState={isPageFullySelected ? 'all' : 'some'}
            onToggleAll={togglePageSelection}
            onClear={clearSelection}
            className="tw-sticky tw-top-0 tw-z-20 tw-bg-background-surface-layer-01 tw-pb-2"
          />
        )}
        <div role="treegrid" aria-label="Apps and folders" aria-multiselectable aria-busy={isLoading}>
          {/* Sits below the 44px selection bar (36px + 8px gap) while it is shown. The page-colored backdrop
              reaches into the selection gutter so checkboxes of rows scrolled underneath stay hidden. */}
          <div
            className={cn(
              'tw-sticky tw-z-10 tw--ml-[52px] tw-bg-background-surface-layer-01 tw-pl-[52px]',
              selectedKind ? 'tw-top-11' : 'tw-top-0'
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <div
                key={headerGroup.id}
                role="row"
                className="tw-grid tw-h-9 tw-items-center tw-rounded-md tw-bg-background-surface-layer-02 tw-pr-3 tw-pl-8"
                style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
              >
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.columnDef.meta.sortField === sortField;
                  return (
                    <div
                      key={header.id}
                      role="columnheader"
                      aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                      className="tw-flex tw-items-center tw-font-title-default tw-text-text-default"
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
            ))}
          </div>

          {isLoading ? (
            <ListViewLoading />
          ) : (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <ItemRow row={row} />
                {row.getIsExpanded() && <FolderChildren folder={row.original} listParams={listParams} />}
              </Fragment>
            ))
          )}
        </div>
      </div>
      {isLoading ? <FooterLoading /> : <ListFooter />}
    </>
  );
}
