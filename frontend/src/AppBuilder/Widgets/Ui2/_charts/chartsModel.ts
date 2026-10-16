// shadcn/ui pack charts (experiment): the logic the charts share, and that of the Line and Sparkline charts.
// Every function takes whatever the author bound (null, strings, mixed arrays, objects with missing keys) and returns
// clean values: numbers or null, plain rows, text labels. Nothing here throws.

import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { chipTone } from '@/AppBuilder/Widgets/NewTable/_utils/chipTone';

export const MAX_ROWS = 2000;
export const MAX_SERIES = 12;

/** A data row as bound: any fields, of any value. */
export type Row = Record<string, unknown>;

export const isText = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
export const isPlain = (v: unknown): v is Row => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isSet = (v: unknown): boolean => v !== undefined && v !== null && String(v).trim() !== '';

/** A finite number, or null: numbers, numeric strings ("1,200", " 42 "); never booleans, objects or NaN. */
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
  if (n === null) return fallback;
  return Math.min(hi, Math.max(lo, n));
};

/** A value fit for an axis tick or a legend: text and numbers as they are, anything else as text. */
export const axisLabel = (v: unknown): string | number => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (isText(v)) return typeof v === 'boolean' ? String(v) : v;
  try {
    return stringify(v) ?? '';
  } catch {
    return String(v);
  }
};

/** Field names from 'a, b', ['a', 'b'] or junk: trimmed, unique, at most MAX_SERIES. */
export const fieldList = (v: unknown): string[] => {
  const raw: unknown[] = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  const out: string[] = [];
  raw.forEach((f) => {
    if (!isText(f)) return;
    const s = String(f).trim();
    if (s && !out.includes(s)) out.push(s);
  });
  return out.slice(0, MAX_SERIES);
};

/** Plain object rows with the category field as a label and every series field as a number or null (a gap). */
export const seriesRows = (data: unknown, categoryField: string | undefined, series: string[]): Row[] =>
  (Array.isArray(data) ? data : [])
    .filter(isPlain)
    .slice(0, MAX_ROWS)
    .map((row) => {
      const out = { ...row };
      if (isSet(categoryField)) out[String(categoryField)] = axisLabel(row[String(categoryField)]);
      series.forEach((s) => {
        out[s] = num(row[s]);
      });
      return out;
    });

export const hasValues = (rows: Row[], series: string[]): boolean =>
  rows.some((row) => series.some((s) => row[s] !== null));

/** Whether every plotted value of these series is a whole number (and there is at least one): such an axis ticks in
 *  whole numbers, so counts never read as 0.5 or 2.3. */
export const wholeNumbers = (rows: ReadonlyArray<Row | null | undefined>, series: string[]): boolean => {
  let seen = false;
  for (const row of rows) {
    for (const s of series) {
      const v = num(row?.[s]);
      if (v === null) continue;
      if (!Number.isInteger(v)) return false;
      seen = true;
    }
  }
  return seen;
};

// ---- Number formats ------------------------------------------------------------------------------------------------

export type NumberFormat = 'number' | 'currency' | 'percent' | 'compact';
export const FORMATS: readonly string[] = ['number', 'currency', 'percent', 'compact'];

/** A value's format as bound: format, currency, prefix and suffix are whatever the author set (unset, text or junk). */
export interface FormatOptions {
  format?: unknown;
  currency?: unknown;
  prefix?: unknown;
  suffix?: unknown;
}

const intl = (options: Intl.NumberFormatOptions): Intl.NumberFormat => {
  try {
    return new Intl.NumberFormat(undefined, options);
  } catch {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  }
};

/** A formatter for the format ('number' | 'currency' | 'percent' | 'compact'), with the value prefix and suffix.
 *  Short (axis ticks) abbreviates large numbers. Percent takes values already in percent (42 shows 42%). Non-numbers
 *  show as text. */
