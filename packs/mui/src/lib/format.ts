import dayjs from 'dayjs';
import { currencyCode, localeFor, moneyStyle } from './locale';

export type NumberFormat = 'auto' | 'number' | 'currency' | 'percent' | 'compact';

/** A number from a value that may be a numeric string ('1,234.5', '12%'); null when it is not a number. */
export const toNumber = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/,/g, '');
  if (!/^[-+]?\d*\.?\d+(e[-+]?\d+)?%?$/i.test(t)) return null;
  const n = Number(t.replace('%', ''));
  return Number.isFinite(n) ? n : null;
};

// One formatter per locale and options. The locale is the author's, else the currency's home locale (BRL pt-BR), else
// en-US (lib/locale.ts), so a BRL figure reads "R$ 8.799,00" and apps that set neither keep their look.
const formatters = new Map<string, Intl.NumberFormat>();
const fmt = (opts: Intl.NumberFormatOptions, locale = 'en-US') => {
  const key = `${locale}|${JSON.stringify(opts)}`;
  let f = formatters.get(key);
  if (!f) {
    if (formatters.size > 300) formatters.clear();
    try {
      f = new Intl.NumberFormat(locale, opts);
    } catch {
      f = new Intl.NumberFormat(locale, { ...opts, style: 'decimal', currency: undefined });
    }
    formatters.set(key, f);
  }
  return f;
};

/**
 * Formats a number. `auto` keeps integers whole and other numbers to 2 places, with grouping. `percent` reads 0.25 and
 * 25 both as 25% (a fraction when |n| <= 1). precision: fixed decimals, or null for the format's own. locale: the
 * author's (pt-BR), or blank to follow the currency (BRL writes "R$ 8.799,00"), else en-US.
 */
export const formatNumber = (n: number, format: NumberFormat = 'auto', currency = 'USD', precision: number | null = null, locale?: unknown) => {
  const digits = precision === null ? {} : { minimumFractionDigits: precision, maximumFractionDigits: precision };
  const where = localeFor(currency, locale);
  switch (format) {
    case 'currency':
      return fmt(moneyStyle(currencyCode(currency), digits), where).format(n);
    case 'percent':
      return fmt({ style: 'percent', maximumFractionDigits: precision ?? 1, ...digits }, where).format(Math.abs(n) <= 1 ? n : n / 100);
    case 'compact':
      return fmt({ notation: 'compact', maximumFractionDigits: precision ?? 1 }, where).format(n);
    case 'number':
      return fmt({ maximumFractionDigits: precision ?? 2, ...digits }, where).format(n);
    default:
      return fmt(precision === null ? { maximumFractionDigits: Number.isInteger(n) ? 0 : 2 } : digits, where).format(n);
  }
};

/** A figure as written: "75.8%" is a percent (shown with its sign under the auto or number format), a plain number is
 *  formatted, other text shows as is. Statistic values often arrive from a query already as "75.8%" text. */
export const formatFigure = (
  v: unknown,
  format: NumberFormat = 'auto',
  currency = 'USD',
  precision: number | null = null,
  locale?: unknown
): string | null => {
  const n = toNumber(v);
  if (n === null) return null;
  // Under any format: a figure written with its percent sign is a percent (compact or currency would drop the sign).
  if (typeof v === 'string' && v.trim().endsWith('%'))
    return fmt(
      { style: 'percent', maximumFractionDigits: precision ?? 1, ...(precision === null ? {} : { minimumFractionDigits: precision }) },
      localeFor(currency, locale)
    ).format(n / 100);
  return formatNumber(n, format, currency, precision, locale);
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// dayjs reads a date-only string in local time (new Date() would read it as UTC midnight, a day early west of UTC).
// A pattern (a column's dateFormat, dayjs tokens: DD/MM, MMM D, YYYY) is written as is; else the date reads in the
// locale (the author's, else the currency's home one: pt-BR writes 25/10/2026), en-US by default.
export const formatDate = (v: string, { pattern, locale, currency }: { pattern?: unknown; locale?: unknown; currency?: unknown } = {}) => {
  const d = dayjs(v);
  if (!d.isValid()) return v;
  const written = typeof pattern === 'string' ? pattern.trim() : '';
  if (written) return d.format(written);
  const where = localeFor(currency, locale);
  return DATE_ONLY.test(v)
    ? d.toDate().toLocaleDateString(where, { year: 'numeric', month: 'short', day: 'numeric' })
    : d.toDate().toLocaleString(where, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

/** Fields whose numbers are identifiers, not quantities: shown as typed, without grouping. */
export const isIdField = (field: string) => /(^id$|_id$|[a-z]Id$|^code$|_code$|year$|zip|phone|^no$|_no$|number$)/i.test(field);

/** A cell value as text: numbers grouped, ISO dates shown as dates, booleans as Yes/No, objects as JSON. */
export const formatCell = (v: unknown, format?: string, currency?: string, locale?: unknown, dateFormat?: unknown): string => {
  if (v === undefined || v === null || v === '') return '';
  if (format === 'text') return typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (format) {
    const n = toNumber(v);
    if (n !== null && ['number', 'currency', 'percent', 'compact'].includes(format)) return formatNumber(n, format as NumberFormat, currency, null, locale);
  }
  if (typeof v === 'string' && ISO_DATE.test(v) && (format === 'date' || !format)) return formatDate(v, { pattern: dateFormat, locale, currency });
  if (typeof v === 'number') return formatNumber(v, 'auto', currency || 'USD', null, locale);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};
