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

/** A figure as written: "75.8%" is a percent (shown with its sign under the auto or number format), a plain number is
 *  formatted, other text shows as is. Statistic values often arrive from a query already as "75.8%" text. */
export const formatFigure = (v: unknown, format: NumberFormat = 'auto', currency = 'USD', precision: number | null = null): string | null => {
  const n = toNumber(v);
  if (n === null) return null;
  if (typeof v === 'string' && v.trim().endsWith('%') && (format === 'auto' || format === 'number' || format === 'percent'))
    return fmt({ style: 'percent', maximumFractionDigits: precision ?? 1, ...(precision === null ? {} : { minimumFractionDigits: precision }) }).format(n / 100);
  return formatNumber(n, format, currency, precision);
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

/** A CSS colour (#hex, rgb(), hsl()) as [hue 0-360, saturation 0-1, lightness 0-1]; undefined when it is not one. */
export const hslOf = (color: string): [number, number, number] | undefined => {
  const t = color.trim().toLowerCase();
  const hsl = /^hsla?\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/.exec(t);
  if (hsl) return [((Number(hsl[1]) % 360) + 360) % 360, Number(hsl[2]) / 100, Number(hsl[3]) / 100];
  let rgb: number[] | undefined;
  const hex = /^#([0-9a-f]{3,8})$/.exec(t)?.[1];
  if (hex && (hex.length === 3 || hex.length === 4)) rgb = [0, 1, 2].map((i) => parseInt(hex[i] + hex[i], 16));
  else if (hex && (hex.length === 6 || hex.length === 8)) rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(t);
  if (fn) rgb = [Number(fn[1]), Number(fn[2]), Number(fn[3])];
  if (!rgb || rgb.some((v) => Number.isNaN(v))) return undefined;
  const [r, g, b] = rgb.map((v) => Math.min(255, v) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
};

// Where each of Ant's preset palettes sits on the hue wheel (the upper bound of its arc).
const PRESET_HUES: [number, string][] = [
  [15, 'red'], [28, 'volcano'], [40, 'orange'], [52, 'gold'], [62, 'yellow'], [85, 'lime'], [165, 'green'], [195, 'cyan'],
  [228, 'blue'], [250, 'geekblue'], [290, 'purple'], [340, 'magenta'], [360, 'red'],
];

/**
 * A tag colour under an applied app theme: a CSS colour (an author's or the AI builder's '#2576CE') becomes the Ant
 * preset of its hue, which the theme redraws in its own colours (scripts/extract-styles.mjs PRESET_THEMED: blue the
 * brand, green success, orange and gold warning, red danger...). A grey stays the neutral tag. Presets and status names
 * pass through. Unthemed (stock Ant) the colour is kept as given.
 */
export const themedTagColor = (color: string | undefined, themed: boolean): string | undefined => {
  if (!themed || !color) return color;
  const word = tagColor(color);
  if (word && !/^(#|rgb|hsl)/i.test(word)) return word;
  const hsl = word ? hslOf(word) : undefined;
  if (!hsl) return color;
  if (hsl[1] < 0.25 || hsl[2] < 0.08 || hsl[2] > 0.96) return undefined;
  return PRESET_HUES.find(([upTo]) => hsl[0] < upTo)?.[1] ?? 'red';
};
