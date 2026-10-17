import React, { useMemo, useRef } from 'react';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { recordItems, type RecordItem } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import {
  ACCENT,
  Chip,
  InlineProgress,
  LIST_BORDER,
  ListSection,
  RecordAvatar,
  TITLE_FONT,
  useItemSelection,
} from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';
import { useShownCount } from '@/AppBuilder/Widgets/Ui2/_shared/ShowMore';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

// ---- Record list -----------------------------------------------------------------------------------------------------

const ROWS_PER_STEP = 100;

export const DENSITY: Record<string, { pad: string; avatar: number; title: string; meta: string }> = {
  compact: { pad: 'tw-py-2', avatar: 28, title: 'tw-text-ui2-sm', meta: 'tw-text-xs' },
  default: { pad: 'tw-py-3', avatar: 36, title: 'tw-text-ui2-sm', meta: 'tw-text-xs' },
  comfortable: { pad: 'tw-py-4', avatar: 40, title: 'tw-text-ui2-base', meta: 'tw-text-ui2-sm' },
};

export const ShadRecordList = (props: WidgetProps) => {
  const { properties: p, id } = props;
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
  const [shownCount, showMore] = useShownCount(ROWS_PER_STEP, rows);
  const { selected, click } = useItemSelection<RecordItem>(props, 'onItemClicked');
  const hasClick = useHasEvent(id, 'onItemClicked');
  const density = DENSITY[p.density] || DENSITY.default;
  const showAvatar = p.showAvatar !== false;
  const dividers = p.showDividers !== false;
  const card = p.listStyle !== 'plain';
  const clickable = (hasClick || p.highlightSelected !== false) && !busy(p);
  // A selected row draws a 3px accent bar and a tint: a plain list that can show it pads its rows 12px, or the bar sat
  // against the title (a field service app, 2026-10-13).
  const inset = card ? 'tw-px-4' : p.highlightSelected !== false ? 'tw-px-3' : 'tw-px-1';
  const divided = (i: number) => (dividers && i > 0 ? 'tw-border-t' : '');

  return (
    <ListSection
      props={props}
      innerRef={ref}
      card={card}
      skeletonClass="tw-overflow-hidden"
      skeleton={Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn('tw-flex tw-items-center tw-gap-3', inset, density.pad, divided(i))}
          style={{ borderColor: LIST_BORDER }}
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
      emptyFallback="Nothing here yet"
      count={rows.length}
      shown={shownCount}
      step={ROWS_PER_STEP}
      onMore={showMore}
    >
      {rows.slice(0, shownCount).map((row, i) => {
        const isSelected = p.highlightSelected !== false && selected?.key === row.key;
        return (
          <li key={row.key}>
            <div
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
                borderColor: LIST_BORDER,
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
            </div>
          </li>
        );
      })}
    </ListSection>
  );
};

export default withControlState(ShadRecordList);
