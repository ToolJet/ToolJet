// The DataTable's data logic, ported from ToolJet UI 2.0's Table (Widgets/Ui2/Table/tableModel.ts and _shared/format.ts)
// with the same conventions: native column keys, filter conditions, sortApplied, rows keyed by idField. Plain TS with no
// dayjs: dates are parsed and formatted here with the dayjs format tokens the UI 2.0 table accepts.
import type { CSSProperties } from 'react';
import { boundedRegex, warnRegexOutcome } from '../../safeRegex';
import { seriesLabel } from '../charts/chartModel';

export type Row = Record<string, unknown>;
type Loose = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type ColumnType =
  | 'string'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'datetime'
  | 'badge'
  | 'tags'
  | 'boolean'
  | 'link'
  | 'image'
  | 'avatar'
  | 'progress'
  | 'button'
  | 'json'
  | 'html';

export interface ColumnFormat {
  decimalPlaces?: number;
  currency?: string;
  locale?: string;
  dateFormat?: string;
  prefix?: string;
  suffix?: string;
  /** A percent column whose values are fractions (0.184 shows 18.4%). */
  fraction?: boolean;
}

export interface TableColumn {
  id: string;
  key: string;
  name: string;
  type: ColumnType;
  align: string;
  width?: number;
  minWidth?: number;
  visible: boolean;
  /** Off until the column chooser shows it: an id column of columns derived from the data. */
  hiddenByDefault: boolean;
  sortable: boolean;
  searchable: boolean;
  wrap: boolean;
  format: ColumnFormat;
  options?: Loose[];
  badgeColors?: Loose;
  buttons?: Loose[];
  textColor?: unknown;
  cellBackgroundColor?: unknown;
  /** What the cell shows instead of its value: a per-row binding ({{cellValue}}, {{rowData.first + ' ' + rowData.last}}). */
  transformation?: unknown;
  fontWeight?: string | number;
  linkText?: unknown;
  openInNewTab: boolean;
  imageShape?: string;
  maxValue: number;
  conditionalStyles: Loose[];
}

export interface TableFilter {
  column: string;
  condition: string;
  value?: unknown;
}

export interface Sort {
  key: string;
  direction: 'asc' | 'desc';
}

/** A data row with its position in the data and its stable key (rowKey). */
export interface Entry {
  row: Row;
  index: number;
  key: string;
}

