import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { recordItems } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import {
  ACCENT,
  Chip,
  InlineProgress,
  RecordAvatar,
  TITLE_FONT,
  onKeyActivate,
  text,
  useHasEvent,
} from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';

// ---- Record list -----------------------------------------------------------------------------------------------------

const ROWS_PER_STEP = 100;

export const DENSITY = {
  compact: { pad: 'py-2', avatar: 28, title: 'text-sm', meta: 'text-xs' },
  default: { pad: 'py-3', avatar: 36, title: 'text-sm', meta: 'text-xs' },
  comfortable: { pad: 'py-4', avatar: 40, title: 'text-base', meta: 'text-sm' },
};

export const ShadRecordList = (props) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const rows = useMemo(
    () =>
      recordItems(p.data, {
        titleField: p.titleField,
        avatarField: p.avatarField,
        metaFields: p.metaFields,
        statusField: p.statusField,
        progressField: p.progressField,
        valueField: p.valueField,
        valueFormat: p.valueFormat,
        currency: p.currency,
        idField: p.idField,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stringify(p.data ?? null),
      p.titleField,
      p.avatarField,
      p.metaFields,
      p.statusField,
      p.progressField,
      p.valueField,
      p.valueFormat,
      p.currency,
      p.idField,
    ]
  );
  // The first ROWS_PER_STEP rows and a button for the next ones, as the card grid does: a 10,000-row binding froze the
  // page. A new data binding starts again from the first step.
  const [shownCount, setShownCount] = useState(ROWS_PER_STEP);
  useEffect(() => setShownCount(ROWS_PER_STEP), [rows]);
  const [selected, setSelected] = useState(null);
  const idKey = text(p.idField) || 'id';
  // selectedItem is the row's data, selectedItemId its idField value.
  const selection = (row) => ({
    selectedItem: row?.row ?? {},
    selectedItemId: row ? row.row?.[idKey] ?? null : null,
  });
  useExposed(setExposedVariables, p, selection(selected));
  const hasClick = useHasEvent(id, 'onItemClicked');
  const density = DENSITY[p.density] || DENSITY.default;
  const showAvatar = p.showAvatar !== false;
  const dividers = p.showDividers !== false;
  const card = p.listStyle !== 'plain';
  const clickable = (hasClick || p.highlightSelected !== false) && !busy(p);
  // A selected row draws a 3px accent bar and a tint: a plain list that can show it pads its rows 12px, or the bar sat
  // against the title (a field service app, 2026-10-13).
  const inset = card ? 'px-4' : p.highlightSelected !== false ? 'px-3' : 'px-1';

  const click = (row) => {
    if (busy(p)) return;
    setSelected(row);
    setExposedVariables(selection(row));
    fireEvent('onItemClicked');
  };

  // Borders are classes: the pack's preflight sets every border width to 0 with !important, so an inline border
  // never shows. The colour stays inline.
  const BORDER = 'var(--lk-border,var(--sc-border))';
  const frameClass = card ? 'border' : '';
  const frame = card
    ? {
        borderColor: BORDER,
        borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        background: 'var(--lk-bg,var(--sc-card))',
      }
    : { background: 'var(--lk-bg,transparent)' };
  const divided = (i) => (dividers && i > 0 ? 'border-t' : '');

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className={cn('overflow-hidden', frameClass)} style={frame}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn('flex items-center gap-3', inset, density.pad, divided(i))}
            style={{ borderColor: BORDER }}
          >
            {showAvatar ? (
              <Skeleton
                className={cn('shrink-0', p.avatarShape === 'rounded' ? 'rounded-lg' : 'rounded-full')}
                style={{ width: density.avatar, height: density.avatar }}
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  } else if (!rows.length) {
    body = (
      <div className={frameClass} style={frame}>
        <p className="m-0 py-10 text-center text-sm text-muted-foreground">{text(p.emptyText) || 'Nothing here yet'}</p>
      </div>
    );
  } else {
    body = (
      <div className={cn('overflow-hidden', frameClass)} style={frame}>
        <ul className="m-0 list-none p-0" role="list">
          {rows.slice(0, shownCount).map((row, i) => {
            const isSelected = p.highlightSelected !== false && selected?.key === row.key;
            return (
              <li
                key={row.key}
                role="button"
                tabIndex={0}
                onClick={() => click(row)}
                onKeyDown={onKeyActivate(() => click(row))}
                className={cn(
                  'flex min-w-0 items-center gap-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--lk-accent,var(--sc-ring))]',
                  inset,
                  density.pad,
                  divided(i),
                  clickable && 'cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--sc-foreground)_4%,transparent)]'
                )}
                style={{
                  borderColor: BORDER,
                  background: isSelected ? `color-mix(in srgb, ${ACCENT} 9%, transparent)` : undefined,
                  boxShadow: isSelected ? `inset 3px 0 0 ${ACCENT}` : undefined,
                }}
                data-selected={isSelected || undefined}
              >
                {showAvatar ? (
                  <RecordAvatar src={row.image} name={row.avatarName} size={density.avatar} shape={p.avatarShape} />
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {/* Two lines before it clips: in a narrow column beside a chip and a time, one line left titles such as
                      "Workspace setti…" that said nothing (a content calendar's drafts list, 2026-10-14). */}
                  <span
                    className={cn('line-clamp-2 break-words font-medium leading-snug', density.title)}
                    title={typeof row.title === 'string' ? row.title : undefined}
                    style={{
                      color: 'var(--lk-title,var(--sc-foreground))',
                      fontFamily: TITLE_FONT,
                    }}
                  >
                    {row.title}
                  </span>
                  {row.meta ? (
                    <span
                      className={cn('truncate tabular-nums leading-snug', density.meta)}
                      style={{
                        color: 'var(--lk-fg,var(--sc-muted-foreground))',
                      }}
                    >
                      {row.meta}
                    </span>
                  ) : null}
                  {row.progress !== null ? <InlineProgress pct={row.progress} className="mt-1 max-w-[240px]" /> : null}
                </div>
                {row.status ? (
                  <span className="flex min-w-0 max-w-[40%] shrink-0 justify-end">
                    <Chip value={row.status} />
                  </span>
                ) : null}
                {row.value ? (
                  <span
                    className={cn('shrink-0 text-right font-semibold tabular-nums', density.title)}
                    style={{
                      color: 'var(--lk-title,var(--sc-foreground))',
                      minWidth: '4.5rem',
                    }}
                  >
                    {row.value}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        {rows.length > shownCount ? (
          <div className="flex justify-center border-t py-2" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={() => setShownCount((n) => n + ROWS_PER_STEP)}
              className="rounded-md px-3 py-1.5 text-sm text-[color:var(--sc-muted-foreground)] transition-colors hover:bg-[color:var(--sc-muted)] hover:text-[color:var(--sc-foreground)]"
            >
              {`Show ${Math.min(ROWS_PER_STEP, rows.length - shownCount)} more of ${rows.length - shownCount}`}
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

export default withControlState(ShadRecordList);
