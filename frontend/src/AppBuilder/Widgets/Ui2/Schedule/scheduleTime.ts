// ToolJet UI 2.0 Schedule: reading times from bound data and calendar-day arithmetic (scheduleModel.ts). Days are
// calendar days in local time: where the clocks change a day has 23 or 25 hours.
import type { ParsedTime } from './scheduleTypes';
import { isNonBlankString, pad2 } from '@/AppBuilder/Widgets/Ui2/_shared/values';

export const int = (v: unknown, fallback: number): number => {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return fallback;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : fallback;
};
/** An hour of the day from a number (9) or a clock time ('09:00', '5:30 PM'); an end rounds up to the next hour
 *  ('17:30' ends after 17:00-18:00). dayStart="09:00" fell back to 8 (2026-10-14). */
export const hourOf = (v: unknown, fallback: number, roundUp: boolean): number => {
  const clock = typeof v === 'string' ? v.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i) : null;
  if (!clock) return int(v, fallback);
  let h = Number(clock[1]) % (clock[3] ? 12 : 24);
  if (clock[3] && /^p/i.test(clock[3])) h += 12;
  if (!clock[3] && Number(clock[1]) === 24) h = 24;
  return roundUp && Number(clock[2] || 0) > 0 ? h + 1 : h;
};
export const midnight = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** `ms` moved by `days` calendar days at the same wall time (a day can have 23 or 25 hours where the clocks change). */
export const addDays = (ms: number, days: number): number => {
  const d = new Date(ms);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + days,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  ).getTime();
};
/** The local midnight after `ms`'s day. */
export const nextMidnight = (ms: number): number => addDays(midnight(new Date(ms)).getTime(), 1);

/** A local day as YYYY-MM-DD. */
export const dayKey = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** A time from what a binding gives: a Date, a timestamp, 'YYYY-MM-DD' (a day, local), 'HH:mm' or '9:30 am' (that
 *  time on `day`), or any date text Date reads. { time, dateOnly } in ms, or null when it is not a time. */
export const parseTime = (v: unknown, day?: Date): ParsedTime | null => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : { time: v.getTime(), dateOnly: false };
  if (typeof v === 'number') return Number.isFinite(v) ? { time: v, dateOnly: false } : null;
  if (!isNonBlankString(v) || v.length > 64) return null;
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

/** A time of day as text: '9:30 AM' (12h) or '09:30' (24h). */
export const clockText = (ms: number, format: unknown = '12h'): string => {
  const d = new Date(ms);
  return hourText(d.getHours(), d.getMinutes(), format);
};
