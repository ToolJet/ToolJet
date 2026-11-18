import React, { useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Table } from '@/components/ui/Rocket/Table/Table';
import { TableSkeleton } from '@/components/ui/blocks/TableSkeleton';
import { useTjdbStore } from '../../_stores/tjdbStore';
import { listAllPrimaryKeyColumns } from '../../constants';
import { patchCachedRow } from '../../rows/useTableRows';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import {
  cellDomId,
  cellNavigationReducer,
  scrollLeftToReveal,
  type CellFocus,
  type CellNavAction,
} from './cellNavigation';
import {
  hasEditableKey,
  hasExactKeyValues,
  isEditableColumn,
  saveCellValue,
  toStoredValue,
  type CellValue,
} from './cellEditing';
import { GridBody } from './GridBody';
import { GridHeader } from './GridHeader';
import { getDeleteBlockedReason } from './deleteRows';
import { SelectionBar } from './SelectionBar';
import type { SortRule } from '../../rows/rowsQuery';
import { toSortingState } from './sortState';
import { useCellNavigation } from './useCellNavigation';
import { useRowSelection } from './useRowSelection';
import './tableGrid.scss';
import {
  ADD_COLUMN_WIDTH,
  ROW_HEIGHT,
  SELECT_COLUMN_ID,
  useTableGrid,
  type ForeignKeyTarget,
  type GridColumn,
  type GridRow,
} from './useTableGrid';

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
  /** Lets a cell be edited. Navigation works without it. */
  canEditCells?: boolean;
  onAddRow?: () => void;
  onAddColumn?: () => void;
  onOpenColumnMenu?: (column: GridColumn, anchor: HTMLElement) => void;
};

const SKELETON_ROWS = 10;
const MIN_SKELETON_COLUMNS = 5;

