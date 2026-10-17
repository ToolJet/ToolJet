import React, { useEffect, useState } from 'react';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { avatarHue } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import { MAX_ROW_BOOKINGS, bookingFace, slotValue } from './scheduleModel';
import type {
  PlacedBooking,
  PlacedBookings,
  ScheduleRange,
  ScheduleResource,
  ScheduleSelected,
  ScheduleSlot,
} from './scheduleTypes';
import type { StyleWithVars } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ToolJet UI 2.0 Schedule (Schedule.tsx): one resource's row, its name and avatar on the left, its free slots and its
// bookings across.

const ACCENT = 'var(--lk-accent,var(--sc-primary))';
export const LINE = 'var(--lk-border,var(--sc-border))';
export const LABEL = 'var(--lk-fg,var(--sc-muted-foreground))';
export const SURFACE = 'var(--lk-bg,var(--sc-card))';
const TONE_VAR: Record<string, string> = {
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  danger: 'var(--sc-destructive)',
  // A fixed blue, apart from success, warning and danger whatever the brand (as the chips and charts).
  info: 'var(--sc-chart-info)',
  neutral: 'var(--sc-muted-foreground)',
};
const LANE = 30;
const LANE_GAP = 4;
const PAD = 6;

const ResourceAvatar = ({ src, name }: { src: string; name: string }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (src && !failed)
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="tw-h-7 tw-w-7 tw-shrink-0 tw-rounded-full tw-object-cover"
      />
    );
  const hue = avatarHue(name);
  return (
    <span
      className="tw-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-[11px] tw-font-semibold"
      style={{
        background: `color-mix(in srgb, hsl(${hue} 70% 55%) 16%, var(--sc-background))`,
        color: `color-mix(in srgb, hsl(${hue} 65% 48%) 62%, var(--sc-foreground))`,
      }}
      aria-hidden="true"
      data-fallback="initials"
    >
      {initials(name)}
    </span>
  );
};

interface ScheduleRowProps {
  r: ScheduleResource;
  i: number;
  entry: PlacedBookings[string] | undefined;
  rowHeight: number;
  rw: number;
  range: ScheduleRange;
  selected: ScheduleSelected | null;
  highlight: boolean;
  disabled: boolean;
  hasSlotClick: boolean;
  hourFormat: unknown;
  width: number;
  slotCount: number;
  clickSlot: (resource: ScheduleResource, slot: ScheduleSlot, index: number) => void;
  clickBooking: (item: PlacedBooking) => void;
}

