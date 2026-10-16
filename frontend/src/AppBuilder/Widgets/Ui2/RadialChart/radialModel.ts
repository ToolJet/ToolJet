// shadcn/ui pack: the pure logic of the Radial chart. Every function takes whatever the author bound and never throws.
import { axisLabel, isPlain, isSet, isText, num, type Row } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';

export const MAX_RINGS = 12;

/** Concentric bars: { name, value (>= 0), color (the row's own fill or color, else null), row }, at most MAX_RINGS. */
export interface RadialRow {
  name: string;
  value: number;
  color: string | null;
  row: Row;
}

export const radialRows = (data: unknown, categoryField: unknown, valueField: unknown): RadialRow[] =>
  (Array.isArray(data) ? data : [])
    .filter(isPlain)
    .slice(0, MAX_RINGS)
    .map((row, i) => {
      const own =
        isSet(row.fill) && isText(row.fill) ? row.fill : isSet(row.color) && isText(row.color) ? row.color : null;
      const name = isSet(categoryField) ? axisLabel(row[String(categoryField)]) : '';
      return {
        name: name === '' ? `Item ${i + 1}` : String(name),
        value: Math.max(0, num(row[String(valueField)]) ?? 0),
        color: own === null ? null : String(own),
        row,
      };
    });

/** The arc's start and end angles (Recharts: degrees, counter-clockwise from 3 o'clock). Equal or junk angles give a
 *  full circle from the top, clockwise; the sweep is capped at one turn. */
export const arcAngles = (startAngle: unknown, endAngle: unknown): { startAngle: number; endAngle: number } => {
  const s = num(startAngle) ?? 90;
  let e = num(endAngle) ?? -270;
  if (e === s) e = s - 360;
  if (Math.abs(e - s) > 360) e = s + Math.sign(e - s) * 360;
  return { startAngle: s, endAngle: e };
};

/** Where to put an arc in a width x height box so it fills it: centre and outer radius in px, and whether the centre
 *  text should sit above the centre (a gauge whose arc has little below its centre). */
export const arcBox = (
  startAngle: unknown,
  endAngle: unknown,
  width: unknown,
  height: unknown,
  pad = 0.92
): { cx: number; cy: number; outerRadius: number; textAbove: boolean } => {
  const w = Math.max(0, num(width) ?? 0);
  const h = Math.max(0, num(height) ?? 0);
  const { startAngle: s, endAngle: e } = arcAngles(startAngle, endAngle);
  const lo = Math.min(s, e);
  const hi = Math.max(s, e);
  const pts: Array<[number, number]> = [[0, 0]];
  const at = (a: number): [number, number] => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)];
  pts.push(at(s), at(e));
  for (let a = Math.ceil(lo / 90) * 90; a <= hi; a += 90) pts.push(at(a));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const bw = Math.max(maxX - minX, 0.2);
  const bh = Math.max(maxY - minY, 0.2);
  const r = Math.max(0, Math.min(w / bw, h / bh) * pad);
  return {
    cx: w / 2 - (r * (minX + maxX)) / 2,
    cy: h / 2 + (r * (minY + maxY)) / 2,
    outerRadius: r,
    textAbove: minY > -0.35,
  };
};
