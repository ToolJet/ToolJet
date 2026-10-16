// shadcn/ui pack (experiment): pure logic of the time, date and date-time widgets. Every function takes junk (null,
// objects, NaN, huge numbers) without throwing.
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { clampInt, isBlank } from './inputsModel';

dayjs.extend(customParseFormat);

// ---- Time ----------------------------------------------------------------------------------------------------------

/** True for a 24-hour display: '24h', '24', 'HH:mm' (a format with H). */
export const is24h = (format) => {
  const f = String(format ?? '').trim();
  return f === '24' || /^24/.test(f) || (/H/.test(f) && !/h/.test(f));
};

/** Minutes since midnight from '14:30', '2:30 pm', '2pm', '14:30:00', an ISO date-time or a Date; null otherwise. */
export const parseTime = (v) => {
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

const pad = (n) => String(n).padStart(2, '0');

/** Minutes since midnight as 'HH:mm'; '' for none. */
export const toHHmm = (minutes) =>
  typeof minutes === 'number' && Number.isFinite(minutes)
    ? `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`
    : '';

/** Minutes since midnight as shown: '2:30 PM' (12-hour) or '14:30'. */
export const formatTime = (minutes, use24h = false) => {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) return '';
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return use24h ? `${pad(h)}:${pad(m)}` : `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
};

export const minuteStep = (v, fallback = 15) => clampInt(v, 1, 60, fallback);

/** The time bounds as minutes: min defaults to 00:00, max to 23:59; swapped when given the wrong way round. */
export const timeBounds = (minTime, maxTime) => {
  let lo = parseTime(minTime) ?? 0;
  let hi = parseTime(maxTime) ?? 1439;
  if (lo > hi) [lo, hi] = [hi, lo];
  return { lo, hi };
};

export const inTimeRange = (minutes, bounds) => minutes >= bounds.lo && minutes <= bounds.hi;

/** Every pickable time of a list: from the minimum, every `step` minutes, up to the maximum (at most 1440). */
export const timeSlots = (step, minTime, maxTime) => {
  const s = minuteStep(step);
  const { lo, hi } = timeBounds(minTime, maxTime);
  const out = [];
  for (let t = Math.ceil(lo / s) * s; t <= hi && out.length < 1440; t += s) out.push(t);
  return out;
};

/** The minutes of an hour column: 0, step, 2*step ... below 60. */
export const minuteOptions = (step) => {
  const s = minuteStep(step);
  const out = [];
  for (let m = 0; m < 60; m += s) out.push(m);
  return out;
};

/** The nearest time within the bounds. */
export const clampTime = (minutes, bounds) => Math.min(bounds.hi, Math.max(bounds.lo, minutes));

// ---- Date and time -------------------------------------------------------------------------------------------------

const DATE_INPUT_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mm',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DD h:mm A',
  'YYYY-MM-DD',
  'DD/MM/YYYY HH:mm',
  'DD/MM/YYYY',
  'MM/DD/YYYY HH:mm',
  'MM/DD/YYYY',
];

/** A date (dayjs) from ISO text, 'YYYY-MM-DD HH:mm', text in the display `format`, a unix timestamp (seconds or
 *  milliseconds) or a Date; null otherwise. */
export const parseDateTime = (v, format) => {
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
  const formats = isBlank(format) ? DATE_INPUT_FORMATS : [String(format), ...DATE_INPUT_FORMATS];
  for (const f of formats) {
    const d = dayjs(s, f, true);
    if (d.isValid()) return d;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = dayjs(s);
    if (d.isValid()) return d;
  }
  return null;
};

/** What a date-time picker exposes for a date (local time). */
export const dateTimeExposed = (d, displayFormat) =>
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
export const toDayjsFormat = (format) => {
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
export const safeFormat = (d, format) => {
  if (!d || !d.isValid()) return '';
  try {
    return d.format(isBlank(format) || typeof format !== 'string' ? 'DD MMM YYYY h:mm A' : toDayjsFormat(format));
  } catch {
    return d.format('DD MMM YYYY h:mm A');
  }
};

/** The day bounds (start of day) and disabled days for the calendar, from author input of any shape. */
export const dateRules = ({ minDate, maxDate, disabledDates, format } = {}) => {
  const min = parseDateTime(minDate, format)?.startOf('day') ?? null;
  const max = parseDateTime(maxDate, format)?.startOf('day') ?? null;
  const disabled = (Array.isArray(disabledDates) ? disabledDates : [])
    .slice(0, 1000)
    .map((d) => parseDateTime(d, format))
    .filter(Boolean)
    .map((d) => d.format('YYYY-MM-DD'));
  return { min, max, disabled };
};

/** Why a date cannot be picked under the rules ('' when it can). */
export const dateProblem = (d, rules) => {
  if (!d || !rules) return '';
  const day = d.startOf('day');
  if (rules.min && day.isBefore(rules.min)) return `Pick a date on or after ${rules.min.format('DD MMM YYYY')}`;
  if (rules.max && day.isAfter(rules.max)) return `Pick a date on or before ${rules.max.format('DD MMM YYYY')}`;
  if (rules.disabled.includes(day.format('YYYY-MM-DD'))) return 'This date is not available';
  return '';
};

/** `date` (a dayjs day) at `minutes` past midnight. */
export const atTime = (date, minutes) =>
  date
    .startOf('day')
    .hour(Math.floor(minutes / 60))
    .minute(minutes % 60);
