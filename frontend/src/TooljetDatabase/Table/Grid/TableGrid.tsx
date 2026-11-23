import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { Table } from '@/components/ui/Rocket/Table/Table';
import { ROCKET_SCROLLBAR } from '@/components/ui/Rocket/scrollbar';
import { TableSkeleton } from '@/components/ui/blocks/TableSkeleton';
import { selectView, useTjdbStore } from '../../_stores/tjdbStore';
import { listAllPrimaryKeyColumns } from '../../constants';
import type { CellPayload } from './cells/cellDraft';
import { patchCachedRow } from '../../rows/useTableRows';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import {
  cellDomId,
  cellNavigationReducer,
  scrollLeftToReveal,
  type CellFocus,
  type CellNavAction,
  type CellNavState,
} from './cellNavigation';
import { hasEditableKey, hasExactKeyValues, isEditableColumn, saveCellValue, toStoredValue } from './cellEditing';
import { EditRowDrawer } from './EditRowDrawer';
import { GridBody } from './GridBody';
import { GridHeader } from './GridHeader';
import { InlineAddRows } from './InlineAddRows';
import { getDeleteBlockedReason } from './deleteRows';
import { getEditBlockedReason } from './editRow';
import { SelectionBar } from './SelectionBar';
import type { SortRule } from '../../rows/rowsQuery';
import { toSortingState } from './sortState';
import { useCellNavigation } from './useCellNavigation';
import { useColumnActions } from './useColumnActions';
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
  /** Gates the add column cell and each header's menu (edit and delete column). */
  canEditSchema: boolean;
  /** Enables the row checkboxes, and with them the bulk bar. */
  canSelectRows?: boolean;
  /** Lets a cell be edited. Navigation works without it. */
  canEditCells?: boolean;
  /** Shows the add row footer, which opens an inline row at the foot of the grid. */
  canAddRows?: boolean;
  onAddColumn?: () => void;
  /** Where the grid scrolls to once its rows first render (the position this table had when it was last open). */
  initialScrollTop?: number;
  /** Called with the vertical position once scrolling pauses. */
  onScrollEnd?: (scrollTop: number) => void;
};

const SKELETON_ROWS = 10;
const MIN_SKELETON_COLUMNS = 5;
const SCROLL_END_DELAY_MS = 150;

