// UI 2.0's list and section logic (Ui2/_sections/sectionsModel.ts, _shared/listModel.ts, _shared/format.ts,
// _display/displayModel.ts, NewTable chipTone / avatarHue), ported for the List view, Record list, Card grid and
// Key-value list. Every function takes whatever the author bound and never throws.

import { localeFor, moneyDigits, numberFormat } from '../../../locale';

export type Row = Record<string, unknown>;

export const isSet = (v: unknown): boolean => v !== undefined && v !== null && v !== '';
export const isNonBlankString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
export const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
export const isRecord = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v);
export const toText = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  if (isScalar(v)) return String(v);
  try {
    return JSON.stringify(v) ?? '';
  } catch {
    return '';
  }
};
export const px = (v: unknown): string => (typeof v === 'number' || /^\d+(\.\d+)?$/.test(String(v).trim()) ? `${Number(v)}px` : String(v));

// ---- Chips and avatars ----------------------------------------------------------------------------------------------

const TONES: [string, RegExp][] = [
  [
    'danger',
    /\b(overdue|out of stock|failed|failure|error|cancell?ed|rejected|declined|blocked|expired|lost|critical|urgent|high|severe|breach(ed)?|late|delayed|churned|suspended|terminated|refunded|disputed|offline|down|absent|no show|missed|out of service|churn|out of range|alerts?|alarms?|fail|lapsed|detractors?|full(?! time)|sold out)\b/,
  ],
  [
    'warning',
    /\b(pending|unpaid|due|due soon|expiring|expiring soon|waitlist|waitlisted|contraction|downgrade|reorder|low stock|waiting|awaiting|review|on hold|hold|draft|medium|at risk|risk|partial|partially paid|tentative|requested|needs attention|needs [a-z]+|follow up|warning|watch|watching|few spots|few left|passives?|almost full|nearly full|maintenance|busy|trial|missing|incomplete|in repair|repair|in workshop|workshop)\b/,
  ],
  [
    'success',
    /\b(paid|active|done|complete|completed|resolved|approved|confirmed|in stock|won|healthy|available|delivered|shipped|success|successful|passed|live|online|published|ready|accepted|vacant|clean|fulfilled|on track|closed won|signed|settled|given|attached|received|present|in service|on the road|on road|on duty|on shift|in operation|operational|operating|running|deployed|en route|on route|returned|verified|validated|cleared|expansion|upgrade|in range|within range|pass|renewed|promoters?)\b/,
  ],
  [
    'info',
    /\b(new(?! (york|zealand|delhi|jersey|mexico|hampshire|south wales|orleans|brunswick|haven|england|caledonia|guinea|westminster))|open|in progress|scheduled|booked|sent|assigned|processing|planned|upcoming|started|qualified|contacted|proposal|negotiation|checked in|in transit|on the way|en route|dispatched|on site|checked out|on loan|in use|occupied|reserved|held|flying|in flight|airborne|quoted|committed|in testing|testing|in qa|on call|on duty|out for delivery|picked up)\b/,
  ],
];

/** The tone a chip takes from its value's words ('Paid' success, 'Overdue' danger), 'neutral' for none. */
export const chipTone = (value: unknown): string => {
  if (typeof value !== 'string') return 'neutral';
  const t = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return 'neutral';
  if (/^not\b/.test(t)) return TONES[2][1].test(t.slice(3)) ? 'warning' : 'neutral';
  if (/^(in|under) review$/.test(t)) return 'info';
  if (/^(out|on hire|hired out|lent out)$/.test(t)) return 'info';
  for (const [tone, words] of TONES) if (words.test(t)) return tone;
  return 'neutral';
};

/** A value stored all lowercase ("in_progress") reads in sentence case ("In progress"); anything else as written. */
export const chipLabel = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const t = String(value);
  if (!/^[a-z][a-z0-9 _-]*$/.test(t)) return t;
  const words = t.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** A stable hue for a name, so a person keeps one avatar colour. */
