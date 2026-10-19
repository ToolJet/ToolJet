import React, { useEffect, useState } from 'react';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { ShowMoreBar } from '@/AppBuilder/Widgets/Ui2/_shared/ShowMore';
import { missingIsGone, useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import type { ReactNode, Ref } from 'react';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { barWidth, percentLabel } from './sectionsModel';
import { chipLabel, chipTone } from '@/AppBuilder/Widgets/Ui2/_shared/chipTone';
import { avatarHue } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';

// ToolJet UI 2.0: page sections (a hero, a card grid, a record list, a progress list and a summary strip). Configs in WidgetManager/widgets/shad*.js, style variables and loading looks
// in looks/sections.ts, data logic in sectionsModel.ts. A section draws a designed layout from properties only, so it
// stays editable in the inspector. Colours come from the theme (shadcn tokens) and the accent style.

export const ACCENT = 'var(--lk-accent,var(--sc-primary))';
// The accent as text (the eyebrow, an icon on its tint): the theme primary kept readable on the background.
export const ACCENT_INK = 'var(--lk-accent,var(--sc-primary-ink))';
export const TITLE_FONT = 'var(--lk-title-font,inherit)';

// ---- Lists (record list, progress list) ------------------------------------------------------------------------------

/** A list's frame: a card (border, radius, card background) or plain. Borders are classes (the pack's preflight zeroes
 *  inline border widths); the colour stays inline. */
export const LIST_BORDER = 'var(--lk-border,var(--sc-border))';
export const listFrame = (card: boolean) => ({
  frameClass: card ? 'tw-border' : '',
  frame: card
    ? {
        borderColor: LIST_BORDER,
        borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        background: 'var(--lk-bg,var(--sc-card))',
      }
    : { background: 'var(--lk-bg,transparent)' },
});

/** What a section shows with no data: the author's empty text, else `fallback`. */
export const EmptyText = ({ text, fallback }: { text: unknown; fallback: string }) => (
  <p className="tw-m-0 tw-py-10 tw-text-center tw-text-ui2-sm tw-text-ui2-muted-foreground">
    {toText(text) || fallback}
  </p>
);

/** A clicked row as selectedItem (its data) and selectedItemId (its idField value), and the click that selects it and
 *  fires `event`; nothing while the widget is disabled or loading. */
export const useItemSelection = <T extends { key: string; row?: Resolved }>(
  props: WidgetProps,
  event: string,
  items: readonly T[]
) => {
  const { properties: p, setExposedVariables, fireEvent } = props;
  // The selection is kept by the item's key and read from the current items, so a data refresh re-publishes it from
  // the fresh record and clears it when the item is gone, with no event (README, "Selection after a data change").
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = selectedKey === null ? null : items.find((item) => item.key === selectedKey) ?? null;
  useEffect(() => {
    if (selectedKey !== null && !selected && missingIsGone(items.length)) setSelectedKey(null);
  }, [selectedKey, selected, items.length]);
  const idKey = toText(p.idField) || 'id';
  const selection = (row: T | null) => ({
    selectedItem: row?.row ?? {},
    selectedItemId: row ? row.row?.[idKey] ?? null : null,
  });
  useExposed(setExposedVariables, p, selection(selected));
  const click = (row: T) => {
    if (busy(p)) return;
    setSelectedKey(row.key);
    setExposedVariables(selection(row));
    fireEvent(event);
  };
  return { selected, click };
};

/** A list section (record list, progress list) by state: ToolJet's loading look, the section's own skeleton, the
 *  empty text, or the rows (`children`, its <li>s) with Show more under them. */
interface ListSectionProps {
  props: WidgetProps;
  innerRef: Ref<HTMLDivElement>;
  card: boolean;
  /** The skeleton frame's layout classes, and classes the card frame adds in every state but empty. */
  skeletonClass: string;
  cardClass?: string;
  skeleton: ReactNode;
  emptyFallback: string;
  /** Rows in all, rows drawn and the Show more step. */
  count: number;
  shown: number;
  step: number;
  onMore: () => void;
  children: ReactNode;
}

export const ListSection = (s: ListSectionProps) => {
  const p = s.props.properties;
  const { frameClass, frame } = listFrame(s.card);
  const pad = s.card && s.cardClass;
  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={s.props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className={cn(s.skeletonClass, frameClass, pad)} style={frame}>
        {s.skeleton}
      </div>
    );
  } else if (!s.count) {
    body = (
      <div className={frameClass} style={frame}>
        <EmptyText text={p.emptyText} fallback={s.emptyFallback} />
      </div>
    );
  } else {
    body = (
      <div className={cn('tw-overflow-hidden', frameClass, pad)} style={frame}>
        <ul className="tw-m-0 tw-list-none tw-p-0" role="list">
          {s.children}
        </ul>
        <ShowMoreBar remaining={s.count - s.shown} step={s.step} onMore={s.onMore} borderColor={LIST_BORDER} />
      </div>
    );
  }
  return (
    <Shell {...s.props} innerRef={s.innerRef}>
      {body}
    </Shell>
  );
};

