// The DataTable's data logic, ported from ToolJet UI 2.0's Table (Widgets/Ui2/Table/tableModel.ts and _shared/format.ts)
// with the same conventions: native column keys, filter conditions, sortApplied, rows keyed by idField. Plain TS with no
// dayjs: dates are parsed and formatted here with the dayjs format tokens the UI 2.0 table accepts.
import type { CSSProperties } from 'react';

export type Row = Record<string, unknown>;
type Loose = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type ColumnType =
  | 'string'
  | 'number'
  | 'currency'
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
const RIGHT_ALIGNED = new Set<string>(['number', 'currency']);
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

/** Past this many columns a binding of rows bound as columns froze the page. */
export const MAX_COLUMNS = 100;

/** Columns as one shape, from native column objects ({key, name, columnType, ...}), the pack's earlier keys ({key,
 *  label, align}), or, when none are given, the keys of the first rows (nested objects skipped). */
export const normalizeColumns = (columns: unknown, data: unknown): TableColumn[] => {
  let source: Loose[] = Array.isArray(columns)
    ? columns.filter((c) => c && typeof c === 'object' && !Array.isArray(c))
    : [];
  if (!source.length) {
    const sample: Row[] = (Array.isArray(data) ? data : []).filter((row) => row && typeof row === 'object').slice(0, 50);
    const seen = new Map<string, unknown>();
    sample.forEach((row) =>
      Object.keys(row).forEach((key) => {
        if (!seen.has(key)) seen.set(key, undefined);
        if (seen.get(key) === undefined && row[key] !== null && row[key] !== undefined) seen.set(key, row[key]);
      })
    );
    source = [...seen.entries()]
      .filter(([, value]) => !(value !== null && typeof value === 'object'))
      .map(([key, value]) => ({ key, name: key, columnType: inferType(value) }));
  }
  const ids = new Set<string>();
  return source.slice(0, MAX_COLUMNS).map((c, index): TableColumn => {
    const key = String(c.key ?? c.dataIndex ?? c.accessor ?? c.name ?? c.title ?? c.label ?? `column${index + 1}`);
    const type = TYPE_ALIASES[c.columnType ?? c.kind ?? c.type] ?? 'string';
    let id = String(c.id ?? key);
    for (let n = 2; ids.has(id); n += 1) id = `${c.id ?? key}-${n}`;
    ids.add(id);
    return {
      id,
      key,
      name: String(c.name ?? c.title ?? c.header ?? c.label ?? key),
      type,
      align: c.horizontalAlignment ?? c.align ?? (RIGHT_ALIGNED.has(type) ? 'right' : 'left'),
      width: Number(c.columnSize ?? c.width) || undefined,
      minWidth: Number(c.minWidth) || undefined,
      visible: !falsy(c.columnVisibility ?? c.visible),
      sortable: !NOT_DATA.has(type) && !falsy(c.sortable),
      searchable: !NOT_DATA.has(type) && !falsy(c.searchable),
      wrap: c.wrap === true,
      format: {
        decimalPlaces: isSet(c.decimalPlaces) ? Math.max(0, Math.min(10, Number(c.decimalPlaces) || 0)) : undefined,
        currency: c.currency,
        locale: c.locale,
        dateFormat: c.dateFormat,
        prefix: c.prefix,
        suffix: c.suffix,
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

const DEFAULT_DATE = 'DD MMM YYYY';
const DEFAULT_DATETIME = 'DD MMM YYYY, HH:mm';

export type ColumnLike = { type?: string; format?: ColumnFormat };

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
      (typeof value !== 'object' && String(value).toLowerCase().includes(needle))
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
  if (type === 'number' || type === 'currency' || (typeof a === 'number' && typeof b === 'number')) {
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

// A regex condition is the author's pattern, run on every row: long patterns and long cells are refused (they hold for
// no row) so one backtracking pattern cannot hang the page. UI 2.0 checks patterns with a bounded matcher instead.
const MAX_PATTERN = 200;
const MAX_REGEX_TEXT = 2000;
const REGEX_CACHE = new Map<string, RegExp | null>();
const regexOf = (pattern: unknown): RegExp | null => {
  const source = String(pattern ?? '');
  if (!source || source.length > MAX_PATTERN) return null;
  if (!REGEX_CACHE.has(source)) {
    if (REGEX_CACHE.size > 100) REGEX_CACHE.clear();
    try {
      REGEX_CACHE.set(source, new RegExp(source, 'i'));
    } catch {
      REGEX_CACHE.set(source, null);
    }
  }
  return REGEX_CACHE.get(source) ?? null;
};
const regexHolds = (pattern: unknown, text: string, negate: boolean): boolean => {
  const re = regexOf(pattern);
  if (!re || text.length > MAX_REGEX_TEXT) return false;
  return re.test(text) !== negate;
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