export interface Paged {
  items: Entry[];
  pageCount: number | null;
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const isSet = (v: unknown): boolean => v !== undefined && v !== null && String(v).trim() !== '';
export const isEmptyValue = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || Number.isNaN(v);

const stringify = (v: unknown): string => {
  try {
    return JSON.stringify(v) ?? '';
  } catch {
    return String(v);
  }
};

const falsy = (value: unknown): boolean => value === false || value === 'false' || value === '{{false}}';

const TYPE_ALIASES: Record<string, ColumnType> = {
  string: 'string',
  text: 'string',
  default: 'string',
  number: 'number',
  currency: 'currency',
  money: 'currency',
  percent: 'percent',
  percentage: 'percent',
  date: 'date',
  datepicker: 'date',
  datetime: 'datetime',
  badge: 'badge',
  status: 'badge',
  select: 'badge',
  tags: 'tags',
  tagsV2: 'tags',
  newMultiSelect: 'tags',
  boolean: 'boolean',
  toggle: 'boolean',
  link: 'link',
  image: 'image',
  avatar: 'avatar',
  progress: 'progress',
  button: 'button',
  actions: 'button',
  json: 'json',
  html: 'html',
};
const RIGHT_ALIGNED = new Set<string>(['number', 'currency', 'percent']);
const NUMERIC = new Set<string>(['number', 'currency', 'percent']);
export const NOT_DATA = new Set<string>(['button']);

/** A cell's value; `key` may be dotted (meta.team). */
export const readCell = (row: unknown, key: unknown): unknown => {
  if (!row || typeof row !== 'object' || !isSet(key)) return undefined;
  const fields = row as Row;
  if (String(key) in fields) return fields[String(key)];
  return String(key)
    .split('.')
    .reduce<unknown>((value, part) => (value && typeof value === 'object' ? (value as Row)[part] : undefined), row);
};

const inferType = (value: unknown): ColumnType =>
  typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string';

// ---- What a column holds, from its name and values ------------------------------------------------------------------
// UI 2.0's Table types columns from the data only by JavaScript type (a number column, a string column) and shows the
// key as the header, so derived tables read "total_amount" over "12,500" and "margin" over "0.18". The pack reads the
// field's words as well, the way the AI-built apps name them: money, percentages, dates, statuses and ids.

const tokens = (...texts: unknown[]): string[] =>
  texts
    .filter((t) => typeof t === 'string' || typeof t === 'number')
    .map((t) => String(t).replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase())
    .join(' ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const MONEY_WORDS = new Set([
  'amount', 'amt', 'price', 'prices', 'cost', 'costs', 'revenue', 'revenues', 'subtotal', 'total', 'balance', 'budget',
  'fee', 'fees', 'salary', 'salaries', 'spend', 'spent', 'payout', 'payouts', 'mrr', 'arr', 'ltv', 'aov', 'gmv', 'acv',
  'tcv', 'income', 'expense', 'expenses', 'profit', 'earnings', 'refund', 'refunds', 'charge', 'charges', 'deposit',
  'wage', 'wages', 'payment', 'payments', 'invoiced', 'billed', 'outstanding', 'owed', 'paid', 'due', 'sales', 'rent',
  'premium', 'arrears', 'msrp', 'valuation', 'capex', 'opex', 'ebitda',
]);
// Money words that also lead a count ("total_orders", "paid_invoices").
const WEAK_MONEY = new Set(['total', 'paid', 'due', 'sales', 'outstanding']);
// "Value" is money beside a deal, an order or a contract; alone it is any figure.
const MONEY_PAIRS = new Set(['deal', 'order', 'contract', 'invoice', 'pipeline', 'lifetime', 'policy', 'claim', 'stock', 'inventory']);
const PERCENT_WORDS = new Set(['pct', 'percent', 'percentage', 'ratio', 'margin', 'utilisation', 'utilization', 'occupancy', 'rate', 'conversion', 'churn', 'apr', 'apy', 'yield']);
// A rate per hour, night or unit is money ("hourly_rate"), not a share.
const PER_UNIT = new Set(['hourly', 'daily', 'nightly', 'weekly', 'monthly', 'day', 'hour', 'night', 'unit', 'room', 'base', 'flat']);
// Words that make a figure a count or a score, never money or a share.
const COUNT_WORDS = new Set([
  'count', 'qty', 'quantity', 'number', 'num', 'no', 'units', 'items', 'orders', 'seats', 'users', 'hours', 'days',
  'minutes', 'mins', 'visits', 'views', 'clicks', 'score', 'rating', 'age', 'year', 'years', 'points', 'sessions',
  'tickets', 'calls', 'leads', 'headcount', 'employees', 'nights', 'guests', 'pages', 'weight', 'kg', 'lbs', 'km', 'miles',
]);
// Figures that are labels: grouping their digits ("2,026") misreads them.
const LABEL_NUMBER_WORDS = new Set(['year', 'zip', 'zipcode', 'postcode', 'pin', 'phone', 'mobile', 'code', 'ext', 'extension', 'sku', 'version']);
const STATUS_WORDS = new Set(['status', 'state', 'stage', 'priority', 'severity', 'tier', 'level', 'health', 'risk', 'urgency', 'phase', 'sentiment']);
const CURRENCY_MARKS: [RegExp, string][] = [
  [/€|\beur\b/i, 'EUR'],
  [/£|\bgbp\b/i, 'GBP'],
  [/₹|\binr\b/i, 'INR'],
  [/¥|\bjpy\b/i, 'JPY'],
  [/\baud\b/i, 'AUD'],
  [/\bcad\b/i, 'CAD'],
  [/\$|\busd\b/i, 'USD'],
];

const NUMERIC_TEXT = /^-?(0|[1-9]\d{0,2}(,\d{3})+|[1-9]\d*)(\.\d+)?$/;
const isNumeric = (v: unknown): boolean =>
  (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && NUMERIC_TEXT.test(v.trim()));
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

/** Whether a field is an id: the row id field, "id", or a key ending in id ("customer_id", "orderId", "uuid"). */
export const isIdField = (key: string, idField: string): boolean =>
  key === idField || /^(id|uuid|guid|_id)$/i.test(key) || /(_id|Id|_uuid|Uuid)$/.test(key);

/** The currency a column's name gives ("Price (€)", "amount_gbp"), if any. */
const currencyIn = (text: string): string | undefined => CURRENCY_MARKS.find(([re]) => re.test(text))?.[1];

