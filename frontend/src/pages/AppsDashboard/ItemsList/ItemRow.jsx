import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { useItemsListStore } from './store/itemsListStore';
import { GRID_TEMPLATE_COLUMNS } from './columns';

// The selection gutter fills the list's 70px side padding (checkbox right-aligned, as in Figma), so when
// docked it also covers columns scrolling under the padding.
export const GUTTER_CLASS = 'tw-flex tw-gap-1 tw-w-[70px] tw-shrink-0 tw-justify-end tw-pr-2';

// Sticky offsets are measured from the list scroller's content edge (inside its padding): the gutter docks
// across the padding, the name at the content edge.
export const DOCKED_GUTTER_CLASS = 'tw-sticky tw--left-[70px] tw-z-[1] tw-bg-page-weak';
const DOCKED_NAME_CLASS = 'tw-sticky tw-left-0 tw-z-[1]';

// Folder rows can't use `sticky` (their own scroll box is the nearest scroller); see itemsList.scss.
const OFFSET_DOCKED_GUTTER_CLASS = 'items-list-offset-docked tw-relative tw-z-[1] tw-bg-page-weak';
const OFFSET_DOCKED_NAME_CLASS = 'items-list-offset-docked tw-relative tw-z-[1]';

// Opaque page background plus the translucent hover tint, so info columns scrolling underneath stay hidden.
const NAME_CELL_BACKGROUND_CLASS = cn(
  'tw-bg-page-weak',
  'group-hover:tw-bg-[linear-gradient(var(--interactive-hover),var(--interactive-hover))]',
  'group-has-[[data-state=open]]:tw-bg-[linear-gradient(var(--interactive-hover),var(--interactive-hover))]'
);
// Figma 3352-14623: 10px edge shadow, shown only while the list is scrolled sideways.
export const DOCKED_EDGE_SHADOW_CLASS = cn(
  "after:tw-pointer-events-none after:tw-absolute after:tw-inset-y-0 after:tw-left-full after:tw-hidden after:tw-w-2.5 after:tw-content-['']",
  'after:tw-bg-gradient-to-r after:tw-from-docked-column-shadow after:tw-to-transparent',
  'group-data-[scrolled-x]/list:after:tw-block'
);

// `level` is the treegrid nesting level (2 = inside a folder); `className`/`style` let virtualized lists position the row.
export default function ItemRow({ row, level = 1, className, style }) {
  const hasSelection = useItemsListStore((state) => Object.keys(state.rowSelection).length > 0);
  const isSelected = row.getIsSelected();
  const isInFolderScrollBox = level > 1;
  const canReorder = row.original.pinned;

  return (
    <div
      role="row"
      aria-level={level}
      aria-expanded={row.getCanExpand() ? row.getIsExpanded() : undefined}
      aria-selected={isSelected}
      className={cn('tw-group tw--ml-[70px] tw-flex tw-h-10 tw-items-center', className)}
      style={style}
    >
      <div
        role="gridcell"
        className={cn(
          GUTTER_CLASS,
          'tw-h-full tw-items-center',
          isInFolderScrollBox ? OFFSET_DOCKED_GUTTER_CLASS : DOCKED_GUTTER_CLASS
        )}
      >
        {/* Figma 1339-125228. Drag-and-drop is not wired yet; this is the handle's placeholder. */}
        {canReorder && (
          <span
            aria-hidden
            className="tw-flex tw-size-5 tw-cursor-grab tw-items-center tw-justify-center tw-opacity-0 group-hover:tw-opacity-100 group-has-[[data-state=open]]:tw-opacity-100"
          >
            <GripVertical size={12} className="tw-text-icon-default" />
          </span>
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
        style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
      >
        {row.getVisibleCells().map((cell) => {
          const isNameCell = cell.column.id === 'name';
          return (
            <div
              key={cell.id}
              role="gridcell"
              className={cn(
                'tw-min-w-0 tw-font-body-default tw-text-text-placeholder',
                isNameCell && [
                  'tw-flex tw-h-full tw-items-center tw-pl-2 tw-pr-7',
                  NAME_CELL_BACKGROUND_CLASS,
                  DOCKED_EDGE_SHADOW_CLASS,
                  isInFolderScrollBox ? OFFSET_DOCKED_NAME_CLASS : DOCKED_NAME_CLASS,
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
