import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { stripColumns, summaryFigures } from '@/AppBuilder/Widgets/Ui2/_sections/summaryModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { TITLE_FONT } from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Summary strip ---------------------------------------------------------------------------------------------------

const STRIP_SIZE: Record<string, { value: string; pad: string; min: number }> = {
  sm: { value: 'text-lg', pad: 'px-4 py-3', min: 120 },
  default: { value: 'text-2xl', pad: 'px-5 py-4', min: 140 },
  lg: { value: 'text-3xl', pad: 'px-6 py-5', min: 170 },
};

export const DELTA_TONE: Record<string, string> = {
  positive: 'var(--lk-pos,var(--sc-success))',
  negative: 'var(--lk-neg,var(--sc-destructive))',
  neutral: 'var(--sc-muted-foreground)',
};

export const ShadSummaryStrip = (props: WidgetProps) => {
  const { properties: p } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const [width, setWidth] = useState(Number(props.width) || 0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width || Number(props.width) || 0);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const figures = useMemo(
    () =>
      summaryFigures(p.items, {
        valueFormat: p.valueFormat,
        currency: p.currency,
        deltaFormat: p.deltaFormat,
      }),
    [stringify(p.items ?? null), p.valueFormat, p.currency, p.deltaFormat] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const size = STRIP_SIZE[p.size] || STRIP_SIZE.default;
  const panel = p.appearance !== 'plain';
  const center = p.align === 'center';
  const count = p.loadingState ? 4 : figures.length;
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
    cn(i % columns && 'border-l', i >= columns && 'border-t', !panel && !(i % columns) && 'pl-0');
  const pad = size.pad;

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (!figures.length && !p.loadingState) {
    body = (
      <div className={panel ? 'border' : ''} style={frame}>
        <p className="m-0 py-6 text-center text-sm text-muted-foreground">No figures yet</p>
      </div>
    );
  } else {
    body = (
      <dl
        className={cn('m-0 grid overflow-hidden', panel && 'border')}
        style={{
          ...frame,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {p.loadingState
          ? Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={cn('flex flex-col gap-2', pad, center && 'items-center', cellBorders(i))}
                style={{ borderColor: hairline }}
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))
          : figures.map((f, i) => (
              <div
                key={f.key}
                className={cn('flex min-w-0 flex-col gap-1', pad, center && 'items-center text-center', cellBorders(i))}
                style={{ borderColor: hairline }}
              >
                {f.label ? (
                  // A long label wraps rather than being cut ("Technicians on the...", 2026-10-13); it takes the cell's
                  // spare height, so the figures in a row of the grid stay level whatever their labels' lengths.
                  <dt
                    className="flex-1 break-words text-xs font-medium"
                    style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}
                  >
                    {f.label}
                  </dt>
                ) : null}
                <dd
                  className={cn(
                    'm-0 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5',
                    center && 'justify-center'
                  )}
                >
                  <span
                    className={cn('truncate font-semibold leading-tight tracking-tight tabular-nums', size.value)}
                    style={{
                      color: 'var(--lk-title,var(--sc-foreground))',
                      fontFamily: TITLE_FONT,
                    }}
                  >
                    {f.value || '–'}
                  </span>
                  {f.delta ? (
                    <span
                      className="text-xs font-semibold tabular-nums"
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
                  <dd className="m-0 break-words text-xs" style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}>
                    {f.caption}
                  </dd>
                ) : figures.some((other) => other.caption) ? (
                  // A line held where a neighbour has a caption, so the figure stays level with theirs: "28" and "433"
                  // sat a line lower than "11" and "£6,467.11" (bookshop stock strip, 2026-10-14).
                  <dd aria-hidden="true" className="invisible m-0 text-xs">
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