// ---- Card grid -------------------------------------------------------------------------------------------------------

export const TONE_VAR: Record<string, string> = {
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  danger: 'var(--sc-destructive)',
  // A fixed blue, as charts and the map use: in the brand colour, Booked and In progress read as Completed under a green
  // theme and as Pending under an orange one (pet salon, helpdesk, 2026-10-14).
  info: 'var(--sc-chart-info)',
  neutral: 'var(--sc-muted-foreground)',
};

/** A status chip toned by its words, or by `toneName` where the widget already knows the tone (a progress row). */
export const Chip = ({ value, onImage, toneName }: { value: unknown; onImage?: boolean; toneName?: string }) => {
  const toneKey = toneName || chipTone(value);
  const tone = TONE_VAR[toneKey] || TONE_VAR.neutral;
  return (
    // A block box, so a chip too long for its room ends in an ellipsis (a flex box clips its text without one); the
    // full text is its tooltip.
    <span
      className="tw-inline-block tw-max-w-full tw-truncate tw-whitespace-nowrap tw-rounded-full tw-px-2.5 tw-py-0.5 tw-align-middle tw-text-xs tw-font-semibold"
      title={String(value)}
      style={
        onImage
          ? {
              background: 'rgba(255,255,255,0.92)',
              color: `color-mix(in srgb, ${tone} 80%, #000)`,
            }
          : {
              background: `color-mix(in srgb, ${tone} 14%, transparent)`,
              color: `color-mix(in srgb, ${tone} 80%, var(--sc-foreground))`,
            }
      }
      data-tone={toneKey}
    >
      {chipLabel(value)}
    </span>
  );
};

/** A slim progress bar in the accent (or a tone), as wide as its box. Unknown progress (pct null: no value, or a
 *  target of 0 or less) has no aria-valuenow, so it reads as indeterminate rather than as 0%. */
export const Bar = ({
  pct,
  tone,
  height = 6,
  label,
}: {
  pct: number | null;
  tone?: string;
  height?: number;
  label?: string;
}) => (
  <div
    role="progressbar"
    aria-label={label || undefined}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={typeof pct === 'number' && Number.isFinite(pct) ? Math.round(barWidth(pct)) : undefined}
    className="tw-relative tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-full"
    style={{
      height,
      background: 'var(--lk-track,color-mix(in srgb, var(--sc-foreground) 9%, transparent))',
    }}
  >
    <div
      className="tw-h-full tw-rounded-full tw-transition-[width] tw-duration-500 tw-ease-out"
      style={{
        width: `${barWidth(pct)}%`,
        background: tone ? TONE_VAR[tone] || ACCENT : ACCENT,
      }}
    />
  </div>
);

/** A bar with its percentage after it, for a card or a record row. */
export const InlineProgress = ({ pct, className }: { pct: number | null; className?: string }) => (
  <div
    className={cn('tw-flex tw-min-w-0 tw-items-center tw-gap-2', className)}
    data-progress={Math.round(barWidth(pct))}
  >
    <Bar pct={pct} height={6} />
    <span
      className="tw-shrink-0 tw-text-xs tw-font-medium tw-tabular-nums"
      style={{
        color: 'var(--lk-fg,var(--sc-muted-foreground))',
        // Room for "100.0%", so every bar in a list is the same length: at 2.5rem a "10.2%" row's bar came out shorter
        // than its neighbours' (nonprofit programmes, 2026-10-14).
        minWidth: '3rem',
        textAlign: 'right',
      }}
    >
      {percentLabel(pct)}
    </span>
  </div>
);

/** A row's avatar: its image, or (none, or one that fails to load) the initials on a tint of the name's hue. */
export const RecordAvatar = ({
  src,
  name,
  size,
  shape,
}: {
  src?: string;
  name: string;
  size: number;
  shape?: string;
}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const hue = avatarHue(name);
  const radius = shape === 'rounded' ? 'tw-rounded-ui2-lg' : 'tw-rounded-full';
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn('tw-shrink-0 tw-object-cover', radius)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn('tj-record-avatar tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-font-semibold', radius)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `color-mix(in srgb, hsl(${hue} 70% 55%) 16%, var(--sc-background))`,
        // Mixed toward the foreground: a deeper ink on a light theme, a lighter one on a dark theme.
        color: `color-mix(in srgb, hsl(${hue} 65% 48%) 62%, var(--sc-foreground))`,
      }}
      aria-hidden="true"
      data-fallback="initials"
    >
      {initials(name)}
    </span>
  );
};
