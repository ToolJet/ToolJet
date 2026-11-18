import React, { useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Table } from '@/components/ui/Rocket/Table/Table';
import { TableSkeleton } from '@/components/ui/blocks/TableSkeleton';
import { useTjdbStore } from '../../_stores/tjdbStore';
import { listAllPrimaryKeyColumns } from '../../constants';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { GridBody } from './GridBody';
import { GridHeader } from './GridHeader';
import { getDeleteBlockedReason } from './deleteRows';
import { SelectionBar } from './SelectionBar';
import type { SortRule } from '../../rows/rowsQuery';
import { toSortingState } from './sortState';
import { useRowSelection } from './useRowSelection';
import './tableGrid.scss';
import { ADD_COLUMN_WIDTH, ROW_HEIGHT, useTableGrid, type GridColumn, type GridRow } from './useTableGrid';

export type TableGridProps = {
  columns: GridColumn[];
  rows: GridRow[];
  isLoading: boolean;
  /** A refetch is running behind the rows on screen: shows a progress bar and dims the rows. */
  isRefetching?: boolean;
  /** Gates the add column cell and each header's menu button. */
  canEditSchema: boolean;
  /** Enables the row checkboxes, and with them the bulk bar. */
  canSelectRows?: boolean;
  onAddRow?: () => void;
  onAddColumn?: () => void;
  onOpenColumnMenu?: (column: GridColumn, anchor: HTMLElement) => void;
};

const SKELETON_ROWS = 10;
const MIN_SKELETON_COLUMNS = 5;

// Read-only table body: pinned and resizable columns, sort indicators, virtualised rows. Sort order and the rows
// themselves come from the server. Rows can be selected (for bulk delete); nothing edits or navigates yet.
export function TableGrid({
  columns,
  rows,
  isLoading,
  isRefetching = false,
  canEditSchema,
  canSelectRows = false,
  onAddRow,
  onAddColumn,
  onOpenColumnMenu,
}: TableGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortFilters = useTjdbStore((state: { sortFilters: Record<string, SortRule> }) => state.sortFilters);
  const sorting = useMemo(() => toSortingState(sortFilters), [sortFilters]);
  const { foreignKeys } = useTooljetDatabaseContext();
  const foreignKeyColumns = useMemo(
    () => new Set((foreignKeys as { column_names?: string[] }[]).flatMap((key) => key.column_names ?? [])),
    [foreignKeys]
  );

  const { rowSelection, onRowSelectionChange, clearSelection } = useRowSelection();
  const table = useTableGrid({
    columns,
    rows,
    foreignKeyColumns,
    sorting,
    rowSelection,
    onRowSelectionChange,
    canSelectRows,
  });
  const primaryKeys = useMemo(() => listAllPrimaryKeyColumns(columns) as string[], [columns]);
  const deleteBlockedReason = useMemo(() => getDeleteBlockedReason(primaryKeys, columns), [primaryKeys, columns]);
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);

  // Here, not in GridBody: a child's layout effect runs before this component attaches scrollRef, so the
  // virtualizer would not find its scroll element on mount. The sticky header covers the first 40px of that element,
  // which makes the virtual window that much too tall at the top; the overscan absorbs it.
  const { rows: tableRows } = table.getRowModel();
  const getItemKey = useCallback((index: number) => tableRows[index]?.id ?? index, [tableRows]);
  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    getItemKey,
    overscan: 8,
  });

  return (
    // The bar floats over the scroll element, not inside it, so it stays centred on what is visible.
    <div className="tw-relative tw-h-full tw-min-h-0 tw-w-full">
      <div
        ref={scrollRef}
        role="grid"
        aria-busy={isLoading || isRefetching}
        className="tw-h-full tw-min-h-0 tw-w-full tw-overflow-auto tw-bg-page-weak"
        data-cy="tjdb-table-grid"
      >
        <div
          className="tw-flex tw-min-h-full tw-flex-col"
          style={{ width: table.getTotalSize() + (canEditSchema ? ADD_COLUMN_WIDTH : 0), minWidth: '100%' }}
        >
          <GridHeader
            table={table}
            canEditSchema={canEditSchema}
            canSelectRows={canSelectRows}
            onAddColumn={onAddColumn}
            onOpenColumnMenu={onOpenColumnMenu}
          />
          {isRefetching && (
            <div
              role="progressbar"
              aria-label="Refreshing rows"
              className="tw-relative tw-h-0.5 tw-w-full tw-shrink-0 tw-overflow-hidden"
            >
              <div className="tjdb-grid-refetch-bar tw-absolute tw-inset-y-0 tw-left-0 tw-w-2/5 tw-bg-background-accent-strong" />
            </div>
          )}
          {isLoading ? (
            <div data-testid="grid-skeleton">
              <Table>
                <TableSkeleton
                  rowCount={SKELETON_ROWS}
                  columnCount={Math.max(table.getVisibleLeafColumns().length, MIN_SKELETON_COLUMNS)}
                />
              </Table>
            </div>
          ) : (
            <GridBody
              table={table}
              virtualizer={virtualizer}
              showTrailingCell={canEditSchema}
              canSelectRows={canSelectRows}
              dimmed={isRefetching}
            />
          )}
          {onAddRow && (
            <div className="tw-sticky tw-bottom-0 tw-z-10 tw-h-10 tw-w-full tw-shrink-0 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-bg-page-weak">
              <div className="tw-sticky tw-left-0 tw-flex tw-h-full tw-w-fit tw-items-center tw-pl-3">
                <Button variant="ghost" onClick={onAddRow} leadingVisual={<Plus />}>
                  Add row
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <SelectionBar
        rows={selectedRows}
        primaryKeys={primaryKeys}
        canSelectRows={canSelectRows}
        deleteBlockedReason={deleteBlockedReason}
        onClear={clearSelection}
      />
    </div>
  );
}
