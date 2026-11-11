import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { str } from './data';

// A date written as YYYY-MM-DD (with an optional time) must name a real day and time: dayjs rolls 2026-13-45 over into
// 2027-02-14 and 25:99 into the next day, which a setFieldValue then saved as if it had been asked for.
const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?/;
const ZONED = /(z|[+-]\d{2}:?\d{2})$/i;

/** A date from text or a date value; null for nothing or for text that names no real date. */
export const parseDate = (v: unknown): Dayjs | null => {
  const s = str(v).trim();
  if (!s) return null;
  const d = dayjs(s);
  if (!d.isValid()) return null;
  const m = ISO.exec(s);
  // A zoned time (Z, +05:30) reads in local time, so its fields differ by design.
  if (m && !ZONED.test(s)) {
    const [y, mo, day, h, mi, sec] = m.slice(1).map((x) => (x === undefined ? undefined : Number(x)));
    if (d.year() !== y || d.month() + 1 !== mo || d.date() !== day) return null;
    if (h !== undefined && (d.hour() !== h || d.minute() !== mi || (sec !== undefined && d.second() !== sec)))
      return null;
  }
  return d;
};

/** A time of day from text in one of `formats` (HH:mm:ss, HH:mm, ...), strictly: 25:99 is no time. */
export const parseTime = (v: unknown, formats: string[]): Dayjs | null => {
  const s = str(v).trim();
  if (!s) return null;
  for (const format of formats) {
    const d = dayjs(`2000-01-01 ${s}`, `YYYY-MM-DD ${format}`, true);
    if (d.isValid()) return d;
  }
  return null;
};

/** Whether a value names nothing (empty), as opposed to text that names an impossible date. */
export const isBlankDate = (v: unknown): boolean => str(v).trim() === '';
