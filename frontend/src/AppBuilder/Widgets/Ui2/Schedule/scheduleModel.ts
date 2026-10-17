// ToolJet UI 2.0: the pure logic of the Schedule (Schedule.tsx): the visible range and its columns, the
// resources down the side, and the bookings placed on them in lanes. Every function takes whatever the author bound
// and never throws.
import { chipTone } from '@/AppBuilder/Widgets/Ui2/_shared/chipTone';
import type {
  BookingFields,
  PlacedBooking,
  PlacedBookings,
  Row,
  ScheduleColumn,
  ScheduleRange,
  ScheduleResource,
  ScheduleSlot,
  SlotSelection,
} from './scheduleTypes';
import { clampNumber, isNonBlankString, pad2, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import {
  addDays,
  clockText,
  dayKey,
  hourOf,
  hourText,
  int,
  midnight,
  nextMidnight,
  parseTime,
  startDay,
} from './scheduleTime';

export { clockText, dayKey, parseTime, startDay };

const HOUR = 3600000;
export const MAX_DAYS = 31;
export const MAX_SLOTS = 96;
export const MAX_LANES = 4;
/** The bookings a resource's row draws; it says how many more it has (every booking is placed). */
export const MAX_ROW_BOOKINGS = 200;

/** Hands out unique keys: an id the first time, then id~1, id~2 ... remembering per id where the search stopped, so
 *  n repeats of one id cost n checks, not n(n+1)/2 (a key that already exists, such as an id 'a~1', is skipped). */
const keyAllocator = () => {
  const taken = new Set<string>();
  const nextSuffix = new Map<string, number>();
  return (base: string): string => {
    let key = base;
    if (taken.has(key)) {
      let n = nextSuffix.get(base) ?? 1;
      while (taken.has(`${base}~${n}`)) n++;
      key = `${base}~${n}`;
      nextSuffix.set(base, n + 1);
    }
    taken.add(key);
    return key;
  };
};

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The visible range: { scale, start, end, columns: [{ key, start, end, label, sub, today }], slots: [{ start, end,
 *  edge }], dayStart, dayEnd }. 'hours' shows dayStart to dayEnd of one day, a column an hour, slots of slotMinutes
 *  (at most MAX_SLOTS); 'days' shows `days` days (1 to MAX_DAYS), a column and a slot a day. */
export const scheduleRange = (
  {
    scale = 'hours',
    date,
    dayStart = 8,
    dayEnd = 18,
    days = 7,
    slotMinutes = 30,
    hourFormat = '12h',
  }: {
    scale?: unknown;
    date?: unknown;
    dayStart?: unknown;
    dayEnd?: unknown;
    days?: unknown;
    slotMinutes?: unknown;
    hourFormat?: unknown;
  } = {},
  now: number = Date.now()
): ScheduleRange => {
  const first = startDay(date, now);
  const todayKey = dayKey(new Date(now));
  if (scale === 'days') {
    const count = clampNumber(int(days, 7), 1, MAX_DAYS);
    const columns = Array.from({ length: count }, (_, i): ScheduleColumn => {
      const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
      const next = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i + 1);
      return {
        key: dayKey(d),
        start: d.getTime(),
        end: next.getTime(),
        label: WEEKDAY[d.getDay()],
        sub: d.getDate() === 1 || i === 0 ? `${d.getDate()} ${MONTH[d.getMonth()]}` : String(d.getDate()),
        today: dayKey(d) === todayKey,
      };
    });
    return {
      scale: 'days',
      start: columns[0].start,
      end: columns[count - 1].end,
      columns,
      slots: columns.map((c) => ({ start: c.start, end: c.end, edge: true })),
    };
  }
  const from = clampNumber(hourOf(dayStart, 8, false), 0, 23);
  const to = clampNumber(hourOf(dayEnd, 18, true), from + 1, 24);
  const at = (h: number): number => new Date(first.getFullYear(), first.getMonth(), first.getDate(), h).getTime();
  // The hours run in elapsed time from dayStart to dayEnd. Where the clocks change, the hour they skip is not on the
  // axis and the hour they repeat is on it twice (the second labelled so); a wall time built for each slot instead
  // normalised 02:30 to 03:30 on the day the clocks went forward and gave a slot that ran backwards.
  const start = at(from);
  const end = Math.max(at(to), start + HOUR); // never empty, even for hours the clocks skip altogether
  const seen = new Map<string, number>();
  const columns: ScheduleColumn[] = [];
  for (let t = start; t < end; t += HOUR) {
    const d = new Date(t);
    const label = hourText(d.getHours(), d.getMinutes(), hourFormat);
    const repeat = (seen.get(label) ?? 0) + 1;
    seen.set(label, repeat);
    columns.push({
      key: repeat === 1 ? String(d.getHours()) : `${d.getHours()}~${repeat}`,
      start: t,
      end: Math.min(end, t + HOUR),
      label: repeat === 1 ? label : `${label} (2nd)`,
      sub: '',
      today: false,
    });
  }
  const span = Math.round((end - start) / 60000);
  // Slots divide the hour evenly where they can, and never number more than MAX_SLOTS.
  let step = clampNumber(int(slotMinutes, 30), 5, 240);
  step = Math.max(step, Math.ceil(span / MAX_SLOTS));
  const slots: ScheduleSlot[] = [];
  for (let m = 0; m < span; m += step) {
    const slotStart = start + m * 60000;
    slots.push({
      start: slotStart,
      end: Math.min(end, start + (m + step) * 60000),
      edge: new Date(slotStart).getMinutes() === 0,
    });
  }
  return { scale: 'hours', start, end, columns, slots, today: dayKey(first) === todayKey };
};

