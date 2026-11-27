import React from 'react';
import type { CSSProperties } from 'react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { flexRender, type Row } from '@tanstack/react-table';
import { GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import {
  DOCKED_COLUMN_CLASS,
  DOCKED_EDGE_SHADOW_CLASS,
  DOCKED_GUTTER_CLASS,
  GUTTER_CLASS,
} from '@/pages/components/DataTable/constants';
import { useDataTableContext } from '@/pages/components/DataTable/DataTableContext';
import type { DataTableColumnMeta } from '@/pages/components/DataTable/types';

import type { DataSourceListItem } from '@/_services/types/globalDatasource.types';

// Opaque page background plus the translucent hover tint, so info columns scrolling underneath stay hidden.
const NAME_CELL_BACKGROUND_CLASS = cn(
  'tw-bg-page-weak',
  'group-hover:tw-bg-[linear-gradient(var(--interactive-hover),var(--interactive-hover))]',
  'group-has-[[data-state=open]]:tw-bg-[linear-gradient(var(--interactive-hover),var(--interactive-hover))]'
);

interface DataSourceRowProps {
  row: Row<DataSourceListItem>;
  /** Treegrid nesting level (2 = inside a folder). */
  level?: number;
  /** Positions the row when it sits inside a virtualized list. */
  className?: string;
  style?: CSSProperties;
  /** From `SortableDataSourceRow`: set only on a root pinned row while reordering is allowed. */
  rowRef?: (element: HTMLElement | null) => void;
  dragHandle?: {
    ref: (element: HTMLElement | null) => void;
    listeners: DraggableSyntheticListeners;
    attributes: DraggableAttributes;
  };
  isDragging?: boolean;
}

export default function DataSourceRow({
  row,
  level = 1,
  className,
  style,
  rowRef,
  dragHandle,
  isDragging = false,
}: DataSourceRowProps) {
  const { gridTemplateColumns } = useDataTableContext();
  const hasSelection = useDataSourcesDashboardStore((state) => Object.keys(state.rowSelection).length > 0);
  const isSelected = row.getIsSelected();

  return (
    <div
      ref={rowRef}
      role="row"
      aria-level={level}
      aria-expanded={row.getCanExpand() ? row.getIsExpanded() : undefined}
      aria-selected={isSelected}
      className={cn('tw-group tw--ml-[70px] tw-flex tw-h-10 tw-items-center', className)}
      style={style}
    >
      <div role="gridcell" className={cn(GUTTER_CLASS, 'tw-h-full tw-items-center', DOCKED_GUTTER_CLASS)}>
        {/* The dragged row keeps its hover look by matching the open-menu hover lock (as in the apps list). */}
        {isDragging && <span hidden data-state="open" />}
        {dragHandle && (
          <button
            type="button"
            ref={dragHandle.ref}
            {...dragHandle.attributes}
            {...dragHandle.listeners}
            aria-label={`Reorder ${row.original.name}`}
            className={cn(
              'tw-flex tw-size-5 tw-cursor-grab tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-0',
              'tw-opacity-0 focus-visible:tw-opacity-100 group-hover:tw-opacity-100 group-has-[[data-state=open]]:tw-opacity-100',
              'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline'
            )}
          >
            <GripVertical size={12} className="tw-text-icon-default" />
          </button>
        )}
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
        className="tw-grid tw-h-full tw-flex-1 tw-items-center tw-pr-2 group-hover:tw-bg-interactive-hover group-has-[[data-state=open]]:tw-bg-interactive-hover"
        style={{ gridTemplateColumns }}
      >
        {row.getVisibleCells().map((cell) => {
          const isDockedCell = Boolean((cell.column.columnDef.meta as DataTableColumnMeta).docked);
          return (
            <div
              key={cell.id}
              role="gridcell"
              className={cn(
                'tw-min-w-0 tw-truncate tw-font-body-default tw-text-text-placeholder',
                isDockedCell && [
                  'tw-flex tw-h-full tw-items-center tw-pl-2 tw-pr-7',
                  NAME_CELL_BACKGROUND_CLASS,
                  DOCKED_EDGE_SHADOW_CLASS,
                  DOCKED_COLUMN_CLASS,
                ]
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          );
        })}
      </div>
    </div>
  );
}
