// ToolJet UI 2.0: how the widgets show numbers, money, percentages and dates. Every function takes whatever the author
// bound and never throws. The input fields' own formats (typed in a locale, parsed back) are in _inputs/inputsModel.ts.
//
// ToolJet's native number helpers (groupDigits, affixNumber in Shared/DataTypes/renderers/NumberRenderer.jsx) format
// in the viewer's locale with up to 20 decimals; these keep the pack's own rules (en-US for table cells, 2 decimals,
// cents on money), which saved apps already show, so they are not swapped for the native ones.
import dayjs from 'dayjs';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { isEmptyValue, isNonBlankString, isScalar, isSet, num } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import type { ColumnLike } from '@/AppBuilder/Widgets/Ui2/Table/types';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** A value fit for an axis tick or a legend: text and numbers as they are, anything else as text. */
export const axisLabel = (v: unknown): string | number => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (isScalar(v)) return typeof v === 'boolean' ? String(v) : v;
  try {
    return stringify(v) ?? '';
  } catch {
    return String(v);
  }
};

// ---- Number formats ------------------------------------------------------------------------------------------------

export type NumberFormat = 'number' | 'currency' | 'percent' | 'compact';
export const FORMATS: readonly string[] = ['number', 'currency', 'percent', 'compact'];
export const isFormat = (format: unknown): format is NumberFormat =>
  typeof format === 'string' && FORMATS.includes(format);

/** A value's format as bound: format, currency, prefix and suffix are whatever the author set (unset, text or junk). */
export interface FormatOptions {
  format?: unknown;
  currency?: unknown;
  prefix?: unknown;
  suffix?: unknown;
}

