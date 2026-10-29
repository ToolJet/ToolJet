// UI 2.0's date and time model (Ui2/_inputs/dateModel.ts, Ui2/_actions/calendarModel.ts) without dayjs: dates are local
// Date objects, formats are dayjs tokens (DD MMM YYYY, h:mm A), and every function takes junk without throwing.

export const pad2 = (n: number) => String(n).padStart(2, '0');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const isBlank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && !v.trim());

export const isValidDate = (d: unknown): d is Date => d instanceof Date && !Number.isNaN(d.getTime());

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** A local day as YYYY-MM-DD; '' for none. */
export const ymd = (d: Date | null | undefined): string =>
  isValidDate(d) ? `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` : '';

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

const TOKENS = /\[([^\]]*)]|YYYY|YY|MMMM|MMM|MM|M|Do|DD|D|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|A|a/g;

/** A date in dayjs tokens. */
export const formatDate = (d: Date, format: string): string =>
  format.replace(TOKENS, (token, escaped: string | undefined) => {
    if (escaped !== undefined) return escaped;
    const h = d.getHours();
    switch (token) {
      case 'YYYY': return String(d.getFullYear());
      case 'YY': return String(d.getFullYear()).slice(-2);
      case 'MMMM': return MONTHS[d.getMonth()];
      case 'MMM': return MONTHS[d.getMonth()].slice(0, 3);
      case 'MM': return pad2(d.getMonth() + 1);
      case 'M': return String(d.getMonth() + 1);
      case 'Do': return ordinal(d.getDate());
      case 'DD': return pad2(d.getDate());
      case 'D': return String(d.getDate());
      case 'dddd': return WEEKDAYS[d.getDay()];
      case 'ddd': return WEEKDAYS[d.getDay()].slice(0, 3);
      case 'dd': return WEEKDAYS[d.getDay()].slice(0, 2);
      case 'd': return String(d.getDay());
      case 'HH': return pad2(h);
      case 'H': return String(h);
      case 'hh': return pad2(h % 12 || 12);
      case 'h': return String(h % 12 || 12);
      case 'mm': return pad2(d.getMinutes());
      case 'm': return String(d.getMinutes());
      case 'ss': return pad2(d.getSeconds());
      case 's': return String(d.getSeconds());
      case 'A': return h < 12 ? 'AM' : 'PM';
      case 'a': return h < 12 ? 'am' : 'pm';
      default: return token;
    }
  });

/**
 * A display format in dayjs tokens. Builds often write date-fns formats ("MMM d, yyyy"): a format with y or E is read
 * as date-fns (yyyy the year, d the day of the month, EEE the weekday). A lone d is always the day of the month.
 */
export const toDayjsFormat = (format: unknown): string => {
  if (typeof format !== 'string' || !format.trim()) return '';
  const parts = format.split(/(\[[^\]]*\])/);
  const dateFns = parts.filter((p) => !p.startsWith('[')).some((p) => /y|E/.test(p));
  return parts
    .map((part) => {
      if (part.startsWith('[')) return part;
      if (!dateFns) return part.replace(/d+/g, (run) => (run.length === 1 ? 'D' : run));
      return part
        .replace(/y+/g, (run) => (run.length === 2 ? 'YY' : 'YYYY'))
        .replace(/E{4,}/g, 'dddd')
        .replace(/E{1,3}/g, 'ddd')
        .replace(/(^|[^d])do/g, '$1Do')
        .replace(/(^|[^d])dd(?!d)/g, '$1DD')
        .replace(/(^|[^dD])d(?!d)/g, '$1D');
    })
    .join('');
};

