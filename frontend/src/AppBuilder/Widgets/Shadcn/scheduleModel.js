// ToolJet UI 2.0 pack: the pure logic of the Schedule (ShadSchedule.jsx): the visible range and its columns, the
// resources down the side, and the bookings placed on them in lanes. Every function takes whatever the author bound
// and never throws.
import { chipTone } from '../NewTable/_utils/chipTone';

const HOUR = 3600000;
const DAY = 24 * HOUR;
export const MAX_DAYS = 31;
export const MAX_SLOTS = 96;
export const MAX_LANES = 4;
export const MAX_BOOKINGS = 2000;

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const shown = (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));
const int = (v, fallback) => {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return fallback;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : fallback;
};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
/** An hour of the day from a number (9) or a clock time ('09:00', '5:30 PM'); an end rounds up to the next hour
 *  ('17:30' ends after 17:00-18:00). dayStart="09:00" fell back to 8 (2026-10-14). */
const hourOf = (v, fallback, roundUp) => {
  const clock = typeof v === 'string' ? v.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i) : null;
  if (!clock) return int(v, fallback);
  let h = Number(clock[1]) % (clock[3] ? 12 : 24);
  if (clock[3] && /^p/i.test(clock[3])) h += 12;
  if (!clock[3] && Number(clock[1]) === 24) h = 24;
  return roundUp && Number(clock[2] || 0) > 0 ? h + 1 : h;
};
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const pad = (n) => String(n).padStart(2, '0');

/** A local day as YYYY-MM-DD. */
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** A time from what a binding gives: a Date, a timestamp, 'YYYY-MM-DD' (a day, local), 'HH:mm' or '9:30 am' (that
 *  time on `day`), or any date text Date reads. { time, dateOnly } in ms, or null when it is not a time. */
export const parseTime = (v, day) => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : { time: v.getTime(), dateOnly: false };
  if (typeof v === 'number') return Number.isFinite(v) ? { time: v, dateOnly: false } : null;
  if (!isText(v) || v.length > 64) return null;
  const s = v.trim();
  const date = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (date) {
    const d = new Date(Number(date[1]), Number(date[2]) - 1, Number(date[3]));
    return Number.isNaN(d.getTime()) || d.getMonth() !== Number(date[2]) - 1
      ? null
      : { time: d.getTime(), dateOnly: true };
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
  // 'YYYY-MM-DD HH:mm' reads as local time (Date reads the space form inconsistently across browsers).
  const local = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (local) {
    const d = new Date(+local[1], +local[2] - 1, +local[3], +local[4], +local[5], +(local[6] || 0));
    return Number.isNaN(d.getTime()) ? null : { time: d.getTime(), dateOnly: false };
  }
  // Other date text needs a four-digit year: Date reads 'Room 42' or 'Sample 7' as a date in 2042 or 2001.
  if (!/\d{4}/.test(s)) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : { time: d.getTime(), dateOnly: false };
};

/** The first day shown: `date` (a Date, a day or date text) at local midnight, else today. */
export const startDay = (date, now = Date.now()) => {
  const parsed = parseTime(date);
  return midnight(new Date(parsed ? parsed.time : now));
};

