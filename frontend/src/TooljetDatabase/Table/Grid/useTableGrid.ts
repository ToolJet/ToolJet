import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { listAllPrimaryKeyColumns } from '../../constants';
import { readColumnWidths, writeColumnWidths } from './columnWidths';

// A column as tjdbStore.fetchTableMetadata returns it.
export type GridColumn = {
  Header: string;
  accessor: string;
  dataType: string;
  constraints_type?: { is_primary_key?: boolean; is_not_null?: boolean };
  /** The column's SQL default, as the table metadata returns it. */
  column_default?: string | null;
  /** Display text for a value, when the stored value is not what the cell should read (time zones). */
  formatValue?: (value: unknown) => string;
};
export type GridRow = Record<string, unknown>;
/** The column a single-column foreign key points at: where the cell editor reads its values. */
export type ForeignKeyTarget = { tableId: string; column: string };
export type GridColumnMeta = {
  column: GridColumn;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKey?: ForeignKeyTarget;
};

export const SELECT_COLUMN_ID = 'select';
export const SELECT_COLUMN_WIDTH = 40;
export const PINNED_COLUMN_WIDTH = 120;
export const DEFAULT_COLUMN_WIDTH = 200;
export const MIN_COLUMN_WIDTH = 80;
export const ROW_HEIGHT = 40;
export const ADD_COLUMN_WIDTH = 45;

const EMPTY_PINNING = { left: [SELECT_COLUMN_ID] };

type UseTableGridArgs = {
  columns: GridColumn[];
  rows: GridRow[];
  foreignKeyColumns: ReadonlySet<string>;
  foreignKeyTargets: ReadonlyMap<string, ForeignKeyTarget>;
  sorting: SortingState;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  canSelectRows: boolean;
  /** Where widths are remembered (per workspace and table); without both ids they are not. */
  workspaceId?: string;
  tableId?: string;
};

// Headless: the TanStack instance and nothing that renders. The first primary key column is pinned after the
// checkbox column; sorting is display-only, so the server's order is what the rows already are. Selection is controlled
// by the caller, keyed by row id (the primary key values).
export const useTableGrid = ({
  columns,
  rows,
  foreignKeyColumns,
  foreignKeyTargets,
  sorting,
  rowSelection,
  onRowSelectionChange,
  canSelectRows,
  workspaceId,
  tableId,
}: UseTableGridArgs) => {
  // Read once: the grid mounts per table. A saved width for a column the table no longer has is never looked up.
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
    workspaceId && tableId ? readColumnWidths(workspaceId, tableId) : {}
  );

  const primaryKeys = useMemo(() => listAllPrimaryKeyColumns(columns) as string[], [columns]);
  const pinnedKey = primaryKeys[0];

  const columnDefs = useMemo<ColumnDef<GridRow>[]>(
    () => [
      {
        id: SELECT_COLUMN_ID,
        size: SELECT_COLUMN_WIDTH,
        minSize: SELECT_COLUMN_WIDTH,
        maxSize: SELECT_COLUMN_WIDTH,
        enableResizing: false,
      },
      ...columns.map((column): ColumnDef<GridRow> => {
        const meta: GridColumnMeta = {
          column,
          isPrimaryKey: primaryKeys.includes(column.accessor),
          isForeignKey: foreignKeyColumns.has(column.accessor),
          foreignKey: foreignKeyTargets.get(column.accessor),
        };
        return {
          id: column.accessor,
          // accessorFn, not accessorKey: a column name with a dot would be read as a nested path.
          accessorFn: (row) => row[column.accessor],
          header: column.Header,
          size: column.accessor === pinnedKey ? PINNED_COLUMN_WIDTH : DEFAULT_COLUMN_WIDTH,
          minSize: MIN_COLUMN_WIDTH,
          meta,
        };
      }),
    ],
    [columns, primaryKeys, pinnedKey, foreignKeyColumns, foreignKeyTargets]
  );

  const columnPinning = useMemo(
    () => (pinnedKey ? { left: [SELECT_COLUMN_ID, pinnedKey] } : EMPTY_PINNING),
    [pinnedKey]
  );

  // Composite keys exist, so the id is every key value. Without a key there is nothing stable to use, and rows can
  // briefly arrive before the columns of their table (a switch to a cached table): their key values are undefined.
  const getRowId = useCallback(
    (row: GridRow, index: number) =>
      primaryKeys.length > 0 && primaryKeys.every((key) => row[key] !== undefined)
        ? primaryKeys.map((key) => String(row[key])).join('\u0000')
        : String(index),
    [primaryKeys]
  );

  // TanStack rebuilds the row model only when `data` changes, not when getRowId does. A new array when the keys
  // change gives rows their real ids once the columns arrive.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => rows.slice(), [rows, getRowId]);

  const instance = useReactTable<GridRow>({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    manualSorting: true,
    enableColumnPinning: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableRowSelection: canSelectRows,
    state: { sorting, columnSizing, columnPinning, rowSelection },
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange,
  });

  // Saved when a resize ends (or a width is reset), never while the handle is moving.
  const isResizing = !!instance.getState().columnSizingInfo.isResizingColumn;
  const savedSizing = useRef(columnSizing);
  useEffect(() => {
    if (isResizing || savedSizing.current === columnSizing) return;
    savedSizing.current = columnSizing;
    if (workspaceId && tableId) {
      writeColumnWidths(
        workspaceId,
        tableId,
        columnSizing,
        columns.map((column) => column.accessor)
      );
    }
    // Only a change of sizing or the end of a resize saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSizing, isResizing]);

  return instance;
};
