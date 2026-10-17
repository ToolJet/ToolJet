import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import {
  resourceHeading,
  dayKey,
  placeBookings,
  positionOf,
  scheduleRange,
  scheduleResources,
  slotTracks,
  startDay,
} from './scheduleModel';
import { pickBooking, pickSlot, resolveSelection, selectionExposed } from './scheduleSelection';
import type { SchedulePick } from './scheduleSelection';
import type { PlacedBooking, ScheduleColumn, ScheduleResource, ScheduleSlot } from './scheduleTypes';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { LABEL, LINE, SURFACE, ScheduleRow } from './ScheduleRow';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import { clampNumber, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { ShowMoreBar, useShownCount } from '@/AppBuilder/Widgets/Ui2/_shared/ShowMore';
import { EmptyText } from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';

// ToolJet UI 2.0 Schedule: resources down the side, time across (the hours of a day, or days), bookings as blocks,
// a now-line, and clicks on a booking or an empty slot. Config in WidgetManager/widgets/shad*.js, logic in
// scheduleModel.ts, a resource's row in ScheduleRow.tsx, style variables in looks/schedule.ts.

const RESOURCES_PER_STEP = 50;

// Number() reading: null and '' are 0 here, unlike clampCoerce's.
const bounded = (v: unknown, fallback: number, lo: number, hi: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? clampNumber(n, lo, hi) : fallback;
};

export const ShadSchedule = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);

  // The range is fixed for the day it was drawn on (the day only matters for an empty date, 'today'); the clock below
  // moves `today` on when the day turns.
  const [today, setToday] = useState(() => dayKey(new Date()));
  // Bound values keep their reference while their content is the same, so the layout rebuilds only on a change.
  const date = useStable(p.date);
  const resourceRows = useStable(p.resources);
  const bookings = useStable(p.bookings);
  const range = useMemo(
    () =>
      scheduleRange(
        {
          scale: p.scale,
          date,
          dayStart: p.dayStart,
          dayEnd: p.dayEnd,
          days: p.days,
          slotMinutes: p.slotMinutes,
          hourFormat: p.hourFormat,
        },
        startDay(today).getTime()
      ),
    [p.scale, date, p.dayStart, p.dayEnd, p.days, p.slotMinutes, p.hourFormat, today]
  );
  const resources = useMemo(
    () => scheduleResources(resourceRows, bookings, p.resourceField),
    [resourceRows, bookings, p.resourceField]
  );
  const placed = useMemo(
    () =>
      placeBookings(
        bookings,
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
    [
      bookings,
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

  const tracks = useMemo(() => slotTracks(range), [range]);
  const [shownCount, showMore] = useShownCount(RESOURCES_PER_STEP, resources);
  // The selection is who or what was picked, resolved against the schedule as it is now (scheduleSelection.ts).
  const [pick, setPick] = useState<SchedulePick | null>(null);
  const selected = useMemo(
    () => resolveSelection(pick, placed, resources, range, p.hourFormat),
    [pick, placed, resources, range, p.hourFormat]
  );
  useExposed(setExposedVariables, p, selectionExposed(selected));
  const hasSlotClick = useHasEvent(id, 'onSlotClicked');
  const disabled = busy(p);
  const highlight = p.highlightSelected !== false;

  const choose = (next: SchedulePick, event: string) => {
    setPick(next);
    setExposedVariables(selectionExposed(resolveSelection(next, placed, resources, range, p.hourFormat)));
    fireEvent(event);
  };
  const clickBooking = (resource: ScheduleResource, item: PlacedBooking) => {
    if (!disabled) choose(pickBooking(resource, item), 'onBookingClicked');
  };
  const clickSlot = (resource: ScheduleResource, slot: ScheduleSlot) => {
    if (!disabled) choose(pickSlot(resource, slot), 'onSlotClicked');
  };

  // The now-line moves with the clock without drawing the schedule again: its position is a CSS variable set here.
  // It is drawn only when the range holds today; outside the hours shown it hides.
  const nowRef = useRef<HTMLDivElement | null>(null);
  const holdsToday = range.scale === 'days' ? range.columns.some((c) => c.today) : !!range.today;
  const showNow = p.showNowLine !== false && holdsToday;
  // Placed when the line mounts as well as on each tick: drawn after the bookings loaded, it sat at its default, the
  // left edge, until the next tick 30 seconds later (a week view showed now on Monday; a day view before its first hour
  // showed it at the start, 2026-10-14).
  const placeNow = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const pos = positionOf(range, Date.now());
      el.style.display = pos === null ? 'none' : '';
      el.style.setProperty('--now', String((pos ?? 0) / 100));
    },
    [range]
  );
  const nowLineRef = (el: HTMLDivElement | null) => {
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
  }, [range, showNow, today, placeNow]);

  const rw = bounded(p.resourceWidth, 168, 80, 400);
  const rowHeight = bounded(p.rowHeight, 56, 32, 160);
  // A day column holds "Mon 12 Oct" and a truncated booking at 80px: at 96 a week beside a 190px resource column needed
  // 862px, and a rental desk's two-thirds-width card cut Sunday off behind a scroll (2026-10-14).
  const columnMin = range.scale === 'days' ? 80 : 72;
  const frame = {
    borderColor: LINE,
    borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
    background: SURFACE,
  };
  const timeLabel = (c: ScheduleColumn) => (
    <>
      <span
        className="tw-font-medium"
        style={{ color: c.today ? 'var(--lk-accent,var(--sc-primary-ink))' : undefined }}
      >
        {c.label}
      </span>
      {c.sub ? (
        <span
          className={cn(
            'tw-ml-1 tw-tabular-nums',
            c.today &&
              'tw-rounded-full tw-bg-[color:var(--lk-accent,var(--sc-primary))] tw-px-1.5 tw-py-px tw-text-[color:var(--sc-primary-foreground)]'
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
      <div className="tw-overflow-hidden tw-border" style={frame}>
        <div className="tw-flex tw-gap-4 tw-border-b tw-px-3 tw-py-3" style={{ borderColor: LINE }}>
          <Skeleton className="tw-h-3 tw-w-20" />
          <Skeleton className="tw-h-3 tw-flex-1" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn('tw-flex tw-items-center tw-gap-4 tw-px-3', i > 0 && 'tw-border-t')}
            style={{ height: rowHeight, borderColor: LINE }}
          >
            <Skeleton className="tw-h-4 tw-shrink-0" style={{ width: rw - 40 }} />
            <Skeleton
              className="tw-h-7 tw-rounded-ui2-md"
              style={{ marginLeft: `${10 + ((i * 23) % 40)}%`, width: '18%' }}
            />
          </div>
        ))}
      </div>
    );
  } else if (!resources.length) {
    body = (
      <div className="tw-border" style={frame}>
        <EmptyText text={p.emptyText} fallback="No resources to schedule" />
      </div>
    );
  } else {
    const shown = resources.slice(0, shownCount);
    body = (
      <div className="sc-schedule tw-overflow-hidden tw-border" style={frame} data-scale={range.scale}>
        <div className="tw-overflow-x-auto">
          <div
            className="tw-relative"
            style={{ minWidth: rw + range.columns.length * columnMin, '--rw': `${rw}px` } as StyleWithVars}
          >
            <div className="tw-flex tw-border-b" style={{ borderColor: LINE }}>
              <div
                className="tw-sticky tw-left-0 tw-z-20 tw-flex tw-shrink-0 tw-items-end tw-px-3 tw-pb-2 tw-pt-3 tw-text-xs tw-font-medium"
                style={{ width: rw, background: SURFACE, color: LABEL }}
              >
                {/* A header written in lowercase ("name", a field name) reads as a label: "Name". */}
                <span className="tw-truncate">{resourceHeading(toText(p.resourceTitle))}</span>
              </div>
              <div className="tw-flex tw-min-w-0 tw-flex-1">
                {range.columns.map((c, i) => (
                  <div
                    key={c.key}
                    className={cn(
                      'tw-min-w-0 tw-flex-1 tw-truncate tw-px-2 tw-pb-2 tw-pt-3 tw-text-xs tw-tabular-nums',
                      i > 0 && 'tw-border-l'
                    )}
                    style={{ borderColor: LINE, color: LABEL }}
                    data-today={c.today || undefined}
                  >
                    {timeLabel(c)}
                  </div>
                ))}
              </div>
            </div>
            {/* The rows, with the now-line over them (under the header, so it never covers today's date). */}
            <div className="tw-relative">
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
                  slotTracks={tracks}
                  width={props.width}
                  clickSlot={clickSlot}
                  clickBooking={clickBooking}
                />
              ))}
              {showNow ? (
                <div
                  ref={nowLineRef}
                  className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-top-0 tw-z-[5] tw-w-0"
                  style={{ left: 'calc(var(--rw) + (100% - var(--rw)) * var(--now, 0))' }}
                  aria-hidden="true"
                  data-now-line=""
                >
                  <span
                    className="tw-absolute tw-bottom-0 tw-top-0 -tw-translate-x-1/2"
                    style={{ width: 2, background: 'var(--lk-now,var(--sc-destructive))' }}
                  />
                  <span
                    className="tw-absolute -tw-top-1 tw-h-2 tw-w-2 -tw-translate-x-1/2 tw-rounded-full"
                    style={{ background: 'var(--lk-now,var(--sc-destructive))' }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <ShowMoreBar
          remaining={resources.length - shownCount}
          step={RESOURCES_PER_STEP}
          onMore={showMore}
          borderColor={LINE}
        />
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
