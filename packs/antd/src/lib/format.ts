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
  if (format === 'boolean') return v === true || v === 'true' || v === 1 || v === '1' ? 'Yes' : v === false || v === 'false' || v === 0 || v === '0' ? 'No' : String(v);
  if (typeof v === 'string' && ISO_DATE.test(v) && (format === 'date' || format === 'datetime' || !format)) {
    if (format === 'datetime' && DATE_ONLY.test(v)) return formatDate(v);
    return format === 'date' ? formatDate(v.slice(0, 10)) : formatDate(v);
  }
  if (typeof v === 'number') return formatNumber(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/**
 * A column or field format as written by Ant (format) or by UI 2.0 (type): number, currency or currency:EUR (the code
 * sets the currency), percent, compact, date, datetime, tag (also badge, status), boolean, link, text.
 */
export const parseFormat = (raw: unknown): { format?: string; currency?: string } => {
  const t = typeof raw === 'string' ? raw.trim() : '';
  if (!t) return {};
  const [head, arg] = t.split(':');
  const k = head!.toLowerCase();
  const code = arg && /^[a-z]{3}$/i.test(arg.trim()) ? arg.trim().toUpperCase() : undefined;
  const map: Record<string, string> = {
    number: 'number', numeric: 'number', integer: 'number', int: 'number', float: 'number', decimal: 'number',
    currency: 'currency', money: 'currency', price: 'currency', amount: 'currency',
    percent: 'percent', percentage: 'percent', compact: 'compact',
    date: 'date', datetime: 'datetime', 'date-time': 'datetime', timestamp: 'datetime', time: 'datetime',
    tag: 'tag', tags: 'tag', badge: 'tag', badges: 'tag', status: 'tag', chip: 'tag', chips: 'tag', pill: 'tag', label: 'tag', labels: 'tag',
    boolean: 'boolean', bool: 'boolean', checkbox: 'boolean', toggle: 'boolean',
    link: 'link', url: 'link', text: 'text', string: 'text',
  };
  return { format: map[k] ?? (code ? 'currency' : undefined), currency: code };
};

// Colour words apps and the AI builder use -> Ant's Tag presets (Ant has no amber, teal, indigo...).
const TAG_COLOR_WORDS: Record<string, string> = {
  amber: 'gold', yellow: 'gold', orange: 'orange', red: 'red', rose: 'red', crimson: 'red', green: 'green', emerald: 'green',
  lime: 'lime', teal: 'cyan', cyan: 'cyan', sky: 'blue', blue: 'blue', indigo: 'geekblue', navy: 'geekblue',
  violet: 'purple', purple: 'purple', pink: 'magenta', magenta: 'magenta', fuchsia: 'magenta', volcano: 'volcano',
  gold: 'gold', geekblue: 'geekblue', gray: 'default', grey: 'default', slate: 'default', neutral: 'default', default: 'default',
  success: 'success', positive: 'success', warning: 'warning', danger: 'error', error: 'error', destructive: 'error',
  negative: 'error', info: 'processing', processing: 'processing', primary: 'processing',
};
/** A colour given for a tag as an Ant Tag colour: a preset or status name, a colour word mapped to one, or a CSS colour. */
export const tagColor = (c: unknown): string | undefined => {
  const t = typeof c === 'string' ? c.trim() : '';
  if (!t) return undefined;
  const k = t.toLowerCase().replace(/[-_\s]?\d{2,3}$/, '');
  if (TAG_COLOR_WORDS[k]) return TAG_COLOR_WORDS[k] === 'default' ? undefined : TAG_COLOR_WORDS[k];
  return /^(#|rgb|hsl)/i.test(t) ? t : undefined;
};
