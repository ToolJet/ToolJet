import dayjs from 'dayjs';

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

const formatters = new Map<string, Intl.NumberFormat>();
const fmt = (opts: Intl.NumberFormatOptions) => {
  const key = JSON.stringify(opts);
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(undefined, opts);
    } catch {
      f = new Intl.NumberFormat(undefined, { ...opts, style: 'decimal', currency: undefined });
    }
    formatters.set(key, f);
  }
  return f;
};

/**
 * Formats a number. `auto` keeps integers whole and other numbers to 2 places, with grouping. `percent` reads 0.25 and
 * 25 both as 25% (a fraction when |n| <= 1). precision: fixed decimals, or null for the format's own.
 */
export const formatNumber = (n: number, format: NumberFormat = 'auto', currency = 'USD', precision: number | null = null) => {
  const digits = precision === null ? {} : { minimumFractionDigits: precision, maximumFractionDigits: precision };
  switch (format) {
    case 'currency':
      return fmt({ style: 'currency', currency: currency || 'USD', ...digits }).format(n);
    case 'percent':
      return fmt({ style: 'percent', maximumFractionDigits: precision ?? 1, ...digits }).format(Math.abs(n) <= 1 ? n : n / 100);
    case 'compact':
      return fmt({ notation: 'compact', maximumFractionDigits: precision ?? 1 }).format(n);
    case 'number':
      return fmt({ maximumFractionDigits: precision ?? 2, ...digits }).format(n);
    default:
      return fmt(precision === null ? { maximumFractionDigits: Number.isInteger(n) ? 0 : 2 } : digits).format(n);
  }
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// dayjs reads a date-only string in local time (new Date() would read it as UTC midnight, a day early west of UTC).
const formatDate = (v: string) => {
  const d = dayjs(v);
  if (!d.isValid()) return v;
  return DATE_ONLY.test(v)
    ? d.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : d.toDate().toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

/** Fields whose numbers are identifiers, not quantities: shown as typed, without grouping. */
export const isIdField = (field: string) => /(^id$|_id$|[a-z]Id$|^code$|_code$|year$|zip|phone|^no$|_no$|number$)/i.test(field);

/** A cell value as text: numbers grouped, ISO dates shown as dates, booleans as Yes/No, objects as JSON. */
export const formatCell = (v: unknown, format?: string, currency?: string): string => {
  if (v === undefined || v === null || v === '') return '';
  if (format === 'text') return typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (format) {
    const n = toNumber(v);
    if (n !== null && ['number', 'currency', 'percent', 'compact'].includes(format)) return formatNumber(n, format as NumberFormat, currency);
  }
  if (typeof v === 'string' && ISO_DATE.test(v) && (format === 'date' || !format)) return formatDate(v);
  if (typeof v === 'number') return formatNumber(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};
