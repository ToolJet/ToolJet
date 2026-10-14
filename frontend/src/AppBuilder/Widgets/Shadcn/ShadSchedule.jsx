import React, { useEffect, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { LoadingBox, Shell, busy, wantsSkeleton } from './Shadcn';
import { initials, useAutoHeight, useExposed } from '../packHooks';
import { Skeleton, cn } from './ui';
import { dayKey, placeBookings, positionOf, scheduleRange, scheduleResources, slotValue } from './scheduleModel';
import { avatarHue } from '../NewTable/_utils/avatarHue';
import { stringify } from '../packJson';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// ToolJet UI 2.0 Schedule: resources down the side, time across (the hours of a day, or days), bookings as blocks,
// a now-line, and clicks on a booking or an empty slot. Config in WidgetManager/shadcnSource.schedule.js, logic in
// scheduleModel.js, style variables in looks/schedule.js.

const ACCENT = 'var(--lk-accent,var(--sc-primary))';
const LINE = 'var(--lk-border,var(--sc-border))';
const LABEL = 'var(--lk-fg,var(--sc-muted-foreground))';
const SURFACE = 'var(--lk-bg,var(--sc-card))';
const TONE_VAR = {
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  danger: 'var(--sc-destructive)',
  info: 'var(--sc-chart-2,var(--sc-primary))',
  neutral: 'var(--sc-muted-foreground)',
};
const RESOURCES_PER_STEP = 50;
const LANE = 30;
const LANE_GAP = 4;
const PAD = 6;

const text = (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));
const num = (v, fallback, lo, hi) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback;
};

const useHasEvent = (id, eventId) =>
  useStore((state) => {
    const modules = state?.eventsSlice?.module;
    if (!modules || !id) return false;
    return Object.values(modules).some((m) =>
      (Array.isArray(m?.events) ? m.events : []).some(
        (e) => e?.sourceId === id && e?.event?.eventId === eventId && !e?.event?.disabled
      )
    );
  });

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

