// shadcn/ui pack charts (experiment): the pure logic of the Line, Radar, Radial and Sparkline charts (ShadCharts.jsx).
// Every function takes whatever the author bound (null, strings, mixed arrays, objects with missing keys) and returns
// clean values: numbers or null, plain rows, text labels. Nothing here throws.

import { stringify } from '../packJson';

export const MAX_ROWS = 2000;
export const MAX_SERIES = 12;
export const MAX_RINGS = 12;

const isText = (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isSet = (v) => v !== undefined && v !== null && String(v).trim() !== '';

/** A finite number, or null: numbers, numeric strings ("1,200", " 42 "); never booleans, objects or NaN. */
export const num = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const t = v.trim().replace(/,/g, '');
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const clamp = (v, lo, hi, fallback) => {
  const n = num(v);
  if (n === null) return fallback;
  return Math.min(hi, Math.max(lo, n));
};

/** A value fit for an axis tick or a legend: text and numbers as they are, anything else as text. */
export const axisLabel = (v) => {
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
export const fieldList = (v) => {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  const out = [];
  raw.forEach((f) => {
    if (!isText(f)) return;
    const s = String(f).trim();
    if (s && !out.includes(s)) out.push(s);
  });
  return out.slice(0, MAX_SERIES);
};

/** Plain object rows with the category field as a label and every series field as a number or null (a gap). */
export const seriesRows = (data, categoryField, series) =>
  (Array.isArray(data) ? data : [])
    .filter(isPlain)
    .slice(0, MAX_ROWS)
    .map((row) => {
      const out = { ...row };
      if (isSet(categoryField)) out[categoryField] = axisLabel(row[categoryField]);
      series.forEach((s) => {
        out[s] = num(row[s]);
      });
      return out;
    });

export const hasValues = (rows, series) => rows.some((row) => series.some((s) => row[s] !== null));

// ---- Number formats ------------------------------------------------------------------------------------------------

export const FORMATS = ['number', 'currency', 'percent', 'compact'];

const intl = (options) => {
  try {
    return new Intl.NumberFormat(undefined, options);
  } catch {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  }
};

/** A formatter for the format ('number' | 'currency' | 'percent' | 'compact'), with the value prefix and suffix.
 *  Short (axis ticks) abbreviates large numbers. Percent takes values already in percent (42 shows 42%). Non-numbers
 *  show as text. */
export const formatter = ({ format, currency, prefix, suffix } = {}, short = false) => {
  const kind = FORMATS.includes(format) ? format : 'number';
  const code = typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim() : 'USD';
  const compact = short || kind === 'compact';
  let f;
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
  return (v) => {
    const n = num(v);
    if (n === null) return v === null || v === undefined ? '' : String(axisLabel(v));
    return `${before}${f.format(n)}${after}`;
  };
};

// ---- Line ----------------------------------------------------------------------------------------------------------

const CURVES = { monotone: 'monotone', linear: 'linear', step: 'step', natural: 'natural' };
export const curveOf = (c) => (typeof c === 'string' && Object.hasOwn(CURVES, c) ? CURVES[c] : 'monotone');

// ---- Sparkline -----------------------------------------------------------------------------------------------------

/** Sparkline points from [3, 5, 4], '3,5,4' or [{ x, y }] (also { label, value }): { i, x, y } with y a number or
 *  null. The last MAX_ROWS points are kept. */
export const sparkPoints = (data) => {
  const raw = Array.isArray(data) ? data : typeof data === 'string' ? data.split(',') : [];
  return raw.slice(-MAX_ROWS).map((d, i) => {
    if (isPlain(d)) {
      const y = num(d.y !== undefined ? d.y : d.value);
      const x = d.x !== undefined ? d.x : d.label;
      return { i, x: isSet(x) ? axisLabel(x) : i + 1, y };
    }
    return { i, x: i + 1, y: num(d) };
  });
};

const finite = (points) => points.filter((p) => p.y !== null);

/** 'up', 'down' or 'flat': the last value against the first. With lowerIsBetter, a fall counts as up (good). */
export const trendOf = (points, lowerIsBetter = false) => {
  const ys = finite(points);
  if (ys.length < 2) return 'flat';
  const diff = ys[ys.length - 1].y - ys[0].y;
  if (diff === 0) return 'flat';
  return diff > 0 !== !!lowerIsBetter ? 'up' : 'down';
};

export const lastPoint = (points) => {
  const ys = finite(points);
  return ys.length ? ys[ys.length - 1] : null;
};

export const extent = (points) => {
  const ys = finite(points).map((p) => p.y);
  return ys.length ? { min: Math.min(...ys), max: Math.max(...ys) } : null;
};

/** The band's y range: the author's bounds where set, else the data's min and max. Null when there is no data. */
export const bandRange = (points, bandMin, bandMax) => {
  const e = extent(points);
  const lo = num(bandMin) ?? e?.min;
  const hi = num(bandMax) ?? e?.max;
  if (lo === undefined || hi === undefined || lo === null || hi === null) return null;
  return lo <= hi ? { y1: lo, y2: hi } : { y1: hi, y2: lo };
};

// ---- Radial --------------------------------------------------------------------------------------------------------

/** Concentric bars: { name, value (>= 0), color (the row's own fill or color, else null), row }, at most MAX_RINGS. */
export const radialRows = (data, categoryField, valueField) =>
  (Array.isArray(data) ? data : [])
    .filter(isPlain)
    .slice(0, MAX_RINGS)
    .map((row, i) => {
      const own =
        isSet(row.fill) && isText(row.fill) ? row.fill : isSet(row.color) && isText(row.color) ? row.color : null;
      const name = isSet(categoryField) ? axisLabel(row[categoryField]) : '';
      return {
        name: name === '' ? `Item ${i + 1}` : String(name),
        value: Math.max(0, num(row[valueField]) ?? 0),
        color: own === null ? null : String(own),
        row,
      };
    });

/** The arc's start and end angles (Recharts: degrees, counter-clockwise from 3 o'clock). Equal or junk angles give a
 *  full circle from the top, clockwise; the sweep is capped at one turn. */
export const arcAngles = (startAngle, endAngle) => {
  const s = num(startAngle) ?? 90;
  let e = num(endAngle) ?? -270;
  if (e === s) e = s - 360;
  if (Math.abs(e - s) > 360) e = s + Math.sign(e - s) * 360;
  return { startAngle: s, endAngle: e };
};

/** Where to put an arc in a width x height box so it fills it: centre and outer radius in px, and whether the centre
 *  text should sit above the centre (a gauge whose arc has little below its centre). */
export const arcBox = (startAngle, endAngle, width, height, pad = 0.92) => {
  const w = Math.max(0, num(width) ?? 0);
  const h = Math.max(0, num(height) ?? 0);
  const { startAngle: s, endAngle: e } = arcAngles(startAngle, endAngle);
  const lo = Math.min(s, e);
  const hi = Math.max(s, e);
  const pts = [[0, 0]];
  const at = (a) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)];
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

/** The x field and series a chart plots. A field the data does not have falls back to the data's own: the first text
 *  field for x, the numeric fields for the series (a Luna build kept the catalog's default "revenue" against data with
 *  "amount", and drew an empty chart). Fields the data has are kept as they are. */
export const resolveChartFields = (data, xField, series) => {
  const rows = (Array.isArray(data) ? data : []).filter((row) => row && typeof row === 'object' && !Array.isArray(row));
  if (!rows.length) return { x: xField, series };
  const keys = [...new Set(rows.slice(0, 50).flatMap((row) => Object.keys(row)))];
  const has = (key) => rows.some((row) => row[key] !== undefined && row[key] !== null);
  const numeric = (key) =>
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
export const seriesLabel = (key, labels) => {
  const own = labels && typeof labels === 'object' && !Array.isArray(labels) ? labels[key] : undefined;
  if (own !== undefined && own !== null && String(own).trim() !== '') return String(own);
  const words = String(key ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : String(key ?? '');
};

const KEYWORDS = ['first', 'last', 'max', 'min'];

/** The rows a bar chart emphasises (the others draw muted), from its highlight property: category values (one, a list,
 *  or comma-separated text), or first / last / max / min (by the row's total across the series) when no category is
 *  literally named that. null when there is nothing to emphasise, so the chart draws as usual. */
export const highlightIndexes = (data, xField, series, highlight) => {
  if (!Array.isArray(data) || !data.length) return null;
  const wanted = (Array.isArray(highlight) ? highlight : isText(highlight) ? String(highlight).split(',') : [])
    .filter(isText)
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!wanted.length) return null;
  const label = (row) => (isPlain(row) && isText(row[xField]) ? String(row[xField]).trim() : undefined);
  const picked = new Set();
  data.forEach((row, i) => {
    if (wanted.includes(label(row))) picked.add(i);
  });
  const keyword = wanted.find((w) => KEYWORDS.includes(w.toLowerCase()) && !data.some((row) => label(row) === w));
  if (keyword) {
    const k = keyword.toLowerCase();
    if (k === 'first') picked.add(0);
    else if (k === 'last') picked.add(data.length - 1);
    else {
      const totals = data.map((row) =>
        isPlain(row) ? (Array.isArray(series) ? series : []).reduce((sum, s) => sum + (num(row[s]) ?? 0), 0) : null
      );
      const valid = totals.filter((t) => t !== null);
      if (valid.length) {
        const target = k === 'max' ? Math.max(...valid) : Math.min(...valid);
        picked.add(totals.indexOf(target));
      }
    }
  }
  return picked.size ? picked : null;
};

// ---- Combo, scatter and funnel -------------------------------------------------------------------------------------

/** The series a combo chart draws: the bar fields, then the line fields not already drawn as bars, each on the left
 *  value axis or, when listed in rightFields, the right one (a margin % line over revenue bars). */
export const comboSeries = (barFields, lineFields, rightFields) => {
  const bars = fieldList(barFields);
  const right = fieldList(rightFields);
  const lines = fieldList(lineFields).filter((f) => !bars.includes(f));
  return [
    ...bars.map((field) => ({ field, kind: 'bar', axis: right.includes(field) ? 'right' : 'left' })),
    ...lines.map((field) => ({ field, kind: 'line', axis: right.includes(field) ? 'right' : 'left' })),
  ].slice(0, MAX_SERIES);
};

const round1 = (v) => Math.round(v * 10) / 10;

/** A funnel's stages in data order: label, value (negative reads as 0, a non-number as null), width (share of the
 *  widest stage, 0 to 1), ofFirst and ofPrevious (percent of the first stage and of the stage before, null when that
 *  stage is empty) and the source row. A stage or value field the data lacks falls back to the data's own. */
export const funnelStages = (data, stageField, valueField) => {
  const rows = (Array.isArray(data) ? data : []).filter(isPlain).slice(0, MAX_ROWS);
  if (!rows.length) return [];
  const { x, series } = resolveChartFields(
    rows,
    isSet(stageField) ? String(stageField) : undefined,
    fieldList(valueField)
  );
  const field = series[0];
  const values = rows.map((row) => {
    const n = num(row[field]);
    return n === null ? null : Math.max(0, n);
  });
  const max = Math.max(0, ...values.filter((v) => v !== null));
  const first = values[0];
  return rows.map((row, i) => {
    const value = values[i];
    const prev = i > 0 ? values[i - 1] : null;
    return {
      label: axisLabel(row[x]),
      value,
      width: max > 0 && value !== null ? value / max : 0,
      ofFirst: first > 0 && value !== null ? round1((value / first) * 100) : null,
      ofPrevious: prev > 0 && value !== null ? round1((value / prev) * 100) : null,
      row,
    };
  });
};

/** A scatter's points, one group per groupField value (one group without it) in order of first appearance: x and y
 *  (rows without both numbers are left out), z from sizeField for bubbles, label from nameField, and the row. When the
 *  data has neither named axis field, its first two numeric fields are used. */
// A point is an SVG symbol with its own handlers: past this many the chart is a blot and slow to draw.
export const MAX_POINTS = 1000;

export const scatterGroups = (data, { xField, yField, sizeField, groupField, nameField } = {}) => {
  const rows = (Array.isArray(data) ? data : []).filter(isPlain).slice(0, MAX_POINTS);
  if (!rows.length) return [];
  let xKey = isSet(xField) ? String(xField) : undefined;
  let yKey = isSet(yField) ? String(yField) : undefined;
  const present = (key) => key !== undefined && rows.some((row) => num(row[key]) !== null);
  if (!present(xKey) && !present(yKey)) {
    const keys = [...new Set(rows.slice(0, 50).flatMap((row) => Object.keys(row)))].filter(present);
    [xKey, yKey] = keys;
  }
  const groups = new Map();
  rows.forEach((row) => {
    const x = num(row[xKey]);
    const y = num(row[yKey]);
    if (x === null || y === null) return;
    const name = isSet(groupField) ? axisLabel(row[groupField]) || 'Other' : '';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({
      x,
      y,
      z: isSet(sizeField) ? num(row[sizeField]) ?? 0 : null,
      label: isSet(nameField) ? axisLabel(row[nameField]) : '',
      row,
    });
  });
  return [...groups.entries()].slice(0, MAX_SERIES).map(([name, points]) => ({ name, points }));
};
