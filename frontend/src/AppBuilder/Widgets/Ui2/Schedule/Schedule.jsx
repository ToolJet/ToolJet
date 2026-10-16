import React, { useEffect, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import {
  resourceHeading,
  dayKey,
  placeBookings,
  positionOf,
  scheduleRange,
  scheduleResources,
  slotValue,
} from './scheduleModel';
import { LABEL, LINE, SURFACE, ScheduleRow } from './ScheduleRow';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';

// ToolJet UI 2.0 Schedule: resources down the side, time across (the hours of a day, or days), bookings as blocks,
// a now-line, and clicks on a booking or an empty slot. Config in WidgetManager/widgets/shad*.js, logic in
// scheduleModel.js, a resource's row in ScheduleRow.jsx, style variables in looks/schedule.js.

const RESOURCES_PER_STEP = 50;

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
  const hasBookingClick = useHasEvent(id, 'onBookingClicked');
  const hasSlotClick = useHasEvent(id, 'onSlotClicked');
  const disabled = busy(p);
  const highlight = p.highlightSelected !== false;

  const clickBooking = (item) => {
    if (disabled) return;
    const next = { kind: 'booking', key: item.key, item };
    setSelected(next);
    setExposedVariables(selection(next));
    fireEvent('onBookingClicked');
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
    fireEvent('onSlotClicked');
  };

  // The now-line moves with the clock without drawing the schedule again: its position is a CSS variable set here.
  // It is drawn only when the range holds today; outside the hours shown it hides.
  const nowRef = useRef(null);
  const holdsToday = range.scale === 'days' ? range.columns.some((c) => c.today) : !!range.today;
  const showNow = p.showNowLine !== false && holdsToday;
  // Placed when the line mounts as well as on each tick: drawn after the bookings loaded, it sat at its default, the
  // left edge, until the next tick 30 seconds later (a week view showed now on Monday; a day view before its first hour
  // showed it at the start, 2026-10-14).
  const placeNow = (el) => {
    if (!el) return;
    const pos = positionOf(range, Date.now());
    el.style.display = pos === null ? 'none' : '';
    el.style.setProperty('--now', String((pos ?? 0) / 100));
  };
  const nowLineRef = (el) => {
    nowRef.current = el;
    placeNow(el);
  };
  useEffect(() => {
    const tick = () => {
      const d = dayKey(new Date());
      if (d !== today) setToday(d);
      placeNow(nowRef.current);
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
                <span className="truncate">{resourceHeading(text(p.resourceTitle))}</span>
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
              {shown.map((r, i) => (
                <ScheduleRow
                  key={r.key}
                  r={r}
                  i={i}
                  entry={placed[r.key]}
                  rowHeight={rowHeight}
                  rw={rw}
                  range={range}
                  selected={selected}
                  highlight={highlight}
                  disabled={disabled}
                  hasSlotClick={hasSlotClick}
                  hourFormat={p.hourFormat}
                  slotCount={slotCount}
                  width={props.width}
                  clickSlot={clickSlot}
                  clickBooking={clickBooking}
                />
              ))}
              {showNow ? (
                <div
                  ref={nowLineRef}
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

export default withControlState(ShadSchedule);