/** A column's kind from its key, header and values: currency, percent, date, badge, boolean, number or string. */
const inferKind = (key: string, name: unknown, values: unknown[]): { type: ColumnType; format?: ColumnFormat } => {
  const present = values.filter((v) => !isEmptyValue(v));
  if (!present.length) return { type: 'string' };
  const words = tokens(key, name);
  const has = (set: Set<string>) => words.some((w) => set.has(w));
  if (present.every((v) => typeof v === 'boolean')) return { type: 'boolean' };
  if (present.every(isNumeric)) {
    if (has(LABEL_NUMBER_WORDS)) return { type: 'string' };
    const figure = numericFigureKind(key, name, present);
    return figure ?? { type: 'number' };
  }
  if (present.every((v) => typeof v === 'string')) {
    const texts = present as string[];
    if (texts.every((t) => ISO_TIME.test(t.trim()) && !Number.isNaN(Date.parse(t)))) return { type: 'datetime' };
    if (texts.every((t) => ISO_DAY.test(t.trim()))) return { type: 'date' };
    // A status reads as a badge: a field named for one, holding a few short words.
    if (has(STATUS_WORDS) && new Set(texts).size <= 12 && texts.every((t) => t.length <= 32)) return { type: 'badge' };
  }
  return { type: inferType(present[0]) };
};

/** A numeric column's money or percent kind from its words, or null for a plain figure. */
const numericFigureKind = (key: string, name: unknown, present: unknown[]): { type: ColumnType; format?: ColumnFormat } | null => {
  const words = tokens(key, name);
  const has = (set: Set<string>) => words.some((w) => set.has(w));
  const text = `${key} ${typeof name === 'string' ? name : ''}`;
  // "total_orders" and "paid_invoices" are counts; "order_amount" is money.
  if (has(COUNT_WORDS) && !words.some((w) => MONEY_WORDS.has(w) && !WEAK_MONEY.has(w))) return null;
  const perUnit = has(PER_UNIT);
  if (/%/.test(text) || (has(PERCENT_WORDS) && !(perUnit && words.includes('rate')))) {
    const numbers = present.map((v) => Number(String(v).replace(/,/g, '')));
    // Shares stored as fractions (0.184) show as 18.4%; shares stored in percent (12.5) as written.
    const fraction = numbers.every((n) => Math.abs(n) <= 1) && numbers.some((n) => !Number.isInteger(n));
    return { type: 'percent', format: { fraction } };
  }
  const code = currencyIn(text);
  const money = has(MONEY_WORDS) || (words.includes('value') && has(MONEY_PAIRS)) || (perUnit && words.includes('rate'));
  if (code || money) return { type: 'currency', format: code ? { currency: code } : {} };
  return null;
};

/** A header from a key: "order_ref" reads "Order ref", "customerId" "Customer ID". */
export const headerLabel = (key: string): string => seriesLabel(key).replace(/\b(pct|percent)$/i, '%');
// A header the author left as the raw key ("order_date", "company") is a key, not a label.
const IDENTIFIER = /^[a-z][a-z0-9]*([_-][a-z0-9]+)*$|^[a-z]+([A-Z][a-z0-9]*)+$/;

/** Past this many columns a binding of rows bound as columns froze the page. */
export const MAX_COLUMNS = 100;

/** Columns as one shape, from native column objects ({key, name, columnType, ...}), the pack's earlier keys ({key,
 *  label, align}), or, when none are given, the keys of the first rows (nested objects skipped). */
