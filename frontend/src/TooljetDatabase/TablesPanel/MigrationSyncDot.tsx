import React from 'react';
import { Info } from 'lucide-react';
import { StatusDot, type StatusDotTone } from '@/components/ui/Rocket/StatusDot/StatusDot';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Rocket/Tooltip/Tooltip';

// Where a table's migrations are pending, as the server reports it (`migration_sync` on a row of the table list).
export type MigrationSync = 'pending_in_development' | 'pending_in_staging' | null;

const STATES: Record<
  NonNullable<MigrationSync>,
  { tone: StatusDotTone; title: string; body: string; dataCy: string }
> = {
  pending_in_development: {
    tone: 'warning',
    title: 'Pending in dev',
    body: 'Changes in Development are not yet applied to Staging or Production.',
    dataCy: 'sync-dot-warning',
  },
  pending_in_staging: {
    tone: 'success',
    title: 'Pending in staging',
    body: 'Changes in Development and Staging are not yet applied to Production.',
    dataCy: 'sync-dot-success',
  },
};

// The dot at the end of a table row (Figma list item, trailing dot), with the tooltip that says what it means: the
// colour alone never carries it. A fully migrated table (or one with a single environment) shows nothing.
export function MigrationSyncDot({ sync }: { sync: MigrationSync | undefined }) {
  if (!sync) return null;
  const { tone, title, body, dataCy } = STATES[sync];
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={title}
            data-cy={dataCy}
            // The hover target is a 24px-wide, row-high box: a 6px dot is too small to hit. The negative margins cancel the extra
            // size (the row has 8px gaps and 7px of vertical padding), so the dot sits where the design puts it.
            className="-tw-mx-1 -tw-my-[7px] tw-flex tw-h-8 tw-w-6 tw-shrink-0 tw-cursor-default tw-items-center tw-justify-center"
          >
            <StatusDot tone={tone} size="small" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          showArrow
          className={`${darkMode ? 'dark-theme ' : ''}tw-flex tw-flex-col tw-gap-1 tw-rounded-lg tw-bg-background-inverse tw-p-3 tw-text-text-inverse`}
        >
          <span className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap tw-font-title-default">
            <Info aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-accent" />
            {title}
          </span>
          {/* The title stays on one line; the body wraps at the design's 120px. */}
          <span className="tw-max-w-[120px] tw-font-body-default">{body}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
