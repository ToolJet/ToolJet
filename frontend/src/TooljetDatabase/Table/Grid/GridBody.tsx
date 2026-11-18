import React from 'react';
import type { Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { GridRow } from './GridRow';
import type { GridRow as GridRowData } from './useTableGrid';

type GridBodyProps = {
  table: Table<GridRowData>;
  /** Created by the component that owns the scroll element, so it finds the element on mount. */
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  showTrailingCell: boolean;
  /** Rows are about to be replaced by a refetch. */
  dimmed?: boolean;
};

export function GridBody({ table, virtualizer, showTrailingCell, dimmed = false }: GridBodyProps) {
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
        return row ? (
          <GridRow
            key={row.id}
            row={row}
            start={item.start}
            columnSizing={columnSizing}
            columns={columns}
            showTrailingCell={showTrailingCell}
          />
        ) : null;
      })}
    </div>
  );
}
