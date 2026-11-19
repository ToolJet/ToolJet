import React from 'react';
import { CodeXml } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Tag } from '@/components/ui/Rocket/Tag/Tag';
import { cn } from '@/lib/utils';

export interface MigrationTimelineItemProps {
  number: string;
  title: string;
  /** A line under the title, when the server sends one (a baseline row carries a derived one). */
  description?: string | null;
  date: string;
  sql: string | null;
  /** Whether the environment on screen has run this migration. */
  applied: boolean;
  /** The newest migration of the table's chain. */
  latest: boolean;
  /** "Staging is here": set on the migration an environment that is behind has reached. */
  hereLabel: string | null;
  expanded: boolean;
  onToggleSql: () => void;
  /** The oldest row has nothing below it to join to. */
  last?: boolean;
}

type ItemState = 'rest' | 'latest' | 'here' | 'unapplied';

const stateOf = ({ applied, latest, hereLabel }: MigrationTimelineItemProps): ItemState => {
  if (!applied) return 'unapplied';
  if (hereLabel) return 'here';
  return latest ? 'latest' : 'rest';
};

const DOT_HALO: Record<ItemState, string> = {
  rest: 'tw-bg-interactive-default',
  unapplied: 'tw-bg-interactive-default',
  latest: 'tw-bg-background-accent-weak',
  here: 'tw-bg-background-warning-weak',
};
const DOT_CORE: Record<ItemState, string> = {
  rest: 'tw-bg-icon-default',
  unapplied: 'tw-bg-icon-default',
  latest: 'tw-bg-icon-accent',
  here: 'tw-bg-icon-warning',
};

// One row of the history drawer's timeline (Figma Migration history item): a dot on a dashed rail, the number with
// its tags, the title and date, and a button that opens the SQL under them. An environment that has not run the
// migration reads as disabled.
export function MigrationTimelineItem(props: MigrationTimelineItemProps) {
  const {
    number,
    title,
    description,
    date,
    sql,
    applied,
    latest,
    hereLabel,
    expanded,
    onToggleSql,
    last = false,
  } = props;
  const state = stateOf(props);

  return (
    <div
      data-testid="migration-timeline-item"
      data-cy="migration-history-row"
      data-state={state}
      data-expanded={expanded}
      className="tw-relative tw-flex tw-items-start tw-justify-between tw-gap-3 tw-pb-5 tw-pl-7"
    >
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0.5">
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className={cn('tw-font-body-large', applied ? 'tw-text-text-default' : 'tw-text-text-disabled')}>
            {number}
          </span>
          {latest && <Tag variant={applied ? 'background' : 'neutral'}>Latest</Tag>}
          {hereLabel && <Tag variant="warning">{hereLabel}</Tag>}
        </div>
        <p
          className={cn(
            'tw-m-0 tw-break-words tw-font-body-default',
            applied ? 'tw-text-text-default' : 'tw-text-text-disabled'
          )}
        >
          {title}
        </p>
        {description && (
          <p
            className={cn('tw-m-0 tw-font-body-small', applied ? 'tw-text-text-medium' : 'tw-text-text-disabled')}
            data-testid="migration-timeline-item-description"
          >
            {description}
          </p>
        )}
        <p className={cn('tw-m-0 tw-font-body-small', applied ? 'tw-text-text-placeholder' : 'tw-text-text-disabled')}>
          {date}
        </p>
        {expanded && (
          <pre
            className="tw-mb-0 tw-mt-1.5 tw-w-full tw-overflow-x-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-md tw-border-0 tw-bg-background-surface-layer-02 tw-px-3 tw-py-2 tw-font-code-regular tw-text-text-default"
            data-cy="migration-history-sql-view"
          >
            {sql ?? <span className="tw-text-text-placeholder">No SQL available for this migration</span>}
          </pre>
        )}
      </div>

      {/* The button sits 4px high so its icon lines up with the number's first line. */}
      <Button
        variant="ghost"
        iconOnly
        size="medium"
        aria-label="View SQL"
        aria-expanded={expanded}
        className={cn('-tw-mt-1 tw-shrink-0', expanded && 'tw-bg-button-outline-pressed')}
        onClick={onToggleSql}
        data-cy="migration-history-view-sql"
      >
        <CodeXml />
      </Button>

      <span
        aria-hidden
        className={cn(
          'tw-absolute tw-left-1 tw-top-[3px] tw-flex tw-size-3 tw-items-center tw-justify-center tw-rounded-full',
          DOT_HALO[state]
        )}
      >
        <span className={cn('tw-size-1.5 tw-rounded-full', DOT_CORE[state])} />
      </span>
      {!last && (
        <span
          aria-hidden
          className="tw-absolute tw-bottom-0 tw-left-[9px] tw-top-[18px] tw-w-px tw-border-0 tw-border-l tw-border-dashed tw-border-border-default"
        />
      )}
    </div>
  );
}
