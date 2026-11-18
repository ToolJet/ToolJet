import React from 'react';
import type { Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import type { CellNavState } from './cellNavigation';
import { GridRow } from './GridRow';
import type { GridRow as GridRowData } from './useTableGrid';

type GridBodyProps = {
  table: Table<GridRowData>;
  /** Created by the component that owns the scroll element, so it finds the element on mount. */
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  showTrailingCell: boolean;
  canSelectRows: boolean;
  /** Rows are about to be replaced by a refetch. */
  dimmed?: boolean;
  /** The focused cell. Each row gets only the part of it that concerns the row. */
  cell: CellNavState;
  onFocusCell: (rowIndex: number, columnId: string) => void;
  onEditCell: (rowIndex: number, columnId: string) => void;
  onSaveCell: (rowIndex: number, columnId: string, value: string | null) => Promise<boolean>;
  onStopEditing: () => void;
};

export function GridBody({
  table,
  virtualizer,
  showTrailingCell,
  canSelectRows,
  dimmed = false,
  cell,
  onFocusCell,
  onEditCell,
  onSaveCell,
  onStopEditing,
}: GridBodyProps) {
  const { rows } = table.getRowModel();
  const { columnSizing } = table.getState();
  const columns = table.getVisibleLeafColumns();

  return (
    <div
      role="rowgroup"
      className={cn('tw-relative tw-w-full tw-transition-opacity', dimmed && 'tw-opacity-60')}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((item) => {
        const row = rows[item.index];
        const focusedHere = cell?.rowIndex === item.index;
        return row ? (
          <GridRow
            key={row.id}
            row={row}
            start={item.start}
            columnSizing={columnSizing}
            columns={columns}
            showTrailingCell={showTrailingCell}
            isSelected={row.getIsSelected()}
            canSelect={canSelectRows}
            focusedColumnId={focusedHere ? cell.columnId : null}
            isEditing={focusedHere && cell.editing}
            onFocusCell={onFocusCell}
            onEditCell={onEditCell}
            onSaveCell={onSaveCell}
            onStopEditing={onStopEditing}
          />
        ) : null;
      })}
    </div>
  );
}
