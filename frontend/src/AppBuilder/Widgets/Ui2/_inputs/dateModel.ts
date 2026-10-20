// ToolJet UI 2.0: pure logic of the time, date and date-time widgets. Every function takes junk (null,
// objects, NaN, huge numbers) without throwing.
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { clampInt, isBlank } from './inputsModel';
import type { Dayjs } from 'dayjs';
import { pad2, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import type { Override } from '@/AppBuilder/Widgets/Ui2/_shared/parity';

dayjs.extend(customParseFormat);

// ---- Time ----------------------------------------------------------------------------------------------------------

/** True for a 24-hour display: '24h', '24', 'HH:mm' (a format with H). */
export const is24h = (format: unknown): boolean => {
  const f = String(format ?? '').trim();
  return f === '24' || /^24/.test(f) || (/H/.test(f) && !/h/.test(f));
};

/** Minutes since midnight from '14:30', '2:30 pm', '2pm', '14:30:00', an ISO date-time or a Date; null otherwise. */
export const parseTime = (v: unknown): number | null => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getHours() * 60 + v.getMinutes();
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

/** Minutes since midnight as 'HH:mm'; '' for none. */
export const toHHmm = (minutes: unknown): string =>
  typeof minutes === 'number' && Number.isFinite(minutes)
    ? `${pad2(Math.floor(minutes / 60) % 24)}:${pad2(minutes % 60)}`
    : '';

/** Minutes since midnight as shown: '2:30 PM' (12-hour) or '14:30'. */
export const formatTime = (minutes: unknown, use24h = false): string => {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) return '';
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return use24h ? `${pad2(h)}:${pad2(m)}` : `${h % 12 || 12}:${pad2(m)} ${h < 12 ? 'AM' : 'PM'}`;
};

export const minuteStep = (v: unknown, fallback = 15): number => clampInt(v, 1, 60, fallback);

/** The time bounds as minutes: min defaults to 00:00, max to 23:59; swapped when given the wrong way round. */
/** A time range in minutes since midnight. */
export interface TimeBounds {
  lo: number;
  hi: number;
}

export const timeBounds = (minTime: unknown, maxTime: unknown): TimeBounds => {
  let lo = parseTime(minTime) ?? 0;
  let hi = parseTime(maxTime) ?? 1439;
  if (lo > hi) [lo, hi] = [hi, lo];
  return { lo, hi };
};

export const inTimeRange = (minutes: number, bounds: TimeBounds): boolean =>
  minutes >= bounds.lo && minutes <= bounds.hi;

/** Every pickable time of a list: from the minimum, every `step` minutes, up to the maximum (at most 1440). */
export const timeSlots = (step: unknown, minTime?: unknown, maxTime?: unknown): number[] => {
  const s = minuteStep(step);
  const { lo, hi } = timeBounds(minTime, maxTime);
  const out: number[] = [];
  for (let t = Math.ceil(lo / s) * s; t <= hi && out.length < 1440; t += s) out.push(t);
  return out;
};

/** The minutes of `hour`'s column. A minute step means a time every `step` minutes from midnight, as the list of
 *  times offers them (timeSlots), so a step that does not divide an hour gives each hour its own minutes: with 45,
 *  09:00 and 09:45, then 10:30, then 11:15. A step that divides an hour gives every hour 0, step, 2*step ... */
export const minuteOptions = (step: unknown, hour: unknown = 0): number[] => {
  const s = minuteStep(step);
  const h = typeof hour === 'number' && Number.isInteger(hour) ? ((hour % 24) + 24) % 24 : 0;
  const out: number[] = [];
  for (let m = (s - ((h * 60) % s)) % s; m < 60; m += s) out.push(m);
  return out;
};

/** `minute` when it falls on the step in `hour`, else the first minute that does. */
export const minuteInHour = (step: unknown, hour: number, minute: number | null): number => {
  const options = minuteOptions(step, hour);
  return minute !== null && options.includes(minute) ? minute : options[0] ?? 0;
};

/** The nearest time within the bounds. */
export const clampTime = (minutes: number, bounds: TimeBounds): number =>
  Math.min(bounds.hi, Math.max(bounds.lo, minutes));

// ---- Date and time -------------------------------------------------------------------------------------------------

