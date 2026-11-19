// Calendar math for the Rocket date/time picker. Every Date here is a wall-clock value read and built with local
// getters/constructors; time zones are the caller's business.

export type DatePickerType = 'date' | 'time' | 'date-time';
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Period = 'AM' | 'PM';

const pad2 = (n: number) => String(n).padStart(2, '0');

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Same day of month in the target month, clamped to its length (31 Jan + 1 month = 28 Feb).
export const addMonths = (d: Date, n: number) => {
  const lastDay = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), lastDay));
};

// Always six rows of seven days (a month spans at most six weeks), so the panel never changes height. Days are built
// with the Date(y, m, d + i) constructor rather than by adding 24h, which would drift across a DST change.
export function getMonthGrid(month: Date, weekStartsOn: WeekStart): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  return Array.from({ length: 6 }, (_, week) =>
    Array.from(
      { length: 7 },
      (_, dayOfWeek) => new Date(first.getFullYear(), first.getMonth(), 1 - lead + week * 7 + dayOfWeek)
    )
  );
}

// Day-level check: the time part of the bounds is ignored, so the bound days themselves stay selectable.
export function isDayDisabled(day: Date, minDate?: Date | null, maxDate?: Date | null) {
  const d = startOfDay(day).getTime();
  return (!!minDate && d < startOfDay(minDate).getTime()) || (!!maxDate && d > startOfDay(maxDate).getTime());
}

// Instant-level check, used when a time is part of the value.
export function clampDate(date: Date, minDate?: Date | null, maxDate?: Date | null) {
  if (minDate && date.getTime() < minDate.getTime()) return minDate;
  if (maxDate && date.getTime() > maxDate.getTime()) return maxDate;
  return date;
}

export const to12h = (hour24: number): { hour: number; period: Period } => ({
  hour: hour24 % 12 || 12,
  period: hour24 < 12 ? 'AM' : 'PM',
});

export const to24h = (hour12: number, period: Period) => (hour12 % 12) + (period === 'PM' ? 12 : 0);

// Replaces the time of `base` (12:00 AM today when there is none). Seconds and milliseconds are zeroed.
export function setTimeParts(base: Date | null, parts: { hour24?: number; minute?: number }) {
  const from = base ?? startOfDay(new Date());
  return new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
    parts.hour24 ?? from.getHours(),
    parts.minute ?? from.getMinutes(),
    0,
    0
  );
}

export function defaultFormatDisplay(date: Date, type: DatePickerType) {
  const { hour, period } = to12h(date.getHours());
  const dayPart = `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  const timePart = `${pad2(hour)}:${pad2(date.getMinutes())} ${period}`;
  if (type === 'date') return dayPart;
  if (type === 'time') return timePart;
  return `${dayPart} ${timePart}`;
}

const longDay = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const monthTitle = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
export const formatDayLabel = (d: Date) => longDay.format(d);
export const formatMonthTitle = (d: Date) => monthTitle.format(d);