/** A date in an author's format, 'DD MMM YYYY h:mm A' when it is not text. */
export const safeFormat = (d: Date | null | undefined, format: unknown): string => {
  if (!isValidDate(d)) return '';
  const f = toDayjsFormat(format);
  return formatDate(d, f || 'DD MMM YYYY h:mm A');
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Text read strictly in a dayjs format (dayjs's customParseFormat, strict); null when it does not match or names a
 *  day or time that does not exist. */
export const parseInFormat = (text: string, format: string): Date | null => {
  const fields: string[] = [];
  let source = '';
  let last = 0;
  format.replace(TOKENS, (token, escaped: string | undefined, offset: number) => {
    source += escapeRe(format.slice(last, offset));
    last = offset + token.length;
    if (escaped !== undefined) {
      source += escapeRe(escaped);
      return token;
    }
    const patterns: Record<string, string> = {
      YYYY: '(\\d{4})', YY: '(\\d{2})', MMMM: '([A-Za-z]+)', MMM: '([A-Za-z]{3})', MM: '(\\d{2})', M: '(\\d{1,2})',
      Do: '(\\d{1,2})(?:st|nd|rd|th)', DD: '(\\d{2})', D: '(\\d{1,2})', dddd: '([A-Za-z]+)', ddd: '([A-Za-z]{3})',
      dd: '([A-Za-z]{2})', d: '(\\d)', HH: '(\\d{2})', H: '(\\d{1,2})', hh: '(\\d{2})', h: '(\\d{1,2})', mm: '(\\d{2})',
      m: '(\\d{1,2})', ss: '(\\d{2})', s: '(\\d{1,2})', A: '(AM|PM|am|pm)', a: '(am|pm|AM|PM)',
    };
    source += patterns[token] ?? escapeRe(token);
    fields.push(token);
    return token;
  });
  source += escapeRe(format.slice(last));
  const m = new RegExp(`^${source}$`).exec(text.trim());
  if (!m) return null;
  let year = new Date().getFullYear();
  let month = 0;
  let day = 1;
  let hour = 0;
  let minute = 0;
  let second = 0;
  let meridiem = '';
  let twelve = false;
  fields.forEach((token, i) => {
    const v = m[i + 1];
    const n = Number(v);
    if (token === 'YYYY') year = n;
    else if (token === 'YY') year = 2000 + n;
    else if (token === 'MMMM' || token === 'MMM') month = MONTHS.findIndex((name) => name.toLowerCase().startsWith(v.toLowerCase()) && (token === 'MMM' || name.toLowerCase() === v.toLowerCase()));
    else if (token === 'MM' || token === 'M') month = n - 1;
    else if (token === 'Do' || token === 'DD' || token === 'D') day = n;
    else if (token === 'HH' || token === 'H') hour = n;
    else if (token === 'hh' || token === 'h') {
      hour = n;
      twelve = true;
    } else if (token === 'mm' || token === 'm') minute = n;
    else if (token === 'ss' || token === 's') second = n;
    else if (token === 'A' || token === 'a') meridiem = v.toLowerCase();
  });
  if (twelve) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (meridiem === 'pm' ? 12 : 0);
  } else if (meridiem === 'pm' && hour < 12) hour += 12;
  if (month < 0 || month > 11 || hour > 23 || minute > 59 || second > 59) return null;
  const d = new Date(year, month, day, hour, minute, second);
  // A day that does not exist (30 February) or a time the clocks skip comes back as another one.
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day || d.getHours() !== hour || d.getMinutes() !== minute) return null;
  return d;
};

// ISO text means one date whatever a widget's display format is, so it is read before that format.
const ISO_INPUT_FORMATS = ['YYYY-MM-DD[T]HH:mm:ss', 'YYYY-MM-DD[T]HH:mm', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD h:mm A', 'YYYY-MM-DD'];
// Day-first and month-first text is ambiguous: the display format, when it reads the text, decides.
const LOCAL_INPUT_FORMATS = ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY', 'MM/DD/YYYY HH:mm', 'MM/DD/YYYY'];

/** A date from ISO text, 'YYYY-MM-DD HH:mm', text in the display `format`, a unix timestamp (seconds or ms) or a Date;
 *  null otherwise. `formatFirst` reads with `format` before ISO (a format given with an action's value). */
export const parseDateTime = (v: unknown, format?: unknown, formatFirst = false): Date | null => {
  if (v === undefined || v === null || v === '' || typeof v === 'boolean') return null;
  if (v instanceof Date) return isValidDate(v) ? new Date(v.getTime()) : null;
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return null;
    const d = new Date(Math.abs(v) < 1e11 ? v * 1000 : v);
    return isValidDate(d) ? d : null;
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (/^\d{9,13}$/.test(s)) return parseDateTime(Number(s));
  const given = isBlank(format) ? [] : [String(format)];
  const formats = formatFirst ? [...given, ...ISO_INPUT_FORMATS, ...LOCAL_INPUT_FORMATS] : [...ISO_INPUT_FORMATS, ...given, ...LOCAL_INPUT_FORMATS];
  for (const f of formats) {
    const d = parseInFormat(s, f);
    if (d) return d;
  }
  // ISO text with an offset or a fraction of a second.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}(:?\d{2})?)$/i.test(s)) {
    const d = new Date(s);
    return isValidDate(d) ? d : null;
  }
  return null;
};

/** A day (local midnight) from author data: '2026-10-09', ISO text, a timestamp, a Date; undefined otherwise. */
export const toDay = (v: unknown, format?: unknown): Date | undefined => {
  const raw = Array.isArray(v) ? undefined : v;
  const d = parseDateTime(raw, format);
  return d ? startOfDay(d) : undefined;
};

export interface DateRules {
  min: Date | null;
  max: Date | null;
  disabled: ReadonlySet<string>;
}

/** The first and last pickable day and the disabled days ('YYYY-MM-DD'), from author input of any shape. */
export const dateRules = ({ minDate, maxDate, disabledDates, format }: { minDate?: unknown; maxDate?: unknown; disabledDates?: unknown; format?: unknown }): DateRules => {
  const min = toDay(minDate, format) ?? null;
  const max = toDay(maxDate, format) ?? null;
  const disabled = new Set<string>();
  for (const raw of Array.isArray(disabledDates) ? disabledDates : []) {
    const d = toDay(raw, format);
    if (d) disabled.add(ymd(d));
  }
  return { min, max, disabled };
};

export const isOffDay = (day: Date, rules: DateRules) =>
  (!!rules.min && day < rules.min) || (!!rules.max && day > rules.max) || rules.disabled.has(ymd(day));

