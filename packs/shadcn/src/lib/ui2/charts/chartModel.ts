// UI 2.0 charts, ported for the pack: the logic the charts share (Widgets/Ui2/_charts/chartsModel.ts, highlight.ts and
// _shared/format.ts in the UI 2.0 checkout). Every function takes whatever the author bound and never throws.
import { chipTone } from './progressModel';
import { withAffixes } from '../../format';

export type Row = Record<string, unknown>;

export const MAX_ROWS = 2000;
export const MAX_SERIES = 12;
export const MAX_BARS = 500;
export const MAX_ANIMATED_POINTS = 300;

// ---- Value readers ---------------------------------------------------------------------------------------------------

export const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
export const isRecord = (v: unknown): v is Row => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isSet = (v: unknown): boolean => v !== undefined && v !== null && String(v).trim() !== '';
export const list = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

/** A finite number, or null: numbers and numeric text ("1,200"); never flags, objects or NaN. */
export const num = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const t = v.trim().replace(/,/g, '');
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const clamp = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = num(v);
  return n === null ? fallback : Math.max(lo, Math.min(hi, n));
};

/** A value fit for an axis tick or a legend: text and numbers as they are, anything else as text. */
export const axisLabel = (v: unknown): string | number => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (isScalar(v)) return typeof v === 'boolean' ? String(v) : v;
  try {
    return JSON.stringify(v) ?? '';
  } catch {
    return String(v);
  }
};

// ---- Number formats --------------------------------------------------------------------------------------------------

export const FORMATS = ['number', 'currency', 'percent', 'compact'] as const;
export type NumberFormat = (typeof FORMATS)[number];
const isFormat = (f: unknown): f is NumberFormat => typeof f === 'string' && (FORMATS as readonly string[]).includes(f);

export interface FormatOptions {
  format?: unknown;
  currency?: unknown;
  prefix?: unknown;
  suffix?: unknown;
}

const FORMATTERS = new Map<string, Intl.NumberFormat>();
const intl = (options: Intl.NumberFormatOptions): Intl.NumberFormat => {
  const key = JSON.stringify(options);
  let cached = FORMATTERS.get(key);
  if (!cached) {
    if (FORMATTERS.size > 200) FORMATTERS.clear();
    try {
      cached = new Intl.NumberFormat(undefined, options);
    } catch {
      cached = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
    }
    FORMATTERS.set(key, cached);
  }
  return cached;
};

/** A formatter for the format ('number' | 'currency' | 'percent' | 'compact') with the value prefix and suffix. Short
 *  (axis ticks) abbreviates large numbers. Percent takes values already in percent (42 shows 42%). */