// Intl.NumberFormat is costly to build; a table formats every cell on each search, and a list every row's figures
// (a 10,000-row currency progress list built 30,000), so formatters are reused, one per locale and options.
const FORMATTERS = new Map<string, Intl.NumberFormat>();
const numberFormatter = (locale: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat => {
  const key = `${locale ?? ''}|${stringify(options)}`;
  let cached = FORMATTERS.get(key);
  if (!cached) {
    if (FORMATTERS.size > 200) FORMATTERS.clear();
    cached = new Intl.NumberFormat(locale, options);
    FORMATTERS.set(key, cached);
  }
  return cached;
};

const intl = (options: Intl.NumberFormatOptions): Intl.NumberFormat => {
  try {
    return numberFormatter(undefined, options);
  } catch {
    return numberFormatter(undefined, { maximumFractionDigits: 2 });
  }
};

/** A formatter for the format ('number' | 'currency' | 'percent' | 'compact'), with the value prefix and suffix.
 *  Short (axis ticks) abbreviates large numbers. Percent takes values already in percent (42 shows 42%). Non-numbers
 *  show as text. */
export const formatter = (
  { format, currency, prefix, suffix }: FormatOptions = {},
  short = false
): ((v: unknown) => string) => {
  const kind = isFormat(format) ? format : 'number';
  const code = typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim() : 'USD';
  const compact = short || kind === 'compact';
  let f: Intl.NumberFormat;
  if (kind === 'currency') {
    f = intl({
      style: 'currency',
      currency: code.toUpperCase(),
      ...(compact
        ? { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }
        : { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    });
  } else if (compact && kind !== 'percent') {
    f = intl({ notation: 'compact', maximumFractionDigits: 1 });
  } else {
    f = intl({ maximumFractionDigits: kind === 'percent' ? 1 : 2 });
  }
  const before = isScalar(prefix) ? String(prefix) : '';
  const after = (kind === 'percent' ? '%' : '') + (isScalar(suffix) ? String(suffix) : '');
  // Money with cents shows both digits ("$3,043.50", never "$3,043.5"); whole amounts and compact ticks stay as they are.
  const cents =
    kind === 'currency' && !compact
      ? intl({ style: 'currency', currency: code.toUpperCase(), minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : null;
  return (v) => {
    const n = num(v);
    if (n === null) return v === null || v === undefined ? '' : String(axisLabel(v));
    return `${before}${(cents && !Number.isInteger(n) ? cents : f).format(n)}${after}`;
  };
};

/** How a change (a Stat's change, a Summary strip's delta) is written: 'percent', 'number' or 'currency'. */
export const CHANGE_FORMATS: readonly string[] = ['percent', 'number', 'currency'];

/** A change as shown: signed (+12.4%, −3.2, no sign at zero) and rounded, never a raw float (an agent's binding printed
 *  "-9.793980410868281"): a percent to one decimal, a number to at most one ("12", "3.2"), money in the currency's own
 *  decimals, all in the viewer's locale. direction is the sign of the figure as shown: −0.04% rounds to 0.0%, flat. */
export const formatChange = (n: number, format: unknown, currency?: unknown): { text: string; direction: number } => {
  const kind = typeof format === 'string' && CHANGE_FORMATS.includes(format) ? format : 'number';
  const code =
    typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim().toUpperCase() : 'USD';
  const f =
    kind === 'currency'
      ? intl({ style: 'currency', currency: code })
      : intl({ minimumFractionDigits: kind === 'percent' ? 1 : 0, maximumFractionDigits: 1 });
  const digits = f.resolvedOptions().maximumFractionDigits ?? 1;
  const shown = Math.round(Math.abs(n) * 10 ** digits) / 10 ** digits;
  const direction = shown === 0 ? 0 : Math.sign(n);
  const sign = direction > 0 ? '+' : direction < 0 ? '\u2212' : '';
  return { text: `${sign}${f.format(shown)}${kind === 'percent' ? '%' : ''}`, direction };
};

// The Area, Bar and Pie charts' values: read with Number() (so a flag or '' is a number), short ones compact, with the
// valuePrefix and valueSuffix as set. formatter reads numbers more strictly; these charts have always shown this.
const COMPACT = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
/** A number in the viewer's locale, up to two decimals. */
export const PLAIN_NUMBER = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
export const affixFormatter =
  (p: Resolved, short: boolean) =>
  (v: unknown): string => {
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v ?? '');
    return `${p.valuePrefix || ''}${short ? COMPACT.format(n) : PLAIN_NUMBER.format(n)}${p.valueSuffix || ''}`;
  };

/** A finite number, or digits as text ('-12.5'); grouped or formatted text ("$1,250.00", "12 open") is not. */
export const isNumericFigure = (value: unknown): value is number | string =>
  typeof value === 'number'
    ? Number.isFinite(value)
    : typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim());

/** A figure written as text, as a number: plain ("1250", "-12.5") or grouped the way the viewer's locale writes numbers
 *  ("1,250" and "1,250.5" in English, "1.250,5" in German). null for other text ("$1,250.00", "12 open"), and for text
 *  the two readings disagree on ("1.250" in German: 1.25 plain, 1250 grouped). */
export const figureOf = (value: unknown, locale?: string): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const plain = /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : null;
  let parts: Intl.NumberFormatPart[] = [];
  try {
    parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  } catch {
    return plain;
  }
  const group = parts.find((p) => p.type === 'group')?.value ?? ',';
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
  const esc = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const grouped = new RegExp(`^-?(\\d{1,3}(${esc(group)}\\d{3})+|\\d+)(${esc(decimal)}\\d+)?$`);
  const local = grouped.test(text) ? Number(text.split(group).join('').replace(decimal, '.')) : null;
  if (plain !== null && local !== null && plain !== local) return null;
  return plain ?? local;
};

// ---- Dates -----------------------------------------------------------------------------------------------------------

/** A date as dayjs reads it; a number below 1e12 is a Unix time in seconds, else in milliseconds. */
export const toDayjs = (value: unknown): dayjs.Dayjs =>
  typeof value === 'number' ? dayjs(value < 1e12 ? value * 1000 : value) : dayjs(value as dayjs.ConfigType);

/** A date from a Date, a timestamp or date text. A bare 'YYYY-MM-DD' is that day where the viewer is (Date reads it as
 *  UTC midnight, which shows the day before west of Greenwich). null when it is not a date. */
export const toDay = (v: unknown): Date | null => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') return Number.isFinite(v) ? new Date(v) : null;
  if (!isNonBlankString(v)) return null;
  const day = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(v.trim());
  return Number.isNaN(d.getTime()) ? null : d;
};

/** A date as '14 Oct' ('14 Oct 2025' in another year), with the time when asked. */
export const dateText = (d: Date, withTime: boolean): string => {
  const sameYear = d.getFullYear() === new Date().getFullYear();
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
      ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    }).format(d);
  } catch {
    return d.toDateString();
  }
};

/** A date-like value in a dayjs format when a format is given and it parses as a date (a timestamp or text starting
 *  'YYYY-MM-DD'); anything else as given. */
export const formatDate = (time: unknown, dateFormat: unknown): string => {
  if (!isSet(time)) return '';
  if (!isSet(dateFormat)) return String(time);
  const looksLikeDate = typeof time === 'number' || /^\d{4}-\d{2}-\d{2}/.test(String(time));
  if (!looksLikeDate) return String(time);
  const parsed = toDayjs(time);
  return parsed.isValid() ? parsed.format(String(dateFormat)) : String(time);
};

