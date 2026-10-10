// shadcn/ui pack: the pure logic of the Stat (Shadcn.jsx ShadStat): its inline trend line, its progress bar and its
// sizes. Every function takes whatever the author bound and never throws.
import { num, sparkPoints } from './chartsModel';

/** Value text classes by size: a small figure for dense rows of KPIs, the default, and a large hero number. */
export const STAT_SIZES = {
  sm: 'text-xl',
  default: 'text-2xl',
  lg: 'text-4xl',
};

export const statSize = (size) => STAT_SIZES[size] || STAT_SIZES.default;

/** A progress value clamped to 0 to 100, or null when unset or not a number. */
export const progressPercent = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = num(value);
  if (n === null) return null;
  return Math.min(100, Math.max(0, n));
};

/** SVG paths for a small trend line drawn across a width x height box: `line` (the stroke), `area` (the same line
 *  closed down to the bottom, for a soft fill) and `last` (the end point, for a dot). Points without a number are
 *  skipped. null when there are fewer than two numbers or the box has no size. */
export const sparkPaths = (data, width, height) => {
  const w = Number(width);
  const h = Number(height);
  if (!(w > 0) || !(h > 0)) return null;
  const points = sparkPoints(data).filter((p) => p.y !== null && Number.isFinite(p.y));
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
