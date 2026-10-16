import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { percentLabel } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import { progressItems, type ProgressItem } from '@/AppBuilder/Widgets/Ui2/_sections/progressModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import {
  Bar,
  Chip,
  TITLE_FONT,
  TONE_VAR,
  onKeyActivate,
  text,
  useHasEvent,
} from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';

// A tone as text: deep enough to read on the background.
export const TONE_INK = Object.fromEntries(
  Object.entries(TONE_VAR).map(([k, v]) => [k, `color-mix(in srgb, ${v} 80%, var(--sc-foreground))`])
);

// ---- Progress list ---------------------------------------------------------------------------------------------------

const BAR_HEIGHT: Record<string, number> = { thin: 4, default: 8, thick: 12 };

export const PROGRESS_ROWS_PER_STEP = 100;

export const ShadProgressList = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const rows = useMemo(
    () =>
      progressItems(p.data, {
        labelField: p.labelField,
        valueField: p.valueField,
        targetField: p.targetField,
        percentField: p.percentField,
        captionField: p.captionField,
        statusField: p.statusField,
        valueFormat: p.valueFormat,
        currency: p.currency,
        idField: p.idField,
        autoTone: p.autoTone,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stringify(p.data ?? null),
      p.labelField,
      p.valueField,
      p.targetField,
      p.percentField,
      p.captionField,
      p.statusField,
      p.valueFormat,
      p.currency,
      p.idField,
      p.autoTone,
    ]
  );
  // The first rows and a button for the next ones: a 10,000-row binding froze the page in the other lists.
  const [shownCount, setShownCount] = useState(PROGRESS_ROWS_PER_STEP);
  useEffect(() => setShownCount(PROGRESS_ROWS_PER_STEP), [rows]);
  const [selected, setSelected] = useState<ProgressItem | null>(null);
  const idKey = text(p.idField) || 'id';
  const selection = (row: ProgressItem | null) => ({
    selectedItem: row?.row ?? {},
    selectedItemId: row ? row.row?.[idKey] ?? null : null,
  });
  useExposed(setExposedVariables, p, selection(selected));
  const clickable = useHasEvent(id, 'onItemClicked') && !busy(p);
  const barHeight = BAR_HEIGHT[p.barSize] || BAR_HEIGHT.default;
  const card = p.listStyle !== 'plain';
  const showValues = p.showValues !== false;
  const showPercent = p.showPercent !== false;
  const inset = card ? 'tw-px-4' : 'tw-px-0';

  const click = (row: ProgressItem) => {
    if (busy(p)) return;
    setSelected(row);
    setExposedVariables(selection(row));
    fireEvent('onItemClicked');
  };

  // Borders are classes (the pack's preflight zeroes inline border widths); the colour stays inline.
  const BORDER = 'var(--lk-border,var(--sc-border))';
  const frameClass = card ? 'tw-border' : '';
  const frame = card
    ? {
        borderColor: BORDER,
        borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        background: 'var(--lk-bg,var(--sc-card))',
      }
    : { background: 'var(--lk-bg,transparent)' };

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className={cn('tw-flex tw-flex-col', frameClass, card && 'tw-py-1')} style={frame}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn('tw-flex tw-flex-col tw-gap-2 tw-py-3', inset)}>
            <div className="tw-flex tw-justify-between tw-gap-4">
              <Skeleton className="tw-h-4 tw-w-1/3" />
              <Skeleton className="tw-h-4 tw-w-1/5" />
            </div>
            <Skeleton className="tw-w-full tw-rounded-full" style={{ height: barHeight }} />
          </div>
        ))}
      </div>
    );
  } else if (!rows.length) {
    body = (
      <div className={frameClass} style={frame}>
        <p className="tw-m-0 tw-py-10 tw-text-center tw-text-ui2-sm tw-text-ui2-muted-foreground">
          {text(p.emptyText) || 'Nothing to track yet'}
        </p>
      </div>
    );
  } else {
    body = (
      <div className={cn('tw-overflow-hidden', frameClass, card && 'tw-py-1')} style={frame}>
        <ul className="tw-m-0 tw-list-none tw-p-0" role="list">
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
        </ul>
        {rows.length > shownCount ? (
          <div className="tw-flex tw-justify-center tw-border-t tw-py-2" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={() => setShownCount((n) => n + PROGRESS_ROWS_PER_STEP)}
              className="tw-rounded-ui2-md tw-px-3 tw-py-1.5 tw-text-ui2-sm tw-text-[color:var(--sc-muted-foreground)] tw-transition-colors hover:tw-bg-[color:var(--sc-muted)] hover:tw-text-[color:var(--sc-foreground)]"
            >
              {`Show ${Math.min(PROGRESS_ROWS_PER_STEP, rows.length - shownCount)} more of ${rows.length - shownCount}`}
            </button>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <Shell {...props} innerRef={ref}>
      {body}
    </Shell>
  );
};

export default withControlState(ShadProgressList);
