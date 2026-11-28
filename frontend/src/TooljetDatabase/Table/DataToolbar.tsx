import React, { type ReactNode } from 'react';
import { ChevronDown, History } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { LinkButton } from '@/components/ui/Rocket/LinkButton/LinkButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import { Tag, tagVariants } from '@/components/ui/Rocket/Tag/Tag';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import { splitFilters, type ToolbarFilter } from './dataToolbarFilters';

export interface DataToolbarProps {
  title: string;
  filters?: ToolbarFilter[];
  /** Chips shown before the rest collapse into a "+N more" popover. */
  maxVisibleFilters?: number;
  onRemoveFilter: (id: string) => void;
  onClearFilters: () => void;
  /** The Filter and Sort triggers (with their own popovers) sit right after the chips. */
  filterControl: ReactNode;
  sortControl: ReactNode;
  onOpenHistory: () => void;
  /** The "Add data" button, wrapped in its menu by the caller. */
  addData: ReactNode;
  className?: string;
}

// The one-row bar above the grid: table name on the left, filter chips and the table's actions on the right.
export function DataToolbar({
  title,
  filters = [],
  maxVisibleFilters = 2,
  onRemoveFilter,
  onClearFilters,
  filterControl,
  sortControl,
  onOpenHistory,
  addData,
  className,
}: DataToolbarProps) {
  const { visible, overflow } = splitFilters(filters, maxVisibleFilters);

  const chip = (filter: ToolbarFilter) => (
    <Tag
      key={filter.id}
      variant="outline"
      removable
      removeLabel={`Remove ${filter.label}`}
      onRemove={() => onRemoveFilter(filter.id)}
      className="tw-max-w-60"
      data-cy={`filter-chip-${filter.id}`}
    >
      {/* Values are typed by the user, so a long one is cut off here and shown in full in a tooltip. */}
      <TruncatedText as="span" content={filter.label} className="tw-block tw-truncate">
        {filter.label}
      </TruncatedText>
    </Tag>
  );

  return (
    <div
      className={cn(
        'tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-gap-2 tw-overflow-hidden tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-bg-page-weak tw-px-4 tw-py-2',
        className
      )}
      data-cy="data-toolbar"
    >
      <TruncatedText
        as="p"
        content={title}
        className="tw-m-0 tw-min-w-24 tw-flex-1 tw-font-title-large tw-text-text-default"
        data-cy="data-toolbar-table-name"
      >
        {title}
      </TruncatedText>

      {filters.length > 0 && (
        <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2" data-cy="filter-chips">
          {visible.map(chip)}
          {overflow.length > 0 && (
            <Popover>
              {/* The trigger carries Radix's aria and ref, which Tag does not forward, so it wears Tag's look instead. */}
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    tagVariants({ variant: 'outline', interactive: true }),
                    'tw-cursor-pointer tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline'
                  )}
                >
                  {`+${overflow.length} more`}
                  <ChevronDown aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="tw-w-60" data-cy="more-filters">
                <div className="tw-flex tw-flex-col tw-items-start tw-gap-2">{overflow.map(chip)}</div>
              </PopoverContent>
            </Popover>
          )}
          <LinkButton onClick={onClearFilters} data-cy="clear-all-filters">
            Clear all filters
          </LinkButton>
        </div>
      )}

      <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-1">
        {filterControl}
        {sortControl}
      </div>
      <div aria-hidden className="tw-h-4 tw-w-px tw-shrink-0 tw-bg-border-weak" />
      <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
        <Tooltip content="Migration history">
          <Button
            variant="ghost"
            size="medium"
            iconOnly
            aria-label="Migration history"
            data-cy="migration-history-button"
            onClick={onOpenHistory}
          >
            <History />
          </Button>
        </Tooltip>
        {addData}
      </div>
    </div>
  );
}