export const ShadSchedule = (props) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);

  // The range is fixed for the day it was drawn on: the day only matters for 'today' (an empty date).
  const [today, setToday] = useState(() => dayKey(new Date()));
  const range = useMemo(
    () =>
      scheduleRange({
        scale: p.scale,
        date: p.date,
        dayStart: p.dayStart,
        dayEnd: p.dayEnd,
        days: p.days,
        slotMinutes: p.slotMinutes,
        hourFormat: p.hourFormat,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.scale, stringify(p.date ?? null), p.dayStart, p.dayEnd, p.days, p.slotMinutes, p.hourFormat, today]
  );
  const resources = useMemo(
    () => scheduleResources(p.resources, p.bookings, p.resourceField),
    [stringify(p.resources ?? null), stringify(p.bookings ?? null), p.resourceField] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const placed = useMemo(
    () =>
      placeBookings(
        p.bookings,
        {
          resourceField: p.resourceField,
          startField: p.startField,
          endField: p.endField,
          titleField: p.titleField,
          subtitleField: p.subtitleField,
          statusField: p.statusField,
          idField: p.idField,
          hourFormat: p.hourFormat,
        },
        range,
        resources
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stringify(p.bookings ?? null),
      p.resourceField,
      p.startField,
      p.endField,
      p.titleField,
      p.subtitleField,
      p.statusField,
      p.idField,
      p.hourFormat,
      range,
      resources,
    ]
  );

  const [shownCount, setShownCount] = useState(RESOURCES_PER_STEP);
  useEffect(() => setShownCount(RESOURCES_PER_STEP), [resources]);
  const [selected, setSelected] = useState(null); // { kind: 'booking', key, item } | { kind: 'slot', resource, index }
  const selection = (next) => ({
    selectedBooking: next?.kind === 'booking' ? next.item.row : {},
    selectedBookingId: next?.kind === 'booking' ? next.item.id ?? null : null,
    selectedSlot: next?.kind === 'slot' ? next.value : {},
  });
  useExposed(setExposedVariables, p, selection(selected));
  const hasBookingClick = useHasEvent(id, 'onBookingClick');
  const hasSlotClick = useHasEvent(id, 'onSlotClick');
  const disabled = busy(p);
  const highlight = p.highlightSelected !== false;

  const clickBooking = (item) => {
    if (disabled) return;
    const next = { kind: 'booking', key: item.key, item };
    setSelected(next);
    setExposedVariables(selection(next));
    fireEvent('onBookingClick');
  };
  const clickSlot = (resource, slot, index) => {
    if (disabled) return;
    const next = {
      kind: 'slot',
      resource: resource.key,
      index,
      value: slotValue(resource, slot, p.hourFormat, range.scale),
    };
    setSelected(next);
    setExposedVariables(selection(next));
    fireEvent('onSlotClick');
  };

  // The now-line moves with the clock without drawing the schedule again: its position is a CSS variable set here.
  // It is drawn only when the range holds today; outside the hours shown it hides.
  const nowRef = useRef(null);
  const holdsToday = range.scale === 'days' ? range.columns.some((c) => c.today) : !!range.today;
  const showNow = p.showNowLine !== false && holdsToday;
  useEffect(() => {
    const tick = () => {
      const d = dayKey(new Date());
      if (d !== today) setToday(d);
      const el = nowRef.current;
      if (!el) return;
      const pos = positionOf(range, Date.now());
      el.style.display = pos === null ? 'none' : '';
      el.style.setProperty('--now', String((pos ?? 0) / 100));
    };
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, [range, showNow, today]);

  const rw = num(p.resourceWidth, 168, 80, 400);
  const rowHeight = num(p.rowHeight, 56, 32, 160);
  // A day column holds "Mon 12 Oct" and a truncated booking at 80px: at 96 a week beside a 190px resource column needed
  // 862px, and a rental desk's two-thirds-width card cut Sunday off behind a scroll (2026-10-14).
  const columnMin = range.scale === 'days' ? 80 : 72;
  const frame = {
    borderColor: LINE,
    borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
    background: SURFACE,
  };
  const timeLabel = (c) => (
    <>
      <span className="font-medium" style={{ color: c.today ? 'var(--lk-accent,var(--sc-primary-ink))' : undefined }}>
        {c.label}
      </span>
      {c.sub ? (
        <span
          className={cn(
            'ml-1 tabular-nums',
            c.today &&
              'rounded-full bg-[color:var(--lk-accent,var(--sc-primary))] px-1.5 py-px text-[color:var(--sc-primary-foreground)]'
          )}
        >
          {c.sub}
        </span>
      ) : null}
    </>
  );

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className="overflow-hidden border" style={frame}>
        <div className="flex gap-4 border-b px-3 py-3" style={{ borderColor: LINE }}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 flex-1" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn('flex items-center gap-4 px-3', i > 0 && 'border-t')}
            style={{ height: rowHeight, borderColor: LINE }}
          >
            <Skeleton className="h-4 shrink-0" style={{ width: rw - 40 }} />
            <Skeleton className="h-7 rounded-md" style={{ marginLeft: `${10 + ((i * 23) % 40)}%`, width: '18%' }} />
          </div>
        ))}
      </div>
    );
  } else if (!resources.length) {
    body = (
      <div className="border" style={frame}>
        <p className="m-0 py-10 text-center text-sm text-muted-foreground">
          {text(p.emptyText) || 'No resources to schedule'}
        </p>
      </div>
    );
  } else {
    const shown = resources.slice(0, shownCount);
    const slotCount = range.slots.length;
    body = (
      <div className="sc-schedule overflow-hidden border" style={frame} data-scale={range.scale}>
        <div className="overflow-x-auto">
          <div className="relative" style={{ minWidth: rw + range.columns.length * columnMin, '--rw': `${rw}px` }}>
            <div className="flex border-b" style={{ borderColor: LINE }}>
              <div
                className="sticky left-0 z-20 flex shrink-0 items-end px-3 pb-2 pt-3 text-xs font-medium"
                style={{ width: rw, background: SURFACE, color: LABEL }}
              >
                {/* A header written in lowercase ("name", a field name) reads as a label: "Name". */}
                <span className="truncate">{text(p.resourceTitle).replace(/^[a-z]/, (ch) => ch.toUpperCase())}</span>
              </div>
              <div className="flex min-w-0 flex-1">
                {range.columns.map((c, i) => (
                  <div
                    key={c.key}
                    className={cn('min-w-0 flex-1 truncate px-2 pb-2 pt-3 text-xs tabular-nums', i > 0 && 'border-l')}
                    style={{ borderColor: LINE, color: LABEL }}
                    data-today={c.today || undefined}
                  >
                    {timeLabel(c)}
                  </div>
                ))}
              </div>
            </div>
            {/* The rows, with the now-line over them (under the header, so it never covers today's date). */}
            <div className="relative">
              {shown.map((r, i) => {
                const entry = placed[r.key];
                const lanes = entry?.lanes || 1;
                const laneHeight = lanes === 1 ? Math.max(20, rowHeight - PAD * 2) : LANE;
                const rowH =
                  lanes === 1 ? rowHeight : Math.max(rowHeight, lanes * LANE + (lanes - 1) * LANE_GAP + PAD * 2);
                return (
                  <div
                    key={r.key}
                    className={cn('flex', i > 0 && 'border-t')}
                    style={{ borderColor: LINE }}
                    data-resource={r.key}
                  >
                    <div
                      className="sticky left-0 z-10 flex shrink-0 items-center gap-2.5 border-r px-3"
                      style={{ width: rw, height: rowH, background: SURFACE, borderColor: LINE }}
                    >
                      {r.avatar ? (
                        <ResourceAvatar
                          src={/^(https?:|data:image\/|\/)/.test(r.avatar) ? r.avatar : ''}
                          name={r.name}
                        />
                      ) : null}
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium leading-snug text-[color:var(--sc-foreground)]">
                          {r.name}
                        </span>
                        {r.caption ? (
                          <span className="truncate text-xs leading-snug" style={{ color: LABEL }}>
                            {r.caption}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="relative min-w-0 flex-1" style={{ height: rowH }}>
                      <div
                        className="absolute inset-0 grid"
                        style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` }}
                      >
                        {range.slots.map((slot, j) => {
                          const isSelected =
                            highlight &&
                            selected?.kind === 'slot' &&
                            selected.resource === r.key &&
                            selected.index === j;
                          const todayColumn = range.scale === 'days' && range.columns[j]?.today;
                          return (
                            <button
                              key={j}
                              type="button"
                              disabled={disabled}
                              onClick={() => clickSlot(r, slot, j)}
                              aria-label={`${r.name}, ${slotValue(r, slot, p.hourFormat, range.scale).label}, free`}
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
                            <span className={cn('truncate font-semibold', cancelled && 'line-through')}>
                              {b.title || 'Booking'}
                            </span>
                            {second && laneHeight >= 34 ? (
                              <span className="truncate tabular-nums opacity-80">{second}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {showNow ? (
                <div
                  ref={nowRef}
                  className="pointer-events-none absolute bottom-0 top-0 z-[5] w-0"
                  style={{ left: 'calc(var(--rw) + (100% - var(--rw)) * var(--now, 0))' }}
                  aria-hidden="true"
                  data-now-line=""
                >
                  <span
                    className="absolute bottom-0 top-0 -translate-x-1/2"
                    style={{ width: 2, background: 'var(--lk-now,var(--sc-destructive))' }}
                  />
                  <span
                    className="absolute -top-1 h-2 w-2 -translate-x-1/2 rounded-full"
                    style={{ background: 'var(--lk-now,var(--sc-destructive))' }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {resources.length > shownCount ? (
          <div className="flex justify-center border-t py-2" style={{ borderColor: LINE }}>
            <button
              type="button"
              onClick={() => setShownCount((n) => n + RESOURCES_PER_STEP)}
              className="rounded-md px-3 py-1.5 text-sm text-[color:var(--sc-muted-foreground)] transition-colors hover:bg-[color:var(--sc-muted)] hover:text-[color:var(--sc-foreground)]"
            >
              {`Show ${Math.min(RESOURCES_PER_STEP, resources.length - shownCount)} more of ${
                resources.length - shownCount
              }`}
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
