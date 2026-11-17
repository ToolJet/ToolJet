// UI 2.0's Schedule model (Ui2/Schedule/scheduleModel.ts, scheduleTime.ts, scheduleLayout.ts, scheduleSelection.ts):
// the visible range and its columns and slots, the resources down the side, the bookings placed on them in lanes, and
// the selection. Every function takes whatever the author bound and never throws. Days are local calendar days.

export type Row = Record<string, unknown>;

export interface ScheduleColumn {
  key: string;
  start: number;
  end: number;
  label: string;
  sub: string;
  today: boolean;
}
export interface ScheduleSlot {
  start: number;
  end: number;
  edge: boolean;
}
export interface ScheduleRange {
  scale: 'hours' | 'days';
  start: number;
  end: number;
  columns: ScheduleColumn[];
  slots: ScheduleSlot[];
  today?: boolean;
}
export interface ScheduleResource {
  key: string;
  id: string;
  name: string;
  caption: string;
  avatar: string;
}
export interface PlacedBooking {
  key: string;
  id: unknown;
  row: Row;
  index: number;
  title: string;
  subtitle: string;
  status: string;
  tone: string;
  start: number;
  end: number;
  spanStart: number;
  spanEnd: number;
  left: number;
  width: number;
  time: string;
  lane: number;
}
export type PlacedBookings = Record<string, { lanes: number; items: PlacedBooking[] }>;
export interface SlotSelection {
  resourceId: string;
  resource: string;
  start: string;
  end: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
}
export type ScheduleSelected =
  | { kind: 'booking'; resource: string; key: string; item: PlacedBooking }
  | { kind: 'slot'; resource: string; index: number; value: SlotSelection | Record<string, never> };
export type SchedulePick = { kind: 'booking'; resource: string; key: string } | { kind: 'slot'; resource: string; start: number; end: number };
export interface BookingFields {
  resourceField?: unknown;
  startField?: unknown;
  endField?: unknown;
  titleField?: unknown;
  subtitleField?: unknown;
  statusField?: unknown;
  idField?: unknown;
  hourFormat?: unknown;
}
export interface BookingProblem {
  index: number;
  id: unknown;
  title: string;
  problem: string;
}

const HOUR = 3600000;
export const MAX_DAYS = 31;
export const MAX_SLOTS = 96;
export const MAX_LANES = 4;
export const MAX_ROW_BOOKINGS = 200;

const pad2 = (n: number) => String(n).padStart(2, '0');
const clampNumber = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const isNonBlankString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
export const toText = (v: unknown): string =>
  v === null || v === undefined ? '' : typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '';
const isBlank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && !v.trim());

// ---- Time ------------------------------------------------------------------------------------------------------------

export const int = (v: unknown, fallback: number): number => {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return fallback;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : fallback;
};

/** An hour of the day from a number (9) or a clock time ('09:00', '5:30 PM'); an end rounds up to the next hour. */
export const hourOf = (v: unknown, fallback: number, roundUp: boolean): number => {
  const clock = typeof v === 'string' ? v.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i) : null;
  if (!clock) return int(v, fallback);
  let h = Number(clock[1]) % (clock[3] ? 12 : 24);
  if (clock[3] && /^p/i.test(clock[3])) h += 12;
  if (!clock[3] && Number(clock[1]) === 24) h = 24;
  return roundUp && Number(clock[2] || 0) > 0 ? h + 1 : h;
};

export const midnight = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** `ms` moved by `days` calendar days at the same wall time. */
export const addDays = (ms: number, days: number): number => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()).getTime();
};

export const nextMidnight = (ms: number): number => addDays(midnight(new Date(ms)).getTime(), 1);

export const dayKey = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const isRealDateText = (text: string): boolean => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/.exec(text.trim());
  if (!m) return true;
  const [year, month, day, hour, minute, second] = m.slice(1).map((f) => (f === undefined ? 0 : Number(f)));
  if (month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate()) return false;
  return hour <= 23 && minute <= 59 && second <= 59;
};

