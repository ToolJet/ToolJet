import React from 'react';
import type { Header } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, KeyRound, Link2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import { cn } from '@/lib/utils';
import { dataTypeIcon } from '../../dataTypeIcons';
import { ROW_HEIGHT, type GridColumn, type GridColumnMeta, type GridRow } from './useTableGrid';

type HeaderCellProps = {
  header: Header<GridRow, unknown>;
  /** The menu button is shown only when the schema can be edited. */
  canEditSchema: boolean;
  onEditColumn?: (column: GridColumn) => void;
  onDeleteColumn?: (column: GridColumn) => void;
};

export function HeaderCell({ header, canEditSchema, onEditColumn, onDeleteColumn }: HeaderCellProps) {
  const { column } = header;
  const meta = column.columnDef.meta as GridColumnMeta;
  const name = meta.column.Header;
  const pinned = column.getIsPinned() === 'left';
  const sorted = column.getIsSorted();
  const sortCount = header.getContext().table.getState().sorting.length;
  const TypeIcon = dataTypeIcon(meta.column.dataType);

  const resizing = column.getIsResizing();

  return (
    <div
      role="columnheader"
      data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-column-header`}
      className={cn(
        'tw-group tw-relative tw-flex tw-shrink-0 tw-items-center tw-gap-1 tw-border-0 tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-02 tw-pl-3 tw-pr-1',
        'hover:tw-bg-background-surface-layer-03 focus-within:tw-bg-background-surface-layer-03',
        resizing && 'tw-bg-background-surface-layer-03',
        pinned && 'tw-sticky tw-z-30',
        column.getIsLastColumn('left') && 'tw-border-r'
      )}
      style={{ width: header.getSize(), height: ROW_HEIGHT, left: pinned ? column.getStart('left') : undefined }}
    >
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-1.5">
        {meta.isPrimaryKey ? (
          <KeyRound role="img" aria-label="Primary key" className="tw-size-4 tw-shrink-0 tw-text-icon-strong" />
        ) : (
          <TypeIcon aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-strong" />
        )}
        <TruncatedText
          as="span"
          content={name}
          className="tw-min-w-0 tw-flex-1 tw-font-title-large tw-text-text-default"
        >
          {name}
        </TruncatedText>
        {meta.isForeignKey && (
          <Link2 role="img" aria-label="Foreign key" className="tw-size-3.5 tw-shrink-0 tw-text-icon-strong" />
        )}
      </div>
      {sorted && (
        <span className="tw-flex tw-shrink-0 tw-items-center tw-gap-0.5 tw-pl-1 tw-text-icon-strong">
          {sorted === 'desc' ? (
            <ArrowDown role="img" aria-label="Sorted descending" className="tw-size-4" />
          ) : (
            <ArrowUp role="img" aria-label="Sorted ascending" className="tw-size-4" />
          )}
          {sortCount > 1 && (
            <span data-testid="sort-priority" className="tw-font-title-small tw-text-text-medium">
              {column.getSortIndex() + 1}
            </span>
          )}
        </span>
      )}
      {canEditSchema && (
        <DropdownMenu
          align="end"
          sections={[
            {
              id: 'column',
              items: [
                {
                  id: 'edit',
                  label: 'Edit column',
                  icon: <Pencil />,
                  onSelect: () => onEditColumn?.(meta.column),
                  'data-cy': 'edit-column-option',
                },
                {
                  id: 'delete',
                  label: 'Delete column',
                  icon: <Trash2 />,
                  destructive: true,
                  // A table keeps its primary key.
                  disabled: meta.isPrimaryKey,
                  wrapper: (item) => (
                    <span title={meta.isPrimaryKey ? 'Primary key columns cannot be deleted' : undefined}>{item}</span>
                  ),
                  onSelect: () => onDeleteColumn?.(meta.column),
                  'data-cy': 'delete-column-option',
                },
              ],
            },
          ]}
          trigger={
            <Button
              variant="ghost"
              size="medium"
              iconOnly
              aria-label={`${name} column options`}
              data-cy="column-menu-icon"
              // Out of the layout at rest (so a sort arrow sits at the cell's edge), in it on hover, focus, resize and
              // while its menu is open.
              className={cn(
                'tw-w-0 -tw-ml-1 tw-shrink-0 tw-overflow-hidden tw-opacity-0',
                'group-hover:tw-ml-0 group-hover:tw-w-7 group-hover:tw-opacity-100',
                'group-focus-within:tw-ml-0 group-focus-within:tw-w-7 group-focus-within:tw-opacity-100',
                'data-[state=open]:tw-ml-0 data-[state=open]:tw-w-7 data-[state=open]:tw-opacity-100',
                resizing && 'tw-ml-0 tw-w-7 tw-opacity-100'
              )}
            >
              <MoreVertical />
            </Button>
          }
        />
      )}
      {column.getCanResize() && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${name} column`}
          className={cn(
            'tw-absolute tw-bottom-0 tw-top-0 tw-w-2 tw-cursor-col-resize tw-touch-none tw-select-none',
            // The pinned column's right border takes 1px of the box, so its handle sits that far out.
            column.getIsLastColumn('left') ? '-tw-right-px' : 'tw-right-0'
          )}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onDoubleClick={() => column.resetSize()}
        >
          <div
            className={cn(
              'tw-absolute tw-left-[3px] tw-top-2.5 tw-h-5 tw-w-0.5 tw-rounded-sm tw-bg-transparent group-hover:tw-bg-border-default',
              resizing && 'tw-bg-border-accent-strong group-hover:tw-bg-border-accent-strong'
            )}
          />
        </div>
      )}
    </div>
  );
}