// The table body: pinned and resizable columns, sort indicators, virtualised rows. Sort order and the rows themselves
// come from the server. Rows can be selected (for bulk delete), cells focused with the keyboard and edited in place.
export function TableGrid({
  columns,
  rows,
  isLoading,
  isRefetching = false,
  canEditSchema,
  canSelectRows = false,
  canEditCells = false,
  onAddRow,
  onAddColumn,
  onOpenColumnMenu,
}: TableGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortFilters = useTjdbStore((state: { sortFilters: Record<string, SortRule> }) => state.sortFilters);
  const sorting = useMemo(() => toSortingState(sortFilters), [sortFilters]);
  const { foreignKeys, selectedTable } = useTooljetDatabaseContext();
  const queryClient = useQueryClient();
  const environmentId = useTjdbStore(
    (state: { selectedEnvironment: { id: string } | null }) => state.selectedEnvironment?.id ?? null
  );
  const foreignKeyColumns = useMemo(
    () => new Set((foreignKeys as { column_names?: string[] }[]).flatMap((key) => key.column_names ?? [])),
    [foreignKeys]
  );
  // Only a single-column key has one list of values to pick from; a column inside a composite key is edited as text.
  const foreignKeyTargets = useMemo(() => {
    const targets = new Map<string, ForeignKeyTarget>();
    (
      foreignKeys as { column_names?: string[]; referenced_table_id?: string; referenced_column_names?: string[] }[]
    ).forEach((key) => {
      const [column, ...others] = key.column_names ?? [];
      const referencedColumn = key.referenced_column_names?.[0];
      if (column && others.length === 0 && key.referenced_table_id && referencedColumn) {
        targets.set(column, { tableId: key.referenced_table_id, column: referencedColumn });
      }
    });
    return targets;
  }, [foreignKeys]);

  const { rowSelection, onRowSelectionChange, clearSelection } = useRowSelection();
  const table = useTableGrid({
    columns,
    rows,
    foreignKeyColumns,
    foreignKeyTargets,
    sorting,
    rowSelection,
    onRowSelectionChange,
    canSelectRows,
  });
  const primaryKeys = useMemo(() => listAllPrimaryKeyColumns(columns) as string[], [columns]);
  const deleteBlockedReason = useMemo(() => getDeleteBlockedReason(primaryKeys, columns), [primaryKeys, columns]);
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const { rows: tableRows } = table.getRowModel();
  const visibleColumnIds = useMemo(
    () => table.getVisibleLeafColumns().map((column) => column.id),
    // The instance is stable; what changes the visible columns is the column list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, columns]
  );
  const columnIds = useMemo(() => visibleColumnIds.filter((id) => id !== SELECT_COLUMN_ID), [visibleColumnIds]);
  const { cell, dispatch } = useCellNavigation({ rowCount: tableRows.length, columnIds });

  // Here, not in GridBody: a child's layout effect runs before this component attaches scrollRef, so the
  // virtualizer would not find its scroll element on mount. The sticky header covers the first 40px of that element,
  // which makes the virtual window that much too tall at the top; the overscan absorbs it.
  const getItemKey = useCallback((index: number) => tableRows[index]?.id ?? index, [tableRows]);
  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    getItemKey,
    overscan: 8,
    // The sticky header (and the add row footer) cover rows the virtualizer counts as visible.
    scrollPaddingEnd: ROW_HEIGHT * (onAddRow ? 2 : 1),
  });

  // The handlers below are passed to memoised rows, so they stay the same functions and read what they need from here.
  const columnsByName = useMemo(() => new Map(columns.map((column) => [column.accessor, column])), [columns]);
  const canEdit = canEditCells && hasEditableKey(primaryKeys, columns);
  const latest = useRef({ tableRows, columnsByName, primaryKeys, canEdit });
  latest.current = { tableRows, columnsByName, primaryKeys, canEdit };
  const savingRef = useRef(false);

  const focusGrid = useCallback(() => scrollRef.current?.focus({ preventScroll: true }), []);

  const focusCell = useCallback(
    (rowIndex: number, columnId: string) => {
      dispatch({ type: 'focus', rowIndex, columnId });
      focusGrid();
    },
    [dispatch, focusGrid]
  );

  const stopEditing = useCallback(() => {
    dispatch({ type: 'stopEditing' });
    focusGrid();
  }, [dispatch, focusGrid]);

  const saveCell = useCallback(
    async (rowIndex: number, columnId: string, value: CellValue) => {
      const row = latest.current.tableRows[rowIndex]?.original;
      const column = latest.current.columnsByName.get(columnId);
      const tableId = selectedTable.id;
      if (!row || !column || !tableId || savingRef.current) return false;

      savingRef.current = true;
      try {
        const saved = await saveCellValue({
          tableId,
          tableName: selectedTable.table_name ?? '',
          primaryKeys,
          row,
          columnName: columnId,
          value,
        });
        if (!saved) return false;
        // Written into the cache instead of refetching, so the row keeps its place even under a sort on this column.
        patchCachedRow(
          queryClient,
          { environmentId, tableId },
          (cached) => primaryKeys.every((key) => cached[key] === row[key]),
          { [columnId]: toStoredValue(column.dataType, value) }
        );
        stopEditing();
        return true;
      } finally {
        savingRef.current = false;
      }
    },
    [selectedTable.id, selectedTable.table_name, primaryKeys, queryClient, environmentId, stopEditing]
  );

  const editCell = useCallback(
    (rowIndex: number, columnId: string) => {
      const { tableRows: rows, columnsByName, primaryKeys: keys, canEdit: allowed } = latest.current;
      const row = rows[rowIndex]?.original;
      const column = columnsByName.get(columnId);
      if (!allowed || !row || !column || !isEditableColumn(column) || !hasExactKeyValues(keys, row)) return;

      // A boolean has nothing to type: it flips on the spot, and NULL becomes true.
      if (column.dataType === 'boolean') {
        saveCell(rowIndex, columnId, row[columnId] !== true);
        return;
      }
      dispatch({ type: 'focus', rowIndex, columnId });
      dispatch({ type: 'startEditing' });
    },
    [dispatch, saveCell]
  );

  const revealCell = (next: CellFocus) => {
    virtualizer.scrollToIndex(next.rowIndex, { align: 'auto' });
    const element = scrollRef.current;
    const column = table.getColumn(next.columnId);
    if (!element || !column || column.getIsPinned()) return;
    const scrollLeft = scrollLeftToReveal({
      cellStart: column.getStart(),
      cellWidth: column.getSize(),
      scrollLeft: element.scrollLeft,
      viewportWidth: element.clientWidth,
      pinnedWidth: table.getLeftTotalSize(),
      trailingWidth: canEditSchema ? ADD_COLUMN_WIDTH : 0,
    });
    if (scrollLeft !== null) element.scrollLeft = scrollLeft;
  };

  // Keys that reach here come from the grid element itself: a checkbox, a header button or the open editor handle
  // their own, and the editor's popover is portalled but its events still bubble through this tree.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey) return;
    const bounds = { rowCount: tableRows.length, columnIds };
    const actions: Record<string, CellNavAction> = {
      ArrowUp: { type: 'move', direction: 'up', ...bounds },
      ArrowDown: { type: 'move', direction: 'down', ...bounds },
      ArrowLeft: { type: 'move', direction: 'left', ...bounds },
      ArrowRight: { type: 'move', direction: 'right', ...bounds },
      Tab: { type: 'tab', backwards: event.shiftKey, ...bounds },
      Escape: { type: 'escape' },
    };

    if (event.key === 'Enter') {
      if (!cell) return;
      event.preventDefault();
      editCell(cell.rowIndex, cell.columnId);
      return;
    }
    const action = actions[event.key];
    if (!action) return;

    const next = cellNavigationReducer(cell, action);
    // Tab at the last (or first) cell is not ours: it leaves the grid.
    if (action.type === 'tab' && next === cell) return;
    event.preventDefault();
    dispatch(action);
    if (next && next !== cell && (action.type === 'move' || action.type === 'tab')) revealCell(next);
  };

  return (
    // The bar floats over the scroll element, not inside it, so it stays centred on what is visible.
    <div className="tw-relative tw-h-full tw-min-h-0 tw-w-full">
      <div
        ref={scrollRef}
        role="grid"
        aria-busy={isLoading || isRefetching}
        tabIndex={0}
        aria-activedescendant={cell ? cellDomId(cell.rowIndex, visibleColumnIds.indexOf(cell.columnId)) : undefined}
        onKeyDown={handleKeyDown}
        // The open editor is anchored to its cell, so it would be left behind by a scroll.
        onScroll={() => cell?.editing && stopEditing()}
        className={cn(
          'tw-h-full tw-min-h-0 tw-w-full tw-overflow-auto tw-bg-page-weak',
          // The focus ring is on the cell once there is one.
          cell && 'tw-outline-none'
        )}
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
              cell={cell}
              onFocusCell={focusCell}
              onEditCell={editCell}
              onSaveCell={saveCell}
              onStopEditing={stopEditing}
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
