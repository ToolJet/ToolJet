// The Sparkline's points, and the trend and band it draws from them (Stat's sparkline reads the same points).
import { MAX_ROWS, axisLabel, isPlain, isSet, num } from './chartsModel';

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
