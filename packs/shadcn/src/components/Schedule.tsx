import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { lookVars, useStable } from '../lib/ui2/choice/looks';
import { useBusy, useColorStyle } from '../lib/ui2/choice/fieldStyles';
import { TOKEN, useThemeRadius } from '../lib/styleDefaults';
import {
  MAX_ROW_BOOKINGS,
  avatarHue,
  barMinWidth,
  bookingFace,
  dayKey,
  initials,
  parseTime,
  placeBookings,
  placedOn,
  positionOf,
  resolveSelection,
  resourceHeading,
  scheduleRange,
  scheduleResources,
  selectionExposed,
  slotAvailability,
  slotTracks,
  slotValue,
  startDay,
  timelineMinWidth,
  toText,
  type BookingProblem,
  type PlacedBooking,
  type PlacedBookings,
  type ScheduleRange,
  type SchedulePick,
  type ScheduleResource,
  type ScheduleSelected,
  type ScheduleSlot,
} from '../lib/ui2/choice/schedule';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { ScheduleSkel } from '../lib/ui2/loading/shapes';
import '../styles/ui2-choice.css';

// UI 2.0's Schedule (Ui2/Schedule/*) on the pack's CSS: resources down the side, time across (the hours of a day, or
// days), bookings as blocks toned by their status and stacked in lanes where they overlap, a now-line, and clicks on a
// booking or an empty slot. A long range scrolls sideways inside the widget, the resource column staying put.

const RESOURCES_PER_STEP = 50;
const LANE = 30;
const LANE_GAP = 4;
const PAD = 6;
const TONE_VAR: Record<string, string> = {
  success: 'var(--ui-success)',
  warning: 'var(--ui-warning)',
  danger: 'var(--ui-destructive)',
  info: 'var(--ui-info)',
  neutral: 'var(--ui-muted-fg)',
};
const ACCENT = 'var(--lk-accent, var(--ui-primary))';