export const avatarHue = (name: unknown): number => {
  const t = typeof name === 'string' ? name : String(name ?? '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) hash = Math.imul(hash ^ t.charCodeAt(i), 0x01000193);
  return ((hash >>> 0) % 7) * 51 + 12;
};

/** Two initials, of the first and the last word with a letter. */
export const initials = (name: unknown): string => {
  const tokens = String(name || '').split(/\s+/);
  const lettered = tokens.filter((w) => /\p{L}/u.test(w));
  const words = (lettered.length ? lettered : tokens).map((w) => w.match(/[\p{L}\p{N}]/u)?.[0]).filter(Boolean) as string[];
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked.join('').toUpperCase();
};

/** The author's colour for a value (exact key, then any case). */
export const colorFor = (value: unknown, colors: unknown): string | undefined => {
  if (!isRecord(colors) || !isSet(value)) return undefined;
  const t = String(value);
  const key = Object.keys(colors).find((k) => k === t) ?? Object.keys(colors).find((k) => k.toLowerCase() === t.toLowerCase());
  const colour = key === undefined ? undefined : colors[key];
  return isSet(colour) && isScalar(colour) ? String(colour) : undefined;
};

// ---- Typefaces --------------------------------------------------------------------------------------------------------

const FONT_STACKS: Record<string, string> = {
  sans: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  display: "Didot, 'Bodoni 72', 'Bodoni MT', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
export const FONT_VALUES = ['theme', 'sans', 'serif', 'display', 'mono'];
export const FONT_LABELS = { theme: 'Theme font', sans: 'Sans serif', serif: 'Serif', display: 'Display serif', mono: 'Monospace' };

/** '' for the theme font, a preset's stack, or the author's own family names with a generic fallback. */
export const fontStack = (value: unknown): string => {
  if (!isSet(value) || typeof value === 'object') return '';
  const key = String(value).trim().toLowerCase();
  if (key === 'theme') return '';
  if (FONT_STACKS[key]) return FONT_STACKS[key];
  const own = String(value).replace(/[^\w\s,'"-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!/[A-Za-z]/.test(own)) return '';
  return /(serif|monospace|cursive|fantasy|system-ui)\s*$/.test(own) ? own : `${own}, sans-serif`;
};

/** Style values as CSS variables, unset ones left out (so the look's fallbacks apply). */
export const styleVars = (pairs: [unknown, string, ((v: unknown) => string)?][]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [value, name, map] of pairs) {
    if (!isSet(value)) continue;
    const v = map ? map(value) : String(value);
    if (v) out[name] = v;
  }
  return out;
};

// ---- Number and date formats ------------------------------------------------------------------------------------------

const FORMATS = ['number', 'currency', 'percent', 'compact'];
export const VALUE_FORMATS = ['auto', ...FORMATS, 'date', 'datetime'];
const nf = numberFormat;
const currencyCode = (c: unknown) => (isNonBlankString(c) && /^[A-Za-z]{3}$/.test(c.trim()) ? c.trim().toUpperCase() : 'USD');
const isNumericFigure = (v: unknown): v is number | string =>
  typeof v === 'number' ? Number.isFinite(v) : typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim());

const formatNumber = (n: number, format: string, currency?: unknown, locale?: unknown): string => {
  const where = localeFor(currency, locale);
  if (format === 'currency') return nf(where, { style: 'currency', currency: currencyCode(currency), ...moneyDigits(n, where) }).format(n);
  if (format === 'compact') return nf(where, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  if (format === 'percent') return `${nf(where, { maximumFractionDigits: 1 }).format(n)}%`;
  return nf(where, { maximumFractionDigits: 2 }).format(n);
};

/** A bare 'YYYY-MM-DD' is that day where the viewer is. null when it is not a date. */
export const toDay = (v: unknown): Date | null => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') return Number.isFinite(v) ? new Date(v < 1e12 ? v * 1000 : v) : null;
  if (!isNonBlankString(v)) return null;
  const day = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(v.trim());
  return Number.isNaN(d.getTime()) ? null : d;
};

const dateText = (d: Date, withTime: boolean): string => {
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

/** A value in a format: numbers ('number', 'currency', 'percent', 'compact'), dates ('date', 'datetime'); 'auto' groups a
 *  bare number's digits. Anything not of the format's kind shows as written; objects show nothing. */
export const formatValue = (value: unknown, format: unknown = 'auto', currency?: unknown, locale?: unknown): string => {
  if (value === null || value === undefined || typeof value === 'object') return '';
  if (typeof value === 'number' && !Number.isFinite(value)) return '';
  if (format === 'date' || format === 'datetime') {
    const d = toDay(value);
    return d ? dateText(d, format === 'datetime') : String(value);
  }
  if (!isNumericFigure(value)) return String(value);
  if (typeof format !== 'string' || !FORMATS.includes(format)) return typeof value === 'number' ? formatNumber(value, 'number', currency, locale) : String(value);
  return formatNumber(Number(value), format, currency, locale);
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** A date in a dayjs-style pattern (YYYY, MMM, DD, HH:mm, A ...); [text] stays literal. */
export const formatDatePattern = (d: Date, pattern: string): string =>
  pattern.replace(/\[([^\]]*)]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a/g, (token, literal) => {
    if (literal !== undefined) return literal;
    const h = d.getHours();
    switch (token) {
      case 'YYYY': return String(d.getFullYear());
      case 'YY': return pad(d.getFullYear() % 100);
      case 'MMMM': return MONTHS[d.getMonth()];
      case 'MMM': return MONTHS[d.getMonth()].slice(0, 3);
      case 'MM': return pad(d.getMonth() + 1);
      case 'M': return String(d.getMonth() + 1);
      case 'DD': return pad(d.getDate());
      case 'D': return String(d.getDate());
      case 'dddd': return DAYS[d.getDay()];
      case 'ddd': return DAYS[d.getDay()].slice(0, 3);
      case 'HH': return pad(h);
      case 'H': return String(h);
      case 'hh': return pad(h % 12 || 12);
      case 'h': return String(h % 12 || 12);
      case 'mm': return pad(d.getMinutes());
      case 'm': return String(d.getMinutes());
      case 'ss': return pad(d.getSeconds());
      case 's': return String(d.getSeconds());
      case 'A': return h < 12 ? 'AM' : 'PM';
      case 'a': return h < 12 ? 'am' : 'pm';
      default: return token;
    }
  });

// ---- Shared field logic -----------------------------------------------------------------------------------------------

const isImageUrl = (v: unknown): v is string => isNonBlankString(v) && /^(https?:\/\/|data:image\/|\/|\.\/)/i.test(v.trim());
const sameName = (label: string, f: string) => String(label).trim() === String(f).trim();
const withLabel = (label: string, f: string, value: string) =>
  !label || sameName(label, f) ? value : label.includes('{}') ? label.replace('{}', value) : `${label} ${value}`;
const metaPart = (row: Row, spec: string): string => {
  const [f, label] = spec.split(/:(.*)/s).map((s) => (s ?? '').trim());
  const value = toText(row[f]);
  return f && value ? withLabel(label, f, value) : '';
};
export const firstTextField = (row: Row): string | undefined => Object.keys(row).find((k) => isNonBlankString(row[k]));

/** Keys of their own for every item: a repeated id gets a suffix by occurrence ("1~2"). */
const uniqueKeys = <T extends { key: string }>(items: T[], fromId: boolean[]): T[] => {
  const seen = new Set<string>();
  const occurrences = new Map<string, number>();
  const keys: (string | null)[] = items.map(() => null);
  const claim = (i: number) => {
    const base = items[i].key;
    let key = base;
    let n = occurrences.get(base) ?? 1;
    while (seen.has(key)) key = `${base}~${++n}`;
    occurrences.set(base, n);
    seen.add(key);
    keys[i] = key;
  };
  items.forEach((_, i) => fromId[i] && claim(i));
  items.forEach((_, i) => !fromId[i] && claim(i));
  return items.map((item, i) => (keys[i] && keys[i] !== item.key ? { ...item, key: keys[i] as string } : item));
};

export const fieldList = (spec: unknown): string[] =>
  (Array.isArray(spec) ? (spec as unknown[]) : isNonBlankString(spec) ? spec.split(',') : [])
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter(Boolean);

export const percentOf = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  return m ? Number(m[1]) : null;
};
export const barWidth = (pct: unknown): number => (typeof pct === 'number' && Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0);
export const percentLabel = (pct: unknown): string =>
  typeof pct === 'number' && Number.isFinite(pct) ? `${Math.abs(pct - Math.round(pct)) < 0.05 ? Math.round(pct) : pct.toFixed(1)}%` : '';

// ---- Card grid --------------------------------------------------------------------------------------------------------

export interface CardItem {
  key: string;
  title: string;
  subtitle: string;
  image: string;
  description: string;
  badges: string[];
  eyebrow: string;
  avatar: { image: string; name: string } | null;
  progress: number | null;
  meta: string;
  row: Row;
  index: number;
}

export const cardItems = (data: unknown, f: Record<string, unknown> = {}): CardItem[] => {
  if (!Array.isArray(data)) return [];
  const metaSpecs = fieldList(f.metaFields);
  const badgeKeys = [...new Set([...(isNonBlankString(f.badgeField) ? [f.badgeField.trim()] : []), ...fieldList(f.badgeFields)])];
  const items = data.flatMap((row: unknown, index: number) => {
    if (!isRecord(row)) return [];
    const titleKey = isNonBlankString(f.titleField) && f.titleField in row ? f.titleField : firstTextField(row);
    const id = isNonBlankString(f.idField) ? row[f.idField] : row.id;
    const title = titleKey ? toText(row[titleKey]) : '';
    const badges = badgeKeys.map((k) => toText(row[k]).trim()).filter(Boolean).slice(0, 4);
    const avatarValue = isNonBlankString(f.avatarField) && f.avatarField in row ? row[f.avatarField] : undefined;
    const progress = isNonBlankString(f.progressField) ? percentOf(row[f.progressField]) : null;
    const description = isNonBlankString(f.descriptionField) ? toText(row[f.descriptionField]) : '';
    const repeatsProgress = progress !== null && description.replace(/\s+/g, '') === `${Math.round(progress)}%`;
    const avatarImage = isImageUrl(avatarValue) ? avatarValue.trim() : '';
    return [
      {
        key: toText(id) || String(index),
        keyFromId: !!toText(id),
        title,
        subtitle:
          isNonBlankString(f.subtitleField) && toText(row[f.subtitleField]).trim() !== (badges[0] || '').trim() ? toText(row[f.subtitleField]) : '',
        image: isNonBlankString(f.imageField) ? toText(row[f.imageField]) : '',
        description: repeatsProgress ? '' : description,
        badges,
        eyebrow: isNonBlankString(f.eyebrowField) ? toText(row[f.eyebrowField]).trim() : '',
        avatar:
          avatarValue === undefined ? null : { image: avatarImage, name: !avatarImage && toText(avatarValue).trim() ? toText(avatarValue).trim() : title },
        progress,
        meta: metaSpecs.map((spec) => metaPart(row, spec)).filter(Boolean).join(' · '),
        row,
        index,
      },
    ];
  });
  return uniqueKeys(items.map(({ keyFromId, ...item }) => item), items.map((item) => item.keyFromId));
};

/** The set column count, never more than fit at the minimum card width; 'auto' (or 0) fits as many as the width allows. */
export const gridColumns = (columns: unknown, width: unknown, minCardWidth: unknown = 240): number => {
  const min = Math.max(120, Number(minCardWidth) || 240);
  const fit = Math.max(1, Math.floor((Number(width) || 0) / min));
  const set = Math.floor(Number(columns));
  return Number.isFinite(set) && set > 0 ? Math.max(1, Math.min(set, fit)) : fit;
};

// ---- Record list ------------------------------------------------------------------------------------------------------

/** 'city' shows the value, 'total|currency' formats it, 'due|date:Due {}' places it in a label. */
const recordMetaPart = (row: Row, spec: string, currency?: unknown, locale?: unknown): string => {
  const [head, label] = spec.split(/:(.*)/s).map((s) => (s ?? '').trim());
  const [f, format] = head.split('|').map((s) => s.trim());
  if (!f || !(f in row)) return '';
  const value = formatValue(row[f], VALUE_FORMATS.includes(format) ? format : 'auto', currency, locale);
  return value ? withLabel(label, f, value) : '';
};

export interface RecordItem {
  key: string;
  title: string;
  image: string;
  avatarName: string;
  meta: string;
  status: string;
  value: string;
  progress: number | null;
  row: Row;
  index: number;
}

export const recordItems = (data: unknown, f: Record<string, unknown> = {}): RecordItem[] => {
  if (!Array.isArray(data)) return [];
  const metaSpecs = fieldList(f.metaFields);
  const format = typeof f.valueFormat === 'string' && VALUE_FORMATS.includes(f.valueFormat) ? f.valueFormat : 'auto';
  const items = data.flatMap((row: unknown, index: number) => {
    if (!isRecord(row)) return [];
    const titleKey = isNonBlankString(f.titleField) && f.titleField in row ? f.titleField : firstTextField(row);
    const title = titleKey ? toText(row[titleKey]) : '';
    const id = isNonBlankString(f.idField) ? row[f.idField] : row.id;
    const avatarValue = isNonBlankString(f.avatarField) ? row[f.avatarField] : undefined;
    const image = isImageUrl(avatarValue) ? avatarValue.trim() : '';
    return [
      {
        key: toText(id) || String(index),
        keyFromId: !!toText(id),
        title,
        image,
        avatarName: !image && toText(avatarValue).trim() ? toText(avatarValue).trim() : title,
        meta: metaSpecs.map((spec) => recordMetaPart(row, spec, f.currency, f.locale)).filter(Boolean).join(' · '),
        status: isNonBlankString(f.statusField) ? toText(row[f.statusField]) : '',
        value: isNonBlankString(f.valueField) ? formatValue(row[f.valueField], format, f.currency, f.locale) : '',
        progress: isNonBlankString(f.progressField) ? percentOf(row[f.progressField]) : null,
        row,
        index,
      },
    ];
  });
  return uniqueKeys(items.map(({ keyFromId, ...item }) => item), items.map((item) => item.keyFromId));
};

// ---- List view --------------------------------------------------------------------------------------------------------

export interface ListPage<T> {
  items: T[];
  pageCount: number | null;
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const positive = (value: unknown, fallback: number): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Client side slices the data; server side shows the data as the page and counts pages from totalRecords (pageCount
 *  null when the total is unknown). `page` is 1-based and clamped into range. */
export const pageOf = <T>(
  data: T[],
  o: { enablePagination?: boolean; serverSidePagination?: boolean; rowsPerPage?: unknown; totalRecords?: unknown; page?: number }
): ListPage<T> => {
  const rows = Array.isArray(data) ? data.filter((r) => r !== undefined && r !== null) : [];
  const size = positive(o.rowsPerPage, 10);
  const wanted = positive(o.page, 1);
  if (!o.enablePagination) return { items: rows, pageCount: 1, page: 1, hasNext: false, hasPrevious: false };
  if (o.serverSidePagination) {
    const total = positive(o.totalRecords, 0);
    const pageCount = total ? Math.max(1, Math.ceil(total / size)) : null;
    const current = pageCount ? Math.min(wanted, pageCount) : wanted;
    return { items: rows, pageCount, page: current, hasPrevious: current > 1, hasNext: pageCount ? current < pageCount : rows.length >= size };
  }
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(wanted, pageCount);
  const start = (current - 1) * size;
  return { items: rows.slice(start, start + size), pageCount, page: current, hasPrevious: current > 1, hasNext: current < pageCount };
};

/** Page numbers around the current one (1 … 4 5 6 … 20), or the current page alone when the count is unknown. */
export const pageWindow = (page: number, count: number | null): (number | string)[] => {
  if (!count) return [page];
  const sorted = [...new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count))].sort((a, b) => a - b);
  const out: (number | string)[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
};

export const itemKey = (item: unknown, idField: string, index: number): string =>
  isRecord(item) && isSet(item[idField]) ? String(item[idField]) : `#${index}`;

/** Keys of their own for a list's items, as cardItems and recordItems key theirs: the id field's value, `#index`
 *  without one, a repeated key suffixed by occurrence ("7~2"). `repeated` names the ids more than one item holds. */
export const itemKeys = (items: unknown[], idField: string): { keys: string[]; repeated: string[] } => {
  const fromId = items.map((item) => isRecord(item) && isSet(item[idField]));
  const base = items.map((item, i) => ({ key: itemKey(item, idField, i) }));
  const counts = new Map<string, number>();
  base.forEach(({ key }, i) => fromId[i] && counts.set(key, (counts.get(key) ?? 0) + 1));
  return {
    keys: uniqueKeys(base, fromId).map(({ key }) => key),
    repeated: [...counts].filter(([, n]) => n > 1).map(([key]) => key),
  };
};

export const SHADOWS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 10px -2px rgb(0 0 0 / 0.08)',
  lg: '0 12px 24px -6px rgb(0 0 0 / 0.16)',
};

// ---- Key-value list ---------------------------------------------------------------------------------------------------

const KV_TYPES = new Set(['text', 'number', 'currency', 'date', 'datetime', 'badge', 'link', 'boolean']);
const KV_ALIASES: Record<string, string> = { string: 'text', money: 'currency', status: 'badge', url: 'link', bool: 'boolean', toggle: 'boolean' };
const MAX_ITEMS = 500;

export interface KeyValueRow extends Row {
  key: string;
  label: string;
  type: string;
}

/** Rows from an object ({ Status: 'Active' }), [{ label, value, type }] or [[label, value]] pairs. */
export const keyValueItems = (data: unknown): KeyValueRow[] => {
  let rows: Row[] = [];
  if (Array.isArray(data)) {
    rows = data.slice(0, MAX_ITEMS).flatMap((entry: unknown): Row[] => {
      if (Array.isArray(entry) && entry.length >= 1) return [{ label: entry[0], value: entry[1] }];
      if (isRecord(entry)) return [{ ...entry, label: entry.label ?? entry.key ?? entry.name ?? entry.title ?? '' }];
      return [];
    });
  } else if (isRecord(data)) {
    rows = Object.entries(data).slice(0, MAX_ITEMS).map(([label, value]) => ({ label, value }));
  }
  return rows.map((row, index) => {
    const rawType = isScalar(row.type) ? String(row.type).toLowerCase() : 'text';
    const type = KV_TYPES.has(rawType) ? rawType : KV_ALIASES[rawType] ?? 'text';
    return { ...row, key: `${index}-${isScalar(row.label) ? row.label : ''}`, label: isScalar(row.label) ? String(row.label) : '', type };
  });
};

const truthy = (v: unknown) => v === true || (typeof v === 'string' && /^(true|yes|y|1|on)$/i.test(v.trim())) || v === 1;

/** A row's value as display text by its type and format (a date pattern, or { currency, locale, decimalPlaces,
 *  dateFormat, prefix, suffix }); '' for an empty value. */
export const keyValueText = (row: KeyValueRow, defaults: { currency?: string; locale?: string; dateFormat?: string } = {}): string => {
  try {
    const value = row.value;
    if (value === null || value === undefined || value === '') return '';
    const bound = row.format;
    const own: Row = isRecord(bound) ? bound : isScalar(bound) ? { dateFormat: String(bound) } : {};
    const prefix = isScalar(own.prefix) ? String(own.prefix) : '';
    const suffix = isScalar(own.suffix) ? String(own.suffix) : '';
    const wrap = (t: string) => `${prefix}${t}${suffix}`;
    const type = row.type;
    if (type === 'number' || type === 'currency') {
      const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
      if (!Number.isFinite(n)) return String(value);
      const digits = isSet(own.decimalPlaces) ? Math.max(0, Math.min(10, Math.floor(Number(own.decimalPlaces)) || 0)) : undefined;
      const locale = toText(own.locale) || defaults.locale || 'en-US';
      const options: Intl.NumberFormatOptions =
        type === 'currency'
          ? { style: 'currency', currency: currencyCode(own.currency ?? row.currency ?? defaults.currency), minimumFractionDigits: digits ?? 2, maximumFractionDigits: digits ?? 2 }
          : { minimumFractionDigits: digits ?? 0, maximumFractionDigits: digits ?? 2 };
      return wrap(nf(locale, options).format(n));
    }
    if (type === 'date' || type === 'datetime') {
      const d = toDay(value);
      if (!d) return String(value);
      const pattern = toText(own.dateFormat) || (type === 'datetime' ? `${defaults.dateFormat || 'DD MMM YYYY'}, HH:mm` : defaults.dateFormat || 'DD MMM YYYY');
      return wrap(formatDatePattern(d, pattern));
    }
    if (type === 'boolean') return truthy(value) ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map((v) => (isScalar(v) ? String(v) : toText(v))).join(', ');
    if (typeof value === 'object') return toText(value);
    return wrap(String(value));
  } catch {
    return '';
  }
};

const safeUrl = (v: unknown): string => {
  const t = isScalar(v) ? String(v).trim() : '';
  return /^(https?:\/\/|mailto:|tel:|\/)/i.test(t) ? t : '';
};

/** A link row's URL: its href, else its value when that reads as a URL, mail or phone link. */
export const linkHref = (row: Row): string => {
  const href = safeUrl(row.href ?? row.url);
  if (href) return href;
  const value = isScalar(row.value) ? String(row.value).trim() : '';
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^www\./i.test(value)) return `https://${value}`;
  return '';
};