// ---- Figures (record list, summary strip, progress list) -----------------------------------------------------------

export const VALUE_FORMATS: readonly string[] = ['auto', ...FORMATS, 'date', 'datetime'];

/** A value in a format: 'number', 'currency' (in currency, default USD), 'percent' (42.5 shows 42.5%) and 'compact'
 *  format numbers and numeric text; 'date' (14 Oct) and 'datetime' (14 Oct, 9:30 AM) format dates. 'auto' groups the
 *  digits of a bare number. Anything that is not of the format's kind (an already formatted "$1,250.00", "12 open")
 *  shows as written; objects show nothing. */
export const formatValue = (value: unknown, format: unknown = 'auto', currency?: unknown): string => {
  // A number that is not finite (Infinity, NaN, a division by zero in a binding) is not a value to show.
  if (value === null || value === undefined || typeof value === 'object') return '';
  if (typeof value === 'number' && !Number.isFinite(value)) return '';
  if (format === 'date' || format === 'datetime') {
    const d = toDay(value);
    return d ? dateText(d, format === 'datetime') : String(value);
  }
  if (!isNumericFigure(value)) return String(value);
  if (!isFormat(format)) return typeof value === 'number' ? formatter({ format: 'number' })(value) : String(value);
  const n = Number(value);
  // Money with cents shows both digits ($386.50, not $386.5); whole amounts show none. Unlike formatter's, the most
  // digits stay the currency's own (3 for KWD).
  if (format === 'currency' && !Number.isInteger(n)) {
    const code =
      isNonBlankString(currency) && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim().toUpperCase() : 'USD';
    try {
      return numberFormatter(undefined, { style: 'currency', currency: code, minimumFractionDigits: 2 }).format(n);
    } catch {
      return formatter({ format, currency })(n);
    }
  }
  return formatter({ format, currency })(n);
};

// ---- Table cells (Table, Key-value list) -----------------------------------------------------------------------------

/** A cell's number format in its locale and currency, or, when Intl cannot use them (a typo, an object), in en-US and
 *  as a plain amount: a bad locale or currency blanked every number and currency cell. No other currency's symbol is
 *  put on the amount. */
const usableFormatter = (locale: unknown, options: Intl.NumberFormatOptions): Intl.NumberFormat => {
  const plain = {
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits,
  };
  for (const [l, o] of [
    [locale || 'en-US', options],
    ['en-US', options],
    ['en-US', plain],
  ] as [string, Intl.NumberFormatOptions][]) {
    try {
      return numberFormatter(typeof l === 'string' ? l : 'en-US', o);
    } catch {
      // Not usable; the next one is.
    }
  }
  return numberFormatter('en-US', {});
};

const DEFAULT_DATE = 'DD MMM YYYY';
const DEFAULT_DATETIME = 'DD MMM YYYY, HH:mm';

/** A cell as text: what the table shows for plain types, searches and exports. Never throws. */
export const formatCell = (value: unknown, column: ColumnLike = {}): string => {
  try {
    if (isEmptyValue(value)) return '';
    const { type = 'string', format = {} } = column;
    const wrap = (text: string) => `${format.prefix ?? ''}${text}${format.suffix ?? ''}`;
    if (type === 'number' || type === 'currency') {
      const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
      if (!Number.isFinite(n)) return String(value);
      const digits = format.decimalPlaces;
      const options: Intl.NumberFormatOptions =
        type === 'currency'
          ? {
              style: 'currency',
              currency: String(format.currency || 'USD').toUpperCase(),
              minimumFractionDigits: digits ?? 2,
              maximumFractionDigits: digits ?? 2,
            }
          : { minimumFractionDigits: digits ?? 0, maximumFractionDigits: digits ?? 2 };
      return wrap(usableFormatter(format.locale, options).format(n));
    }
    if (type === 'date' || type === 'datetime') {
      const parsed = toDayjs(value);
      if (!parsed.isValid()) return String(value);
      return wrap(parsed.format(format.dateFormat || (type === 'datetime' ? DEFAULT_DATETIME : DEFAULT_DATE)));
    }
    if (type === 'boolean') return value === true || value === 'true' ? 'Yes' : 'No';
    if (type === 'tags')
      return (Array.isArray(value) ? value : String(value).split(',')).map((t) => String(t).trim()).join(', ');
    if (typeof value === 'object') return stringify(value);
    return wrap(String(value));
  } catch {
    return '';
  }
};