/** A time from a binding: a Date, a timestamp, 'YYYY-MM-DD' (a day), 'HH:mm' or '9:30 am' (that time on `day`), or any
 *  date text with a four-digit year. { time, dateOnly } in ms, or null. */
export const parseTime = (v: unknown, day?: Date): { time: number; dateOnly: boolean } | null => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : { time: v.getTime(), dateOnly: false };
  if (typeof v === 'number') return Number.isFinite(v) ? { time: v, dateOnly: false } : null;
  if (!isNonBlankString(v) || v.length > 64) return null;
  const s = v.trim();
  if (!isRealDateText(s)) return null;
  const date = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (date) {
    const d = new Date(Number(date[1]), Number(date[2]) - 1, Number(date[3]));
    return Number.isNaN(d.getTime()) || d.getMonth() !== Number(date[2]) - 1 ? null : { time: d.getTime(), dateOnly: true };
  }
  const clock = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (clock && (clock[2] !== undefined || clock[3])) {
    let h = Number(clock[1]);
    const m = Number(clock[2] || 0);
    if (clock[3]) {
      if (h < 1 || h > 12) return null;
      h = (h % 12) + (/pm/i.test(clock[3]) ? 12 : 0);
    }
    if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
    const base = day instanceof Date && !Number.isNaN(day.getTime()) ? day : midnight(new Date());
    return { time: new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m).getTime(), dateOnly: false };
  }
  const local = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (local) {
    const d = new Date(+local[1], +local[2] - 1, +local[3], +local[4], +local[5], +(local[6] || 0));
    return Number.isNaN(d.getTime()) ? null : { time: d.getTime(), dateOnly: false };
  }
  if (!/\d{4}/.test(s)) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : { time: d.getTime(), dateOnly: false };
};

export const startDay = (date: unknown, now: number = Date.now()): Date => {
  const parsed = parseTime(date);
  return midnight(new Date(parsed ? parsed.time : now));
};

