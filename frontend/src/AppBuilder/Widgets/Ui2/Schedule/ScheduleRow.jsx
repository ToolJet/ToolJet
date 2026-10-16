import React, { useEffect, useState } from 'react';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { avatarHue } from '@/AppBuilder/Widgets/NewTable/_utils/avatarHue';
import { bookingFace, slotValue } from './scheduleModel';

// ToolJet UI 2.0 Schedule (Schedule.jsx): one resource's row, its name and avatar on the left, its free slots and its
// bookings across.

const ACCENT = 'var(--lk-accent,var(--sc-primary))';
export const LINE = 'var(--lk-border,var(--sc-border))';
export const LABEL = 'var(--lk-fg,var(--sc-muted-foreground))';
export const SURFACE = 'var(--lk-bg,var(--sc-card))';
const TONE_VAR = {
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

const ResourceAvatar = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (src && !failed)
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    );
  const hue = avatarHue(name);
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
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
}) => {
  const lanes = entry?.lanes || 1;
  const laneHeight = lanes === 1 ? Math.max(20, rowHeight - PAD * 2) : LANE;
  const rowH = lanes === 1 ? rowHeight : Math.max(rowHeight, lanes * LANE + (lanes - 1) * LANE_GAP + PAD * 2);
  return (
    <div className={cn('flex', i > 0 && 'border-t')} style={{ borderColor: LINE }} data-resource={r.key}>
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center gap-2.5 border-r px-3"
        style={{ width: rw, height: rowH, background: SURFACE, borderColor: LINE }}
      >
        {r.avatar ? (
          <ResourceAvatar src={/^(https?:|data:image\/|\/)/.test(r.avatar) ? r.avatar : ''} name={r.name} />
        ) : null}
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium leading-snug text-[color:var(--sc-foreground)]">{r.name}</span>
          {r.caption ? (
            <span className="truncate text-xs leading-snug" style={{ color: LABEL }}>
              {r.caption}
            </span>
          ) : null}
        </span>
      </div>
      <div className="relative min-w-0 flex-1" style={{ height: rowH }}>
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` }}>
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
                  'sc-slot h-full min-w-0 outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--lk-accent,var(--sc-ring))] disabled:cursor-default',
                  j > 0 && slot.edge && 'border-l',
                  !disabled && (hasSlotClick || highlight) && 'sc-slot-live cursor-pointer'
                )}
                // Fills and lines are rules in shadcn.scss: the pack's reset sets every button's
                // background and border colour with !important, which an inline style cannot beat.
                data-selected={isSelected || undefined}
                data-today={todayColumn || undefined}
              />
            );
          })}
        </div>
        {(entry?.items || []).map((b) => {
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
                'sc-booking absolute z-[1] flex min-w-0 flex-col justify-center overflow-hidden rounded-md border-l-[3px] px-2 text-left text-xs leading-tight outline-none transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-[color:var(--lk-accent,var(--sc-ring))] disabled:cursor-default',
                !disabled && 'cursor-pointer',
                cancelled && 'opacity-70'
              )}
              style={{
                left: `calc(${b.left}% + 2px)`,
                width: `max(calc(${b.width}% - 4px), 6px)`,
                top,
                height: laneHeight,
                // The fill, the edge and the ink derive from the tone in shadcn.scss (.sc-booking).
                '--bk-tone': tone,
              }}
            >
              <span
                className={cn(
                  'font-semibold',
                  // Two lines break at spaces only: a name broken mid-word ("Juni / per") read worse than "Junip...".
                  face.titleLines === 2 && /\s/.test(String(b.title || '').trim()) ? 'line-clamp-2' : 'truncate',
                  cancelled && 'line-through'
                )}
              >
                {b.title || 'Booking'}
              </span>
              {face.showSecond ? <span className="truncate tabular-nums opacity-80">{second}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
