import React, { useMemo, useRef } from 'react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { rootWidth, useAutoHeight, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { stripColumns, summaryFigures } from '@/AppBuilder/Widgets/Ui2/_sections/summaryModel';
import { TITLE_FONT } from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Summary strip ---------------------------------------------------------------------------------------------------

const STRIP_SIZE: Record<string, { value: string; pad: string; min: number }> = {
  sm: { value: 'tw-text-ui2-lg', pad: 'tw-px-4 tw-py-3', min: 120 },
  default: { value: 'tw-text-2xl', pad: 'tw-px-5 tw-py-4', min: 140 },
  lg: { value: 'tw-text-3xl', pad: 'tw-px-6 tw-py-5', min: 170 },
};

export const DELTA_TONE: Record<string, string> = {
  positive: 'var(--lk-pos,var(--sc-success))',
  negative: 'var(--lk-neg,var(--sc-destructive))',
  neutral: 'var(--sc-muted-foreground)',
};

/** A line of text's height (its font size and line height from `className`) with a skeleton bar in it. */
const SkeletonLine = ({ className, width }: { className: string; width: string }) => (
  <div className={cn('tw-relative tw-flex tw-max-w-full tw-items-center', width, className)}>
    <span aria-hidden="true">&nbsp;</span>
    <Skeleton className="tw-absolute tw-inset-x-0 tw-h-[0.75em]" />
  </div>
);

export const ShadSummaryStrip = (props: WidgetProps) => {
  const { properties: p } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  // The root has no padding of its own, so its width is the box's.
  const width = rootWidth(props.width);
  const items = useStable(p.items);
  const { valueFormat, currency, deltaFormat } = p;
  const figures = useMemo(
    () => summaryFigures(items, { valueFormat, currency, deltaFormat }),
    [items, valueFormat, currency, deltaFormat]
  );
  const size = STRIP_SIZE[p.size] || STRIP_SIZE.default;
  const panel = p.appearance !== 'plain';
  const center = p.align === 'center';
  // While loading, as many cells as the figures it will show (4 before the first data), so the grid keeps its rows.
  const count = p.loadingState ? figures.length || 4 : figures.length;
  const captions = figures.some((f) => f.caption);
  const columns = stripColumns(count, width || Number(props.width) || 960, size.min);
  // Borders are classes (the pack's preflight zeroes inline border widths); the colour stays inline.
  const hairline = 'var(--lk-border,var(--sc-border))';
  const frame = panel
    ? {
        borderColor: hairline,
        borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        background: 'var(--lk-bg,var(--sc-card))',
      }
    : { background: 'var(--lk-bg,transparent)' };
  // A hairline before every figure but the first of its row, and above every row but the first.
  // Without a panel, the first figure of each row starts at the strip's edge.
  const cellBorders = (i: number) =>
    cn(i % columns && 'tw-border-l', i >= columns && 'tw-border-t', !panel && !(i % columns) && 'tw-pl-0');
  const pad = size.pad;

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (!figures.length && !p.loadingState) {
    body = (
      <div className={panel ? 'tw-border' : ''} style={frame}>
        <p className="tw-m-0 tw-py-6 tw-text-center tw-text-ui2-sm tw-text-ui2-muted-foreground">No figures yet</p>
      </div>
    );
  } else {
    body = (
      <dl
        className={cn('tw-m-0 tw-grid tw-overflow-hidden', panel && 'tw-border')}
        style={{
          ...frame,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {p.loadingState
          ? Array.from({ length: count }).map((_, i) => (
              // A skeleton cell is built from the loaded cell's line boxes (label, figure, caption), each holding a bar,
              // so it is exactly as tall: a 48px skeleton row in place of a 70px figure row shrank the strip.
              <div
                key={i}
                className={cn('tw-flex tw-flex-col tw-gap-1', pad, center && 'tw-items-center', cellBorders(i))}
                style={{ borderColor: hairline }}
              >
                <SkeletonLine className="tw-flex-1 tw-text-xs" width="tw-w-20" />
                <SkeletonLine className={cn('tw-leading-tight', size.value)} width="tw-w-24" />
                {captions ? <SkeletonLine className="tw-text-xs" width="tw-w-16" /> : null}
              </div>
            ))
          : figures.map((f, i) => (
              <div
                key={f.key}
                className={cn(
                  'tw-flex tw-min-w-0 tw-flex-col tw-gap-1',
                  pad,
                  center && 'tw-items-center tw-text-center',
                  cellBorders(i)
                )}
                style={{ borderColor: hairline }}
              >
                {f.label ? (
                  // A long label wraps rather than being cut ("Technicians on the..."); it takes the cell's
                  // spare height, so the figures in a row of the grid stay level whatever their labels' lengths.
                  <dt
                    className="tw-flex-1 tw-break-words tw-text-xs tw-font-medium"
                    style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}
                  >
                    {f.label}
                  </dt>
                ) : null}
                <dd
                  className={cn(
                    'tw-m-0 tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-0.5',
                    center && 'tw-justify-center'
                  )}
                >
                  <span
                    className={cn(
                      'tw-truncate tw-font-semibold tw-leading-tight tw-tracking-tight tw-tabular-nums',
                      size.value
                    )}
                    style={{
                      color: 'var(--lk-title,var(--sc-foreground))',
                      fontFamily: TITLE_FONT,
                    }}
                  >
                    {f.value || '–'}
                  </span>
                  {f.delta ? (
                    <span
                      className="tw-text-xs tw-font-semibold tw-tabular-nums"
                      style={{
                        color: DELTA_TONE[f.delta.tone] || DELTA_TONE.neutral,
                      }}
                      data-tone={f.delta.tone}
                    >
                      {f.delta.text}
                    </span>
                  ) : null}
                </dd>
                {f.caption ? (
                  <dd
                    className="tw-m-0 tw-break-words tw-text-xs"
                    style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}
                  >
                    {f.caption}
                  </dd>
                ) : figures.some((other) => other.caption) ? (
                  // A line held where a neighbour has a caption, so the figure stays level with theirs: "28" and "433"
                  // sat a line lower than "11" and "£6,467.11".
                  <dd aria-hidden="true" className="tw-invisible tw-m-0 tw-text-xs">
                    &nbsp;
                  </dd>
                ) : null}
              </div>
            ))}
      </dl>
    );
  }
  return (
    <Shell {...props} innerRef={ref}>
      {body}
    </Shell>
  );
};

export default withControlState(ShadSummaryStrip);