const bounded = (v: unknown, fallback: number, lo: number, hi: number): number => {
  const n = Number(v);
  return v !== '' && v !== null && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

const ResourceAvatar = ({ src, name }: { src: string; name: string }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (src && !failed)
    return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="ucs-avatar" />;
  const hue = avatarHue(name);
  return (
    <span
      className="ucs-avatar"
      aria-hidden="true"
      style={{
        background: `color-mix(in srgb, hsl(${hue} 70% 55%) 16%, var(--ui-bg))`,
        color: `color-mix(in srgb, hsl(${hue} 65% 48%) 62%, var(--ui-fg))`,
      }}
    >
      {initials(name)}
    </span>
  );
};

interface RowProps {
  r: ScheduleResource;
  entry: PlacedBookings[string] | undefined;
  rowHeight: number;
  rw: number;
  range: ScheduleRange;
  selected: ScheduleSelected | null;
  highlight: boolean;
  disabled: boolean;
  hourFormat: unknown;
  axisWidth: number;
  tracks: string;
  colors: Record<string, string>;
  clickSlot: (r: ScheduleResource, slot: ScheduleSlot) => void;
  clickBooking: (r: ScheduleResource, item: PlacedBooking) => void;
}

// One resource's row: its name and avatar on the left, its free slots and its bookings across.
const ScheduleRow = ({
  r,
  entry,
  rowHeight,
  rw,
  range,
  selected,
  highlight,
  disabled,
  hourFormat,
  axisWidth,
  tracks,
  colors,
  clickSlot,
  clickBooking,
}: RowProps) => {
  const lanes = entry?.lanes || 1;
  const laneHeight = lanes === 1 ? Math.max(20, rowHeight - PAD * 2) : LANE;
  const rowH = lanes === 1 ? rowHeight : Math.max(rowHeight, lanes * LANE + (lanes - 1) * LANE_GAP + PAD * 2);
  const barMin = barMinWidth(range);
  return (
    <div className="ucs-row" data-resource={r.key}>
      <div className="ucs-res" style={{ width: rw, height: rowH }}>
        {r.avatar ? (
          <ResourceAvatar src={/^(https?:|data:image\/|\/)/.test(r.avatar) ? r.avatar : ''} name={r.name} />
        ) : null}
        <span className="ucs-res-text">
          <span className="ucs-res-name uc-truncate">{r.name}</span>
          {r.caption ? <span className="ucs-res-caption uc-truncate">{r.caption}</span> : null}
        </span>
      </div>
      <div className="ucs-lane" style={{ height: rowH }}>
        <div className="ucs-slots" style={{ gridTemplateColumns: tracks }}>
          {range.slots.map((slot, j) => {
            const isSelected =
              highlight && selected?.kind === 'slot' && selected.resource === r.key && selected.index === j;
            const todayColumn = range.scale === 'days' && range.columns[j]?.today;
            // A slot says what is in it; one bookings cover entirely is not offered as free.
            const { state, titles } = slotAvailability(slot, entry?.items);
            const status =
              state === 'free' ? 'free' : `${state === 'booked' ? 'booked' : 'partly booked'}: ${titles.join(', ')}`;
            return (
              <button
                key={j}
                type="button"
                disabled={disabled || state === 'booked'}
                onClick={() => clickSlot(r, slot)}
                aria-label={`${r.name}, ${(slotValue(r, slot, hourFormat, range.scale) as { label?: string }).label ?? ''}, ${status}`}
                data-availability={state}
                data-selected={isSelected || undefined}
                data-today={todayColumn || undefined}
                className={cn('ucs-slot', j > 0 && slot.edge && 'is-edge', !disabled && 'is-live')}
              />
            );
          })}
        </div>
        {(entry?.items || []).slice(0, MAX_ROW_BOOKINGS).map((b) => {
          const custom = colors[b.status.toLowerCase()];
          const tone = custom || (b.tone ? TONE_VAR[b.tone] : ACCENT);
          const isSelected =
            highlight && selected?.kind === 'booking' && selected.resource === r.key && selected.key === b.key;
          const cancelled = /\bcancel/i.test(b.status);
          const second = [b.time, b.subtitle].filter(Boolean).join(' · ');
          const barPx = axisWidth * (b.width / 100) - 4;
          const face = bookingFace(barPx, laneHeight, !!second);
          return (
            <button
              key={b.key}
              type="button"
              disabled={disabled}
              onClick={() => clickBooking(r, b)}
              title={[b.title, second, b.status].filter(Boolean).join(' · ')}
              aria-pressed={isSelected}
              data-selected={isSelected || undefined}
              data-booking={b.key}
              data-tone={b.tone || undefined}
              className={cn('ucs-booking', barPx < 56 && 'is-tight', cancelled && 'is-cancelled')}
              style={
                {
                  left: `calc(${b.left}% + 2px)`,
                  width: `calc(${b.width}% - 4px)`,
                  minWidth: barMin,
                  top: PAD + b.lane * (laneHeight + LANE_GAP),
                  height: laneHeight,
                  '--bk-tone': tone,
                } as React.CSSProperties
              }
            >
              <span
                className={cn(
                  'ucs-booking-title',
                  face.titleLines === 2 && /\s/.test(b.title.trim()) ? 'ucs-clamp2' : 'uc-truncate'
                )}
              >
                {b.title || 'Booking'}
              </span>
              {face.showSecond ? <span className="ucs-booking-second uc-truncate">{second}</span> : null}
            </button>
          );
        })}
        {(entry?.items.length ?? 0) > MAX_ROW_BOOKINGS ? (
          <span className="ucs-more" role="note">
            +{(entry?.items.length ?? 0) - MAX_ROW_BOOKINGS} more
          </span>
        ) : null}
      </div>
    </div>
  );
};

export const Schedule = () => {
  const [resources] = ToolJet.useStateArray({
    name: 'resources',
    label: 'Resources',
    description:
      "['Atlas', 'Cove'] or [{ id, name, caption, avatar }]; empty: the distinct values of the bookings' resource field.",
    initialValue: [
      { id: 'atlas', name: 'Atlas', caption: '8 seats' },
      { id: 'borealis', name: 'Borealis', caption: '4 seats' },
      { id: 'cove', name: 'Cove', caption: '12 seats, screen' },
      { id: 'dune', name: 'Dune', caption: '2 seats' },
    ],
  });
  const [bookings] = ToolJet.useStateArray({
    name: 'bookings',
    label: 'Bookings',
    description:
      "Rows read through the fields below. Times: ISO, 'YYYY-MM-DD HH:mm', 'HH:mm' on the shown day, or 'YYYY-MM-DD' for a whole day.",
    initialValue: [
      {
        id: 1,
        room: 'atlas',
        title: 'Design review',
        start: '09:00',
        end: '10:30',
        status: 'Confirmed',
        host: 'Maya Chen',
      },
      {
        id: 2,
        room: 'atlas',
        title: '1:1 with Owen',
        start: '11:00',
        end: '11:30',
        status: 'Tentative',
        host: 'Owen Hart',
      },
      {
        id: 3,
        room: 'borealis',
        title: 'Sprint planning',
        start: '10:00',
        end: '12:00',
        status: 'Confirmed',
        host: 'Priya Nair',
      },
      {
        id: 4,
        room: 'cove',
        title: 'All hands',
        start: '13:00',
        end: '14:00',
        status: 'Confirmed',
        host: 'Leo Martins',
      },
      {
        id: 5,
        room: 'cove',
        title: 'Customer call',
        start: '15:30',
        end: '16:30',
        status: 'Pending',
        host: 'Maya Chen',
      },
      { id: 6, room: 'dune', title: 'Interview', start: '14:00', end: '15:00', status: 'Cancelled', host: 'Grace Ho' },
    ],
  });
  const [resourceField] = ToolJet.useStateString({
    name: 'resourceField',
    label: "Resource field (a resource's id or name)",
    initialValue: 'room',
  });
  const [startField] = ToolJet.useStateString({ name: 'startField', label: 'Start field', initialValue: 'start' });
  const [endField] = ToolJet.useStateString({ name: 'endField', label: 'End field', initialValue: 'end' });
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: 'title' });
  const [subtitleField] = ToolJet.useStateString({
    name: 'subtitleField',
    label: 'Second line field',
    initialValue: '',
  });
  const [statusField] = ToolJet.useStateString({
    name: 'statusField',
    label: 'Status field (toned by its words)',
    initialValue: 'status',
  });
  const [idField] = ToolJet.useStateString({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [scale] = ToolJet.useStateEnumeration({
    name: 'scale',
    label: 'Time across',
    enumDefinition: ['hours', 'days'],
    enumLabels: { hours: 'Hours', days: 'Days' },
    initialValue: 'hours',
    inspector: 'switch',
  });
  const [date] = ToolJet.useStateString({ name: 'date', label: 'Date shown (empty for today)', initialValue: '' });
  const [dayStart] = ToolJet.useStateNumber({
    name: 'dayStart',
    label: 'Day starts at (hour, or a time such as 09:00)',
    initialValue: 8,
  });
  const [dayEnd] = ToolJet.useStateNumber({
    name: 'dayEnd',
    label: 'Day ends at (hour, or a time such as 18:00)',
    initialValue: 18,
  });
  const [slotMinutes] = ToolJet.useStateNumber({
    name: 'slotMinutes',
    label: 'Slot length (minutes)',
    initialValue: 30,
  });
  const [days] = ToolJet.useStateNumber({
    name: 'days',
    label: 'Days shown',
    initialValue: 7,
    visibleWhen: { key: 'scale', value: 'days' },
  });
  const [hourFormat] = ToolJet.useStateEnumeration({
    name: 'hourFormat',
    label: 'Hour format',
    enumDefinition: ['12h', '24h'],
    enumLabels: { '12h': '12h', '24h': '24h' },
    initialValue: '12h',
    inspector: 'switch',
  });
  const [resourceTitle] = ToolJet.useStateString({
    name: 'resourceTitle',
    label: 'Resource column title',
    initialValue: 'Room',
  });
  const [resourceWidth] = ToolJet.useStateNumber({
    name: 'resourceWidth',
    label: 'Resource column width (px)',
    initialValue: 168,
  });
  const [rowHeight] = ToolJet.useStateNumber({ name: 'rowHeight', label: 'Row height (px)', initialValue: 56 });
  const [showNowLine] = ToolJet.useStateBoolean({
    name: 'showNowLine',
    label: 'Show the current time',
    initialValue: true,
  });
  const [highlightSelected] = ToolJet.useStateBoolean({
    name: 'highlightSelected',
    label: 'Highlight the selected booking',
    initialValue: true,
  });
  const [emptyText] = ToolJet.useStateString({
    name: 'emptyText',
    label: 'Empty text',
    initialValue: 'No resources to schedule',
  });
  const [statusColors] = ToolJet.useStateObject({
    name: 'statusColors',
    label: 'Status colors',
    description: "Colors by status word, over the tones: { 'on site': '#0ea5e9' }.",
    initialValue: {},
  });
  const [, setSelectedBooking] = ToolJet.useStateObject({
    name: 'selectedBooking',
    initialValue: {},
    inspector: 'hidden',
  });
  const [, setSelectedBookingId] = ToolJet.useStateString({
    name: 'selectedBookingId',
    initialValue: null as unknown as string,
    inspector: 'hidden',
  });
  const [, setSelectedSlot] = ToolJet.useStateObject({ name: 'selectedSlot', initialValue: {}, inspector: 'hidden' });
  const onBookingClicked = ToolJet.useEventCallback({ name: 'onBookingClicked' });
  const onSlotClicked = ToolJet.useEventCallback({ name: 'onSlotClicked' });
  const backgroundColor = useColorStyle('backgroundColor', 'Background', TOKEN.surface);
  const borderColor = useColorStyle('borderColor', 'Grid line color', TOKEN.border);
  const textColor = useColorStyle('textColor', 'Label color', TOKEN.mutedText);
  const accentColor = useColorStyle(
    'accentColor',
    'Booking accent (bookings without a status, the selection)',
    TOKEN.brand
  );
  const nowColor = useColorStyle('nowColor', 'Current time line color', TOKEN.error);
  const borderRadius = useThemeRadius('borderRadius', 'Radius');
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'schedule', fit: false, loading: 'own', defaultWidth: 43, defaultHeight: 30 });
  const { disabled } = useBusy(false);

  // The range is fixed for the day it was drawn on; the clock below moves `today` on when the day turns.
  const [today, setToday] = useState(() => dayKey(new Date()));
  const stableDate = useStable(date);
  const resourceRows = useStable(resources);
  const rows = useStable(bookings);
  const range = useMemo(
    () =>
      scheduleRange(
        { scale, date: stableDate, dayStart, dayEnd, days, slotMinutes, hourFormat },
        startDay(today).getTime()
      ),
    [scale, stableDate, dayStart, dayEnd, days, slotMinutes, hourFormat, today]
  );
  const resourceList = useMemo(
    () => scheduleResources(resourceRows, rows, resourceField),
    [resourceRows, rows, resourceField]
  );
  const { placed, problems } = useMemo(() => {
    const found: BookingProblem[] = [];
    const fields = { resourceField, startField, endField, titleField, subtitleField, statusField, idField, hourFormat };
    return { placed: placeBookings(rows, fields, range, resourceList, found), problems: found };
  }, [
    rows,
    resourceField,
    startField,
    endField,
    titleField,
    subtitleField,
    statusField,
    idField,
    hourFormat,
    range,
    resourceList,
  ]);
  const badDate =
    stableDate !== undefined && stableDate !== null && toText(stableDate).trim() !== '' && !parseTime(stableDate);
  const notes = [
    badDate ? `The date "${toText(stableDate)}" is not a date; showing today.` : '',
    problems.length
      ? `${problems.length} booking${problems.length === 1 ? '' : 's'} not shown: ${problems.length === 1 ? 'its' : 'their'} dates are not valid.`
      : '',
  ].filter(Boolean);

  const tracks = useMemo(() => slotTracks(range), [range]);
  const axisMin = useMemo(() => timelineMinWidth(range, placed), [range, placed]);
  const [shownCount, setShownCount] = useState(RESOURCES_PER_STEP);
  const [pick, setPick] = useState<SchedulePick | null>(null);
  const selected = useMemo(
    () => resolveSelection(pick, placed, resourceList, range, hourFormat),
    [pick, placed, resourceList, range, hourFormat]
  );
  const expose = (sel: ScheduleSelected | null) => {
    const e = selectionExposed(sel);
    setSelectedBooking(e.selectedBooking as Record<string, unknown>);
    setSelectedBookingId(e.selectedBookingId as string);
    setSelectedSlot(e.selectedSlot as Record<string, unknown>);
  };
  useEffect(() => expose(selected), [JSON.stringify(selectionExposed(selected))]); // eslint-disable-line react-hooks/exhaustive-deps
  const highlight = highlightSelected !== false;
  const choose = (next: SchedulePick, fire: () => void) => {
    setPick(next);
    expose(resolveSelection(next, placed, resourceList, range, hourFormat));
    fire();
  };
  const clickBooking = (r: ScheduleResource, item: PlacedBooking) =>
    !disabled && choose({ kind: 'booking', resource: r.key, key: item.key }, onBookingClicked);
  const clickSlot = (r: ScheduleResource, slot: ScheduleSlot) =>
    !disabled && choose({ kind: 'slot', resource: r.key, start: slot.start, end: slot.end }, onSlotClicked);

  // The axis is drawn at least axisMin wide; its width as drawn sizes the bookings' faces.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setFrameWidth(el.clientWidth));
    ro.observe(el);
    setFrameWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [resourceList.length > 0]);
  const rw = bounded(resourceWidth, 168, 80, 400);
  const rh = bounded(rowHeight, 56, 32, 160);
  const axisWidth = Math.max(frameWidth - rw, axisMin);

  // The now-line moves with the clock without drawing the schedule again: its position is a CSS variable.
  const nowRef = useRef<HTMLDivElement | null>(null);
  const holdsToday = range.scale === 'days' ? range.columns.some((c) => c.today) : !!range.today;
  const showNow = showNowLine !== false && holdsToday;
  const placeNow = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const pos = positionOf(range, Date.now());
      el.style.display = pos === null ? 'none' : '';
      el.style.setProperty('--now', String((pos ?? 0) / 100));
    },
    [range]
  );
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

  const colors = Object.fromEntries(
    Object.entries(
      statusColors && typeof statusColors === 'object' ? (statusColors as Record<string, unknown>) : {}
    ).map(([k, v]) => [k.toLowerCase(), toText(v)])
  );
  const vars = lookVars({
    '--lk-bg': backgroundColor,
    '--lk-border': borderColor,
    '--lk-fg': textColor,
    '--lk-accent': accentColor,
    '--lk-now': nowColor,
    '--ui-radius': borderRadius,
  });
  const shown = resourceList.slice(0, shownCount);
  const remaining = resourceList.length - shownCount;

  return (
    <LoadingFrame
      loading={ld.loading}
      minHeight={200}
      look={ld.skeleton ? <ScheduleSkel rowHeight={Number(rowHeight) || 56} /> : <LoadingBox />}
    >
      <div className="ui uc ucs" style={vars}>
        {!resourceList.length ? (
          <div className="ucs-frame ucs-empty">{emptyText || 'No resources to schedule'}</div>
        ) : (
          <div className="ucs-frame" data-scale={range.scale}>
            <div ref={scrollRef} className="ucs-scroll" style={{ scrollPaddingLeft: rw }}>
              <div className="ucs-inner" style={{ minWidth: rw + axisMin, ['--rw' as string]: `${rw}px` }}>
                <div className="ucs-head">
                  <div className="ucs-res-title" style={{ width: rw }}>
                    <span className="uc-truncate">{resourceHeading(resourceTitle)}</span>
                  </div>
                  <div className="ucs-cols">
                    {range.columns.map((c) => (
                      <div key={c.key} className={cn('ucs-col', c.today && 'is-today')}>
                        <span className="ucs-col-label">{c.label}</span>
                        {c.sub ? <span className="ucs-col-sub">{c.sub}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  {shown.map((r) => (
                    <ScheduleRow
                      key={r.key}
                      r={r}
                      entry={placedOn(placed, r.key)}
                      rowHeight={rh}
                      rw={rw}
                      range={range}
                      selected={selected}
                      highlight={highlight}
                      disabled={disabled}
                      hourFormat={hourFormat}
                      axisWidth={axisWidth}
                      tracks={tracks}
                      colors={colors}
                      clickSlot={clickSlot}
                      clickBooking={clickBooking}
                    />
                  ))}
                  {showNow ? (
                    <div
                      ref={(el) => {
                        nowRef.current = el;
                        placeNow(el);
                      }}
                      className="ucs-now"
                      style={{ left: 'calc(var(--rw) + (100% - var(--rw)) * var(--now, 0))' }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </div>
            </div>
            {remaining > 0 ? (
              <div className="ucs-show-more">
                <button
                  type="button"
                  className="ui-btn ui-btn--sm ui-btn--ghost ui-btn--auto"
                  onClick={() => setShownCount((n) => n + RESOURCES_PER_STEP)}
                >
                  {`Show ${Math.min(remaining, RESOURCES_PER_STEP)} more of ${remaining}`}
                </button>
              </div>
            ) : null}
          </div>
        )}
        {notes.length ? (
          <div
            role="note"
            className="ucs-notice"
            title={problems
              .map(
                (x) => `${x.title || 'Booking'}${x.id != null && x.id !== '' ? ` (${toText(x.id)})` : ''}: ${x.problem}`
              )
              .join('\n')}
          >
            {notes.join(' ')}
          </div>
        ) : null}
      </div>
    </LoadingFrame>
  );
};
