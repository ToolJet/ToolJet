import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { percentLabel } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import { progressItems } from '@/AppBuilder/Widgets/Ui2/_sections/progressModel';
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

const BAR_HEIGHT = { thin: 4, default: 8, thick: 12 };

export const PROGRESS_ROWS_PER_STEP = 100;

export const ShadProgressList = (props) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef(null);
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
  const [selected, setSelected] = useState(null);
  const idKey = text(p.idField) || 'id';
  const selection = (row) => ({
    selectedItem: row?.row ?? {},
    selectedItemId: row ? row.row?.[idKey] ?? null : null,
  });
  useExposed(setExposedVariables, p, selection(selected));
  const clickable = useHasEvent(id, 'onItemClicked') && !busy(p);
  const barHeight = BAR_HEIGHT[p.barSize] || BAR_HEIGHT.default;
  const card = p.listStyle !== 'plain';
  const showValues = p.showValues !== false;
  const showPercent = p.showPercent !== false;
  const inset = card ? 'px-4' : 'px-0';

  const click = (row) => {
    if (busy(p)) return;
    setSelected(row);
    setExposedVariables(selection(row));
    fireEvent('onItemClicked');
  };

  // Borders are classes (the pack's preflight zeroes inline border widths); the colour stays inline.
  const BORDER = 'var(--lk-border,var(--sc-border))';
  const frameClass = card ? 'border' : '';
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
      <div className={cn('flex flex-col', frameClass, card && 'py-1')} style={frame}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn('flex flex-col gap-2 py-3', inset)}>
            <div className="flex justify-between gap-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/5" />
            </div>
            <Skeleton className="w-full rounded-full" style={{ height: barHeight }} />
          </div>
        ))}
      </div>
    );
  } else if (!rows.length) {
    body = (
      <div className={frameClass} style={frame}>
        <p className="m-0 py-10 text-center text-sm text-muted-foreground">
          {text(p.emptyText) || 'Nothing to track yet'}
        </p>
      </div>
    );
  } else {
    body = (
      <div className={cn('overflow-hidden', frameClass, card && 'py-1')} style={frame}>
        <ul className="m-0 list-none p-0" role="list">
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
                  'flex min-w-0 flex-col gap-2 py-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--lk-accent,var(--sc-ring))]',
                  inset,
                  clickable && 'cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--sc-foreground)_4%,transparent)]'
                )}
                data-tone={row.tone || undefined}
              >
                <div className="flex min-w-0 items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="truncate text-sm font-medium leading-snug"
                      style={{
                        color: 'var(--lk-title,var(--sc-foreground))',
                        fontFamily: TITLE_FONT,
                      }}
                    >
                      {row.label}
                    </span>
                    {row.status ? (
                      <span className="flex min-w-0 shrink">
                        <Chip value={row.status} toneName={row.tone} />
                      </span>
                    ) : null}
                  </span>
                  {figure || (pct && showPercent && !row.caption) ? (
                    <span
                      className="shrink-0 text-sm tabular-nums"
                      style={{ color: 'var(--lk-title,var(--sc-foreground))' }}
                    >
                      {figure ? <span className="font-semibold">{figure}</span> : null}
                      {pct && showPercent && !row.caption ? (
                        <span
                          className={cn(figure && 'ml-2')}
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
                  <div className="flex min-w-0 items-baseline justify-between gap-3 text-xs">
                    <span
                      className="truncate"
                      style={{
                        color: 'var(--lk-fg,var(--sc-muted-foreground))',
                      }}
                    >
                      {row.caption}
                    </span>
                    {pct && showPercent ? (
                      <span
                        className="shrink-0 font-medium tabular-nums"
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
          <div className="flex justify-center border-t py-2" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={() => setShownCount((n) => n + PROGRESS_ROWS_PER_STEP)}
              className="rounded-md px-3 py-1.5 text-sm text-[color:var(--sc-muted-foreground)] transition-colors hover:bg-[color:var(--sc-muted)] hover:text-[color:var(--sc-foreground)]"
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
