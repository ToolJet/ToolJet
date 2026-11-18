import React, { memo } from 'react';
import type { Column, ColumnSizingState, Row } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { cn } from '@/lib/utils';
import { CellContent } from './cells/CellContent';
import { isNumericType } from './cells/dataTypes';
import {
  ADD_COLUMN_WIDTH,
  ROW_HEIGHT,
  SELECT_COLUMN_ID,
  type GridColumnMeta,
  type GridRow as GridRowData,
} from './useTableGrid';

type GridRowProps = {
  row: Row<GridRowData>;
  /** Pixels from the top of the body. */
  start: number;
  /** Not read: a new object on every resize is what re-renders this memoised row at the new widths. */
  columnSizing: ColumnSizingState;
  /** Not read either: the row object outlives a column change (metadata arriving after the rows), so this is what
   * re-renders a mounted row with the new columns. */
  columns: Column<GridRowData>[];
  showTrailingCell: boolean;
};

// The Cypress hook the previous grid had: id-<row id>-column-<column>-table-cell, lower-cased.
const cellDataCy = (row: Row<GridRowData>, columnId: string) =>
  `id-${row.original.id}-column-${columnId}-table-cell`.toLowerCase().replace(/\s+/g, '-');

function GridRowComponent({ row, start, showTrailingCell }: GridRowProps) {
  return (
    <div
      role="row"
      data-testid={`grid-row-${row.id}`}
      className="tw-absolute tw-left-0 tw-top-0 tw-flex tw-w-full"
      style={{ height: ROW_HEIGHT, transform: `translateY(${start}px)` }}
    >
      {row.getVisibleCells().map((cell) => {
        const { column } = cell;
        const pinned = column.getIsPinned() === 'left';
        const meta = column.columnDef.meta as GridColumnMeta | undefined;
        const isSelect = column.id === SELECT_COLUMN_ID;
        return (
          <div
            key={cell.id}
            role="gridcell"
            data-cy={cellDataCy(row, column.id)}
            className={cn(
              'tw-flex tw-shrink-0 tw-items-center tw-overflow-hidden tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-bg-page-weak',
              'tw-font-body-large',
              isSelect ? 'tw-pl-4' : 'tw-px-3',
              pinned && 'tw-sticky tw-z-10',
              column.getIsLastColumn('left') && 'tw-border-r',
              meta && isNumericType(meta.column.dataType) && 'tw-justify-end'
            )}
            style={{ width: column.getSize(), height: ROW_HEIGHT, left: pinned ? column.getStart('left') : undefined }}
          >
            {isSelect ? (
              <Checkbox disabled aria-label="Select row" />
            ) : (
              meta && <CellContent value={cell.getValue()} isPrimaryKey={meta.isPrimaryKey} />
            )}
          </div>
        );
      })}
      <div className="tw-h-10 tw-min-w-0 tw-flex-1 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak" />
      {showTrailingCell && (
        <div
          className="tw-sticky tw-right-0 tw-z-10 tw-h-10 tw-shrink-0 tw-border-0 tw-border-b tw-border-l tw-border-solid tw-border-border-weak tw-bg-page-weak"
          style={{ width: ADD_COLUMN_WIDTH }}
        />
      )}
    </div>
  );
}

export const GridRow = memo(GridRowComponent);