export const formatter = ({ format, currency, prefix, suffix }: FormatOptions = {}, short = false): ((v: unknown) => string) => {
  const kind = isFormat(format) ? format : 'number';
  const code = typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim().toUpperCase() : 'USD';
  const compact = short || kind === 'compact';
  let f: Intl.NumberFormat;
  if (kind === 'currency') {
    f = intl({
      style: 'currency',
      currency: code,
      ...(compact ? { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 } : { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    });
  } else if (compact && kind !== 'percent') {
    f = intl({ notation: 'compact', maximumFractionDigits: 1 });
  } else {
    f = intl({ maximumFractionDigits: kind === 'percent' ? 1 : 2 });
  }
  const before = isScalar(prefix) ? String(prefix) : '';
  const after = isScalar(suffix) ? String(suffix) : '';
  // Money with cents shows both digits ("$3,043.50").
  const cents = kind === 'currency' && !compact ? intl({ style: 'currency', currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;
  return (v) => {
    const n = num(v);
    if (n === null) return v === null || v === undefined ? '' : String(axisLabel(v));
    return withAffixes(`${(cents && !Number.isInteger(n) ? cents : f).format(n)}${kind === 'percent' ? '%' : ''}`, before, after, kind === 'currency');
  };
};

const COMPACT = intl({ notation: 'compact', maximumFractionDigits: 1 });
export const PLAIN_NUMBER = intl({ maximumFractionDigits: 2 });
/** The Area, Bar and Pie charts' values: compact when short, with the value prefix and suffix. */
export const affixFormatter =
  (p: { valuePrefix?: unknown; valueSuffix?: unknown }, short: boolean) =>
  (v: unknown): string => {
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v ?? '');
    return withAffixes(short ? COMPACT.format(n) : PLAIN_NUMBER.format(n), isScalar(p.valuePrefix) ? p.valuePrefix : '', isScalar(p.valueSuffix) ? p.valueSuffix : '');
  };

/** How much a percent axis multiplies its values: 100 when every value is a fraction (0.39 for 39%), else 1. */
export const percentScale = (format: unknown, values: unknown): number => {
  if (format !== 'percent') return 1;
  const nums = (Array.isArray(values) ? values : []).map(num).filter((v): v is number => v !== null);
  if (!nums.length || nums.every((v) => v === 0)) return 1;
  return nums.every((v) => Math.abs(v) <= 1) ? 100 : 1;
};

export const scaled = (format: (v: unknown) => string, scale: number): ((v: unknown) => string) =>
  scale === 1
    ? format
    : (v: unknown) => {
        const n = num(v);
        return format(n === null ? v : n * scale);
      };

/** "+$190,800.00" as "+$190.8K" for a small space; under 10,000 and words are left as written. */
const FIGURE = /^([+\-−±]?)\s?([$€£¥₹]?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?$/;
export const compactFigure = (text: unknown): string => {
  const s = String(text ?? '').trim();
  const m = s.match(FIGURE);
  if (!m) return s;
  const n = Number(m[3].replace(/,/g, '') + (m[4] ?? ''));
  if (!Number.isFinite(n) || n < 10000) return s;
  const [unit, letter]: [number, string] = n >= 1e9 ? [1e9, 'B'] : n >= 1e6 ? [1e6, 'M'] : [1e3, 'K'];
  const v = n / unit;
  return `${m[1]}${m[2]}${v.toFixed(v < 10 ? 2 : 1).replace(/\.?0+$/, '')}${letter}`;
};

/** A donut's centre value at a size that fits its hole: 24px, smaller down to 16px, then shortened. */
export const centreValueFit = (text: unknown, innerRadius: unknown): { text: string; fontSize: number } => {
  const s = String(text ?? '');
  const room = Math.max(40, 2 * (Number(innerRadius) || 0) - 16);
  const sizeFor = (t: string) => Math.floor(room / Math.max(1, t.length * 0.62));
  if (sizeFor(s) >= 24) return { text: s, fontSize: 24 };
  if (sizeFor(s) >= 16) return { text: s, fontSize: sizeFor(s) };
  const short = compactFigure(s);
  return { text: short, fontSize: Math.max(12, Math.min(24, sizeFor(short))) };
};

// ---- Fields and series -----------------------------------------------------------------------------------------------

/** Field names from 'a, b', ['a', 'b'] or junk: trimmed, unique, at most MAX_SERIES. */
export const fieldList = (v: unknown): string[] => {
  const raw: unknown[] = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  const out: string[] = [];
  raw.forEach((f) => {
    if (!isScalar(f)) return;
    const s = String(f).trim();
    if (s && !out.includes(s)) out.push(s);
  });
  return out.slice(0, MAX_SERIES);
};

/** Rows with the category as a label and each series a number or null (a gap). */
export const seriesRows = (data: unknown, categoryField: string | undefined, series: string[]): Row[] =>
  list(data)
    .filter(isRecord)
    .slice(0, MAX_ROWS)
    .map((row) => {
      const out = { ...row };
      if (isSet(categoryField)) out[String(categoryField)] = axisLabel(row[String(categoryField)]);
      series.forEach((s) => {
        out[s] = num(row[s]);
      });
      return out;
    });

export const hasValues = (rows: Row[], series: string[]): boolean => rows.some((row) => series.some((s) => row[s] !== null && row[s] !== undefined));

export const wholeNumbers = (rows: ReadonlyArray<Row | null | undefined>, series: string[]): boolean => {
  let seen = false;
  for (const row of rows)
    for (const s of series) {
      const v = num(row?.[s]);
      if (v === null) continue;
      if (!Number.isInteger(v)) return false;
      seen = true;
    }
  return seen;
};

export type Curve = 'monotone' | 'linear' | 'step' | 'natural';
export const curveOf = (c: unknown): Curve => (c === 'linear' || c === 'step' || c === 'natural' ? c : 'monotone');

export interface ChartFields {
  x: string | undefined;
  series: string[];
  missing: string[];
  substitutes: string[];
}
/** The x field and series a chart plots: a field the data lacks falls back to the data's own (the first text field for
 *  x, the numeric fields for the series), and `missing` / `substitutes` feed the note under the chart. */
export const resolveChartFields = (data: unknown, xField: string | undefined, series: string[]): ChartFields => {
  const rows = list(data).filter(isRecord).slice(0, MAX_ROWS);
  if (!rows.length) return { x: xField, series, missing: [], substitutes: [] };
  const keys = [...new Set(rows.slice(0, 50).flatMap((row) => Object.keys(row)))];
  const has = (key: string) => rows.some((row) => row[key] !== undefined && row[key] !== null);
  const numeric = (key: string) => rows.some((row) => row[key] !== null && row[key] !== '' && Number.isFinite(Number(row[key])));
  const x = xField && has(xField) ? xField : keys.find((key) => !numeric(key) && rows.some((row) => typeof row[key] === 'string')) ?? xField;
  const named = series.filter((key) => has(key));
  const fallback = named.length ? [] : keys.filter((key) => key !== x && numeric(key) && typeof rows[0][key] !== 'boolean').slice(0, 6);
  return {
    x,
    series: named.length ? named : fallback.length ? fallback : series,
    missing: [...(xField && !has(xField) ? [xField] : []), ...series.filter((key) => !has(key))],
    substitutes: [...(x !== xField && x !== undefined ? [x] : []), ...(series.length ? fallback : [])],
  };
};

const andList = (words: string[]) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`);

export const fieldNote = ({ missing, substitutes }: Pick<ChartFields, 'missing' | 'substitutes'>): string | null => {
  if (!missing.length) return null;
  const lacks = `The data has no ${missing.join(' or ')} field${missing.length === 1 ? '' : 's'}`;
  return substitutes.length ? `${lacks}: showing ${andList(substitutes)}` : lacks;
};

export const hiddenNote = (count: number, one: string, many = `${one}s`): string | null =>
  count > 0 ? `${count} more ${count === 1 ? one : many} not shown` : null;

/** `max` of `rows` taken evenly across them (the first and the last kept), in order: a sample that spans the whole
 *  data, where the first `max` showed only its start. Fewer rows come back as they are. */
export const evenSample = <T>(rows: T[], max: number): T[] => {
  if (rows.length <= max) return rows;
  if (max <= 1) return rows.slice(0, Math.max(0, max));
  return Array.from({ length: max }, (_, i) => rows[Math.round((i * (rows.length - 1)) / (max - 1))]);
};

/** The note under a chart that draws an even sample of its points. */
export const sampledNote = (shown: number, total: number, many: string): string | null =>
  total > shown ? `Showing ${shown} of ${total} ${many}, sampled evenly` : null;

/** seriesLabels as an object ({ hours: 'Flight hours' }) or a list naming the series in order. */
export const seriesLabelMap = (labels: unknown, series: string[] | undefined): Record<string, unknown> => {
  const names = series || [];
  const positional =
    isRecord(labels) && Object.keys(labels).length > 0 && Object.keys(labels).every((k) => /^\d+$/.test(k) && !names.includes(k));
  if (Array.isArray(labels) || positional) {
    const at = labels as Record<number, unknown>;
    return Object.fromEntries(names.map((s, i) => [s, at[i]]).filter(([, l]) => l !== undefined && l !== null && String(l).trim() !== ''));
  }
  return isRecord(labels) ? labels : {};
};

/** Each drawn series' place among the configured fields, which its positional label and colour belong to. */
export const seriesSlots = (configured: string[], drawn: string[]): number[] =>
  drawn.map((key, i) => (configured.includes(key) ? configured.indexOf(key) : i));

export const drawnLabelMap = (labels: unknown, configured: string[], drawn: string[]): Record<string, unknown> =>
  seriesLabelMap(labels, configured.length ? configured : drawn);

const ACRONYMS = /\b(mrr|arr|nps|sla|kpi|roi|aov|gmv|ctr|cpc|cpa|csat|ltv|cac|arpu|eta|qa|hr|it|api|sku|id|ytd|mtd|qtd)\b/g;

/** A series' name: the author's label, else its field made readable ("food_cost_pct" reads "Food cost pct"). */
export const seriesLabel = (key: unknown, labels?: unknown): string => {
  const own = isRecord(labels) ? labels[String(key)] : undefined;
  if ((typeof own === 'string' || typeof own === 'number') && String(own).trim() !== '') return String(own);
  const words = String(key ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  if (!words) return String(key ?? '');
  const spoken = words.replace(ACRONYMS, (w) => w.toUpperCase());
  return spoken.charAt(0).toUpperCase() + spoken.slice(1);
};

// ---- Colours ---------------------------------------------------------------------------------------------------------

const STATUS_FILLS: Record<string, string> = {
  success: 'var(--sc-success, var(--ui-success))',
  warning: 'var(--sc-warning, #f59e0b)',
  danger: 'var(--sc-destructive, var(--ui-destructive))',
  info: 'var(--sc-chart-info, #3b82f6)',
};

/** Fills for series or slices that are all states (Completed, In progress, Missed): their status tones, so a chart
 *  reads like the chips beside it. null when any label is not a state, or all share one tone. */
export const statusColors = (labels: unknown): string[] | null => {
  if (!Array.isArray(labels) || labels.length < 2 || labels.length > MAX_SERIES) return null;
  const tones = labels.map((label) => chipTone(isScalar(label) ? String(label) : ''));
  if (tones.some((tone) => !STATUS_FILLS[tone]) || new Set(tones).size < 2) return null;
  const seen: Record<string, number> = {};
  return tones.map((tone) => {
    seen[tone] = (seen[tone] || 0) + 1;
    const fill = STATUS_FILLS[tone];
    return seen[tone] === 1 ? fill : `color-mix(in srgb, ${fill} ${Math.max(30, 100 - 35 * (seen[tone] - 1))}%, var(--ui-bg))`;
  });
};

// ---- Highlight -------------------------------------------------------------------------------------------------------

const KEYWORDS = ['first', 'last', 'max', 'min'];

/** The rows a bar chart emphasises: category values (one, a list or comma-separated), or first / last / max / min. */
export const highlightIndexes = (data: unknown, xField: string | undefined, series: unknown, highlight: unknown): Set<number> | null => {
  if (!Array.isArray(data) || !data.length) return null;
  const wanted = (Array.isArray(highlight) ? (highlight as unknown[]) : isScalar(highlight) ? String(highlight).split(',') : [])
    .filter(isScalar)
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!wanted.length) return null;
  const label = (row: unknown) => (isRecord(row) && isScalar(row[String(xField)]) ? String(row[String(xField)]).trim() : undefined);
  const picked = new Set<number>();
  data.forEach((row, i) => {
    const name = label(row);
    if (name !== undefined && wanted.includes(name)) picked.add(i);
  });
  const keyword = wanted.find((w) => KEYWORDS.includes(w.toLowerCase()) && !data.some((row) => label(row) === w));
  if (keyword) {
    const k = keyword.toLowerCase();
    if (k === 'first') picked.add(0);
    else if (k === 'last') picked.add(data.length - 1);
    else {
      const totals = data.map((row) => (isRecord(row) ? (Array.isArray(series) ? series : []).reduce((sum: number, s) => sum + (num(row[s]) ?? 0), 0) : null));
      const valid = totals.filter((t): t is number => t !== null);
      if (valid.length) picked.add(totals.indexOf(k === 'max' ? Math.max(...valid) : Math.min(...valid)));
    }
  }
  return picked.size ? picked : null;
};

const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};
/** Whether `row` is the clicked datum: the same row, or one whose every field the clicked datum holds alike. */
export const sameDatum = (row: unknown, clicked: unknown): boolean => {
  if (row === clicked) return true;
  if (!isRecord(row) || !isRecord(clicked)) return false;
  const fields = Object.entries(row);
  return fields.length > 0 && fields.every(([key, value]) => same(value, clicked[key]));
};
export const DIMMED = 0.35;
export const emphasis = (row: unknown, highlighted: unknown): number => (highlighted == null || sameDatum(row, highlighted) ? 1 : DIMMED);
export const highlightOf = (clicked: unknown): unknown => (isRecord(clicked) && Object.keys(clicked).length ? clicked : null);

// ---- Axes ------------------------------------------------------------------------------------------------------------

/** Whole-number ticks for a small count axis (steps of 1, 2 or 5), or small decimal ones; {} leaves it to the chart. */
export const wholeTicks = (rows: ReadonlyArray<Row | null | undefined>, series: string[], stacked = false): { domain?: [number, number]; tickCount?: number } => {
  const values = rows.flatMap((row) =>
    series
      .map((s) => row?.[s])
      .filter((v) => v !== null && v !== undefined && v !== '')
      .map(Number)
  );
  if (!values.length || values.some((v) => !Number.isFinite(v) || v < 0)) return {};
  const max = stacked ? Math.max(...rows.map((row) => series.reduce((sum, s) => sum + (Number(row?.[s]) || 0), 0))) : Math.max(...values);
  if (values.some((v) => !Number.isInteger(v))) {
    if (max <= 0 || max > 10) return {};
    const step = [0.1, 0.2, 0.25, 0.5, 1, 2].find((s) => Math.ceil(max / s - 1e-9) <= 5) ?? 2;
    const top = Math.round(Math.ceil(max / step - 1e-9) * step * 1000) / 1000;
    return { domain: [0, top], tickCount: Math.round(top / step) + 1 };
  }
  if (max <= 0 || max > 20) return {};
  const step = [1, 2, 5].find((s) => Math.ceil(max / s) <= 5) ?? 5;
  const top = Math.ceil(max / step) * step;
  return { domain: [0, top], tickCount: top / step + 1 };
};

const niceCeil = (v: number): number => {
  if (!(v > 0)) return v;
  const step = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / step) * step;
};

/** A value axis as wide as its longest tick label. */
export const valueAxisWidth = (data: unknown, series: string[], format: (v: number) => unknown, stacked = false): number => {
  const values = list(data).flatMap((row) => {
    const nums = series.map((key) => Number(row?.[key])).filter((n) => Number.isFinite(n));
    return stacked ? [nums.reduce((a, b) => a + b, 0)] : nums;
  });
  if (!values.length) return 40;
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const top = niceCeil(max);
  const ticks = [max, top, min, top * 0.25, top * 0.5, top * 0.75, top * 0.9, top * 0.3, top * 0.7];
  const longest = Math.max(...ticks.map((v) => String(format(v) ?? '').length));
  return Math.min(110, Math.max(32, longest * 7 + 12));
};

export const axisWidthFor = (values: number[], tick: (v: number) => unknown): number => {
  if (!values.length) return 40;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const top = niceCeil(max);
  const samples = [max, min, top, top * 0.25, top * 0.5, top * 0.75, top * 0.3, top * 0.8];
  const longest = Math.max(...samples.map((v) => String(tick(v)).length));
  return Math.min(96, Math.max(32, longest * 7 + 12));
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** An x axis of ISO dates reads "10 Sep", of year-months "Mar" (or "Mar '26" across years); other values as they are. */
export const dateTicks = (data: unknown, key: string | undefined): ((v: unknown) => string) | undefined => {
  const values = list(data).map((row) => row?.[String(key)]);
  const sample = values.find((v) => v !== null && v !== undefined && v !== '');
  if (typeof sample === 'string' && YEAR_MONTH.test(sample)) {
    const years = new Set(values.filter((v): v is string => typeof v === 'string' && YEAR_MONTH.test(v)).map((v) => v.slice(0, 4)));
    return (v) => {
      if (typeof v !== 'string' || !YEAR_MONTH.test(v)) return String(v ?? '');
      const month = MONTHS[Number(v.slice(5, 7)) - 1];
      return years.size > 1 ? `${month} '${v.slice(2, 4)}` : month;
    };
  }
  if (typeof sample !== 'string' || !ISO_DATE.test(sample)) return undefined;
  return (v) => {
    if (typeof v !== 'string' || !ISO_DATE.test(v)) return String(v ?? '');
    // A bare day is that day where the viewer is, not UTC midnight.
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(Number(v.slice(0, 4)), Number(v.slice(5, 7)) - 1, Number(v.slice(8, 10))) : new Date(v);
    return Number.isNaN(d.getTime()) ? v : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };
};

/** A chart under 100px tall draws the shape alone, without axes, grid or legend. */
export const isCompactChart = (height: unknown): boolean => (Number(height) || 300) < 100;

export const animated = (animate: unknown, points = 0): boolean => animate !== false && points <= MAX_ANIMATED_POINTS;