// ISO text means one date whatever a widget's display format is, so it is read before that format.
const ISO_INPUT_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mm',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DD h:mm A',
  'YYYY-MM-DD',
];
// Day-first and month-first text is ambiguous: the display format, when it reads the text, decides.
const LOCAL_INPUT_FORMATS = ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY', 'MM/DD/YYYY HH:mm', 'MM/DD/YYYY'];

// Text that starts like an ISO date, with an optional time: year, month, day, hour, minute, second.
const ISO_FIELDS = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;

/** False for text that starts like an ISO date but names a day or time that does not exist (30 February, month 13,
 *  hour 25, minute 60): dayjs would roll it into another date. True for any other text. */
export const isRealDateText = (text: string): boolean => {
  const m = ISO_FIELDS.exec(text.trim());
  if (!m) return true;
  const [year, month, day, hour, minute, second] = m.slice(1).map((f) => (f === undefined ? 0 : Number(f)));
  if (month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate()) return false;
  return hour <= 23 && minute <= 59 && second <= 59;
};

/** True when `d` is the local year, month (1 to 12), day, hour, minute and second asked for. A local time the clocks
 *  skip (02:30 on the day they go forward, or a day a zone left out) comes back from Date as another one. */
const keepsFields = (d: Dayjs, [year, month, day, hour = 0, minute = 0, second = 0]: number[]): boolean =>
  d.year() === year &&
  d.month() + 1 === month &&
  d.date() === day &&
  d.hour() === hour &&
  d.minute() === minute &&
  d.second() === second;

// An explicit offset (Z, +05:30, -0800) names one instant, whatever its local time is here.
const ISO_OFFSET = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/** A date (dayjs) from ISO text, 'YYYY-MM-DD HH:mm', text in the display `format`, a unix timestamp (seconds or
 *  milliseconds) or a Date; null otherwise, and for a day or time that does not exist. ISO text is read as ISO before
 *  the display format; `formatFirst` reads with `format` first, for a format given with the value (an action's
 *  argument). */
export const parseDateTime = (v: unknown, format?: unknown, formatFirst = false): Dayjs | null => {
  if (v === undefined || v === null || v === '' || typeof v === 'boolean') return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : dayjs(v);
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return null;
    const d = dayjs(Math.abs(v) < 1e11 ? v * 1000 : v);
    return d.isValid() ? d : null;
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (/^\d{9,13}$/.test(s)) return parseDateTime(Number(s));
  const given = isBlank(format) ? [] : [String(format)];
  const formats = formatFirst
    ? [...given, ...ISO_INPUT_FORMATS, ...LOCAL_INPUT_FORMATS]
    : [...ISO_INPUT_FORMATS, ...given, ...LOCAL_INPUT_FORMATS];
  for (const f of formats) {
    const d = dayjs(s, f, true);
    if (d.isValid()) return d;
  }
  // ISO text the formats above do not cover (an offset, a fraction of a second), when it names a real date and time.
  // Without an offset it is a local time, which must exist here: one the clocks skip read as another (the strict
  // formats above refuse it the same way).
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) && isRealDateText(s)) {
    const d = dayjs(s);
    const fields =
      ISO_FIELDS.exec(s)
        ?.slice(1)
        .map((f) => (f === undefined ? 0 : Number(f))) ?? [];
    if (d.isValid() && (ISO_OFFSET.test(s) || keepsFields(d, fields))) return d;
  }
  return null;
};

/** What a date-time picker exposes for a date (local time). */
/** What a date-time picker exposes (a type, not an interface: it is passed to setExposedVariables as a record). */
export type DateTimeExposed = {
  value: string;
  selectedDate: string;
  selectedTime: string;
  unixTimestamp: number | null;
  displayValue: string;
};

export const dateTimeExposed = (d: Dayjs | null | undefined, displayFormat: unknown): DateTimeExposed =>
  d && d.isValid()
    ? {
        value: d.format('YYYY-MM-DDTHH:mm'),
        selectedDate: d.format('YYYY-MM-DD'),
        selectedTime: d.format('HH:mm'),
        unixTimestamp: d.valueOf(),
        displayValue: safeFormat(d, displayFormat),
      }
    : { value: '', selectedDate: '', selectedTime: '', unixTimestamp: null, displayValue: '' };

