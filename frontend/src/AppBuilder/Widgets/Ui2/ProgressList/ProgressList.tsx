import React, { useMemo, useRef } from 'react';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { percentLabel } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import { progressItems, type ProgressItem } from '@/AppBuilder/Widgets/Ui2/_sections/progressModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import {
  Bar,
  Chip,
  ListSection,
  TITLE_FONT,
  TONE_VAR,
  useItemSelection,
} from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';
import { useShownCount } from '@/AppBuilder/Widgets/Ui2/_shared/ShowMore';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

// A tone as text: deep enough to read on the background.
export const TONE_INK = Object.fromEntries(
  Object.entries(TONE_VAR).map(([k, v]) => [k, `color-mix(in srgb, ${v} 80%, var(--sc-foreground))`])
);

// ---- Progress list ---------------------------------------------------------------------------------------------------

const BAR_HEIGHT: Record<string, number> = { thin: 4, default: 8, thick: 12 };

export const PROGRESS_ROWS_PER_STEP = 100;

export const ShadProgressList = (props: WidgetProps) => {
  const { properties: p, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const data = useStable(p.data);
  const { labelField, valueField, targetField, percentField, captionField, statusField } = p;
  const { valueFormat, currency, idField, autoTone } = p;
  const rows = useMemo(
    () =>
      progressItems(data, {
        labelField,
        valueField,
        targetField,
        percentField,
        captionField,
        statusField,
        valueFormat,
        currency,
        idField,
        autoTone,
      }),
    [
      data,
      labelField,
      valueField,
      targetField,
      percentField,
      captionField,
      statusField,
      valueFormat,
      currency,
      idField,
      autoTone,
    ]
  );
  // The first rows and a button for the next ones: a 10,000-row binding froze the page in the other lists.
  const [shownCount, showMore] = useShownCount(PROGRESS_ROWS_PER_STEP, rows);
  const { click } = useItemSelection<ProgressItem>(props, 'onItemClicked', rows);
  const clickable = useHasEvent(id, 'onItemClicked') && !busy(p);
  const barHeight = BAR_HEIGHT[p.barSize] || BAR_HEIGHT.default;
  const card = p.listStyle !== 'plain';
  const showValues = p.showValues !== false;
  const showPercent = p.showPercent !== false;
  const inset = card ? 'tw-px-4' : 'tw-px-0';

  return (
    <ListSection
      props={props}
      innerRef={ref}
      card={card}
      skeletonClass="tw-flex tw-flex-col"
      cardClass="tw-py-1"
      skeleton={Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn('tw-flex tw-flex-col tw-gap-2 tw-py-3', inset)}>
          <div className="tw-flex tw-justify-between tw-gap-4">
            <Skeleton className="tw-h-4 tw-w-1/3" />
            <Skeleton className="tw-h-4 tw-w-1/5" />
          </div>
          <Skeleton className="tw-w-full tw-rounded-full" style={{ height: barHeight }} />
        </div>
      ))}
      emptyFallback="Nothing to track yet"
      count={rows.length}
      shown={shownCount}
      step={PROGRESS_ROWS_PER_STEP}
      onMore={showMore}
    >
      {rows.slice(0, shownCount).map((row) => {
        const figure = showValues && row.value ? (row.target ? `${row.value} of ${row.target}` : row.value) : '';
        const pct = Number.isFinite(row.pct) ? percentLabel(row.pct) : '';
        return (
          <li
            key={row.key}
            {...(clickable
              ? {
                  role: 'button',
                  tabIndex: 0,
                  onClick: () => click(row),
                  onKeyDown: onKeyActivate(() => click(row)),
                }
              : { onClick: () => click(row) })}
            className={cn(
              'tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-py-3 tw-outline-none tw-transition-colors tw-duration-150 focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[color:var(--lk-accent,var(--sc-ring))]',
              inset,
              clickable &&
                'tw-cursor-pointer hover:tw-bg-[color:color-mix(in_srgb,var(--sc-foreground)_4%,transparent)]'
            )}
            data-tone={row.tone || undefined}
          >
            <div className="tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-3">
              <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
                <span
                  className="tw-truncate tw-text-ui2-sm tw-font-medium tw-leading-snug"
                  style={{
                    color: 'var(--lk-title,var(--sc-foreground))',
                    fontFamily: TITLE_FONT,
                  }}
                >
                  {row.label}
                </span>
                {row.status ? (
                  <span className="tw-flex tw-min-w-0 tw-shrink">
                    <Chip value={row.status} toneName={row.tone} />
                  </span>
                ) : null}
              </span>
              {figure || (pct && showPercent && !row.caption) ? (
                <span
                  className="tw-shrink-0 tw-text-ui2-sm tw-tabular-nums"
                  style={{ color: 'var(--lk-title,var(--sc-foreground))' }}
                >
                  {figure ? <span className="tw-font-semibold">{figure}</span> : null}
                  {pct && showPercent && !row.caption ? (
                    <span
                      className={cn(figure && 'tw-ml-2')}
                      style={{
                        color: 'var(--lk-fg,var(--sc-muted-foreground))',
                      }}
                    >
                      {pct}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </div>
            <Bar pct={row.pct} tone={row.tone} height={barHeight} label={row.label} />
            {row.caption ? (
              <div className="tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-3 tw-text-xs">
                <span
                  className="tw-truncate"
                  style={{
                    color: 'var(--lk-fg,var(--sc-muted-foreground))',
                  }}
                >
                  {row.caption}
                </span>
                {pct && showPercent ? (
                  <span
                    className="tw-shrink-0 tw-font-medium tw-tabular-nums"
                    style={{
                      color: row.tone ? TONE_INK[row.tone] : 'var(--lk-fg,var(--sc-muted-foreground))',
                    }}
                  >
                    {pct}
                  </span>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ListSection>
  );
};

export default withControlState(ShadProgressList);