/** Where `ms` falls in the range, 0 to 100, or null outside it. The columns are drawn the same width, so a time is
 *  placed in its column by the part of that column it has reached: a day where the clocks change has 23 or 25 hours,
 *  and an elapsed-time share of the whole range put its bookings past or short of its column. */
export const positionOf = (range: ScheduleRange | null | undefined, ms: number): number | null => {
  if (!range || !Number.isFinite(ms) || ms < range.start || ms > range.end) return null;
  const { columns } = range;
  if (!columns.length) return ((ms - range.start) / (range.end - range.start)) * 100;
  let i = columns.findIndex((c) => ms < c.end);
  if (i === -1) i = columns.length - 1;
  const c = columns[i];
  const within = c.end > c.start ? Math.min(1, Math.max(0, (ms - c.start) / (c.end - c.start))) : 0;
  return ((i + within) / columns.length) * 100;
};

/** The slots' widths as grid tracks, on the same axis as positionOf (a short last slot is drawn short). */
export const slotTracks = (range: ScheduleRange): string =>
  range.slots
    .map(
      (s) =>
        `minmax(0, ${Math.max(0, (positionOf(range, s.end) ?? 0) - (positionOf(range, s.start) ?? 0)).toFixed(4)}fr)`
    )
    .join(' ');

/** Resources down the side: [{ key, id, name, caption, avatar }] from ['Room A'] or [{ id, name (or label, title),
 *  caption (or subtitle, role), avatar }]. With none given, the distinct values of the bookings' resourceField, in
 *  order of appearance. Repeated ids are kept apart. */
export const scheduleResources = (
  resources: unknown,
  bookings: unknown,
  resourceField: unknown
): ScheduleResource[] => {
  let list: (Row | string | number | null | undefined)[] = Array.isArray(resources) ? resources : [];
  if (!list.length && Array.isArray(bookings) && isNonBlankString(resourceField)) {
    const seen = new Set<string>();
    list = [];
    for (const b of bookings) {
      const v = b && typeof b === 'object' ? toText(b[resourceField]).trim() : '';
      if (v && !seen.has(v)) {
        seen.add(v);
        list.push(v);
      }
      if (list.length >= 1000) break;
    }
  }
  const uniqueKey = keyAllocator();
  return list.flatMap((r, index): ScheduleResource[] => {
    let entry: Omit<ScheduleResource, 'key'>;
    if (typeof r === 'string' || typeof r === 'number') {
      const name = String(r).trim();
      if (!name) return [];
      entry = { id: name, name, caption: '', avatar: '' };
    } else if (r && typeof r === 'object' && !Array.isArray(r)) {
      const name = toText(r.name ?? r.label ?? r.title).trim();
      const id = toText(r.id ?? r.value ?? r.key).trim() || name;
      if (!id && !name) return [];
      entry = {
        id,
        name: name || id,
        caption: toText(r.caption ?? r.subtitle ?? r.role ?? r.description).trim(),
        avatar: toText(r.avatar ?? r.image).trim(),
      };
    } else return [];
    return [{ key: uniqueKey(entry.id || String(index)), ...entry }];
  });
};