/** Why a date cannot be picked under the rules ('' when it can). */
export const dateProblem = (d: Date | null | undefined, rules: DateRules): string => {
  if (!isValidDate(d)) return '';
  const day = startOfDay(d);
  if (rules.min && day < rules.min) return `Pick a date on or after ${formatDate(rules.min, 'DD MMM YYYY')}`;
  if (rules.max && day > rules.max) return `Pick a date on or before ${formatDate(rules.max, 'DD MMM YYYY')}`;
  if (rules.disabled.has(ymd(day))) return 'This date is not available';
  return '';
};

/** `day` at `minutes` past midnight; null when the clocks skip that time on that day. */
export const atTime = (day: Date, minutes: number): Date | null => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  return d.getHours() === h && d.getMinutes() === m ? d : null;
};

// ---- Time ------------------------------------------------------------------------------------------------------------

/** True for a 24-hour display: '24h', '24', 'HH:mm' (a format with H). */
export const is24h = (format: unknown): boolean => {
  const f = String(format ?? '').trim();
  return f === '24' || /^24/.test(f) || (/H/.test(f) && !/h/.test(f));
};

/** Minutes since midnight from '14:30', '2:30 pm', '2pm', '14:30:00', an ISO date-time or a Date; null otherwise. */
export const parseTime = (v: unknown): number | null => {
  if (v instanceof Date) return isValidDate(v) ? v.getHours() * 60 + v.getMinutes() : null;
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 && v < 1440 ? Math.floor(v) : null;
  if (isBlank(v) || typeof v !== 'string') return null;
  const s = v.trim();
  const iso = s.match(/T(\d{1,2}):(\d{2})/);
  const m = iso || s.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2}(?:\.\d+)?)?\s*([ap]\.?m\.?)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const meridiem = iso ? null : m[3]?.[0]?.toLowerCase();
  if (min > 59) return null;
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (meridiem === 'p' ? 12 : 0);
  }
  if (h > 23) return null;
  return h * 60 + min;
};

/** A time from an action's argument, read in `format` (dayjs tokens) when one is given, else as parseTime reads it. */
export const parseTimeArg = (v: unknown, format: unknown): number | null => {
  if (typeof v === 'string' && typeof format === 'string' && format.trim()) {
    const d = parseInFormat(`2000-01-01 ${v.trim()}`, `YYYY-MM-DD ${toDayjsFormat(format)}`);
    if (d) return d.getHours() * 60 + d.getMinutes();
  }
  return parseTime(v);
};

export const toHHmm = (minutes: number | null): string =>
  typeof minutes === 'number' && Number.isFinite(minutes) ? `${pad2(Math.floor(minutes / 60) % 24)}:${pad2(minutes % 60)}` : '';

/** Minutes since midnight as shown: '2:30 PM' or '14:30'. */
export const formatTime = (minutes: number | null, use24 = false): string => {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) return '';
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return use24 ? `${pad2(h)}:${pad2(m)}` : `${h % 12 || 12}:${pad2(m)} ${h < 12 ? 'AM' : 'PM'}`;
};

export const minuteStep = (v: unknown, fallback = 15): number => {
  const n = Math.round(Number(v));
  return v === null || v === '' || !Number.isFinite(n) ? fallback : Math.min(60, Math.max(1, n));
};

export interface TimeBounds {
  lo: number;
  hi: number;
}

/** The time bounds in minutes: 00:00 and 23:59 by default, swapped when given the wrong way round. */
export const timeBounds = (minTime: unknown, maxTime: unknown): TimeBounds => {
  let lo = parseTime(minTime) ?? 0;
  let hi = parseTime(maxTime) ?? 1439;
  if (lo > hi) [lo, hi] = [hi, lo];
  return { lo, hi };
};

export const inTimeRange = (minutes: number, b: TimeBounds) => minutes >= b.lo && minutes <= b.hi;

export const clampTime = (minutes: number, b: TimeBounds) => Math.min(b.hi, Math.max(b.lo, minutes));

/** Every pickable time of a list: every `step` minutes from midnight, within the bounds. */
export const timeSlots = (step: unknown, minTime?: unknown, maxTime?: unknown): number[] => {
  const s = minuteStep(step);
  const { lo, hi } = timeBounds(minTime, maxTime);
  const out: number[] = [];
  for (let t = Math.ceil(lo / s) * s; t <= hi && out.length < 1440; t += s) out.push(t);
  return out;
};

/** The minutes of `hour`'s column: a time every `step` minutes from midnight, so a step that does not divide an hour
 *  gives each hour its own minutes (45: 09:00, 09:45, then 10:30). */
export const minuteOptions = (step: unknown, hour = 0): number[] => {
  const s = minuteStep(step);
  const h = Number.isInteger(hour) ? ((hour % 24) + 24) % 24 : 0;
  const out: number[] = [];
  for (let m = (s - ((h * 60) % s)) % s; m < 60; m += s) out.push(m);
  return out;
};

export const minuteInHour = (step: unknown, hour: number, minute: number | null): number => {
  const options = minuteOptions(step, hour);
  return minute !== null && options.includes(minute) ? minute : options[0] ?? 0;
};