export const hourText = (h: number, m: number, format: unknown): string => {
  if (format === '24h') return `${pad2(h % 24)}:${pad2(m)}`;
  const suffix = h % 24 < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${pad2(m)} ${suffix}` : `${h12} ${suffix}`;
};

export const clockText = (ms: number, format: unknown = '12h'): string => {
  const d = new Date(ms);
  return hourText(d.getHours(), d.getMinutes(), format);
};

// ---- Range -----------------------------------------------------------------------------------------------------------

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

/** 'hours' shows dayStart to dayEnd of one day, a column an hour, slots of slotMinutes; 'days' shows `days` days (2 to
 *  MAX_DAYS), a column and a slot a day. One day on the days scale is drawn by its hours. */
export const scheduleRange = (
  { scale = 'hours', date, dayStart = 8, dayEnd = 18, days = 7, slotMinutes = 30, hourFormat = '12h' }: Record<string, unknown> = {},
  now: number = Date.now()
): ScheduleRange => {
  const first = startDay(date, now);
  const todayKey = dayKey(new Date(now));
  const count = clampNumber(int(days, 7), 1, MAX_DAYS);
  if (scale === 'days' && count > 1) {
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
    return { scale: 'days', start: columns[0].start, end: columns[count - 1].end, columns, slots: columns.map((c) => ({ start: c.start, end: c.end, edge: true })) };
  }
  const from = clampNumber(hourOf(dayStart, 8, false), 0, 23);
  const to = clampNumber(hourOf(dayEnd, 18, true), from + 1, 24);
  const at = (h: number): number => new Date(first.getFullYear(), first.getMonth(), first.getDate(), h).getTime();
  const start = at(from);
  const end = Math.max(at(to), start + HOUR);
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
  let step = clampNumber(int(slotMinutes, 30), 5, 240);
  step = Math.max(step, Math.ceil(span / MAX_SLOTS));
  const slots: ScheduleSlot[] = [];
  for (let m = 0; m < span; m += step) {
    const slotStart = start + m * 60000;
    slots.push({ start: slotStart, end: Math.min(end, start + (m + step) * 60000), edge: new Date(slotStart).getMinutes() === 0 });
  }
  return { scale: 'hours', start, end, columns, slots, today: dayKey(first) === todayKey };
};

/** Where `ms` falls in the range, 0 to 100 (placed in its column by the part of it reached), or null outside it. */
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

export const slotTracks = (range: ScheduleRange): string =>
  range.slots
    .map((s) => `minmax(0, ${Math.max(0, (positionOf(range, s.end) ?? 0) - (positionOf(range, s.start) ?? 0)).toFixed(4)}fr)`)
    .join(' ');

// ---- Resources and bookings ------------------------------------------------------------------------------------------

/** Resources from ['Room A'] or [{ id, name (or label, title), caption (or subtitle, role), avatar }]; with none given,
 *  every distinct value of the bookings' resourceField. */
export const scheduleResources = (resources: unknown, bookings: unknown, resourceField: unknown): ScheduleResource[] => {
  let list: unknown[] = Array.isArray(resources) ? resources : [];
  if (!list.length && Array.isArray(bookings) && isNonBlankString(resourceField)) {
    const seen = new Set<string>();
    list = [];
    for (const b of bookings) {
      const v = b && typeof b === 'object' ? toText((b as Row)[resourceField]).trim() : '';
      if (v && !seen.has(v)) {
        seen.add(v);
        list.push(v);
      }
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
      const o = r as Row;
      const name = toText(o.name ?? o.label ?? o.title).trim();
      const id = toText(o.id ?? o.value ?? o.key).trim() || name;
      if (!id && !name) return [];
      entry = { id, name: name || id, caption: toText(o.caption ?? o.subtitle ?? o.role ?? o.description).trim(), avatar: toText(o.avatar ?? o.image).trim() };
    } else return [];
    return [{ key: uniqueKey(entry.id || String(index)), ...entry }];
  });
};

// The native Table's status chip words (NewTable/_utils/chipTone.js), danger first.
const TONE_WORDS: [string, RegExp][] = [
  ['danger', /\b(overdue|out of stock|failed|failure|error|cancell?ed|rejected|declined|blocked|expired|lost|critical|urgent|high|severe|breach(ed)?|late|delayed|churned|suspended|terminated|refunded|disputed|offline|down|absent|no show|missed|out of service|churn|out of range|alerts?|alarms?|fail|lapsed|full(?! time)|sold out)\b/],
  ['warning', /\b(pending|unpaid|due|due soon|expiring|waitlist|waitlisted|waiting|awaiting|review|on hold|hold|draft|medium|at risk|risk|partial|tentative|requested|needs attention|needs [a-z]+|follow up|warning|watch|maintenance|busy|trial|missing|incomplete|in repair|repair)\b/],
  ['success', /\b(paid|active|done|complete|completed|resolved|approved|confirmed|in stock|won|healthy|available|delivered|shipped|success|successful|passed|live|online|published|ready|accepted|vacant|clean|fulfilled|on track|signed|settled|received|present|in service|on the road|on road|on duty|on shift|in operation|operational|operating|running|deployed|en route|on route|returned|verified|cleared|pass|renewed)\b/],
  ['info', /\b(new(?! (york|zealand|delhi|jersey|mexico|hampshire|orleans))|open|in progress|scheduled|booked|sent|assigned|processing|planned|upcoming|started|checked in|in transit|on the way|en route|dispatched|on site|checked out|on loan|in use|occupied|reserved|held|in testing|testing|on call|on duty)\b/],
];

const chipTone = (value: string): string => {
  const t = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return 'neutral';
  if (/^not\b/.test(t)) return TONE_WORDS[2][1].test(t.slice(3)) ? 'warning' : 'neutral';
  if (/^(in|under) review$/.test(t)) return 'info';
  for (const [tone, words] of TONE_WORDS) if (words.test(t)) return tone;
  return 'neutral';
};

const TONES = ['success', 'warning', 'danger', 'info', 'neutral'];

/** A booking's tone from its status: a tone name, else its words; '' (the accent) when it has none. */
export const bookingTone = (status: unknown): string => {
  if (!isNonBlankString(status)) return '';
  const word = status.trim().toLowerCase();
  if (TONES.includes(word)) return word;
  const tone = chipTone(status);
  return tone === 'neutral' ? (/\b(tentative|hold|optional)\b/.test(word) ? 'warning' : '') : tone;
};

/** Bookings placed on the range per resource key, in lanes where they overlap (at most MAX_LANES). A booking matches a
 *  resource by its id or name; one with no end lasts an hour (a day on the days scale); malformed dates are reported. */
export const placeBookings = (
  bookings: unknown,
  fields: BookingFields,
  range: ScheduleRange,
  resources: ScheduleResource[],
  problems?: BookingProblem[]
): PlacedBookings => {
  const out: PlacedBookings = Object.create(null);
  if (!Array.isArray(bookings)) return out;
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
    const report = (problem: string) =>
      problems?.push({ index, id: row[isNonBlankString(f.idField) ? f.idField : 'id'], title: toText(field(row, f.titleField)).trim(), problem });
    const startRaw = field(row, f.startField);
    const start = parseTime(startRaw, day);
    if (!start) return void report(isBlank(startRaw) ? 'it has no start' : 'its start is not a date');
    const endRaw = field(row, f.endField);
    const endParsed = parseTime(endRaw, new Date(start.time));
    if (!endParsed && !isBlank(endRaw)) return void report('its end is not a date');
    const dayAfter = start.dateOnly ? nextMidnight(start.time) : addDays(start.time, 1);
    let end: number;
    if (endParsed) end = endParsed.dateOnly && days ? nextMidnight(endParsed.time) : endParsed.time;
    else end = start.dateOnly || days ? dayAfter : start.time + HOUR;
    if (end < start.time) return void report('it ends before it starts');
    if (end === start.time) end = days ? dayAfter : start.time + HOUR / 2;
    if (end <= range.start || start.time >= range.end) return;
    // On the days scale a timed booking shorter than a day fills its day; its own time stays in `time`.
    const wholeDay = days && !start.dateOnly && end < dayAfter;
    const spanStart = wholeDay ? midnight(new Date(start.time)).getTime() : start.time;
    const spanEnd = wholeDay ? nextMidnight(spanStart) : end;
    const left = positionOf(range, Math.max(spanStart, range.start)) ?? 0;
    const right = positionOf(range, Math.min(spanEnd, range.end)) ?? 100;
    const status = toText(field(row, f.statusField)).trim();
    const id = isNonBlankString(f.idField) ? row[f.idField] : row.id;
    const fmt = f.hourFormat === '24h' ? '24h' : '12h';
    const time = days && (start.dateOnly || endParsed?.dateOnly) ? '' : `${clockText(start.time, fmt)} to ${clockText(end, fmt)}`;
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

/** 'booked' when bookings cover all of the slot, 'partly' when some, else 'free'; a cancelled booking takes no time. */
export const slotAvailability = (slot: ScheduleSlot, items: readonly PlacedBooking[] = []): { state: 'free' | 'partly' | 'booked'; titles: string[] } => {
  const inSlot = items.filter((b) => !/\bcancel/i.test(b.status) && b.start < slot.end && b.end > slot.start).sort((a, b) => a.start - b.start);
  if (!inSlot.length) return { state: 'free', titles: [] };
  let reached = slot.start;
  for (const b of inSlot) if (b.start <= reached) reached = Math.max(reached, b.end);
  return { state: reached >= slot.end ? 'booked' : 'partly', titles: [...new Set(inSlot.map((b) => b.title || 'Booking'))] };
};

/** A slot as the app reads it (selectedSlot). */
export const slotValue = (resource: ScheduleResource | undefined, slot: ScheduleSlot | undefined, hourFormat: unknown = '12h', scale = 'hours'): SlotSelection | Record<string, never> => {
  if (!resource || !slot) return {};
  const clock = (ms: number) => {
    const d = new Date(ms);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  const d = new Date(slot.start);
  return {
    resourceId: resource.id,
    resource: resource.name,
    start: new Date(slot.start).toISOString(),
    end: new Date(slot.end).toISOString(),
    date: dayKey(d),
    startTime: clock(slot.start),
    endTime: clock(slot.end),
    label: scale === 'days' ? `${WEEKDAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}` : `${clockText(slot.start, hourFormat)} to ${clockText(slot.end, hourFormat)}`,
  };
};

/** A title line and a second line when the booking is 110px wide and its lane 34px tall; narrower, the title takes both. */
export const bookingFace = (widthPx: number, laneHeight: number, hasSecond: boolean) => {
  const twoLines = laneHeight >= 34;
  const narrow = Number.isFinite(widthPx) && widthPx > 0 && widthPx < 110;
  return { titleLines: twoLines && narrow ? 2 : 1, showSecond: hasSecond && twoLines && !narrow };
};

/** The resource column's heading, a field name read as words ("boat_name" heads "Boat name"). */
export const resourceHeading = (value: unknown): string => {
  const raw = value === null || value === undefined ? '' : String(value).trim();
  const words = /^[A-Za-z][A-Za-z0-9]*([_-][A-Za-z0-9]+)+$|^[a-z]+[A-Z][A-Za-z0-9]*$/.test(raw)
    ? raw.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase()
    : raw;
  return words.replace(/^[a-z]/, (ch) => ch.toUpperCase());
};

// ---- Layout ----------------------------------------------------------------------------------------------------------

const DAY_MIN_PX = 80;
const HOUR_MIN_PX = 72;
const SLOT_MIN_PX = 28;
const BOOKING_MIN_PX = 44;
const SLOT_MAX_PX = 64;

/** The least width of the time axis: 80px a day; 72px an hour, 28px a slot, and room for the shortest booking. Below it
 *  the axis scrolls sideways in the widget rather than squeeze. */
export const timelineMinWidth = (range: ScheduleRange, placed: PlacedBookings): number => {
  if (range.scale === 'days') return range.columns.length * DAY_MIN_PX;
  let min = Math.max(range.columns.length * HOUR_MIN_PX, range.slots.length * SLOT_MIN_PX);
  let shortest = Infinity;
  for (const entry of Object.values(placed)) for (const b of entry.items) if (b.width > 0 && b.width < shortest) shortest = b.width;
  if (Number.isFinite(shortest)) min = Math.max(min, Math.min(range.slots.length * SLOT_MAX_PX, Math.ceil((BOOKING_MIN_PX * 100) / shortest - 1e-6)));
  return min;
};

export const barMinWidth = (range: ScheduleRange): number => (range.scale === 'days' ? 6 : 20);

// ---- Selection -------------------------------------------------------------------------------------------------------

export const placedOn = (placed: PlacedBookings, key: string) => (Object.prototype.hasOwnProperty.call(placed, key) ? placed[key] : undefined);

/** The selection as it is now, resolved from who or what was picked; null when it is not on the schedule. */
export const resolveSelection = (
  pick: SchedulePick | null,
  placed: PlacedBookings,
  resources: ScheduleResource[],
  range: ScheduleRange,
  hourFormat: unknown
): ScheduleSelected | null => {
  if (!pick) return null;
  if (pick.kind === 'booking') {
    const own = placedOn(placed, pick.resource)?.items.find((b) => b.key === pick.key);
    if (own) return { kind: 'booking', resource: pick.resource, key: own.key, item: own };
    for (const [resource, entry] of Object.entries(placed)) {
      const item = entry.items.find((b) => b.key === pick.key);
      if (item) return { kind: 'booking', resource, key: item.key, item };
    }
    return null;
  }
  const resource = resources.find((r) => r.key === pick.resource);
  const index = range.slots.findIndex((s) => s.start === pick.start && s.end === pick.end);
  if (!resource || index === -1) return null;
  return { kind: 'slot', resource: resource.key, index, value: slotValue(resource, range.slots[index], hourFormat, range.scale) };
};

export const selectionExposed = (selected: ScheduleSelected | null) => ({
  selectedBooking: selected?.kind === 'booking' ? selected.item.row : {},
  selectedBookingId: selected?.kind === 'booking' ? selected.item.id ?? null : null,
  selectedSlot: selected?.kind === 'slot' ? selected.value : {},
});

// ---- Avatars ---------------------------------------------------------------------------------------------------------

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export const avatarHue = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
};