const TONES: readonly string[] = ['success', 'warning', 'danger', 'info', 'neutral'];
/** A booking's tone from its status: a tone name, else its words (Confirmed green, Tentative amber, Cancelled red,
 *  Booked blue); '' (the accent) when it has none. */
export const bookingTone = (status: unknown): string => {
  if (!isNonBlankString(status)) return '';
  const word = status.trim().toLowerCase();
  if (TONES.includes(word)) return word;
  const tone = chipTone(status);
  return tone === 'neutral' ? (/\b(tentative|hold|optional)\b/.test(word) ? 'warning' : '') : tone;
};

/** Bookings placed on the range, per resource key: { [key]: { lanes, items: [{ key, id, row, index, title, subtitle,
 *  status, tone, start, end, left, width, lane, time }] } }. A booking matches a resource by its id or its name; one
 *  with no end lasts an hour (a day on the days scale); a day without a time on the days scale runs to the end of that
 *  day. Bookings outside the range, without a start or a resource, are left out; overlapping bookings of a resource
 *  take lanes (at most MAX_LANES; more share the last). */
export const placeBookings = (
  bookings: unknown,
  fields: BookingFields = {},
  range: ScheduleRange | null | undefined,
  resources: ScheduleResource[] = []
): PlacedBookings => {
  const out: PlacedBookings = {};
  if (!Array.isArray(bookings) || !range) return out;
  const f = fields || {};
  const byId = new Map<string, string>();
  for (const r of resources) {
    if (!byId.has(r.id)) byId.set(r.id, r.key);
    if (!byId.has(r.name)) byId.set(r.name, r.key);
  }
  const day = new Date(range.start);
  const days = range.scale === 'days';
  const field = (row: Row, name: unknown): unknown => (isNonBlankString(name) ? row[name] : undefined);
  bookings.forEach((row: Row, index: number) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return;
    const resourceKey = byId.get(toText(field(row, f.resourceField)).trim());
    if (resourceKey === undefined) return;
    const start = parseTime(field(row, f.startField), day);
    if (!start) return;
    const endParsed = parseTime(field(row, f.endField), new Date(start.time));
    let end: number;
    // A day is a calendar day (to the next local midnight), not 24 hours: a day can have 23 or 25.
    const dayAfter = start.dateOnly ? nextMidnight(start.time) : addDays(start.time, 1);
    if (endParsed) end = endParsed.dateOnly && days ? nextMidnight(endParsed.time) : endParsed.time;
    else end = start.dateOnly || days ? dayAfter : start.time + HOUR;
    if (end <= start.time) end = days ? dayAfter : start.time + HOUR / 2;
    if (end <= range.start || start.time >= range.end) return;
    // On the days scale a timed booking shorter than a day fills its day: placed by its time of day, a one-hour class
    // was a 10px sliver with no room for its title (a gym's week, 2026-10-14). Its own time stays in `time`.
    const wholeDay = days && !start.dateOnly && end < dayAfter;
    const spanStart = wholeDay ? midnight(new Date(start.time)).getTime() : start.time;
    const spanEnd = wholeDay ? nextMidnight(spanStart) : end;
    const left = positionOf(range, Math.max(spanStart, range.start)) ?? 0;
    const right = positionOf(range, Math.min(spanEnd, range.end)) ?? 100;
    const status = toText(field(row, f.statusField)).trim();
    const id = isNonBlankString(f.idField) ? row[f.idField] : row.id;
    const fmt = f.hourFormat === '24h' ? '24h' : '12h';
    const time =
      days && (start.dateOnly || endParsed?.dateOnly) ? '' : `${clockText(start.time, fmt)} to ${clockText(end, fmt)}`;
    if (!out[resourceKey]) out[resourceKey] = { lanes: 1, items: [] };
    out[resourceKey].items.push({
      key: toText(id) || `#${index}`,
      id: id ?? null,
      row,
      index,
      title: toText(field(row, f.titleField)).trim(),
      subtitle: toText(field(row, f.subtitleField)).trim(),
      status: TONES.includes(status.toLowerCase()) ? '' : status,
      tone: bookingTone(status),
      start: start.time,
      end,
      spanStart,
      spanEnd,
      left,
      width: right - left,
      time,
      lane: 0,
    });
  });
  for (const entry of Object.values(out)) {
    entry.items.sort((a, b) => a.start - b.start || b.end - a.end);
    const laneEnds: number[] = [];
    const uniqueKey = keyAllocator();
    for (const item of entry.items) {
      let lane = laneEnds.findIndex((t) => t <= item.spanStart);
      if (lane === -1) lane = laneEnds.length < MAX_LANES ? laneEnds.length : MAX_LANES - 1;
      laneEnds[lane] = Math.max(laneEnds[lane] ?? 0, item.spanEnd);
      item.lane = lane;
      item.key = uniqueKey(item.key);
    }
    entry.lanes = Math.max(1, laneEnds.length);
  }
  return out;
};

