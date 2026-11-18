import React, { type HTMLAttributes, type ReactNode } from 'react';
import { Table } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EmptyAndNoResultsVariant = 'empty' | 'no-results' | 'no-table-open';

export interface EmptyAndNoResultsStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant: EmptyAndNoResultsVariant;
  /** `default` is 360px wide, for a page or table body. `compact` is 240px, for panels, popovers and drawers. */
  size?: 'default' | 'compact';
  /** Overrides the title of the variant. */
  title?: string;
  /** Overrides the description of the variant. */
  description?: string;
  /** Hides the description line. */
  hideDescription?: boolean;
  /** The single action: a secondary Button, or a LinkButton on `no-results`. Left out, the state has none. */
  action?: ReactNode;
}

// Copy follows the TJDB prototype.
const COPY: Record<EmptyAndNoResultsVariant, { title: string; description: string }> = {
  empty: { title: 'No records yet', description: 'This table is ready. Add its first record to get started.' },
  'no-results': {
    title: 'No records match your filters',
    description: 'Try changing a condition, or clear the filters.',
  },
  'no-table-open': {
    title: 'No table open',
    description: 'Pick a table from the Database list, or open one with the plus button.',
  },
};

// Empty, no-results and no-table-open states for a table view or a panel (Figma "empty and no-results state"). It
// centres its own content and sets its own width; to centre it in a region, put it in a flex parent with
// `items-center justify-center`.
function EmptyAndNoResultsState({
  variant,
  size = 'default',
  title,
  description,
  hideDescription = false,
  action,
  className,
  ...props
}: EmptyAndNoResultsStateProps) {
  const compact = size === 'compact';
  // The design gives "no results" at the default size more room and 14px copy; every other state is 12px.
  const roomyNoResults = variant === 'no-results' && !compact;
  const copy = COPY[variant];

  return (
    <div
      className={cn(
        'tw-box-border tw-flex tw-max-w-full tw-flex-col tw-items-center tw-justify-center',
        compact ? 'tw-w-60 tw-gap-3 tw-p-4' : 'tw-w-[360px] tw-gap-4 tw-p-6',
        roomyNoResults && 'tw-gap-2 tw-px-6 tw-py-10',
        className
      )}
      {...props}
    >
      {variant === 'no-table-open' && (
        <Table aria-hidden className={cn('tw-shrink-0 tw-text-icon-default', compact ? 'tw-size-4' : 'tw-size-6')} />
      )}
      <div
        className={cn(
          'tw-flex tw-w-full tw-flex-col tw-items-center tw-text-center',
          roomyNoResults ? 'tw-gap-2' : 'tw-gap-0.5'
        )}
      >
        <p
          className={cn(
            'tw-m-0 tw-w-full tw-text-text-default',
            compact ? 'tw-font-title-default' : 'tw-font-title-large'
          )}
        >
          {title ?? copy.title}
        </p>
        {!hideDescription && (
          <p
            className={cn(
              'tw-m-0 tw-w-full tw-text-text-placeholder',
              compact ? 'tw-font-body-small' : roomyNoResults ? 'tw-font-body-large' : 'tw-font-body-default'
            )}
          >
            {description ?? copy.description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export { EmptyAndNoResultsState };