// The table body: pinned and resizable columns, sort indicators, virtualised rows. Sort order and the rows themselves
// come from the server. Rows can be selected (to edit one or delete several), cells focused with the keyboard and
// edited in place, a row added inline, and a column edited or deleted from its header menu.
export function TableGrid({
  columns,
  rows,
  isLoading,
  isRefetching = false,
  canEditSchema,
  canSelectRows = false,
  canEditCells = false,
  canAddRows = false,
  onAddColumn,
  initialScrollTop = 0,
  onScrollEnd,
}: TableGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortFilters = useTjdbStore(
    (state: { views: Record<string, unknown> }) => selectView(state).sortFilters as Record<string, SortRule>
  );
  const sorting = useMemo(() => toSortingState(sortFilters), [sortFilters]);
  const { foreignKeys, selectedTable, organizationId } = useTooljetDatabaseContext();
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
    workspaceId: organizationId ?? undefined,
    tableId: selectedTable.id,
  });
  const primaryKeys = useMemo(() => listAllPrimaryKeyColumns(columns) as string[], [columns]);
  const deleteBlockedReason = useMemo(() => getDeleteBlockedReason(primaryKeys, columns), [primaryKeys, columns]);
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const editBlockedReason =
    selectedRows.length === 1 ? getEditBlockedReason(primaryKeys, columns, selectedRows[0]) : 'Select one row to edit';
  const [editingRow, setEditingRow] = useState<GridRow | null>(null);
  const { editColumn, deleteColumn, overlays: columnOverlays } = useColumnActions(rows);
  const { rows: tableRows } = table.getRowModel();
  const visibleColumnIds = useMemo(
    () => table.getVisibleLeafColumns().map((column) => column.id),
    // The instance is stable; what changes the visible columns is the column list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, columns]
  );
  const columnIds = useMemo(() => visibleColumnIds.filter((id) => id !== SELECT_COLUMN_ID), [visibleColumnIds]);
  const { cell: storedCell, dispatch } = useCellNavigation({ rowCount: tableRows.length, columnIds });
  // The editor belongs to a row, not to a position: a refetch under the same view can move rows (or remove one) while
  // it is open. The focused cell follows the row; a row that is gone closes the editor.
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const editingIndex = storedCell?.editing ? tableRows.findIndex((row) => row.id === editingRowId) : -1;
  const cell: CellNavState = storedCell?.editing
    ? { ...storedCell, rowIndex: editingIndex >= 0 ? editingIndex : storedCell.rowIndex, editing: editingIndex >= 0 }
    : storedCell;
  const editorRowLost = !!storedCell?.editing && editingIndex < 0;
  useEffect(() => {
    if (editorRowLost) dispatch({ type: 'stopEditing' });
  }, [editorRowLost, dispatch]);

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
    // The sticky header (and the add row footer, and the new row above it while there is one) cover rows the
    // virtualizer counts as visible.
    scrollPaddingEnd: ROW_HEIGHT * (canAddRows ? 3 : 1),
  });

  // The handlers below are passed to memoised rows, so they stay the same functions and read what they need from here.
  const columnsByName = useMemo(() => new Map(columns.map((column) => [column.accessor, column])), [columns]);
  const canEdit = canEditCells && hasEditableKey(primaryKeys, columns);
  const latest = useRef({ tableRows, columnsByName, primaryKeys, canEdit, cell, editingRowId });
  latest.current = { tableRows, columnsByName, primaryKeys, canEdit, cell, editingRowId };
  const savingRef = useRef(false);

  // The id cell's expand button: the row opens in the edit drawer, under the same rules as the bar's Edit.
  const openRow = useCallback((rowId: string) => {
    const row = latest.current.tableRows.find((tableRow) => tableRow.id === rowId);
    if (row) setEditingRow(row.original);
  }, []);
  const getOpenBlockedReason = useCallback(
    (row: GridRow) => getEditBlockedReason(primaryKeys, columns, row),
    [primaryKeys, columns]
  );

  const focusGrid = useCallback(() => scrollRef.current?.focus({ preventScroll: true }), []);

  const focusCell = useCallback(
    (rowIndex: number, columnId: string) => {
      dispatch({ type: 'focus', rowIndex, columnId });
      focusGrid();
    },
    [dispatch, focusGrid]
  );

  const stopEditing = useCallback(() => {
    // The stored cell can still hold the row's old position: land on where the row is now.
    const open = latest.current.cell;
    if (open?.editing) dispatch({ type: 'focus', rowIndex: open.rowIndex, columnId: open.columnId });
    dispatch({ type: 'stopEditing' });
    focusGrid();
  }, [dispatch, focusGrid]);

  // Restored once, when this table's first rows are on screen: before that the scroll area has no height to scroll.
  // Not while the view is still another table's: the rows on screen can be a cached page of a different view, which
  // would clamp the position, and the clamped one would then be reported over the saved one.
  const viewIsForTable = useTjdbStore(
    (state: { viewTableId: string | null }) => state.viewTableId === selectedTable.id
  );
  const scrollRestored = useRef(false);
  const hasRows = viewIsForTable && !isLoading && tableRows.length > 0;
  useLayoutEffect(() => {
    if (!hasRows || scrollRestored.current) return;
    scrollRestored.current = true;
    if (scrollRef.current && initialScrollTop > 0) scrollRef.current.scrollTop = initialScrollTop;
    // The position is read once; later changes of it are this grid's own reports.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRows]);

  const scrollEndTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(scrollEndTimer.current), []);
  const handleScroll = () => {
    // The open editor is anchored to its cell, so it would be left behind by a scroll.
    if (cell?.editing) stopEditing();
    if (!onScrollEnd || !viewIsForTable) return;
    clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => onScrollEnd(scrollRef.current?.scrollTop ?? 0), SCROLL_END_DELAY_MS);
  };

  const saveCell = useCallback(
    async (rowId: string, columnId: string, payload: CellPayload) => {
      const row = latest.current.tableRows.find((candidate) => candidate.id === rowId)?.original;
      const column = latest.current.columnsByName.get(columnId);
      const tableId = selectedTable.id;
      if (!column || !tableId || savingRef.current) return false;
      if (!row) {
        toast.error('This row is no longer in the table');
        stopEditing();
        return false;
      }

      savingRef.current = true;
      try {
        const saved = await saveCellValue({
          tableId,
          tableName: selectedTable.table_name ?? '',
          primaryKeys,
          row,
          columnName: columnId,
          payload,
          organizationId,
          environmentId,
        });
        if (!saved) return false;
        // Written into the cache instead of refetching, so the row keeps its place even under a sort on this column.
        patchCachedRow(
          queryClient,
          { environmentId, tableId },
          (cached) => primaryKeys.every((key) => cached[key] === row[key]),
          { [columnId]: toStoredValue(column.dataType, saved.stored) }
        );
        // The save can resolve after the editor was closed and another opened: only close the one that finished.
        const { cell: open, editingRowId: openRowId } = latest.current;
        if (open?.editing && openRowId === rowId && open.columnId === columnId) stopEditing();
        return true;
      } finally {
        savingRef.current = false;
      }
    },
    [selectedTable.id, selectedTable.table_name, primaryKeys, queryClient, environmentId, organizationId, stopEditing]
  );

  const editCell = useCallback(
    (rowIndex: number, columnId: string) => {
      const { tableRows: rows, columnsByName, primaryKeys: keys, canEdit: allowed } = latest.current;
      const gridRow = rows[rowIndex];
      const row = gridRow?.original;
      const column = columnsByName.get(columnId);
      if (!allowed || !row || !column || !isEditableColumn(column) || !hasExactKeyValues(keys, row)) return;

      setEditingRowId(gridRow.id);
      dispatch({ type: 'focus', rowIndex, columnId });
      dispatch({ type: 'startEditing' });
    },
    [dispatch]
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
        onScroll={handleScroll}
        className={cn(
          'tw-h-full tw-min-h-0 tw-w-full tw-overflow-auto tw-bg-page-weak',
          ROCKET_SCROLLBAR,
          // The grid also scrolls sideways: the same bar along the bottom, with a clear corner.
          '[&::-webkit-scrollbar]:tw-h-[10px] [&::-webkit-scrollbar-corner]:tw-bg-transparent',
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
            onEditColumn={editColumn}
            onDeleteColumn={deleteColumn}
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
              onOpenRow={openRow}
              getOpenBlockedReason={getOpenBlockedReason}
            />
          )}
          {canAddRows && <InlineAddRows table={table} showTrailingCell={canEditSchema} />}
        </div>
      </div>
      <SelectionBar
        rows={selectedRows}
        primaryKeys={primaryKeys}
        canSelectRows={canSelectRows}
        deleteBlockedReason={deleteBlockedReason}
        onEdit={() => setEditingRow(selectedRows[0])}
        editBlockedReason={editBlockedReason}
        onClear={clearSelection}
      />
      {canSelectRows && (
        <EditRowDrawer row={editingRow} onClose={() => setEditingRow(null)} onEdited={() => setEditingRow(null)} />
      )}
      {canEditSchema && columnOverlays}
    </div>
  );
}
