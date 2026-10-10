// shadcn/ui pack (experiment): the display widgets' data logic (ShadDisplay.jsx), kept apart from the components so it
// is tested on its own. Every function accepts junk (null, wrong types, huge numbers, mixed arrays) without throwing.
import dayjs from 'dayjs';
import { formatCell } from './tableModel';

const isSet = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const isText = (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const MAX_ITEMS = 500;
// A map entry for a value, never an inherited key ("constructor" from junk data).
const own = (map, key) => (Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined);

/** A number within [min, max]; `fallback` for anything that is not a finite number. */
export const clamp = (value, min, max, fallback = min) => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim() === '' ? NaN : value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

/** A ToolJet definition value can arrive wrapped ({ value: true }); this unwraps it. */
const unwrap = (v) => (isObject(v) && 'value' in v && Object.keys(v).length <= 2 ? v.value : v);
const truthy = (v, fallback) => {
  const u = unwrap(v);
  if (u === undefined || u === null || u === '') return fallback;
  return !(u === false || u === 'false' || u === '{{false}}' || u === 0);
};

// ---- Icon ------------------------------------------------------------------------------------------------------------

/** The PascalCase names to try for a lucide icon given as kebab-case (trending-up), snake or space separated,
 *  camelCase (trendingUp) or PascalCase (TrendingUp, TrendingUpIcon). */
export const iconCandidates = (name) => {
  if (!isText(name)) return [];
  const raw = String(name).trim();
  if (!raw) return [];
  const pascal = raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const lowerRest = raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
  const out = [pascal, lowerRest, pascal.replace(/Icon$/, '')];
  return [...new Set(out.filter(Boolean))];
};

/** The icon component for `name` from a lucide `icons` map (and optionally the module's own exports, which carry
 *  the older alias names), or `fallback`. Never throws. */
export const resolveIcon = (name, maps, fallback) => {
  const sources = (Array.isArray(maps) ? maps : [maps]).filter(isObject);
  for (const candidate of iconCandidates(name)) {
    if (candidate === 'Icon') continue; // lucide's base component, not an icon
    for (const source of sources) {
      const found = source[candidate];
      if (found && (typeof found === 'function' || typeof found === 'object')) return found;
    }
  }
  return fallback;
};

// ---- Tags ------------------------------------------------------------------------------------------------------------

/** Tags as strings, from an array (of text or { label | name | value }) or a comma-separated string. Empty entries
 *  are dropped; duplicates stay (a tag list may repeat a value on purpose). */
export const toTags = (value) => {
  const source = Array.isArray(value) ? value : isText(value) ? String(value).split(',') : [];
  const tags = [];
  for (const entry of source.slice(0, MAX_ITEMS)) {
    let text;
    if (isText(entry)) text = String(entry);
    else if (isObject(entry)) {
      const label = entry.label ?? entry.name ?? entry.title ?? entry.value;
      text = isText(label) ? String(label) : undefined;
    }
    if (text !== undefined && text.trim() !== '') tags.push(text.trim());
  }
  return tags;
};

/** A value's colour from an author's map ({ Paid: '#16a34a' }), matched exactly or ignoring case; undefined when the
 *  map does not name it. */
export const colorFor = (value, colors) => {
  if (!isObject(colors) || !isSet(value)) return undefined;
  const text = String(value);
  const key =
    Object.keys(colors).find((k) => k === text) ??
    Object.keys(colors).find((k) => k.toLowerCase() === text.toLowerCase());
  const colour = key === undefined ? undefined : colors[key];
  return isSet(colour) && isText(colour) ? String(colour) : undefined;
};

// ---- Circular progress -----------------------------------------------------------------------------------------------

/** The ring's geometry: an SVG of `size` px with a stroke of `thickness`, filled to `value` percent. */
export const ringGeometry = (value, size, thickness) => {
  const s = clamp(size, 16, 1000, 96);
  const t = clamp(thickness, 1, s / 2, Math.max(2, Math.round(s / 12)));
  const radius = (s - t) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = clamp(value, 0, 100, 0);
  return { size: s, thickness: t, radius, circumference, percent, offset: circumference * (1 - percent / 100) };
};

// ---- Key-value list --------------------------------------------------------------------------------------------------

const KV_TYPES = new Set(['text', 'number', 'currency', 'date', 'datetime', 'badge', 'link', 'boolean']);
const KV_ALIASES = {
  string: 'text',
  money: 'currency',
  status: 'badge',
  url: 'link',
  bool: 'boolean',
  toggle: 'boolean',
};

/** Key-value rows from an object ({ Status: 'Active' }), an array of { label, value, type?, format? } (key / name /
 *  title stand in for label), or an array of [label, value] pairs. */
export const keyValueItems = (data) => {
  let rows = [];
  if (Array.isArray(data)) {
    rows = data.slice(0, MAX_ITEMS).flatMap((entry) => {
      if (Array.isArray(entry) && entry.length >= 1) return [{ label: entry[0], value: entry[1] }];
      if (isObject(entry)) {
        const label = entry.label ?? entry.key ?? entry.name ?? entry.title ?? '';
        return [{ ...entry, label }];
      }
      return [];
    });
  } else if (isObject(data)) {
    rows = Object.entries(data)
      .slice(0, MAX_ITEMS)
      .map(([label, value]) => ({ label, value }));
  }
  return rows.map((row, index) => {
    const rawType = isText(row.type) ? String(row.type).toLowerCase() : 'text';
    const type = KV_TYPES.has(rawType) ? rawType : own(KV_ALIASES, rawType) ?? 'text';
    return {
      ...row,
      key: `${index}-${isText(row.label) ? row.label : ''}`,
      label: isText(row.label) ? String(row.label) : '',
      type,
    };
  });
};

const isEmptyValue = (v) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (typeof v === 'number' && isNaN(v));

/** A key-value row's value as display text, by its type and format (a date format string, or { currency, locale,
 *  decimalPlaces, dateFormat, prefix, suffix }); `defaults` hold the widget's currency, locale and date format.
 *  Returns '' for an empty value (the widget shows its empty text). */
export const formatValue = (row, defaults = {}) => {
  try {
    const value = row?.value;
    if (isEmptyValue(value)) return '';
    const type = row?.type || 'text';
    const own = isObject(row?.format) ? row.format : isText(row?.format) ? { dateFormat: String(row.format) } : {};
    const format = {
      currency: own.currency ?? row?.currency ?? defaults.currency,
      locale: own.locale ?? defaults.locale,
      dateFormat: own.dateFormat ?? defaults.dateFormat,
      decimalPlaces: isSet(own.decimalPlaces) ? clamp(own.decimalPlaces, 0, 10, 0) : undefined,
      prefix: own.prefix,
      suffix: own.suffix,
    };
    if (type === 'number' || type === 'currency' || type === 'date' || type === 'datetime') {
      return formatCell(value, { type, format });
    }
    if (type === 'boolean') return truthy(value, false) ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map((v) => (isText(v) ? String(v) : JSON.stringify(v))).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return `${format.prefix ?? ''}${String(value)}${format.suffix ?? ''}`;
  } catch {
    return '';
  }
};

/** A link row's URL: its href, else its value when that reads as a URL, mail or phone link. */
export const linkHref = (row) => {
  const href = isText(row?.href) ? String(row.href) : isText(row?.url) ? String(row.url) : '';
  if (href) return href;
  const value = isText(row?.value) ? String(row.value).trim() : '';
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^www\./i.test(value)) return `https://${value}`;
  return '';
};

