import React from 'react';
import type { Table } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { HeaderCell } from './HeaderCell';
import {
  ADD_COLUMN_WIDTH,
  ROW_HEIGHT,
  SELECT_COLUMN_ID,
  SELECT_COLUMN_WIDTH,
  type GridColumn,
  type GridRow,
} from './useTableGrid';

type GridHeaderProps = {
  table: Table<GridRow>;
  canEditSchema: boolean;
  canSelectRows: boolean;
  onAddColumn?: () => void;
  onOpenColumnMenu?: (column: GridColumn, anchor: HTMLElement) => void;
};

export function GridHeader({ table, canEditSchema, canSelectRows, onAddColumn, onOpenColumnMenu }: GridHeaderProps) {
  const [headerGroup] = table.getHeaderGroups();
  // Counted from the rows on screen, not from the selection state, which can still hold ids a refetch removed.
  const rowCount = table.getRowModel().rows.length;
  const selectedCount = table.getSelectedRowModel().rows.length;
  const allSelected = rowCount > 0 && selectedCount === rowCount;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <div role="row" className="tw-sticky tw-top-0 tw-z-20 tw-flex tw-w-full" style={{ height: ROW_HEIGHT }}>
      {headerGroup.headers.map((header) =>
        header.column.id === SELECT_COLUMN_ID ? (
          <div
            key={header.id}
            role="columnheader"
            className="tw-sticky tw-left-0 tw-z-30 tw-flex tw-shrink-0 tw-items-center tw-bg-background-surface-layer-02 tw-pl-4"
            style={{ width: SELECT_COLUMN_WIDTH, height: ROW_HEIGHT }}
          >
            <Checkbox
              aria-label="Select all rows"
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              disabled={!canSelectRows || rowCount === 0}
              // Partly selected clears, like a mail list: Radix would report `true` and select the rest.
              onCheckedChange={() => table.toggleAllRowsSelected(!allSelected && !someSelected)}
            />
          </div>
        ) : (
          <HeaderCell key={header.id} header={header} canEditSchema={canEditSchema} onOpenMenu={onOpenColumnMenu} />
        )
      )}
      <div className="tw-min-w-0 tw-flex-1 tw-bg-background-surface-layer-02" />
      {canEditSchema && (
        <div
          role="columnheader"
          className="tw-sticky tw-right-0 tw-z-30 tw-flex tw-shrink-0 tw-items-center tw-border-0 tw-border-l tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-02 tw-px-2"
          style={{ width: ADD_COLUMN_WIDTH, height: ROW_HEIGHT }}
        >
          <Button variant="ghost" size="medium" iconOnly aria-label="Add column" onClick={onAddColumn}>
            <Plus />
          </Button>
        </div>
      )}
    </div>
  );
}