export const normalizeColumns = (columns: unknown, data: unknown, idField = 'id'): TableColumn[] => {
  let source: Loose[] = Array.isArray(columns)
    ? columns.filter((c) => c && typeof c === 'object' && !Array.isArray(c))
    : [];
  const sample: Row[] = (Array.isArray(data) ? data : []).filter((row) => row && typeof row === 'object').slice(0, 50);
  const derived = !source.length;
  if (derived) {
    const seen = new Map<string, unknown>();
    sample.forEach((row) =>
      Object.keys(row).forEach((key) => {
        if (!seen.has(key)) seen.set(key, undefined);
        if (seen.get(key) === undefined && row[key] !== null && row[key] !== undefined) seen.set(key, row[key]);
      })
    );
    source = [...seen.entries()]
      .filter(([, value]) => !(value !== null && typeof value === 'object'))
      .map(([key]) => ({ key }));
  }
  const ids = new Set<string>();
  return source.slice(0, MAX_COLUMNS).map((c, index): TableColumn => {
    const key = String(c.key ?? c.dataIndex ?? c.accessor ?? c.name ?? c.title ?? c.label ?? `column${index + 1}`);
    const given = c.columnType ?? c.kind ?? c.type;
    const values = () => sample.map((row) => readCell(row, key));
    const ownName = c.name ?? c.title ?? c.header ?? c.label;
    // A column with no type is typed from its values and words, as a derived one is. A number column named for money
    // or a share ("budget", "Utilisation %") shows as one, unless the author gave it a prefix or a suffix.
    let inferred: { type: ColumnType; format?: ColumnFormat } | null = null;
    if (!isSet(given)) inferred = inferKind(key, ownName, values());
    else if (TYPE_ALIASES[given] === 'number' && !isSet(c.prefix) && !isSet(c.suffix)) {
      const present = values().filter((v) => !isEmptyValue(v));
      inferred = isSet(c.currency)
        ? { type: 'currency' }
        : present.length && present.every(isNumeric)
          ? numericFigureKind(key, ownName, present)
          : null;
    }
    const type = inferred?.type ?? TYPE_ALIASES[given] ?? 'string';
    const named = isSet(ownName) && !(String(ownName) === key && IDENTIFIER.test(key));
    const name = named ? String(ownName) : headerLabel(key);
    // Derived columns leave the ids out (they stay in the column chooser); a set column named only "id" or "Id" too.
    const hiddenByDefault =
      isIdField(key, idField) &&
      !isSet(c.columnVisibility ?? c.visible) &&
      (derived || /^(id|Id)$/.test(String(ownName ?? key)));
    let id = String(c.id ?? key);
    for (let n = 2; ids.has(id); n += 1) id = `${c.id ?? key}-${n}`;
    ids.add(id);
    return {
      id,
      key,
      name,
      type,
      align: c.horizontalAlignment ?? c.align ?? (RIGHT_ALIGNED.has(type) ? 'right' : 'left'),
      width: Number(c.columnSize ?? c.width) || undefined,
      minWidth: Number(c.minWidth) || undefined,
      visible: !falsy(c.columnVisibility ?? c.visible),
      hiddenByDefault,
      sortable: !NOT_DATA.has(type) && !falsy(c.sortable),
      searchable: !NOT_DATA.has(type) && !falsy(c.searchable),
      wrap: c.wrap === true,
      format: {
        decimalPlaces: isSet(c.decimalPlaces) ? Math.max(0, Math.min(10, Number(c.decimalPlaces) || 0)) : undefined,
        currency: c.currency ?? inferred?.format?.currency,
        locale: c.locale,
        dateFormat: c.dateFormat,
        prefix: c.prefix,
        suffix: c.suffix,
        fraction: c.fraction === true || (c.fraction !== false && inferred?.format?.fraction === true),
      },
      options: Array.isArray(c.options) ? c.options : undefined,
      badgeColors: c.badgeColors && typeof c.badgeColors === 'object' ? c.badgeColors : undefined,
      buttons: Array.isArray(c.buttons) ? c.buttons.filter((b: unknown) => b && typeof b === 'object') : undefined,
      textColor: c.textColor,
      cellBackgroundColor: c.cellBackgroundColor,
      transformation: c.transformation,
      fontWeight: c.fontWeight,
      linkText: c.displayText ?? c.linkText,
      openInNewTab: c.linkTarget !== '_self' && c.openInNewTab !== false,
      imageShape: c.imageShape,
      maxValue: Number(c.maxValue) || 100,
      // Declarative per-row styling: [{ key?, condition, value, textColor, backgroundColor, fontWeight }], first match
      // wins.
      conditionalStyles: Array.isArray(c.conditionalStyles)
        ? c.conditionalStyles.filter(
            (r: Loose) => r && typeof r === 'object' && FILTER_CONDITIONS.some(([k]) => k === r.condition)
          )
        : [],
    };
  });
};

// ---- Dates ---------------------------------------------------------------------------------------------------------

/** A date from a Date, a timestamp (below 1e12 in seconds) or date text; a bare 'YYYY-MM-DD' is that day locally. */
export const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return new Date(value < 1e12 ? value * 1000 : value);
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  const day = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number, width = 2) => String(n).padStart(width, '0');
const DATE_TOKENS = /\[([^\]]*)]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|SSS|A|a/g;

/** A date in a dayjs format string (DD MMM YYYY, YYYY-MM-DD HH:mm, [at] h:mm A). */
export const formatDateTokens = (d: Date, format: string): string =>
  format.replace(DATE_TOKENS, (token, literal) => {
    if (literal !== undefined) return literal;
    const h = d.getHours();
    switch (token) {
      case 'YYYY': return String(d.getFullYear());
      case 'YY': return String(d.getFullYear()).slice(-2);
      case 'MMMM': return MONTHS[d.getMonth()];
      case 'MMM': return MONTHS[d.getMonth()].slice(0, 3);
      case 'MM': return pad(d.getMonth() + 1);
      case 'M': return String(d.getMonth() + 1);
      case 'DD': return pad(d.getDate());
      case 'D': return String(d.getDate());
      case 'dddd': return DAYS[d.getDay()];
      case 'ddd': return DAYS[d.getDay()].slice(0, 3);
      case 'dd': return DAYS[d.getDay()].slice(0, 2);
      case 'd': return String(d.getDay());
      case 'HH': return pad(h);
      case 'H': return String(h);
      case 'hh': return pad(h % 12 || 12);
      case 'h': return String(h % 12 || 12);
      case 'mm': return pad(d.getMinutes());
      case 'm': return String(d.getMinutes());
      case 'ss': return pad(d.getSeconds());
      case 's': return String(d.getSeconds());
      case 'SSS': return pad(d.getMilliseconds(), 3);
      case 'A': return h < 12 ? 'AM' : 'PM';
      case 'a': return h < 12 ? 'am' : 'pm';
      default: return token;
    }
  });

