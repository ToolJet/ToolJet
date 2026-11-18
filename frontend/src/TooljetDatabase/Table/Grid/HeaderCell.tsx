import React from 'react';
import type { Header } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  Braces,
  Calendar,
  CaseSensitive,
  KeyRound,
  Link2,
  MoreVertical,
  Square,
  Variable,
} from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import { cn } from '@/lib/utils';
import { ROW_HEIGHT, type GridColumn, type GridColumnMeta, type GridRow } from './useTableGrid';

const TYPE_ICONS = {
  integer: Variable,
  bigint: Variable,
  serial: Variable,
  'double precision': Variable,
  boolean: Square,
  'timestamp with time zone': Calendar,
  jsonb: Braces,
} as const;

const typeIcon = (dataType: string) => TYPE_ICONS[dataType as keyof typeof TYPE_ICONS] ?? CaseSensitive;

type HeaderCellProps = {
  header: Header<GridRow, unknown>;
  /** The menu button is shown only when the schema can be edited. */
  canEditSchema: boolean;
  onOpenMenu?: (column: GridColumn, anchor: HTMLElement) => void;
};

export function HeaderCell({ header, canEditSchema, onOpenMenu }: HeaderCellProps) {
  const { column } = header;
  const meta = column.columnDef.meta as GridColumnMeta;
  const name = meta.column.Header;
  const pinned = column.getIsPinned() === 'left';
  const sorted = column.getIsSorted();
  const sortCount = header.getContext().table.getState().sorting.length;
  const TypeIcon = typeIcon(meta.column.dataType);

  return (
    <div
      role="columnheader"
      data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-column-header`}
      className={cn(
        'tw-group tw-relative tw-flex tw-shrink-0 tw-items-center tw-gap-1 tw-border-0 tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-02 tw-pl-3 tw-pr-1',
        'hover:tw-bg-background-surface-layer-03',
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
        <TruncatedText as="span" content={name} className="tw-min-w-0 tw-font-title-large tw-text-text-default">
          {name}
        </TruncatedText>
        {meta.isForeignKey && (
          <Link2 role="img" aria-label="Foreign key" className="tw-size-3.5 tw-shrink-0 tw-text-icon-strong" />
        )}
        {sorted && (
          <span className="tw-flex tw-shrink-0 tw-items-center tw-gap-0.5 tw-text-icon-strong">
            {sorted === 'desc' ? (
              <ArrowDown role="img" aria-label="Sorted descending" className="tw-size-3.5" />
            ) : (
              <ArrowUp role="img" aria-label="Sorted ascending" className="tw-size-3.5" />
            )}
            {sortCount > 1 && (
              <span data-testid="sort-priority" className="tw-font-title-small tw-text-text-medium">
                {column.getSortIndex() + 1}
              </span>
            )}
          </span>
        )}
      </div>
      {canEditSchema && (
        <Button
          variant="ghost"
          size="medium"
          iconOnly
          aria-label={`${name} column options`}
          data-cy="column-menu-icon"
          className="tw-shrink-0 tw-opacity-0 focus-visible:tw-opacity-100 group-hover:tw-opacity-100 group-focus-within:tw-opacity-100"
          onClick={(event) => onOpenMenu?.(meta.column, event.currentTarget)}
        >
          <MoreVertical />
        </Button>
      )}
      {column.getCanResize() && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${name} column`}
          className="tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-w-2 tw-cursor-col-resize tw-touch-none tw-select-none"
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onDoubleClick={() => column.resetSize()}
        >
          <div
            className={cn(
              'tw-absolute tw-left-[3px] tw-top-2.5 tw-h-5 tw-w-0.5 tw-rounded-sm tw-bg-transparent group-hover:tw-bg-border-default',
              column.getIsResizing() && 'tw-bg-border-accent-strong group-hover:tw-bg-border-accent-strong'
            )}
          />
        </div>
      )}
    </div>
  );
}