export const ScheduleRow = ({
  r,
  i,
  entry,
  rowHeight,
  rw,
  range,
  selected,
  highlight,
  disabled,
  hasSlotClick,
  hourFormat,
  width,
  slotCount,
  clickSlot,
  clickBooking,
}: ScheduleRowProps) => {
  const lanes = entry?.lanes || 1;
  const laneHeight = lanes === 1 ? Math.max(20, rowHeight - PAD * 2) : LANE;
  const rowH = lanes === 1 ? rowHeight : Math.max(rowHeight, lanes * LANE + (lanes - 1) * LANE_GAP + PAD * 2);
  return (
    <div className={cn('tw-flex', i > 0 && 'tw-border-t')} style={{ borderColor: LINE }} data-resource={r.key}>
      <div
        className="tw-sticky tw-left-0 tw-z-10 tw-flex tw-shrink-0 tw-items-center tw-gap-2.5 tw-border-r tw-px-3"
        style={{ width: rw, height: rowH, background: SURFACE, borderColor: LINE }}
      >
        {r.avatar ? (
          <ResourceAvatar src={/^(https?:|data:image\/|\/)/.test(r.avatar) ? r.avatar : ''} name={r.name} />
        ) : null}
        <span className="tw-flex tw-min-w-0 tw-flex-col">
          <span className="tw-truncate tw-text-ui2-sm tw-font-medium tw-leading-snug tw-text-[color:var(--sc-foreground)]">
            {r.name}
          </span>
          {r.caption ? (
            <span className="tw-truncate tw-text-xs tw-leading-snug" style={{ color: LABEL }}>
              {r.caption}
            </span>
          ) : null}
        </span>
      </div>
      <div className="tw-relative tw-min-w-0 tw-flex-1" style={{ height: rowH }}>
        <div
          className="tw-absolute tw-inset-0 tw-grid"
          style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` }}
        >
          {range.slots.map((slot, j) => {
            const isSelected =
              highlight && selected?.kind === 'slot' && selected.resource === r.key && selected.index === j;
            const todayColumn = range.scale === 'days' && range.columns[j]?.today;
            return (
              <button
                key={j}
                type="button"
                disabled={disabled}
                onClick={() => clickSlot(r, slot, j)}
                aria-label={`${r.name}, ${slotValue(r, slot, hourFormat, range.scale).label}, free`}
                className={cn(
                  'sc-slot tw-h-full tw-min-w-0 tw-outline-none tw-transition-colors tw-duration-100 focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[color:var(--lk-accent,var(--sc-ring))] disabled:tw-cursor-default',
                  j > 0 && slot.edge && 'tw-border-l',
                  !disabled && (hasSlotClick || highlight) && 'sc-slot-live tw-cursor-pointer'
                )}
                // Fills and lines are rules in shadcn.scss, keyed on the data attributes below.
                data-selected={isSelected || undefined}
                data-today={todayColumn || undefined}
              />
            );
          })}
        </div>
        {(entry?.items || []).slice(0, MAX_ROW_BOOKINGS).map((b) => {
          const tone = b.tone ? TONE_VAR[b.tone] : ACCENT;
          const isSelected = highlight && selected?.kind === 'booking' && selected.key === b.key;
          const cancelled = /\bcancel/i.test(b.status);
          const second = [b.time, b.subtitle].filter(Boolean).join(' · ');
          const face = bookingFace(((Number(width) || 0) - rw) * (b.width / 100) - 4, laneHeight, !!second);
          const top = PAD + b.lane * (laneHeight + LANE_GAP);
          return (
            <button
              key={b.key}
              type="button"
              disabled={disabled}
              onClick={() => clickBooking(b)}
              title={[b.title, second, b.status].filter(Boolean).join(' · ')}
              aria-pressed={isSelected}
              data-selected={isSelected || undefined}
              data-booking={b.key}
              data-tone={b.tone || undefined}
              className={cn(
                'sc-booking tw-absolute tw-z-[1] tw-flex tw-min-w-0 tw-flex-col tw-justify-center tw-overflow-hidden tw-rounded-ui2-md tw-border-l-[3px] tw-px-2 tw-text-left tw-text-xs tw-leading-tight tw-outline-none tw-transition-shadow tw-duration-150 focus-visible:tw-ring-2 focus-visible:tw-ring-[color:var(--lk-accent,var(--sc-ring))] disabled:tw-cursor-default',
                !disabled && 'tw-cursor-pointer',
                cancelled && 'tw-opacity-70'
              )}
              style={
                {
                  left: `calc(${b.left}% + 2px)`,
                  width: `max(calc(${b.width}% - 4px), 6px)`,
                  top,
                  height: laneHeight,
                  // The fill, the edge and the ink derive from the tone in shadcn.scss (.sc-booking).
                  '--bk-tone': tone,
                } as StyleWithVars
              }
            >
              <span
                className={cn(
                  'tw-font-semibold',
                  // Two lines break at spaces only: a name broken mid-word ("Juni / per") read worse than "Junip...".
                  face.titleLines === 2 && /\s/.test(String(b.title || '').trim()) ? 'tw-line-clamp-2' : 'tw-truncate',
                  cancelled && 'tw-line-through'
                )}
              >
                {b.title || 'Booking'}
              </span>
              {face.showSecond ? <span className="tw-truncate tw-tabular-nums tw-opacity-80">{second}</span> : null}
            </button>
          );
        })}
        {/* Bookings past what a row draws (the latest ones) are counted here, never left out without a trace. */}
        {(entry?.items.length ?? 0) > MAX_ROW_BOOKINGS ? (
          <span
            className="tw-absolute tw-bottom-0.5 tw-right-1 tw-z-[2] tw-rounded-ui2-md tw-px-1.5 tw-text-[11px] tw-font-medium tw-tabular-nums"
            style={{ background: SURFACE, color: LABEL }}
            data-more-bookings=""
            role="note"
          >
            +{(entry?.items.length ?? 0) - MAX_ROW_BOOKINGS} more
          </span>
        ) : null}
      </div>
    </div>
  );
};