// ---- Timeline --------------------------------------------------------------------------------------------------------

// Status words and the theme colour each maps to (the author's statusColors map wins).
const STATUS_TOKENS = {
  success: 'var(--sc-success)',
  completed: 'var(--sc-success)',
  complete: 'var(--sc-success)',
  done: 'var(--sc-success)',
  paid: 'var(--sc-success)',
  approved: 'var(--sc-success)',
  delivered: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  pending: 'var(--sc-warning)',
  waiting: 'var(--sc-warning)',
  'in progress': 'var(--sc-primary)',
  active: 'var(--sc-primary)',
  current: 'var(--sc-primary)',
  info: 'var(--sc-primary)',
  primary: 'var(--sc-primary)',
  error: 'var(--sc-destructive)',
  failed: 'var(--sc-destructive)',
  danger: 'var(--sc-destructive)',
  destructive: 'var(--sc-destructive)',
  cancelled: 'var(--sc-destructive)',
  canceled: 'var(--sc-destructive)',
  rejected: 'var(--sc-destructive)',
};

/** A status's colour: the author's map, then the theme colour for known words, else undefined (the marker colour). */
export const statusColor = (status, colors) => {
  if (!isSet(status) || !isText(status)) return undefined;
  return colorFor(status, colors) ?? own(STATUS_TOKENS, String(status).trim().toLowerCase());
};

/** Timeline items: objects with title, description, time, status or color, icon (text entries become titles), in the
 *  given order or newest first (reversed). */