// ---- Cell text -----------------------------------------------------------------------------------------------------

// Intl.NumberFormat is costly to build and a table formats every cell on each search: one per locale and options.
const FORMATTERS = new Map<string, Intl.NumberFormat>();
const numberFormatter = (locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat => {
  const key = `${locale}|${stringify(options)}`;
  let cached = FORMATTERS.get(key);
  if (!cached) {
    if (FORMATTERS.size > 200) FORMATTERS.clear();
    cached = new Intl.NumberFormat(locale, options);
    FORMATTERS.set(key, cached);
  }
  return cached;
};
// A bad locale or currency falls back to en-US, then to a plain amount, instead of blanking every cell.
const usableFormatter = (locale: unknown, options: Intl.NumberFormatOptions): Intl.NumberFormat => {
  const plain = { minimumFractionDigits: options.minimumFractionDigits, maximumFractionDigits: options.maximumFractionDigits };
  for (const [l, o] of [
    [typeof locale === 'string' && locale ? locale : 'en-US', options],
    ['en-US', options],
    ['en-US', plain],
  ] as [string, Intl.NumberFormatOptions][]) {
    try {
      return numberFormatter(l, o);
    } catch {
      // Not usable; the next one is.
    }
  }
  return numberFormatter('en-US', {});
};

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
/** An html cell's text for search and export: each block, line break and cell is a word apart ("Pinecrest Schools Lena
 *  Duarte", never "Pinecrest SchoolsLena Duarte"). */
export const htmlToText = (html: string): string =>
  html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<\/?(br|div|p|li|ul|ol|tr|td|th|h[1-6]|section|article|header|footer|table|blockquote)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, e: string) => ENTITIES[e])
    .replace(/\s+/g, ' ')
    .trim();

const DEFAULT_DATE = 'DD MMM YYYY';
const DEFAULT_DATETIME = 'DD MMM YYYY, HH:mm';

export type ColumnLike = { type?: string; format?: ColumnFormat };

/** A cell as text: what the table shows for plain types, searches and exports. Never throws. */
export const formatCell = (value: unknown, column: ColumnLike = {}): string => {
  try {
    if (isEmptyValue(value)) return '';
    const { type = 'string', format = {} } = column;
    const wrap = (text: string) => `${format.prefix ?? ''}${text}${format.suffix ?? ''}`;
    if (type === 'percent') {
      const raw = typeof value === 'number' ? value : Number(String(value).replace(/[,%\s]/g, ''));
      if (!Number.isFinite(raw)) return String(value);
      const digits = format.decimalPlaces;
      const n = format.fraction ? raw * 100 : raw;
      const text = usableFormatter(format.locale, { minimumFractionDigits: digits ?? 0, maximumFractionDigits: digits ?? 1 }).format(n);
      return wrap(`${text}%`);
    }
    if (type === 'html') return htmlToText(String(value));
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
      const d = toDate(value);
      if (!d) return String(value);
      return wrap(formatDateTokens(d, format.dateFormat || (type === 'datetime' ? DEFAULT_DATETIME : DEFAULT_DATE)));
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

// ---- Search, sort, filters -----------------------------------------------------------------------------------------

/** Case-insensitive substring match over the searchable visible columns; the text is never a regex. */
export const matchesSearch = (row: unknown, columns: TableColumn[], text: unknown): boolean => {
  const needle = String(text ?? '').trim().toLowerCase();
  if (!needle) return true;
  return columns.some((column) => {
    if (!column.visible || !column.searchable) return false;
    const value = readCell(row, column.key);
    if (isEmptyValue(value)) return false;
    return (
      formatCell(value, column).toLowerCase().includes(needle) ||
      // An html cell is searched by its text, not its markup ("div" matched every row).
      (typeof value !== 'object' && column.type !== 'html' && String(value).toLowerCase().includes(needle))
    );
  });
};

const asNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || !value.trim()) return NaN;
  return Number(value.replace(/,/g, ''));
};
const asTime = (value: unknown): number => {
  if (isEmptyValue(value) || typeof value === 'boolean') return NaN;
  const d = toDate(value);
  return d ? d.getTime() : NaN;
};

