// shadcn/ui pack: the pure logic of the Heatmap chart. Every function takes whatever the author bound and never throws.
import { axisLabel, isPlain, isText, MAX_ROWS, num } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';

// A heatmap past this many cells is unreadable and slow to draw.
export const MAX_HEAT_COLUMNS = 60;
export const MAX_HEAT_ROWS = 40;

/** A heatmap's grid: column labels (xs) and row labels (ys) in order of first appearance, or in xOrder / yOrder when
 *  given (missing labels added after them); value(y, x), the sum of the rows that land in a cell or null; the smallest
 *  and largest cell; and strength(v), a value's place between them from 0 to 1 (null for an empty cell). */
export interface HeatmapFields {
  xField?: unknown;
  yField?: unknown;
  valueField?: unknown;
  xOrder?: unknown;
  yOrder?: unknown;
}

export interface HeatmapGrid {
  xs: string[];
  ys: string[];
  min: number;
  max: number;
  value: (y: string, x: string) => number | null;
  strength: (v: number | null | undefined) => number | null;
}

export const heatmapGrid = (
  data: unknown,
  { xField: xf, yField: yf, valueField: vf, xOrder, yOrder }: HeatmapFields = {}
): HeatmapGrid => {
  // A field name is text: an array bound there (10k rows) became a huge string key on every row.
  const field = (f: unknown) => (isText(f) ? String(f) : undefined);
  const [xField, yField, valueField] = [field(xf), field(yf), field(vf)];
  const rows = (Array.isArray(data) ? data : []).filter(isPlain).slice(0, MAX_ROWS * 5);
  const label = (v: unknown) => (v === null || v === undefined ? '' : String(axisLabel(v)));
  // Sets keep a 10k-row bind linear; labels past the drawable grid are not collected.
  const ordered = (preset: unknown, cap: number) =>
    new Set((Array.isArray(preset) ? preset.slice(0, cap) : []).filter(isText).map((v) => String(v)));
  const xs = ordered(xOrder, MAX_HEAT_COLUMNS);
  const ys = ordered(yOrder, MAX_HEAT_ROWS);
  const cells = new Map<string, number>();
  rows.forEach((row) => {
    const x = label(row[String(xField)]);
    const y = label(row[String(yField)]);
    const v = num(row[String(valueField)]);
    if (x === '' || y === '') return;
    if (!xs.has(x) && xs.size < MAX_HEAT_COLUMNS) xs.add(x);
    if (!ys.has(y) && ys.size < MAX_HEAT_ROWS) ys.add(y);
    if (!xs.has(x) || !ys.has(y) || v === null) return;
    const key = `${y}\u0000${x}`;
    cells.set(key, (cells.get(key) ?? 0) + v);
  });
  const values = [...cells.values()];
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  return {
    xs: [...xs],
    ys: [...ys],
    min,
    max,
    value: (y, x) => {
      const v = cells.get(`${y}\u0000${x}`);
      return v === undefined ? null : v;
    },
    strength: (v) => {
      if (v === null || v === undefined) return null;
      return max > min ? (v - min) / (max - min) : 1;
    },
  };
};