export const timelineItems = (items, newestFirst = false) => {
  const out = (Array.isArray(items) ? items : []).slice(0, MAX_ITEMS).flatMap((entry, index) => {
    if (isText(entry)) return [{ key: String(index), title: String(entry), index }];
    if (!isObject(entry)) return [];
    const pick = (v) => (isText(v) ? String(v) : '');
    return [
      {
        ...entry,
        key: isText(entry.id) ? String(entry.id) : String(index),
        index,
        title: pick(entry.title ?? entry.label ?? entry.name),
        description: pick(entry.description ?? entry.content ?? entry.text),
        time: pick(entry.time ?? entry.date ?? entry.timestamp),
        status: pick(entry.status),
        color: pick(entry.color),
        icon: pick(entry.icon),
      },
    ];
  });
  return newestFirst ? out.reverse() : out;
};

/** A timeline time as shown: formatted when a date format is given and the time parses as a date, else as given. */
export const formatTime = (time, dateFormat) => {
  if (!isSet(time)) return '';
  if (!isSet(dateFormat)) return String(time);
  const looksLikeDate = typeof time === 'number' || /^\d{4}-\d{2}-\d{2}/.test(String(time));
  if (!looksLikeDate) return String(time);
  const parsed = typeof time === 'number' ? dayjs(time < 1e12 ? time * 1000 : time) : dayjs(time);
  return parsed.isValid() ? parsed.format(String(dateFormat)) : String(time);
};

// ---- Steps -----------------------------------------------------------------------------------------------------------

/** Steps in the native Steps shape: { id, name, description, tooltip, visible, disabled }, from objects (title or label
 *  stand in for name; a missing id becomes the 1-based position), plain text, or a JSON string of either. Values the
 *  native definition wraps ({ value: true }) are unwrapped. */
export const normalizeSteps = (steps) => {
  let source = steps;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = source.trim() ? source.split(',') : [];
    }
  }
  const seen = new Set();
  return (Array.isArray(source) ? source : []).slice(0, 100).flatMap((entry, index) => {
    let step;
    if (isText(entry)) step = { name: String(entry).trim() };
    else if (isObject(entry)) step = { ...entry };
    else return [];
    const rawId = unwrap(step.id);
    let id = isText(rawId) && String(rawId) !== '' ? rawId : index + 1;
    if (seen.has(String(id))) id = `${id}-${index + 1}`;
    seen.add(String(id));
    const name = unwrap(step.name ?? step.title ?? step.label);
    const description = unwrap(step.description);
    const tooltip = unwrap(step.tooltip);
    return [
      {
        ...step,
        id,
        name: isText(name) ? String(name) : '',
        description: isText(description) ? String(description) : '',
        tooltip: isText(tooltip) ? String(tooltip) : '',
        visible: truthy(step.visible, true),
        disabled: truthy(step.disabled, false),
      },
    ];
  });
};

/** The index of the step whose id matches (loosely: 2 and '2' match) among `steps`, or -1. */
export const stepIndexOf = (steps, id) =>
  isText(id) ? (Array.isArray(steps) ? steps : []).findIndex((s) => String(s.id) === String(id)) : -1;

// ---- Pagination ------------------------------------------------------------------------------------------------------

/** The page count: numberOfPages, else ceil(totalRecords / pageSize) when both are given; at least 1, at most 1e6. */
export const pageCountOf = ({ numberOfPages, totalRecords, pageSize } = {}) => {
  const records = clamp(totalRecords, 0, 1e12, NaN);
  const size = clamp(pageSize, 1, 1e6, NaN);
  if (Number.isFinite(records) && Number.isFinite(size) && isSet(totalRecords)) {
    return Math.max(1, Math.min(1e6, Math.ceil(records / size)));
  }
  return Math.max(1, Math.min(1e6, Math.floor(clamp(numberOfPages, 1, 1e6, 1))));
};

/** A page number within 1..count (fallback for junk). */
export const clampPage = (page, count, fallback = 1) => Math.floor(clamp(page, 1, Math.max(1, count), fallback));

/** The pager's items: page numbers with 'start-ellipsis' / 'end-ellipsis' gaps, `siblings` pages either side of the
 *  current one and the first and last page always shown. The list keeps a constant length once pages overflow. */
export const pageItems = (page, count, siblings = 1) => {
  const total = Math.max(1, Math.floor(Number(count) || 1));
  const current = clampPage(page, total);
  const sib = Math.floor(clamp(siblings, 0, 5, 1));
  const slots = sib * 2 + 5; // first, last, current, siblings and two gaps
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const left = Math.max(current - sib, 2);
  const right = Math.min(current + sib, total - 1);
  const showLeftGap = left > 3;
  const showRightGap = right < total - 2;
  if (!showLeftGap && showRightGap) return [...range(1, 3 + 2 * sib), 'end-ellipsis', total];
  if (showLeftGap && !showRightGap) return [1, 'start-ellipsis', ...range(total - (2 + 2 * sib), total)];
  return [1, 'start-ellipsis', ...range(left, right), 'end-ellipsis', total];
};
