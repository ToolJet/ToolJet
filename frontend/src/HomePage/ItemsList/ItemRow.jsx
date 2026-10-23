import React from 'react';
import { flexRender } from '@tanstack/react-table';

import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { useItemsListStore } from './store/itemsListStore';
import { GRID_TEMPLATE_COLUMNS } from './columns';

// The selection gutter (44px + 8px gap) sits in the page padding, left of the column grid, per Figma.
export const GUTTER_CLASS = 'tw-mr-2 tw-flex tw-w-11 tw-shrink-0 tw-justify-end';

// `level` is the treegrid nesting level; `className`/`style` let virtualized lists position the row.
export default function ItemRow({ row, level = 1, className, style }) {
  const hasSelection = useItemsListStore((state) => Object.keys(state.rowSelection).length > 0);
  const isSelected = row.getIsSelected();

  return (
    <div
      role="row"
      aria-level={level}
      aria-expanded={row.getCanExpand() ? row.getIsExpanded() : undefined}
      aria-selected={isSelected}
      className={cn('tw-group tw--ml-[52px] tw-flex tw-h-10 tw-items-center', className)}
      style={style}
    >
      <div role="gridcell" className={GUTTER_CLASS}>
        <span className="tw-flex tw-size-5 tw-items-center tw-justify-center">
          {/* Hidden until hover/focus while nothing is selected; opacity (not visibility) keeps it focusable. */}
          <Checkbox
            checked={isSelected}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
            aria-label={`Select ${row.original.name}`}
            className={cn(!hasSelection && 'tw-opacity-0 focus-visible:tw-opacity-100 group-hover:tw-opacity-100')}
          />
        </span>
      </div>
      <div
        className="tw-grid tw-h-full tw-min-w-0 tw-flex-1 tw-items-center tw-px-2 group-hover:tw-bg-interactive-hover"
        style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
      >
        {row.getVisibleCells().map((cell) => (
          <div key={cell.id} role="gridcell" className="tw-min-w-0 tw-font-body-default tw-text-text-placeholder">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    </div>
  );
}