export const formatter = (
  { format, currency, prefix, suffix }: FormatOptions = {},
  short = false
): ((v: unknown) => string) => {
  const kind = typeof format === 'string' && FORMATS.includes(format) ? format : 'number';
  const code = typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim() : 'USD';
  const compact = short || kind === 'compact';
  let f: Intl.NumberFormat;
  if (kind === 'currency') {
    f = intl({
      style: 'currency',
      currency: code.toUpperCase(),
      ...(compact
        ? { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }
        : { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    });
  } else if (compact && kind !== 'percent') {
    f = intl({ notation: 'compact', maximumFractionDigits: 1 });
  } else {
    f = intl({ maximumFractionDigits: kind === 'percent' ? 1 : 2 });
  }
  const before = isText(prefix) ? String(prefix) : '';
  const after = (kind === 'percent' ? '%' : '') + (isText(suffix) ? String(suffix) : '');
  // Money with cents shows both digits ("$3,043.50", never "$3,043.5"); whole amounts and compact ticks stay as they are.
  const cents =
    kind === 'currency' && !compact
      ? intl({ style: 'currency', currency: code.toUpperCase(), minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : null;
  return (v) => {
    const n = num(v);
    if (n === null) return v === null || v === undefined ? '' : String(axisLabel(v));
    return `${before}${(cents && !Number.isInteger(n) ? cents : f).format(n)}${after}`;
  };
};

// ---- Line ----------------------------------------------------------------------------------------------------------

export type Curve = 'monotone' | 'linear' | 'step' | 'natural';
const CURVES: Record<Curve, Curve> = { monotone: 'monotone', linear: 'linear', step: 'step', natural: 'natural' };
const isCurve = (c: unknown): c is Curve => typeof c === 'string' && Object.prototype.hasOwnProperty.call(CURVES, c);
export const curveOf = (c: unknown): Curve => (isCurve(c) ? CURVES[c] : 'monotone');

// ---- Sparkline -----------------------------------------------------------------------------------------------------

/** Sparkline points from [3, 5, 4], '3,5,4' or [{ x, y }] (also { label, value }): { i, x, y } with y a number or
 *  null. The last MAX_ROWS points are kept. */
export interface SparkPoint {
  i: number;
  x: string | number;
  y: number | null;
}

export const sparkPoints = (data: unknown): SparkPoint[] => {
  const raw: unknown[] = Array.isArray(data) ? data : typeof data === 'string' ? data.split(',') : [];
  return raw.slice(-MAX_ROWS).map((d, i) => {
    if (isPlain(d)) {
      const y = num(d.y !== undefined ? d.y : d.value);
      const x = d.x !== undefined ? d.x : d.label;
      return { i, x: isSet(x) ? axisLabel(x) : i + 1, y };
    }
    return { i, x: i + 1, y: num(d) };
  });
};

const finite = (points: SparkPoint[]): Array<SparkPoint & { y: number }> =>
  points.filter((p): p is SparkPoint & { y: number } => p.y !== null);

/** 'up', 'down' or 'flat': the last value against the first. With lowerIsBetter, a fall counts as up (good). */
export type Trend = 'up' | 'down' | 'flat';

export const trendOf = (points: SparkPoint[], lowerIsBetter = false): Trend => {
  const ys = finite(points);
  if (ys.length < 2) return 'flat';
  const diff = ys[ys.length - 1].y - ys[0].y;
  if (diff === 0) return 'flat';
  return diff > 0 !== !!lowerIsBetter ? 'up' : 'down';
};

export const lastPoint = (points: SparkPoint[]): (SparkPoint & { y: number }) | null => {
  const ys = finite(points);
  return ys.length ? ys[ys.length - 1] : null;
};

export const extent = (points: SparkPoint[]): { min: number; max: number } | null => {
  const ys = finite(points).map((p) => p.y);
  return ys.length ? { min: Math.min(...ys), max: Math.max(...ys) } : null;
};

/** The band's y range: the author's bounds where set, else the data's min and max. Null when there is no data. */
export const bandRange = (
  points: SparkPoint[],
  bandMin: unknown,
  bandMax: unknown
): { y1: number; y2: number } | null => {
  const e = extent(points);
  const lo = num(bandMin) ?? e?.min;
  const hi = num(bandMax) ?? e?.max;
  if (lo === undefined || hi === undefined || lo === null || hi === null) return null;
  return lo <= hi ? { y1: lo, y2: hi } : { y1: hi, y2: lo };
};

/** The x field and series a chart plots. A field the data does not have falls back to the data's own: the first text
 *  field for x, the numeric fields for the series (a Luna build kept the catalog's default "revenue" against data with
 *  "amount", and drew an empty chart). Fields the data has are kept as they are. */
export const resolveChartFields = (
  data: unknown,
  xField: string | undefined,
  series: string[]
): { x: string | undefined; series: string[] } => {
  const rows: Row[] = (Array.isArray(data) ? data : []).filter(
    (row): row is Row => row && typeof row === 'object' && !Array.isArray(row)
  );
  if (!rows.length) return { x: xField, series };
  const keys = [...new Set(rows.slice(0, 50).flatMap((row) => Object.keys(row)))];
  const has = (key: string) => rows.some((row) => row[key] !== undefined && row[key] !== null);
  const numeric = (key: string) =>
    rows.some((row) => row[key] !== null && row[key] !== '' && Number.isFinite(Number(row[key])));
  const x =
    xField && has(xField)
      ? xField
      : keys.find((key) => !numeric(key) && rows.some((row) => typeof row[key] === 'string')) ?? xField;
  const named = series.filter((key) => has(key));
  const fallback = keys.filter((key) => key !== x && numeric(key) && typeof rows[0][key] !== 'boolean').slice(0, 6);
  return { x, series: named.length ? named : fallback.length ? fallback : series };
};

/** A series' name in the legend and tooltip: the author's label for it (seriesLabels), else its field name made
 *  readable ("food_cost_pct" reads "Food cost pct", "lastWeek" reads "Last week"; a build's legend showed raw keys). */
/** seriesLabels as written: an object ({ hours: 'Flight hours' }) or a list naming the series in order (['Flight
 *  hours'], as models often write it; the object-only property dropped it, 35 charts, 2026-10-14). */
export const seriesLabelMap = (labels: unknown, series: string[] | undefined): Record<string, unknown> => {
  const list = series || [];
  // The list can arrive as an object keyed by position ({ 0: 'Flight hours' }) once resolved; keys that are positions
  // and not series names are read as the list.
  const positional =
    labels &&
    typeof labels === 'object' &&
    !Array.isArray(labels) &&
    Object.keys(labels).length > 0 &&
    Object.keys(labels).every((k) => /^\d+$/.test(k) && !list.includes(k));
  if (Array.isArray(labels) || positional) {
    const at = labels as Record<number, unknown>;
    return Object.fromEntries(
      list.map((s, i) => [s, at[i]]).filter(([, l]) => l !== undefined && l !== null && String(l).trim() !== '')
    );
  }
  return labels && typeof labels === 'object' ? (labels as Record<string, unknown>) : {};
};

export const seriesLabel = (key: unknown, labels?: unknown): string => {
  const own = isPlain(labels) ? labels[String(key)] : undefined;
  // Text or a number only: a label bound to an object (a list of rows by mistake) read "[object Object]" in the legend.
  if ((typeof own === 'string' || typeof own === 'number') && String(own).trim() !== '') return String(own);
  const words = String(key ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  if (!words) return String(key ?? '');
  // Acronyms read in capitals: a legend said "Mrr" for mrr (subscription dashboard, 2026-10-14).
  const spoken = words.replace(ACRONYMS, (word) => word.toUpperCase());
  return spoken.charAt(0).toUpperCase() + spoken.slice(1);
};

// The status tones as chart fills (info is a fixed blue, --sc-chart-info in shadcn.scss: beside green, amber and red
// the states must stay apart whatever the brand colour, as on the map).
const STATUS_FILLS: Record<string, string> = {
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  danger: 'var(--sc-destructive)',
  info: 'var(--sc-chart-info)',
};

/** Fills for series (or slices) that are all states, Completed, In progress, Missed: their status tones, so a chart
 *  reads like the chips beside it (a stacked chart of visits drew Completed orange and Missed yellow from a warm theme,
 *  field visits, 2026-10-14). A second state of one tone takes a lighter shade. null when any label is not a state, or
 *  all share one tone: the theme's series colours then. */
export const statusColors = (labels: unknown): string[] | null => {
  if (!Array.isArray(labels) || labels.length < 2 || labels.length > MAX_SERIES) return null;
  // chipTone (plain JS) returns a tone name; String() gives it the type its inference misses.
  const tones = labels.map((label) => String(chipTone(isText(label) ? String(label) : '')));
  if (tones.some((tone) => !STATUS_FILLS[tone]) || new Set(tones).size < 2) return null;
  const seen: Record<string, number> = {};
  return tones.map((tone) => {
    seen[tone] = (seen[tone] || 0) + 1;
    const fill = STATUS_FILLS[tone];
    return seen[tone] === 1
      ? fill
      : `color-mix(in srgb, ${fill} ${Math.max(30, 100 - 35 * (seen[tone] - 1))}%, var(--sc-background))`;
  });
};

const ACRONYMS =
  /\b(mrr|arr|nps|sla|kpi|roi|aov|gmv|ctr|cpc|cpa|csat|ltv|cac|arpu|eta|qa|hr|it|api|sku|id|ytd|mtd|qtd)\b/g;

const KEYWORDS = ['first', 'last', 'max', 'min'];

/** The rows a bar chart emphasises (the others draw muted), from its highlight property: category values (one, a list,
 *  or comma-separated text), or first / last / max / min (by the row's total across the series) when no category is
 *  literally named that. null when there is nothing to emphasise, so the chart draws as usual. */
export const highlightIndexes = (
  data: unknown,
  xField: string | undefined,
  series: unknown,
  highlight: unknown
): Set<number> | null => {
  if (!Array.isArray(data) || !data.length) return null;
  const wanted = (
    Array.isArray(highlight) ? (highlight as unknown[]) : isText(highlight) ? String(highlight).split(',') : []
  )
    .filter(isText)
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!wanted.length) return null;
  const label = (row: unknown) =>
    isPlain(row) && isText(row[String(xField)]) ? String(row[String(xField)]).trim() : undefined;
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
      const totals = data.map((row) =>
        isPlain(row)
          ? (Array.isArray(series) ? series : []).reduce((sum: number, s) => sum + (num(row[s]) ?? 0), 0)
          : null
      );
      const valid = totals.filter((t): t is number => t !== null);
      if (valid.length) {
        const target = k === 'max' ? Math.max(...valid) : Math.min(...valid);
        picked.add(totals.indexOf(target));
      }
    }
  }
  return picked.size ? picked : null;
};

/** How much a percent axis multiplies its values: 100 when every value is a fraction (a 39% margin sent as 0.39, which
 *  read 0.4% on two dashboards), else 1. Other formats and all-zero series are left as they are. */
export const percentScale = (format: unknown, values: unknown): number => {
  if (format !== 'percent') return 1;
  const nums = (Array.isArray(values) ? values : []).map(num).filter((v): v is number => v !== null);
  if (!nums.length || nums.every((v) => v === 0)) return 1;
  return nums.every((v) => Math.abs(v) <= 1) ? 100 : 1;
};

/** A long money or number figure shortened for a small space: "+$190,800.00" as "+$190.8K", keeping its sign and
 *  currency. Under 10,000, percentages and anything with words are left as written. A stat's change badge broke
 *  "+$190,800.0 / 0" over two lines, and a donut's "$8,196,250.00" ran over its ring (museum loans, 2026-10-14). */
const FIGURE = /^([+\-−±]?)\s?([$€£¥₹]?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?$/;
export const compactFigure = (text: unknown): string => {
  const s = String(text ?? '').trim();
  const m = s.match(FIGURE);
  if (!m) return s;
  const n = Number(m[3].replace(/,/g, '') + (m[4] ?? ''));
  if (!Number.isFinite(n) || n < 10000) return s;
  const [unit, letter]: [number, string] = n >= 1e9 ? [1e9, 'B'] : n >= 1e6 ? [1e6, 'M'] : [1e3, 'K'];
  const v = n / unit;
  const shown = v.toFixed(v < 10 ? 2 : 1).replace(/\.?0+$/, '');
  return `${m[1]}${m[2]}${shown}${letter}`;
};

/** The centre value of a donut at a size that fits its hole: 24px when it fits, smaller down to 16px, then shortened
 *  (compactFigure) and set at the size that fits. About 0.62em a character of bold tabular figures. */
export const centreValueFit = (text: unknown, innerRadius: unknown): { text: string; fontSize: number } => {
  const s = String(text ?? '');
  const room = Math.max(40, 2 * (Number(innerRadius) || 0) - 16);
  const sizeFor = (t: string) => Math.floor(room / Math.max(1, t.length * 0.62));
  if (sizeFor(s) >= 24) return { text: s, fontSize: 24 };
  if (sizeFor(s) >= 16) return { text: s, fontSize: sizeFor(s) };
  const short = compactFigure(s);
  return { text: short, fontSize: Math.max(12, Math.min(24, sizeFor(short))) };
};

/** Whole-number ticks for a small count axis: steps of 1, 2 or 5 that end at or just past the maximum, five ticks at
 *  most. Left to itself the chart ran a count axis to 4 for a maximum of 1 and to 8 for a maximum of 5, leaving most
 *  of the plot empty (2026-10-14). Only whole, non-negative values up to 20; anything else is left to the chart ({}). */
export const wholeTicks = (
  rows: ReadonlyArray<Row | null | undefined>,
  series: string[],
  stacked = false
): { domain?: [number, number]; tickCount?: number } => {
  const list = Array.isArray(rows) ? rows : [];
  const values = list.flatMap((row) =>
    series
      .map((s) => row?.[s])
      .filter((v) => v !== null && v !== undefined && v !== '')
      .map(Number)
  );
  if (!values.length || values.some((v) => !Number.isFinite(v) || v < 0 || !Number.isInteger(v))) return {};
  const max = stacked
    ? Math.max(...list.map((row) => series.reduce((sum, s) => sum + (Number(row?.[s]) || 0), 0)))
    : Math.max(...values);
  if (max <= 0 || max > 20) return {};
  const step = [1, 2, 5].find((s) => Math.ceil(max / s) <= 5) ?? 5;
  const top = Math.ceil(max / step) * step;
  return { domain: [0, top], tickCount: top / step + 1 };
};
