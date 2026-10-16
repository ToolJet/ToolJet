// ToolJet UI 2.0: the pure logic of the Scatter chart. Every function takes whatever the author bound and never throws.
import { axisLabel, isPlain, isSet, MAX_SERIES, num, type Row } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';

/** A scatter's points, one group per groupField value (one group without it) in order of first appearance: x and y
 *  (rows without both numbers are left out), z from sizeField for bubbles, label from nameField, and the row. When the
 *  data has neither named axis field, its first two numeric fields are used. */
// A point is an SVG symbol with its own handlers: past this many the chart is a blot and slow to draw.
export const MAX_POINTS = 1000;

export interface ScatterFields {
  xField?: unknown;
  yField?: unknown;
  sizeField?: unknown;
  groupField?: unknown;
  nameField?: unknown;
}

export interface ScatterPoint {
  x: number;
  y: number;
  z: number | null;
  label: string | number;
  row: Row;
}

export interface ScatterGroup {
  name: string | number;
  points: ScatterPoint[];
}

export const scatterGroups = (
  data: unknown,
  { xField, yField, sizeField, groupField, nameField }: ScatterFields = {}
): ScatterGroup[] => {
  const rows = (Array.isArray(data) ? data : []).filter(isPlain).slice(0, MAX_POINTS);
  if (!rows.length) return [];
  let xKey = isSet(xField) ? String(xField) : undefined;
  let yKey = isSet(yField) ? String(yField) : undefined;
  const present = (key: string | undefined) => key !== undefined && rows.some((row) => num(row[key]) !== null);
  if (!present(xKey) && !present(yKey)) {
    const keys = [...new Set(rows.slice(0, 50).flatMap((row) => Object.keys(row)))].filter(present);
    [xKey, yKey] = keys;
  }
  const groups = new Map<string | number, ScatterPoint[]>();
  rows.forEach((row) => {
    const x = num(row[String(xKey)]);
    const y = num(row[String(yKey)]);
    if (x === null || y === null) return;
    const name = isSet(groupField) ? axisLabel(row[String(groupField)]) || 'Other' : '';
    const points = groups.get(name) ?? [];
    groups.set(name, points);
    points.push({
      x,
      y,
      z: isSet(sizeField) ? num(row[String(sizeField)]) ?? 0 : null,
      label: isSet(nameField) ? axisLabel(row[String(nameField)]) : '',
      row,
    });
  });
  return [...groups.entries()].slice(0, MAX_SERIES).map(([name, points]) => ({ name, points }));
};