/** A slot's availability on its resource: 'booked' when bookings cover all of it, 'partly' when they cover some,
 *  else 'free', with the titles of the bookings in it. A booking's own times count, not the whole day it is drawn
 *  across on the days scale, and a cancelled booking takes no time. */
export const slotAvailability = (
  slot: ScheduleSlot,
  items: readonly PlacedBooking[] = []
): { state: 'free' | 'partly' | 'booked'; titles: string[] } => {
  const inSlot = items
    .filter((b) => !/\bcancel/i.test(b.status) && b.start < slot.end && b.end > slot.start)
    .sort((a, b) => a.start - b.start);
  if (!inSlot.length) return { state: 'free', titles: [] };
  let reached = slot.start;
  for (const b of inSlot) if (b.start <= reached) reached = Math.max(reached, b.end);
  return {
    state: reached >= slot.end ? 'booked' : 'partly',
    titles: [...new Set(inSlot.map((b) => b.title || 'Booking'))],
  };
};

/** A slot as the app reads it: the resource, ISO start and end, the local day and times, and a label ('9:30 AM to
 *  10 AM', or the day on the days scale). */
export const slotValue = (
  resource: ScheduleResource | null | undefined,
  slot: ScheduleSlot | null | undefined,
  hourFormat: unknown = '12h',
  scale = 'hours'
): SlotSelection | Record<string, never> => {
  if (!resource || !slot) return {};
  const clock = (ms: number) => {
    const d = new Date(ms);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  return {
    resourceId: resource.id,
    resource: resource.name,
    start: new Date(slot.start).toISOString(),
    end: new Date(slot.end).toISOString(),
    date: dayKey(new Date(slot.start)),
    startTime: clock(slot.start),
    endTime: clock(slot.end),
    label:
      scale === 'days'
        ? (() => {
            const d = new Date(slot.start);
            return `${WEEKDAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;
          })()
        : `${clockText(slot.start, hourFormat)} to ${clockText(slot.end, hourFormat)}`,
  };
};

/** How a booking's face fits its box: a title line and a second line (time, subtitle) when the booking is 110px wide and
 *  its lane 34px tall; a narrower booking gives its title both lines and drops the second, which its place on the grid
 *  already says (bookings in 30-minute slots read "Ju... 11:...", both lines cut, 2026-10-14). The tooltip has it all. */
export const bookingFace = (
  widthPx: number,
  laneHeight: number,
  hasSecond: boolean
): { titleLines: number; showSecond: boolean } => {
  const twoLines = laneHeight >= 34;
  const narrow = Number.isFinite(widthPx) && widthPx > 0 && widthPx < 110;
  return { titleLines: twoLines && narrow ? 2 : 1, showSecond: Boolean(hasSecond) && twoLines && !narrow };
};

/** The resource column's heading as written, a field name read as words: resourceTitle="boat_name" headed a schedule
 *  "Boat_name" (2026-10-14). The first letter is capitalised. */
export const resourceHeading = (value: unknown): string => {
  const raw = value === null || value === undefined ? '' : String(value).trim();
  const words = /^[A-Za-z][A-Za-z0-9]*([_-][A-Za-z0-9]+)+$|^[a-z]+[A-Z][A-Za-z0-9]*$/.test(raw)
    ? raw
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .toLowerCase()
    : raw;
  return words.replace(/^[a-z]/, (ch) => ch.toUpperCase());
};
