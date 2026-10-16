// ToolJet UI 2.0: the pure date logic of the Calendar widget (also used by the Date picker). It takes
// author data as it comes and never throws.
import dayjs from 'dayjs';
import { arr, isObject, text, unwrap } from './actionsModel';
import type { ConfigType } from 'dayjs';
import type { DateRange, Matcher } from 'react-day-picker';

/** What a calendar holds: a date (single mode), a list of dates (multiple) or a range, or nothing. */
export type CalendarSelection = Date | Date[] | DateRange | undefined;

/** What a calendar exposes for its selection. */
export type CalendarExposed = {
  value: string | string[];
  selectedDate: string;
  selectedDates: string[];
  startDate: string;
  endDate: string;
};

/** A day's marker: a dot (in `color`) with a label shown on hover. */
export interface Marker {
  label: string;
  color: string;
}

// ---- Calendar --------------------------------------------------------------------------------------------------

/** A date from author data ('2026-10-09', an ISO string, a timestamp, a Date), or undefined. */
export const toDate = (v: unknown): Date | undefined => {
  const raw = unwrap(v);
  if (raw === undefined || raw === null || raw === '' || typeof raw === 'boolean') return undefined;
  if (!(raw instanceof Date) && typeof raw !== 'string' && typeof raw !== 'number') return undefined;
  const d = dayjs(raw);
  return d.isValid() ? d.startOf('day').toDate() : undefined;
};
export const ymd = (d: ConfigType): string => (d && dayjs(d).isValid() ? dayjs(d).format('YYYY-MM-DD') : '');

/** The selection from a default value: a Date (single), a list of Dates (multiple) or `{ from, to }` (range). */
export const calendarSelection = (raw: unknown, mode: unknown): CalendarSelection => {
  const value = unwrap(raw);
  if (mode === 'multiple') {
    const dates = (Array.isArray(value) ? value : [value])
      .slice(0, 1000)
      .map(toDate)
      .filter((d): d is Date => !!d);
    const seen = new Set<string>();
    return dates.filter((d) => !seen.has(ymd(d)) && seen.add(ymd(d)));
  }
  if (mode === 'range') {
    const pair = Array.isArray(value)
      ? value
      : isObject(value)
      ? [value.from ?? value.start ?? value.startDate, value.to ?? value.end ?? value.endDate]
      : [value];
    const from = toDate(pair[0]);
    const to = toDate(pair[1]);
    if (!from) return undefined;
    return to && to < from ? { from: to, to: from } : { from, to };
  }
  return toDate(Array.isArray(value) ? value[0] : value);
};

/** The exposed values of a selection. value: 'YYYY-MM-DD' (single), a list (multiple) or [start, end] (range). */
export const calendarExposed = (selected: CalendarSelection, mode: unknown): CalendarExposed => {
  if (mode === 'multiple') {
    const dates = arr(selected).map(ymd).filter(Boolean).sort();
    return { value: dates, selectedDate: dates[0] ?? '', selectedDates: dates, startDate: '', endDate: '' };
  }
  if (mode === 'range') {
    // The selection's shape follows the mode.
    const range = selected as DateRange | undefined;
    const start = ymd(range?.from);
    const end = ymd(range?.to);
    return {
      value: [start, end],
      selectedDate: start,
      selectedDates: [start, end].filter(Boolean),
      startDate: start,
      endDate: end,
    };
  }
  const date = ymd(selected as Date | undefined);
  return { value: date, selectedDate: date, selectedDates: date ? [date] : [], startDate: '', endDate: '' };
};

/** The exposed visible period: visibleMonth 'YYYY-MM' and the first and last day shown across the months. */
export const visiblePeriod = (
  month: ConfigType,
  numberOfMonths = 1
): { visibleMonth: string; visibleStart: string; visibleEnd: string } => {
  const start = dayjs(month).isValid() ? dayjs(month).startOf('month') : dayjs().startOf('month');
  return {
    visibleMonth: start.format('YYYY-MM'),
    visibleStart: start.format('YYYY-MM-DD'),
    visibleEnd: start
      .add(Math.max(1, numberOfMonths) - 1, 'month')
      .endOf('month')
      .format('YYYY-MM-DD'),
  };
};

/** Markers by day ('YYYY-MM-DD' -> [{ label, color }]): `[{ date, label?, color? }]`, or plain dates. */
export const markersByDay = (markers: unknown): Map<string, Marker[]> => {
  const map = new Map<string, Marker[]>();
  for (const raw of arr(markers).slice(0, 2000)) {
    const date = toDate(isObject(raw) ? raw.date ?? raw.day ?? raw.start : raw);
    if (!date) continue;
    const key = ymd(date);
    const marker = {
      label: isObject(raw) ? text(raw.label ?? raw.title) : '',
      color: isObject(raw) ? text(raw.color) : '',
    };
    map.set(key, [...(map.get(key) || []), marker]);
  }
  return map;
};

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** react-day-picker's disabled matchers from min and max dates, a list of disabled dates and disabled weekdays
 *  (0 to 6 or names). */
export const disabledMatchers = ({
  minDate,
  maxDate,
  disabledDates,
  disabledDays,
}: { minDate?: unknown; maxDate?: unknown; disabledDates?: unknown; disabledDays?: unknown } = {}): Matcher[] => {
  const matchers: Matcher[] = [];
  const min = toDate(minDate);
  const max = toDate(maxDate);
  if (min) matchers.push({ before: min });
  if (max) matchers.push({ after: max });
  const dates = arr(disabledDates)
    .slice(0, 2000)
    .map(toDate)
    .filter((d): d is Date => !!d);
  if (dates.length) matchers.push(...dates);
  const days = arr(disabledDays)
    .map((d) => (typeof d === 'string' && WEEKDAYS.includes(d.toLowerCase()) ? WEEKDAYS.indexOf(d.toLowerCase()) : d))
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (days.length) matchers.push({ dayOfWeek: [...new Set(days)] });
  return matchers;
};
