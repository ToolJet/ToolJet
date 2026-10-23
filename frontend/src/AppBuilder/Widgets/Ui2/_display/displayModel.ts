// ToolJet UI 2.0: the display widgets' data logic, kept apart from the components so it
// is tested on its own. Every function accepts junk (null, wrong types, huge numbers, mixed arrays) without throwing.
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import type { ColumnFormat } from '@/AppBuilder/Widgets/Ui2/Table/types';
import { formatCell } from '@/AppBuilder/Widgets/Ui2/_shared/format';
import { uniqueKeys } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import {
  clampCoerce,
  isEmptyValue,
  isRecord,
  isScalar,
  isSet,
  own,
  safeUrl,
} from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** A plain object as bound data (an entry of a bound list, an author's map). */
export type Entry = Record<string, unknown>;

/** How many entries a display list draws at a time (Tags and Timeline draw the next ones on Show more; Key-value draws
 *  no more). */
export const MAX_ITEMS = 500;

/** A ToolJet definition value can arrive wrapped ({ value: true }); this unwraps it. */
const unwrap = (v: unknown): unknown => (isRecord(v) && 'value' in v && Object.keys(v).length <= 2 ? v.value : v);
const truthy = (v: unknown, fallback: boolean): boolean => {
  const u = unwrap(v);
  if (u === undefined || u === null || u === '') return fallback;
  return !(u === false || u === 'false' || u === '{{false}}' || u === 0);
};

// ---- Tags ------------------------------------------------------------------------------------------------------------

/** Tags as strings, from an array (of text or { label | name | value }) or a comma-separated string. Empty entries
 *  are dropped; duplicates stay (a tag list may repeat a value on purpose). Every tag is kept (the Tags widget exposes
 *  them all and draws MAX_ITEMS at a time). */
export const toTags = (value: unknown): string[] => {
  const source: unknown[] = Array.isArray(value) ? value : isScalar(value) ? String(value).split(',') : [];
  const tags: string[] = [];
  for (const entry of source) {
    let text: string | undefined;
    if (isScalar(entry)) text = String(entry);
    else if (isRecord(entry)) {
      const label = entry.label ?? entry.name ?? entry.title ?? entry.value;
      text = isScalar(label) ? String(label) : undefined;
    }
    if (text !== undefined && text.trim() !== '') tags.push(text.trim());
  }
  return tags;
};

/** A value's colour from an author's map ({ Paid: '#16a34a' }), matched exactly or ignoring case; undefined when the
 *  map does not name it. */
export const colorFor = (value: unknown, colors: unknown): string | undefined => {
  if (!isRecord(colors) || !isSet(value)) return undefined;
  const text = String(value);
  const key =
    Object.keys(colors).find((k) => k === text) ??
    Object.keys(colors).find((k) => k.toLowerCase() === text.toLowerCase());
  const colour = key === undefined ? undefined : colors[key];
  return isSet(colour) && isScalar(colour) ? String(colour) : undefined;
};

// ---- Circular progress -----------------------------------------------------------------------------------------------

export interface RingGeometry {
  size: number;
  thickness: number;
  radius: number;
  circumference: number;
  percent: number;
  offset: number;
}

/** The ring's geometry: an SVG of `size` px with a stroke of `thickness`, filled to `value` percent. */
export const ringGeometry = (value: unknown, size: unknown, thickness: unknown): RingGeometry => {
  const s = clampCoerce(size, 16, 1000, 96);
  const t = clampCoerce(thickness, 1, s / 2, Math.max(2, Math.round(s / 12)));
  const radius = (s - t) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = clampCoerce(value, 0, 100, 0);
  return { size: s, thickness: t, radius, circumference, percent, offset: circumference * (1 - percent / 100) };
};

// ---- Key-value list --------------------------------------------------------------------------------------------------

const KV_TYPES = new Set(['text', 'number', 'currency', 'date', 'datetime', 'badge', 'link', 'boolean']);
const KV_ALIASES: Record<string, string> = {
  string: 'text',
  money: 'currency',
  status: 'badge',
  url: 'link',
  bool: 'boolean',
  toggle: 'boolean',
};

/** A key-value row: the author's entry with its label, type and a React key filled in. */
export interface KeyValueRow extends Entry {
  key: string;
  label: string;
  type: string;
}

/** Key-value rows from an object ({ Status: 'Active' }), an array of { label, value, type?, format? } (key / name /
 *  title stand in for label), or an array of [label, value] pairs. */
export const keyValueItems = (data: unknown): KeyValueRow[] => {
  let rows: Entry[] = [];
  if (Array.isArray(data)) {
    rows = data.slice(0, MAX_ITEMS).flatMap((entry: unknown): Entry[] => {
      if (Array.isArray(entry) && entry.length >= 1) return [{ label: entry[0], value: entry[1] }];
      if (isRecord(entry)) {
        const label = entry.label ?? entry.key ?? entry.name ?? entry.title ?? '';
        return [{ ...entry, label }];
      }
      return [];
    });
  } else if (isRecord(data)) {
    rows = Object.entries(data)
      .slice(0, MAX_ITEMS)
      .map(([label, value]) => ({ label, value }));
  }
  return rows.map((row, index) => {
    const rawType = isScalar(row.type) ? String(row.type).toLowerCase() : 'text';
    const type = KV_TYPES.has(rawType) ? rawType : own(KV_ALIASES, rawType) ?? 'text';
    return {
      ...row,
      key: `${index}-${isScalar(row.label) ? row.label : ''}`,
      label: isScalar(row.label) ? String(row.label) : '',
      type,
    };
  });
};

/** A key-value row's value as display text, by its type and format (a date format string, or { currency, locale,
 *  decimalPlaces, dateFormat, prefix, suffix }); `defaults` hold the widget's currency, locale and date format.
 *  Returns '' for an empty value (the widget shows its empty text). */
export interface KeyValueDefaults {
  currency?: string;
  locale?: string;
  dateFormat?: string;
}

export const keyValueText = (row: Entry | null | undefined, defaults: KeyValueDefaults = {}): string => {
  try {
    const value = row?.value;
    if (isEmptyValue(value)) return '';
    const type = row?.type || 'text';
    const bound = row?.format;
    // The author's format object is taken to be a column format, as the Table takes it.
    const own: ColumnFormat = isRecord(bound)
      ? (bound as ColumnFormat)
      : isScalar(bound)
      ? { dateFormat: String(bound) }
      : {};
    const format: ColumnFormat = {
      currency: own.currency ?? (row?.currency as ColumnFormat['currency']) ?? defaults.currency,
      locale: own.locale ?? defaults.locale,
      dateFormat: own.dateFormat ?? defaults.dateFormat,
      decimalPlaces: isSet(own.decimalPlaces) ? clampCoerce(own.decimalPlaces, 0, 10, 0) : undefined,
      prefix: own.prefix,
      suffix: own.suffix,
    };
    if (type === 'number' || type === 'currency' || type === 'date' || type === 'datetime') {
      return formatCell(value, { type, format });
    }
    if (type === 'boolean') return truthy(value, false) ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map((v) => (isScalar(v) ? String(v) : stringify(v))).join(', ');
    if (typeof value === 'object') return stringify(value);
    return `${format.prefix ?? ''}${String(value)}${format.suffix ?? ''}`;
  } catch {
    return '';
  }
};

/** A link row's URL: its href, else its value when that reads as a URL, mail or phone link. */
export const linkHref = (row: Entry | null | undefined): string => {
  const href = safeUrl(isScalar(row?.href) ? row?.href : row?.url);
  if (href) return href;
  const value = isScalar(row?.value) ? String(row?.value).trim() : '';
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^www\./i.test(value)) return `https://${value}`;
  return '';
};

