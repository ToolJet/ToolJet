import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { recordItems, type RecordItem } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import {
  ACCENT,
  Chip,
  InlineProgress,
  RecordAvatar,
  TITLE_FONT,
  onKeyActivate,
  text,
} from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';

// ---- Record list -----------------------------------------------------------------------------------------------------

const ROWS_PER_STEP = 100;

export const DENSITY: Record<string, { pad: string; avatar: number; title: string; meta: string }> = {
  compact: { pad: 'tw-py-2', avatar: 28, title: 'tw-text-ui2-sm', meta: 'tw-text-xs' },
  default: { pad: 'tw-py-3', avatar: 36, title: 'tw-text-ui2-sm', meta: 'tw-text-xs' },
  comfortable: { pad: 'tw-py-4', avatar: 40, title: 'tw-text-ui2-base', meta: 'tw-text-ui2-sm' },
};

export const ShadRecordList = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const data = useStable(p.data);
  const metaFields = useStable(p.metaFields);
  const { titleField, avatarField, statusField, progressField, valueField, valueFormat, currency, idField } = p;
  const rows = useMemo(
    () =>
      recordItems(data, {
        titleField,
        avatarField,
        metaFields,
        statusField,
        progressField,
        valueField,
        valueFormat,
        currency,
        idField,
      }),
    [data, titleField, avatarField, metaFields, statusField, progressField, valueField, valueFormat, currency, idField]
  );
  // The first ROWS_PER_STEP rows and a button for the next ones, as the card grid does: a 10,000-row binding froze the
  // page. A new data binding starts again from the first step.
  const [shownCount, setShownCount] = useState(ROWS_PER_STEP);
  useEffect(() => setShownCount(ROWS_PER_STEP), [rows]);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const idKey = text(p.idField) || 'id';
  // selectedItem is the row's data, selectedItemId its idField value.
  const selection = (row: RecordItem | null) => ({
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
  const inset = card ? 'tw-px-4' : p.highlightSelected !== false ? 'tw-px-3' : 'tw-px-1';

  const click = (row: RecordItem) => {
    if (busy(p)) return;
    setSelected(row);
    setExposedVariables(selection(row));
    fireEvent('onItemClicked');
  };

  // Borders are classes (the width); the colour stays inline.
  const BORDER = 'var(--lk-border,var(--sc-border))';
  const frameClass = card ? 'tw-border' : '';
  const frame = card
    ? {
        borderColor: BORDER,
        borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        background: 'var(--lk-bg,var(--sc-card))',
      }
    : { background: 'var(--lk-bg,transparent)' };
  const divided = (i: number) => (dividers && i > 0 ? 'tw-border-t' : '');

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className={cn('tw-overflow-hidden', frameClass)} style={frame}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn('tw-flex tw-items-center tw-gap-3', inset, density.pad, divided(i))}
            style={{ borderColor: BORDER }}
          >
            {showAvatar ? (
              <Skeleton
                className={cn('tw-shrink-0', p.avatarShape === 'rounded' ? 'tw-rounded-ui2-lg' : 'tw-rounded-full')}
                style={{ width: density.avatar, height: density.avatar }}
              />
            ) : null}
            <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1.5">
              <Skeleton className="tw-h-4 tw-w-2/5" />
              <Skeleton className="tw-h-3 tw-w-3/5" />
            </div>
            <Skeleton className="tw-h-5 tw-w-16 tw-rounded-full" />
          </div>
        ))}
      </div>
    );
  } else if (!rows.length) {
    body = (
      <div className={frameClass} style={frame}>
        <p className="tw-m-0 tw-py-10 tw-text-center tw-text-ui2-sm tw-text-ui2-muted-foreground">
          {text(p.emptyText) || 'Nothing here yet'}
        </p>
      </div>
    );
  } else {
    body = (
      <div className={cn('tw-overflow-hidden', frameClass)} style={frame}>
        <ul className="tw-m-0 tw-list-none tw-p-0" role="list">
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
                  'tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-outline-none tw-transition-colors tw-duration-150 focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[color:var(--lk-accent,var(--sc-ring))]',
                  inset,
                  density.pad,
                  divided(i),
                  clickable &&
                    'tw-cursor-pointer hover:tw-bg-[color:color-mix(in_srgb,var(--sc-foreground)_4%,transparent)]'
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
                <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0.5">
                  {/* Two lines before it clips: in a narrow column beside a chip and a time, one line left titles such as
                      "Workspace setti…" that said nothing (a content calendar's drafts list, 2026-10-14). */}
                  <span
                    className={cn('tw-line-clamp-2 tw-break-words tw-font-medium tw-leading-snug', density.title)}
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
                      className={cn('tw-truncate tw-tabular-nums tw-leading-snug', density.meta)}
                      style={{
                        color: 'var(--lk-fg,var(--sc-muted-foreground))',
                      }}
                    >
                      {row.meta}
                    </span>
                  ) : null}
                  {row.progress !== null ? (
                    <InlineProgress pct={row.progress} className="tw-mt-1 tw-max-w-[240px]" />
                  ) : null}
                </div>
                {row.status ? (
                  <span className="tw-flex tw-min-w-0 tw-max-w-[40%] tw-shrink-0 tw-justify-end">
                    <Chip value={row.status} />
                  </span>
                ) : null}
                {row.value ? (
                  <span
                    className={cn('tw-shrink-0 tw-text-right tw-font-semibold tw-tabular-nums', density.title)}
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
          <div className="tw-flex tw-justify-center tw-border-t tw-py-2" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={() => setShownCount((n) => n + ROWS_PER_STEP)}
              className="tw-rounded-ui2-md tw-px-3 tw-py-1.5 tw-text-ui2-sm tw-text-[color:var(--sc-muted-foreground)] tw-transition-colors hover:tw-bg-[color:var(--sc-muted)] hover:tw-text-[color:var(--sc-foreground)]"
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
