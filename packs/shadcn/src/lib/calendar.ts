// Dates travel as local 'YYYY-MM-DD' strings, so no timezone shifts a picked day.
export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseIso = (value: unknown): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
};

export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// The 6x7 grid of days shown for a month, starting on the week-start day on or before the 1st.
export const monthGrid = (year: number, month: number, weekStartsOn = 0): Date[] => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
};

export const monthTitle = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export const addMonths = (year: number, month: number, delta: number) => {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
};

// Time values travel as 24h 'HH:mm'.
export const parseTime = (value: unknown): { h: number; m: number } | null => {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? ''));
  return match ? { h: Number(match[1]) % 24, m: Number(match[2]) % 60 } : null;
};

export const toTime = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

export const formatTime = (value: string, format: string) => {
  const t = parseTime(value);
  if (!t) return '';
  if (format === '24h') return toTime(t.h, t.m);
  const h12 = t.h % 12 === 0 ? 12 : t.h % 12;
  return `${h12}:${String(t.m).padStart(2, '0')} ${t.h < 12 ? 'AM' : 'PM'}`;
};
