import type { ReactNode } from 'react';
import type { ColumnDef, ExpandedState, OnChangeFn, Row, RowSelectionState } from '@tanstack/react-table';

export interface DataTableColumnMeta {
  /** CSS grid track shared by the header and every row, so columns stay aligned. */
  width: string;
  /** Matches `DataTableSort.field`; the header shows a direction icon and `aria-sort` for it. */
  sortField?: string;
  /** The column stays fixed on the left while the other columns scroll sideways under it. */
  docked?: boolean;
}

/** A TanStack column whose `meta` carries the layout info `DataTable` needs. */
export type DataTableColumn<T> = ColumnDef<T> & { meta: DataTableColumnMeta };

export interface DataTableSort {
  field: string;
  direction: 'asc' | 'desc';
}

/** Where a drag would land: on `side` of the row `overId`, at `toIndex` among the reorderable rows. */
export interface DropTarget {
  overId: string;
  side: 'before' | 'after';
  toIndex: number;
}

export interface DataTableReorder<T> {
  /** The page's gate (search, page, whether the whole set is loaded...). Handles show up only while true. */
  isEnabled: boolean;
  /** Which top-level rows can be dragged, e.g. `row.original.pinned`. Reorderable rows must be contiguous. */
  isRowReorderable: (row: Row<T>) => boolean;
  /** Row name used in screen-reader announcements. */
  getRowLabel: (row: Row<T>) => string;
  /** Called on drop. Indexes are positions among the reorderable rows. The page saves the new order. */
  onReorder: (move: { activeId: string; fromIndex: number; toIndex: number }) => void;
  /** Noun used in the keyboard instructions, e.g. "pinned item". */
  itemLabel?: string;
}

export interface DataTableProps<T> {
  /** Must be a stable reference (module constant or memoized). Every column needs `meta.width`. */
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (item: T) => string;
  ariaLabel: string;
  /** Stable reference. Available to cells as `table.options.meta`. */
  tableMeta?: Record<string, unknown>;
  sort?: DataTableSort;
  /** The table scrolls back to the top whenever this value changes, e.g. the current page. */
  scrollResetKey?: unknown;

  isLoading?: boolean;
  /** Shown under the header instead of the rows while `isLoading`. */
  loadingState?: ReactNode;
  /** Replaces the whole table, header included. The footer still renders. */
  emptyState?: ReactNode;

  /** Leave all three out for an uncontrolled table with no selection state held by the page. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  enableRowSelection?: boolean | ((row: Row<T>) => boolean);

  /** Passing this turns the table into a "treegrid". */
  getRowCanExpand?: (row: Row<T>) => boolean;
  expanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  /** Rendered right after an expanded row (and before its drop line). */
  renderExpandedRow?: (row: Row<T>) => ReactNode;

  /** Renders one top-level row. Give the element a `key`. */
  renderRow: (row: Row<T>) => ReactNode;
  /** Rendered after a row (and its expanded content), e.g. a divider between sections. */
  renderRowSeparator?: (row: Row<T>, nextRow: Row<T> | undefined) => ReactNode;

  reorder?: DataTableReorder<T>;

  /** Floats over the table, e.g. a selection bar. */
  overlay?: ReactNode;
  /** Below the table, e.g. pagination. */
  footer?: ReactNode;
}