/** Numbers as numbers, dates as dates, else natural text order. */
export const compareCells = (a: unknown, b: unknown, type?: string): number => {
  if ((type && NUMERIC.has(type)) || (typeof a === 'number' && typeof b === 'number')) {
    const x = asNumber(a);
    const y = asNumber(b);
    if (Number.isFinite(x) && Number.isFinite(y)) return x - y;
  }
  if (type === 'date' || type === 'datetime') {
    const x = asTime(a);
    const y = asTime(b);
    if (Number.isFinite(x) && Number.isFinite(y)) return x - y;
  }
  if (type === 'boolean') return Number(a === true || a === 'true') - Number(b === true || b === 'true');
  return String(typeof a === 'object' ? stringify(a) : a).localeCompare(String(typeof b === 'object' ? stringify(b) : b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

/** Entries sorted by one column, empty values last in both directions. Returns a new array. */
export const sortEntries = (entries: Entry[], column: TableColumn | undefined, direction: unknown): Entry[] => {
  if (!column || (direction !== 'asc' && direction !== 'desc')) return entries;
  const sign = direction === 'desc' ? -1 : 1;
  return entries
    .map((entry, index) => ({ entry, index, value: readCell(entry.row, column.key) }))
    .sort((p, q) => {
      const pe = isEmptyValue(p.value);
      const qe = isEmptyValue(q.value);
      if (pe || qe) return pe === qe ? p.index - q.index : pe ? 1 : -1;
      return sign * compareCells(p.value, q.value, column.type) || p.index - q.index;
    })
    .map((x) => x.entry);
};

export const FILTER_CONDITIONS: [string, string][] = [
  ['contains', 'contains'],
  ['doesNotContains', 'does not contain'],
  ['matches', 'matches (regex)'],
  ['nl', 'does not match (regex)'],
  ['equals', 'equals'],
  ['ne', 'not equals'],
  ['isEmpty', 'is empty'],
  ['isNotEmpty', 'is not empty'],
  ['gt', 'greater than'],
  ['lt', 'less than'],
  ['gte', 'greater than or equal'],
  ['lte', 'less than or equal'],
];
export const NO_VALUE = new Set<unknown>(['isEmpty', 'isNotEmpty']);

const cellText = (value: unknown): string =>
  (isEmptyValue(value) ? '' : typeof value === 'object' ? stringify(value) : String(value)).toLowerCase();

// A regex condition is the author's pattern, run on every row with bounded work (safeRegex), with i, on the cell's text
// in lower case. Length caps alone never stopped a backtracking pattern (^(a+)+$ hangs on 33 characters), so the
// browser's RegExp never runs it on the text. A pattern that is invalid, or that cannot be checked on a cell (too
// complex for the work budget, or unsupported), holds for no cell: a filter drops the row, a style applies to no cell
// and a button rule disables or hides no button. The table warns once per pattern.
const regexHolds = (pattern: unknown, text: string, negate: boolean): boolean => {
  const source = pattern instanceof RegExp ? pattern.source : String(pattern ?? '');
  const re = source ? boundedRegex(source, 'i') : null;
  if (!re) return false;
  const outcome = re.match(text);
  if (typeof outcome === 'boolean') return outcome !== negate;
  warnRegexOutcome('DataTable', re, outcome, 'so its rule holds for no cell');
  return false;
};

/** Whether a value meets one of the filter conditions (filters, conditional styles and button rules). */
export const matchesCondition = (value: unknown, condition: unknown, wanted: unknown, column?: ColumnLike): boolean => {
  const text = cellText(value);
  const target = String(wanted ?? '').toLowerCase();
  const same = () => text === target || (Number.isFinite(asNumber(value)) && asNumber(value) === asNumber(wanted));
  switch (condition) {
    case 'contains':
      return text.includes(target);
    case 'doesNotContains':
      return !text.includes(target);
    case 'matches':
      return regexHolds(wanted, text, false);
    case 'nl':
      return regexHolds(wanted, text, true);
    case 'equals':
      return same();
    case 'ne':
      return !same();
    case 'isEmpty':
      return isEmptyValue(value) || (Array.isArray(value) && value.length === 0);
    case 'isNotEmpty':
      return !isEmptyValue(value) && !(Array.isArray(value) && value.length === 0);
    case 'gt':
    case 'lt':
    case 'gte':
    case 'lte': {
      if (isEmptyValue(value)) return false;
      const type = column?.type === 'string' && Number.isFinite(asNumber(value)) ? 'number' : column?.type;
      const cmp = compareCells(value, wanted, type);
      return condition === 'gt' ? cmp > 0 : condition === 'lt' ? cmp < 0 : condition === 'gte' ? cmp >= 0 : cmp <= 0;
    }
    default:
      return true;
  }
};

/** A cell's style from its column's conditional rules: the first rule whose condition holds (on the cell, or on the
 *  row's `key` field when the rule names one). */
export const cellStyleFor = (column: TableColumn, row: unknown): CSSProperties => {
  const rule = column.conditionalStyles.find((r) => {
    const field = isSet(r.key) ? String(r.key) : column.key;
    return matchesCondition(readCell(row, field), r.condition, r.value, field === column.key ? column : { type: 'string' });
  });
  if (!rule) return {};
  return {
    ...(isSet(rule.textColor) ? { color: String(rule.textColor) } : {}),
    ...(isSet(rule.backgroundColor) ? { background: String(rule.backgroundColor) } : {}),
    ...(isSet(rule.fontWeight) ? { fontWeight: rule.fontWeight } : {}),
  };
};

export const MAX_FILTERS = 50;

/** Filters as the table holds them: complete ones only, column by key (header names accepted, as natively). */
export const cleanFilters = (list: unknown, columns: TableColumn[]): TableFilter[] =>
  (Array.isArray(list) ? list : [])
    .filter((f) => f && typeof f === 'object' && isSet(f.column) && isSet(f.condition))
    .slice(0, MAX_FILTERS)
    .map((f: Loose) => ({
      column: columns.find((c) => c.key === f.column || c.name === f.column || c.id === f.column)?.key ?? String(f.column),
      condition: String(f.condition),
      value: f.value,
    }));

/** The entries passing every complete filter; incomplete ones are ignored. */
export const applyFilters = (entries: Entry[], filters: TableFilter[], columns: TableColumn[]): Entry[] => {
  const active = filters
    .map((f) => {
      const column = columns.find((c) => c.key === f.column || c.name === f.column || c.id === f.column);
      if (!column || !FILTER_CONDITIONS.some(([c]) => c === f.condition)) return null;
      if (!NO_VALUE.has(f.condition) && !isSet(f.value)) return null;
      return { column, condition: f.condition, value: f.value };
    })
    .filter((f): f is { column: TableColumn; condition: string; value: unknown } => f !== null);
  if (!active.length) return entries;
  return entries.filter((entry) =>
    active.every((f) => matchesCondition(readCell(entry.row, f.column.key), f.condition, f.value, f.column))
  );
};

// ---- Paging, identity, matching, export ----------------------------------------------------------------------------

const positive = (v: unknown, fallback: number): number => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export interface PageOptions {
  enablePagination: boolean;
  serverSidePagination: boolean;
  rowsPerPage: unknown;
  totalRecords: unknown;
  page: number;
}

/** The rows on the page and the paging state; server-side, the data is the page. */
export const pageOf = (rows: Entry[], { enablePagination, serverSidePagination, rowsPerPage, totalRecords, page }: PageOptions): Paged => {
  const size = Math.min(1000, positive(rowsPerPage, 10));
  const wanted = positive(page, 1);
  if (!enablePagination) return { items: rows, pageCount: 1, page: 1, hasNext: false, hasPrevious: false };
  if (serverSidePagination) {
    const total = positive(totalRecords, 0);
    const pageCount = total ? Math.max(1, Math.ceil(total / size)) : null;
    const current = pageCount ? Math.min(wanted, pageCount) : wanted;
    return {
      items: rows,
      pageCount,
      page: current,
      hasPrevious: current > 1,
      hasNext: pageCount ? current < pageCount : rows.length >= size,
    };
  }
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(wanted, pageCount);
  const start = (current - 1) * size;
  return { items: rows.slice(start, start + size), pageCount, page: current, hasPrevious: current > 1, hasNext: current < pageCount };
};

/** A stable key for a row: its id field when it has one ("id:"), else its position ("#"). */
export const rowKey = (row: unknown, idField: string, index: number): string =>
  row && typeof row === 'object' && isSet(readCell(row, idField)) ? `id:${String(readCell(row, idField))}` : `#${index}`;

const PRIMITIVE = new Set(['string', 'number', 'boolean']);

/** Whether a cell matches any of `values` by ==, as the native Table's selectRow / selectRows match, in one pass. */
export const looseMatcher = (values: unknown[]): ((cell: unknown) => boolean) => {
  const same = new Set<unknown>();
  const numbers = new Map<string, Set<number>>([...PRIMITIVE].map((type) => [type, new Set<number>()]));
  const other: unknown[] = [];
  let nullish = false;
  values.forEach((value) => {
    if (value === null || value === undefined) nullish = true;
    else if (PRIMITIVE.has(typeof value)) {
      const n = Number(value);
      if (Number.isNaN(n) && typeof value === 'number') return;
      same.add(value);
      if (!Number.isNaN(n)) numbers.get(typeof value)?.add(n);
    } else other.push(value);
  });
  return (cell) => {
    if (cell === null || cell === undefined) return nullish;
    const type = typeof cell;
    if (!PRIMITIVE.has(type)) return values.some((value) => cell == value); // eslint-disable-line eqeqeq
    if (same.has(cell)) return true;
    const n = Number(cell);
    if (!Number.isNaN(n) && [...numbers].some(([t, set]) => t !== type && set.has(n))) return true;
    return other.some((value) => cell == value); // eslint-disable-line eqeqeq
  };
};

const csvCell = (value: unknown): string => {
  if (isEmptyValue(value)) return '';
  let text: string = typeof value === 'object' ? stringify(value) : String(value);
  // A cell that starts like a formula is run by spreadsheets: prefix it so it is read as text.
  if (/^[=+\-@\t\r\n＝＋－＠]/.test(text) && typeof value !== 'number') text = `'${text}`;
  return /[",\n\r]/.test(text) || text.startsWith("'") ? `"${text.replace(/"/g, '""')}"` : text;
};

/** The rows as CSV: visible data columns, header names, raw values. */
export const toCsv = (rows: unknown[], columns: TableColumn[]): string => {
  const cols = columns.filter((c) => c.visible && !NOT_DATA.has(c.type));
  const lines = [cols.map((c) => csvCell(c.name)).join(',')];
  rows.forEach((row) => lines.push(cols.map((c) => csvCell(readCell(row, c.key))).join(',')));
  return lines.join('\n');
};

export const downloadFile = (name: string, content: string, mime: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

// ---- Safe URLs, initials, badge colours ----------------------------------------------------------------------------

const LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel', 'sms']);
const schemeOf = (url: string): string | null => {
  // eslint-disable-next-line no-control-regex
  const match = url.replace(/[\s\u0000-\u001f]/g, '').match(/^([a-z][a-z0-9+.-]*):/i);
  return match ? match[1].toLowerCase() : null;
};
const toText = (v: unknown): string => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));
/** A link's URL, or '' for a scheme that could run script (javascript:, data:). */
export const safeUrl = (v: unknown): string => {
  const url = toText(v).trim();
  const scheme = schemeOf(url);
  return scheme === null || LINK_SCHEMES.has(scheme) ? url : '';
};
export const safeImageUrl = (v: unknown): string => {
  const url = toText(v).trim();
  return /^data:image\//i.test(url) || schemeOf(url) === 'blob' ? url : safeUrl(url);
};

export const initials = (name: unknown): string => {
  const words = toText(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/** Badge status words to tones, as UI 2.0's table reads them. */
export const BADGE_BY_STATUS: Record<string, string> = {
  active: 'success', approved: 'success', available: 'success', completed: 'success', confirmed: 'success',
  delivered: 'success', done: 'success', paid: 'success', success: 'success',
  pending: 'warning', processing: 'warning', review: 'warning', maintenance: 'warning',
  draft: 'secondary', open: 'secondary', new: 'secondary', inactive: 'secondary',
  cancelled: 'destructive', canceled: 'destructive', failed: 'destructive', overdue: 'destructive',
  rejected: 'destructive', blocked: 'destructive',
};

const hexLuminance = (colour: string): number | null => {
  const m = colour.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** A badge's colours from a badgeColors map ({ Paid: '#16a34a' } or { Paid: { text, background } }), matched exactly
 *  first, then ignoring case. A colour alone tints the badge (14%) and inks the label; a light colour is the fill. */
export const badgeLook = (value: unknown, badgeColors: unknown): CSSProperties | null => {
  if (!badgeColors || typeof badgeColors !== 'object' || !isSet(value)) return null;
  const text = String(value);
  const map = badgeColors as Loose;
  const key = Object.keys(map).find((k) => k === text) ?? Object.keys(map).find((k) => k.toLowerCase() === text.toLowerCase());
  const colour: unknown = key === undefined ? undefined : map[key];
  const deep = (c: string) => `color-mix(in srgb, ${c} 45%, black)`;
  if (colour && typeof colour === 'object') {
    const pair = colour as Loose;
    const fg = pair.text ?? pair.color ?? pair.textColor;
    const bg = pair.background ?? pair.bg ?? pair.backgroundColor;
    if (!isSet(fg) && !isSet(bg)) return null;
    return {
      '--t2-badge-fg': String(isSet(fg) ? fg : deep(String(bg))),
      '--t2-badge-bg': String(isSet(bg) ? bg : `color-mix(in srgb, ${fg} 14%, transparent)`),
    } as CSSProperties;
  }
  if (!isSet(colour)) return null;
  const c = String(colour);
  const lum = hexLuminance(c);
  if (lum !== null && lum > 0.6) return { '--t2-badge-fg': deep(c), '--t2-badge-bg': c } as CSSProperties;
  return { '--t2-badge-fg': c, '--t2-badge-bg': `color-mix(in srgb, ${c} 14%, transparent)` } as CSSProperties;
};