// ---- Timeline --------------------------------------------------------------------------------------------------------

// Status words and the theme colour each maps to (the author's statusColors map wins).
const STATUS_TOKENS: Record<string, string> = {
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
  // Work under way is the info blue, apart from success and warning whatever the brand.
  'in progress': 'var(--sc-chart-info)',
  active: 'var(--sc-primary)',
  current: 'var(--sc-primary)',
  info: 'var(--sc-chart-info)',
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
export const statusColor = (status: unknown, colors: unknown): string | undefined => {
  if (!isSet(status) || !isScalar(status)) return undefined;
  return colorFor(status, colors) ?? own(STATUS_TOKENS, String(status).trim().toLowerCase());
};

/** A timeline item: the author's entry with its fields as text. */
export interface TimelineItem extends Entry {
  key: string;
  index: number;
  title: string;
  description?: string;
  time?: string;
  status?: string;
  color?: string;
  icon?: string;
}

/** Timeline items: objects with title, description, time, status or color, icon (text entries become titles), in the
 *  given order or newest first (reversed). `limit` takes a window of that many entries from the start the list is read
 *  from: the first ones, or newest first the last ones (the newest), so a long stream is cut at its oldest end. It took
 *  the first 500 and then reversed them, dropping the newest. */
export const timelineItems = (items: unknown, newestFirst = false, limit = Infinity): TimelineItem[] => {
  const all: unknown[] = Array.isArray(items) ? items : [];
  const start = newestFirst ? Math.max(0, all.length - limit) : 0;
  const out = all.slice(start, start + limit).flatMap((entry: unknown, offset: number): TimelineItem[] => {
    const index = start + offset;
    if (isScalar(entry)) return [{ key: String(index), title: String(entry), index }];
    if (!isRecord(entry)) return [];
    const pick = (v: unknown): string => (isScalar(v) ? String(v) : '');
    return [
      {
        ...entry,
        key: isScalar(entry.id) ? String(entry.id) : String(index),
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

// ---- Steps -----------------------------------------------------------------------------------------------------------

export type StepId = string | number | boolean;

/** A step in the native Steps shape, with the author's other fields kept. */
export interface Step extends Entry {
  id: StepId;
  name: string;
  description: string;
  tooltip: string;
  visible: boolean;
  disabled: boolean;
}

/** Steps in the native Steps shape: { id, name, description, tooltip, visible, disabled }, from objects (title or label
 *  stand in for name; a missing id becomes the 1-based position), plain text, or a JSON string of either. Values the
 *  native definition wraps ({ value: true }) are unwrapped. */
export const normalizeSteps = (steps: unknown): Step[] => {
  let source: unknown = steps;
  if (typeof steps === 'string') {
    try {
      source = JSON.parse(steps);
    } catch {
      source = steps.trim() ? steps.split(',') : [];
    }
  }
  const fromId: boolean[] = [];
  const drafts = (Array.isArray(source) ? source : [])
    .slice(0, 100)
    .flatMap((entry: unknown, index: number): Step[] => {
      let step: Entry;
      if (isScalar(entry)) step = { name: String(entry).trim() };
      else if (isRecord(entry)) step = { ...entry };
      else return [];
      const rawId = unwrap(step.id);
      const authored = isScalar(rawId) && String(rawId) !== '';
      const id: StepId = authored ? rawId : index + 1;
      fromId.push(authored);
      const name = unwrap(step.name ?? step.title ?? step.label);
      const description = unwrap(step.description);
      const tooltip = unwrap(step.tooltip);
      return [
        {
          ...step,
          id,
          name: isScalar(name) ? String(name) : '',
          description: isScalar(description) ? String(description) : '',
          tooltip: isScalar(tooltip) ? String(tooltip) : '',
          visible: truthy(step.visible, true),
          disabled: truthy(step.disabled, false),
        },
      ];
    });
  // Ids are allocated by uniqueKeys: authored ids claim theirs first, and a repeated one (or a position that is
  // another step's id) is suffixed until it is free; repaired once, ['a-3', 'a', 'a'] gave two steps the id a-3, and a
  // click on the third selected the first. An id that needed no repair keeps its value (a number stays a number).
  const keyed = uniqueKeys(
    drafts.map((step) => ({ key: String(step.id) })),
    fromId
  );
  return drafts.map((step, i) => (keyed[i].key === String(step.id) ? step : { ...step, id: keyed[i].key }));
};

/** The index of the step whose id matches (loosely: 2 and '2' match) among `steps`, or -1. */
export const stepIndexOf = (steps: unknown, id: unknown): number =>
  isScalar(id) ? (Array.isArray(steps) ? steps : []).findIndex((s: Partial<Step>) => String(s.id) === String(id)) : -1;

// ---- Pagination ------------------------------------------------------------------------------------------------------

/** The page count: numberOfPages, else ceil(totalRecords / pageSize) when both are given; at least 1, at most 1e6. */
export interface PageCountInput {
  numberOfPages?: unknown;
  totalRecords?: unknown;
  pageSize?: unknown;
}

export const pageCountOf = ({ numberOfPages, totalRecords, pageSize }: PageCountInput = {}): number => {
  const records = clampCoerce(totalRecords, 0, 1e12, NaN);
  const size = clampCoerce(pageSize, 1, 1e6, NaN);
  if (Number.isFinite(records) && Number.isFinite(size) && isSet(totalRecords)) {
    return Math.max(1, Math.min(1e6, Math.ceil(records / size)));
  }
  return Math.max(1, Math.min(1e6, Math.floor(clampCoerce(numberOfPages, 1, 1e6, 1))));
};

/** A page number within 1..count (fallback for junk). */
export const clampPage = (page: unknown, count: number, fallback = 1): number =>
  Math.floor(clampCoerce(page, 1, Math.max(1, count), fallback));

/** The pager's items: page numbers with 'start-ellipsis' / 'end-ellipsis' gaps, `siblings` pages either side of the
 *  current one and the first and last page always shown. The list keeps a constant length once pages overflow. */
export type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

export const pageItems = (page: unknown, count: unknown, siblings: unknown = 1): PageItem[] => {
  const total = Math.max(1, Math.floor(Number(count) || 1));
  const current = clampPage(page, total);
  const sib = Math.floor(clampCoerce(siblings, 0, 5, 1));
  const slots = sib * 2 + 5; // first, last, current, siblings and two gaps
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);
  const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const left = Math.max(current - sib, 2);
  const right = Math.min(current + sib, total - 1);
  const showLeftGap = left > 3;
  const showRightGap = right < total - 2;
  if (!showLeftGap && showRightGap) return [...range(1, 3 + 2 * sib), 'end-ellipsis', total];
  if (showLeftGap && !showRightGap) return [1, 'start-ellipsis', ...range(total - (2 + 2 * sib), total)];
  return [1, 'start-ellipsis', ...range(left, right), 'end-ellipsis', total];
};