/**
 * A display format in dayjs tokens. Builds often write date-fns (Unicode) formats: "MMM d, yyyy" in dayjs read
 * "Oct 6, yyyy" (d is the weekday there, and yyyy no token). A format with y or E is read as date-fns: yyyy and yy are
 * the year, d and dd the day of the month, do its ordinal, EEE and EEEE the weekday. A lone d is always the day of the
 * month. [Escaped] text is kept.
 */
export const toDayjsFormat = <T>(format: T): T | string => {
  if (typeof format !== 'string' || !format) return format;
  const parts = format.split(/(\[[^\]]*\])/);
  const plain = parts.filter((part) => !part.startsWith('['));
  const dateFns = plain.some((part) => /y|E/.test(part));
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

/** A date in an author's format, falling back to 'DD MMM YYYY h:mm A' when the format is not text. */
export const safeFormat = (d: Dayjs | null | undefined, format: unknown): string => {
  if (!d || !d.isValid()) return '';
  try {
    return d.format(isBlank(format) || typeof format !== 'string' ? 'DD MMM YYYY h:mm A' : toDayjsFormat(format));
  } catch {
    return d.format('DD MMM YYYY h:mm A');
  }
};

/** The day bounds (start of day) and disabled days for the calendar, from author input of any shape. */
/** Author input for the calendar's rules, of any shape. */
export interface DateRuleInput {
  minDate?: unknown;
  maxDate?: unknown;
  disabledDates?: unknown;
  format?: unknown;
}

/** The calendar's rules: first and last pickable day (start of day) and the disabled days as 'YYYY-MM-DD'. Every
 *  disabled date is kept: a rule left out would let that day validate and submit. */
export interface DateRules {
  min: Dayjs | null;
  max: Dayjs | null;
  disabled: ReadonlySet<string>;
}

export const dateRules = ({ minDate, maxDate, disabledDates, format }: DateRuleInput = {}): DateRules => {
  const min = parseDateTime(minDate, format)?.startOf('day') ?? null;
  const max = parseDateTime(maxDate, format)?.startOf('day') ?? null;
  const disabled = new Set<string>();
  for (const raw of Array.isArray(disabledDates) ? disabledDates : []) {
    const d = parseDateTime(raw, format);
    if (d) disabled.add(d.format('YYYY-MM-DD'));
  }
  return { min, max, disabled };
};

/** Why a date cannot be picked under the rules ('' when it can). */
export const dateProblem = (d: Dayjs | null | undefined, rules: DateRules | null | undefined): string => {
  if (!d || !rules) return '';
  const day = d.startOf('day');
  if (rules.min && day.isBefore(rules.min)) return `Pick a date on or after ${rules.min.format('DD MMM YYYY')}`;
  if (rules.max && day.isAfter(rules.max)) return `Pick a date on or before ${rules.max.format('DD MMM YYYY')}`;
  if (rules.disabled.has(day.format('YYYY-MM-DD'))) return 'This date is not available';
  return '';
};

/** `date` (a dayjs day) at `minutes` past midnight; null when the clocks skip that time on that day (02:30 on the
 *  day they go forward), not the time they go to. */
export const atTime = (date: Dayjs, minutes: number): Dayjs | null => {
  const hour = Math.floor(minutes / 60);
  const d = date
    .startOf('day')
    .hour(hour)
    .minute(minutes % 60);
  return keepsFields(d, [date.year(), date.month() + 1, date.date(), hour, minutes % 60]) ? d : null;
};

/** react-day-picker's disabled matchers for the rules: before the minimum, after the maximum, and one lookup for the
 *  disabled days (a matcher per day would be checked against every day drawn). */
export const dayMatchers = (rules: DateRules) => [
  ...(rules.min ? [{ before: rules.min.toDate() }] : []),
  ...(rules.max ? [{ after: rules.max.toDate() }] : []),
  ...(rules.disabled.size ? [(date: Date) => rules.disabled.has(dayjs(date).format('YYYY-MM-DD'))] : []),
];

/** The date pickers' bound actions; each sets its property until the property itself changes. */
export const dateBoundActions = (override: Override) => ({
  setMinDate: async (v: unknown) => override('minDate', toText(v)),
  setMaxDate: async (v: unknown) => override('maxDate', toText(v)),
  setDisabledDates: async (v: unknown) =>
    override('disabledDates', Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v]),
  clearDisabledDates: async () => override('disabledDates', []),
});