const hourText = (h, m, format) => {
  if (format === '24h') return `${pad(h % 24)}:${pad(m)}`;
  const suffix = h % 24 < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${pad(m)} ${suffix}` : `${h12} ${suffix}`;
};

/** A time of day as text: '9:30 AM' (12h) or '09:30' (24h). */
export const clockText = (ms, format = '12h') => {
  const d = new Date(ms);
  return hourText(d.getHours(), d.getMinutes(), format);
};

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The visible range: { scale, start, end, columns: [{ key, start, end, label, sub, today }], slots: [{ start, end,
 *  edge }], dayStart, dayEnd }. 'hours' shows dayStart to dayEnd of one day, a column an hour, slots of slotMinutes
 *  (at most MAX_SLOTS); 'days' shows `days` days (1 to MAX_DAYS), a column and a slot a day. */
export const scheduleRange = (
  { scale = 'hours', date, dayStart = 8, dayEnd = 18, days = 7, slotMinutes = 30, hourFormat = '12h' } = {},
  now = Date.now()
) => {
  const first = startDay(date, now);
  const todayKey = dayKey(new Date(now));
  if (scale === 'days') {
    const count = clamp(int(days, 7), 1, MAX_DAYS);
    const columns = Array.from({ length: count }, (_, i) => {
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
  const from = clamp(hourOf(dayStart, 8, false), 0, 23);
  const to = clamp(hourOf(dayEnd, 18, true), from + 1, 24);
  const at = (h, m = 0) => new Date(first.getFullYear(), first.getMonth(), first.getDate(), h, m).getTime();
  const columns = Array.from({ length: to - from }, (_, i) => ({
    key: String(from + i),
    start: at(from + i),
    end: at(from + i + 1),
    label: hourText(from + i, 0, hourFormat),
    sub: '',
    today: false,
  }));
  const span = (to - from) * 60;
  // Slots divide the hour evenly where they can, and never number more than MAX_SLOTS.
  let step = clamp(int(slotMinutes, 30), 5, 240);
  step = Math.max(step, Math.ceil(span / MAX_SLOTS));
  const slots = [];
  for (let m = 0; m < span; m += step) {
    const end = Math.min(span, m + step);
    slots.push({ start: at(from, m), end: at(from, end), edge: m % 60 === 0 });
  }
  return { scale: 'hours', start: at(from), end: at(to), columns, slots, today: dayKey(first) === todayKey };
};

/** Where `ms` falls in the range, 0 to 100, or null outside it. */
export const positionOf = (range, ms) => {
  if (!range || !Number.isFinite(ms) || ms < range.start || ms > range.end) return null;
  return ((ms - range.start) / (range.end - range.start)) * 100;
};

/** Resources down the side: [{ key, id, name, caption, avatar }] from ['Room A'] or [{ id, name (or label, title),
 *  caption (or subtitle, role), avatar }]. With none given, the distinct values of the bookings' resourceField, in
 *  order of appearance. Repeated ids are kept apart. */
export const scheduleResources = (resources, bookings, resourceField) => {
  let list = Array.isArray(resources) ? resources : [];
  if (!list.length && Array.isArray(bookings) && isText(resourceField)) {
    const seen = new Set();
    list = [];
    for (const b of bookings) {
      const v = b && typeof b === 'object' ? shown(b[resourceField]).trim() : '';
      if (v && !seen.has(v)) {
        seen.add(v);
        list.push(v);
      }
      if (list.length >= 1000) break;
    }
  }
  const keys = new Set();
  return list.flatMap((r, index) => {
    let entry;
    if (typeof r === 'string' || typeof r === 'number') {
      const name = String(r).trim();
      if (!name) return [];
      entry = { id: name, name, caption: '', avatar: '' };
    } else if (r && typeof r === 'object' && !Array.isArray(r)) {
      const name = shown(r.name ?? r.label ?? r.title).trim();
      const id = shown(r.id ?? r.value ?? r.key).trim() || name;
      if (!id && !name) return [];
      entry = {
        id,
        name: name || id,
        caption: shown(r.caption ?? r.subtitle ?? r.role ?? r.description).trim(),
        avatar: shown(r.avatar ?? r.image).trim(),
      };
    } else return [];
    let key = entry.id || String(index);
    for (let n = 1; keys.has(key); n++) key = `${entry.id}~${n}`;
    keys.add(key);
    return [{ key, ...entry }];
  });
};

const TONES = ['success', 'warning', 'danger', 'info', 'neutral'];
/** A booking's tone from its status: a tone name, else its words (Confirmed green, Tentative amber, Cancelled red,
 *  Booked blue); '' (the accent) when it has none. */
export const bookingTone = (status) => {
  if (!isText(status)) return '';
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
export const placeBookings = (bookings, fields = {}, range, resources = []) => {
  const out = {};
  if (!Array.isArray(bookings) || !range) return out;
  const f = fields || {};
  const byId = new Map();
  for (const r of resources) {
    if (!byId.has(r.id)) byId.set(r.id, r.key);
    if (!byId.has(r.name)) byId.set(r.name, r.key);
  }
  const day = new Date(range.start);
  const days = range.scale === 'days';
  const field = (row, name) => (isText(name) ? row[name] : undefined);
  let count = 0;
  bookings.forEach((row, index) => {
    if (count >= MAX_BOOKINGS || !row || typeof row !== 'object' || Array.isArray(row)) return;
    const resourceKey = byId.get(shown(field(row, f.resourceField)).trim());
    if (resourceKey === undefined) return;
    const start = parseTime(field(row, f.startField), day);
    if (!start) return;
    const endParsed = parseTime(field(row, f.endField), new Date(start.time));
    let end;
    if (endParsed) end = endParsed.dateOnly && days ? endParsed.time + DAY : endParsed.time;
    else end = start.dateOnly || days ? start.time + DAY : start.time + HOUR;
    if (end <= start.time) end = start.time + (days ? DAY : HOUR / 2);
    if (end <= range.start || start.time >= range.end) return;
    // On the days scale a timed booking shorter than a day fills its day: placed by its time of day, a one-hour class
    // was a 10px sliver with no room for its title (a gym's week, 2026-10-14). Its own time stays in `time`.
    const wholeDay = days && !start.dateOnly && end - start.time < DAY;
    const spanStart = wholeDay ? midnight(new Date(start.time)).getTime() : start.time;
    const spanEnd = wholeDay ? spanStart + DAY : end;
    const from = Math.max(spanStart, range.start);
    const to = Math.min(spanEnd, range.end);
    const status = shown(field(row, f.statusField)).trim();
    const id = isText(f.idField) ? row[f.idField] : row.id;
    const fmt = f.hourFormat === '24h' ? '24h' : '12h';
    const time =
      days && (start.dateOnly || endParsed?.dateOnly) ? '' : `${clockText(start.time, fmt)} to ${clockText(end, fmt)}`;
    count += 1;
    if (!out[resourceKey]) out[resourceKey] = { lanes: 1, items: [] };
    out[resourceKey].items.push({
      key: shown(id) || `#${index}`,
      id: id ?? null,
      row,
      index,
      title: shown(field(row, f.titleField)).trim(),
      subtitle: shown(field(row, f.subtitleField)).trim(),
      status: TONES.includes(status.toLowerCase()) ? '' : status,
      tone: bookingTone(status),
      start: start.time,
      end,
      spanStart,
      spanEnd,
      left: ((from - range.start) / (range.end - range.start)) * 100,
      width: ((to - from) / (range.end - range.start)) * 100,
      time,
    });
  });
  for (const entry of Object.values(out)) {
    entry.items.sort((a, b) => a.start - b.start || b.end - a.end);
    const laneEnds = [];
    const keys = new Set();
    for (const item of entry.items) {
      let lane = laneEnds.findIndex((t) => t <= item.spanStart);
      if (lane === -1) lane = laneEnds.length < MAX_LANES ? laneEnds.length : MAX_LANES - 1;
      laneEnds[lane] = Math.max(laneEnds[lane] ?? 0, item.spanEnd);
      item.lane = lane;
      let key = item.key;
      for (let n = 1; keys.has(key); n++) key = `${item.key}~${n}`;
      keys.add(key);
      item.key = key;
    }
    entry.lanes = Math.max(1, laneEnds.length);
  }
  return out;
};

/** A slot as the app reads it: the resource, ISO start and end, the local day and times, and a label ('9:30 AM to
 *  10 AM', or the day on the days scale). */
export const slotValue = (resource, slot, hourFormat = '12h', scale = 'hours') => {
  if (!resource || !slot) return {};
  const pad2 = (ms) => {
    const d = new Date(ms);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  return {
    resourceId: resource.id,
    resource: resource.name,
    start: new Date(slot.start).toISOString(),
    end: new Date(slot.end).toISOString(),
    date: dayKey(new Date(slot.start)),
    startTime: pad2(slot.start),
    endTime: pad2(slot.end),
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
export const bookingFace = (widthPx, laneHeight, hasSecond) => {
  const twoLines = laneHeight >= 34;
  const narrow = Number.isFinite(widthPx) && widthPx > 0 && widthPx < 110;
  return { titleLines: twoLines && narrow ? 2 : 1, showSecond: Boolean(hasSecond) && twoLines && !narrow };
};
