import React, { Fragment, useEffect, useMemo, useRef, type UIEvent } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';

import { cn } from '@/lib/utils';
import { DataTableContext } from './DataTableContext';
import { DOCKED_EDGE_SHADOW_CLASS, DOCKED_GUTTER_CLASS, GUTTER_CLASS, SCROLLER_CLASS } from './constants';
import { getGridTemplateColumns } from './getGridTemplateColumns';
import { DropIndicator, ReorderProvider } from './Reorder';
import type { DataTableColumnMeta, DataTableProps } from './types';

// Mirrors the @supports check in DataTable.module.scss.
const SUPPORTS_SCROLL_TIMELINE = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()');

export function DataTable<T>({
  columns,
  data,
  getRowId,
  ariaLabel,
  tableMeta,
  sort,
  scrollResetKey,
  isLoading = false,
  loadingState,
  emptyState,
  rowSelection,
  onRowSelectionChange,
  enableRowSelection,
  getRowCanExpand,
  expanded,
  onExpandedChange,
  renderExpandedRow,
  renderRow,
  renderRowSeparator,
  reorder,
  overlay,
  footer,
}: DataTableProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasEmptyState = Boolean(emptyState);

  const table = useReactTable({
    data,
    columns,
    getRowId,
    getRowCanExpand,
    getCoreRowModel: getCoreRowModel(),
    meta: tableMeta,
    // Only the state the page controls; the rest stays inside TanStack.
    state: { ...(expanded && { expanded }), ...(rowSelection && { rowSelection }) },
    onExpandedChange,
    onRowSelectionChange,
    enableRowSelection,
  });

  const gridTemplateColumns = useMemo(() => getGridTemplateColumns(columns), [columns]);
  const contextValue = useMemo(
    () => ({ columnCount: columns.length, gridTemplateColumns }),
    [columns.length, gridTemplateColumns]
  );

  useEffect(() => {
    scrollContainerRef.current?.scrollTo?.({ top: 0 });
  }, [scrollResetKey]);

  // The docking animation (DataTable.module.scss) maps its 0→1 progress onto this distance.
  // Re-runs on `hasEmptyState` because the empty state unmounts the scroller.
  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!SUPPORTS_SCROLL_TIMELINE || !scroller) return undefined;
    const syncMaxScrollLeft = () =>
      scroller.style.setProperty('--data-table-max-scroll-left', `${scroller.scrollWidth - scroller.clientWidth}px`);
    const observer = new ResizeObserver(syncMaxScrollLeft);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    return () => observer.disconnect();
  }, [hasEmptyState]);

  // Written to the DOM rather than React state so sideways scrolling doesn't re-render every row;
  // data-scrolled-x shows the docked column's edge shadow.
  const syncHorizontalScroll = (event: UIEvent<HTMLDivElement>) => {
    const scroller = event.currentTarget;
    if (!SUPPORTS_SCROLL_TIMELINE) scroller.style.setProperty('--data-table-scroll-left', `${scroller.scrollLeft}px`);
    scroller.toggleAttribute('data-scrolled-x', scroller.scrollLeft > 0);
  };

  const SortDirectionIcon = sort?.direction === 'asc' ? ArrowUpNarrowWide : ArrowDownWideNarrow;
  const rows = table.getRowModel().rows;

  const rowElements = rows.map((row, index) => (
    <Fragment key={row.id}>
      {reorder && <DropIndicator rowId={row.id} side="before" />}
      {renderRow(row)}
      {row.getIsExpanded() && renderExpandedRow?.(row)}
      {/* After the open children, since that's where a drop below the row lands. */}
      {reorder && <DropIndicator rowId={row.id} side="after" />}
      {renderRowSeparator?.(row, rows[index + 1])}
    </Fragment>
  ));

  return (
    <>
      {/* Replaces the whole table, header included, so it centers in the panel's free space. */}
      {hasEmptyState ? (
        emptyState
      ) : (
        <DataTableContext.Provider value={contextValue}>
          <div className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
            <div
              ref={scrollContainerRef}
              onScroll={syncHorizontalScroll}
              // Right gutter is a margin, not padding: content shows through a scroller's padding when scrolled.
              className={cn(
                SCROLLER_CLASS,
                'tw-group/data-table tw-mr-[70px] tw-min-h-0 tw-flex-1 tw-overflow-auto tw-hide-scrollbar tw-pb-10 tw-pl-[70px]'
              )}
            >
              {/* min-w-min: never narrower than the columns' minimums, so the scroller scrolls sideways instead. */}
              <div
                role={getRowCanExpand ? 'treegrid' : 'grid'}
                aria-label={ariaLabel}
                aria-multiselectable={onRowSelectionChange ? true : undefined}
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
                        style={{ gridTemplateColumns }}
                      >
                        {headerGroup.headers.map((header) => {
                          // TanStack types `meta` as an empty interface; `DataTableColumn` guarantees this shape.
                          const { sortField, docked } = header.column.columnDef.meta as DataTableColumnMeta;
                          const isSorted = Boolean(sort && sortField === sort.field);
                          return (
                            <div
                              key={header.id}
                              role="columnheader"
                              aria-sort={
                                isSorted ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : undefined
                              }
                              className={cn(
                                'tw-flex tw-h-full tw-items-center tw-font-title-default tw-text-text-default',
                                docked && [
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
                  loadingState
                ) : reorder ? (
                  <ReorderProvider rows={rows} reorder={reorder}>
                    {rowElements}
                  </ReorderProvider>
                ) : (
                  rowElements
                )}
              </div>
            </div>

            {overlay}
          </div>
        </DataTableContext.Provider>
      )}

      {footer}
    </>
  );
}
