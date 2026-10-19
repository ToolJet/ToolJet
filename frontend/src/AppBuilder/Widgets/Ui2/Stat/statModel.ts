// ToolJet UI 2.0: the pure logic of the Stat (Stat.tsx): its inline trend line, its progress bar and its
// sizes. Every function takes whatever the author bound and never throws.
import { sparkPoints, type SparkPoint } from '@/AppBuilder/Widgets/Ui2/_charts/sparkModel';
import { formatter, isFormat, isNumericFigure } from '@/AppBuilder/Widgets/Ui2/_shared/format';
import { num } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** Value text classes by size: a small figure for dense rows of KPIs, the default, and a large hero number. */
export const STAT_SIZES: Record<string, string> = {
  sm: 'tw-text-ui2-xl',
  default: 'tw-text-2xl',
  lg: 'tw-text-4xl',
};

export const statSize = (size: string): string => STAT_SIZES[size] || STAT_SIZES.default;

/** A progress value clamped to 0 to 100, or null when unset or not a number. */
export const progressPercent = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) return null;
  const n = num(value);
  if (n === null) return null;
  return Math.min(100, Math.max(0, n));
};

/** SVG paths for a small trend line drawn across a width x height box: `line` (the stroke), `area` (the same line
 *  closed down to the bottom, for a soft fill) and `last` (the end point, for a dot). Points without a number are
 *  skipped. null when there are fewer than two numbers or the box has no size. */
export interface SparkPaths {
  line: string;
  area: string;
  last: { x: number; y: number };
  pad: number;
}

export const sparkPaths = (data: unknown, width: unknown, height: unknown): SparkPaths | null => {
  const w = Number(width);
  const h = Number(height);
  if (!(w > 0) || !(h > 0)) return null;
  const points = sparkPoints(data).filter((p): p is SparkPoint & { y: number } => p.y !== null && Number.isFinite(p.y));
  if (points.length < 2) return null;
  const pad = 2;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min;
  const step = (w - pad * 2) / (points.length - 1);
  const xy = points.map((p, i) => ({
    x: pad + i * step,
    // Equal values draw a flat line through the middle rather than along an edge.
    y: span === 0 ? h / 2 : pad + (1 - (p.y - min) / span) * (h - pad * 2),
  }));
  const line = xy.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${line} L${xy[xy.length - 1].x.toFixed(2)},${h} L${xy[0].x.toFixed(2)},${h} Z`;
  return { line, area, last: xy[xy.length - 1], pad };
};

/** The figure a Stat shows. A bare number groups its digits ('auto'); valueFormat 'number', 'currency' (in currency,
 *  default USD), 'percent' (42.5 shows 42.5%) or 'compact' formats numbers and numeric text. Other text (an already
 *  formatted "$1,250.00", "12 open") shows as written: a bound revenue figure read "947.37" with no sign before. */
export const statValue = (
  value: unknown,
  { valueFormat = 'auto', currency }: { valueFormat?: unknown; currency?: unknown } = {}
): string => {
  // A number that is not finite (Infinity, NaN from a division by zero in a binding) is not a value to show.
  if (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))) return '';
  if (!isNumericFigure(value)) return String(value);
  if (!isFormat(valueFormat)) return typeof value === 'number' ? formatter({ format: 'number' })(value) : String(value);
  // A percent below 1 is a ratio, as the pack's charts read a series of fractions (percentScale): a churn rate of 0.021
  // and a margin of 0.70 showed "0%" and "0.7%". A whole percentage (42.5) shows as written.
  const n = Number(value);
  const shown = valueFormat === 'percent' && n !== 0 && Math.abs(n) < 1 ? n * 100 : n;
  return formatter({ format: valueFormat, currency })(shown);
};

/** A change written with its context ("+8 vs semana passada") as { chip: '+8', context: 'vs semana passada' }: the chip
 *  holds the figure and the words go to the context line, which wraps. In the chip, capped at 60% of the row, the
 *  whole phrase read "+8 vs semana pa...". A bare figure or words without one stay whole. */
const LEADING_FIGURE = /^\s*([+\-−±]?\s?[$€£¥₹]?\d[\d.,]*\s?%?[kKmMbB]?)\s+(\S.*?)\s*$/;
export const splitChange = (change: unknown): { chip: string; context: string } => {
  const text = change === null || change === undefined ? '' : String(change).trim();
  const match = text.match(LEADING_FIGURE);
  return match ? { chip: match[1].replace(/\s+/g, ''), context: match[2] } : { chip: text, context: '' };
};
