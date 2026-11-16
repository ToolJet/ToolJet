import { useCallback, useMemo, useRef } from 'react';

type Row = Record<string, unknown>;

/** What G2 hands a style callback, and what an element click reports: one row, or a line's or area's rows. */
const firstRow = (d: unknown): Row | null => {
  const row = Array.isArray(d) ? d[0] : d;
  return row && typeof row === 'object' ? (row as Row) : null;
};

type Node = {
  className?: string;
  markType?: string;
  parentNode?: Node;
  ownerDocument?: { getElementsByClassName?: (name: string) => Node[] };
  __data__?: {
    points?: number[][];
    seriesIndex?: number[];
    markKey?: string;
    markState?: Map<{ key?: string; data?: Row[] }, unknown>;
  };
  getWorldTransform?: () => number[];
};
type ClickEvent = { data?: { data?: Row | Row[] }; target?: Node; canvas?: { x: number; y: number } };
type Emitter = { on?: (name: string, handler: (event: ClickEvent) => void) => void };

/**
 * The clicked row. A line or area click carries all the series' rows: take the one whose vertex is nearest the click.
 * The element's points are plot-local, in row order (an area has the top edge first, then the bottom).
 */
export const pickRow = (event: ClickEvent): Row | Row[] => {
  const d = event?.data?.data ?? {};
  if (!Array.isArray(d)) return d;
  let el = event.target;
  while (el && el.className !== 'element') el = el.parentNode;
  const pts = el?.__data__?.points;
  const m = el?.getWorldTransform?.();
  const at = event.canvas;
  if (!pts || !m || !at) return d[0] ?? {};
  // Cartesian (the first points run left to right): nearest by x alone, so a click deep in a tall area picks its column.
  const cartesian = pts.slice(0, d.length).every((p, i, a) => i === 0 || p[0] >= a[i - 1][0]);
  let best = 0;
  let min = Infinity;
  d.forEach((_, i) => {
    if (!pts[i]) return;
    const dx = pts[i][0] + m[12] - at.x;
    const dist = cartesian ? Math.abs(dx) : Math.hypot(dx, pts[i][1] + m[13] - at.y);
    if (dist < min) [min, best] = [dist, i];
  });
  return d[best];
};

const REACH = 12;

/**
 * The row of a line or area vertex near a click that missed the shape. G2 draws a hover circle on each point, half of
 * it outside the shape, so a click there is a plot click, not an element click. `elements` are the chart's elements.
 */
export const nearRow = (event: ClickEvent, elements: Node[]): Row | null => {
  const at = event?.canvas;
  for (let n = event?.target; n; n = n.parentNode) if (n.className === 'element') return null;
  if (!at) return null;
  let best: Row | null = null;
  let min = REACH;
  for (const el of elements) {
    const si = el.__data__?.seriesIndex;
    const m = el.getWorldTransform?.();
    if (!si || !m || (el.markType !== 'line' && el.markType !== 'area')) continue;
    let view = el.parentNode;
    while (view && view.className !== 'view') view = view.parentNode;
    const mark = [...(view?.__data__?.markState?.keys() ?? [])].find((k) => k.key === el.__data__?.markKey);
    el.__data__?.points?.slice(0, si.length).forEach((p, i) => {
      const dist = Math.hypot(p[0] + m[12] - at.x, p[1] + m[13] - at.y);
      const row = mark?.data?.[si[i]];
      if (row && dist < min) [min, best] = [dist, row];
    });
  }
  return best;
};

/**
 * A chart's onReady that reports each clicked element's row. G2 emits a click on a bar, slice or point as
 * 'element:click', but Ant's chart passes G2's events on (and to onEvent) under the pointer event's own type, 'click',
 * so a check for 'element:click' never matched and On element click never fired. The element event is listened for by
 * its name on the G2 chart itself (the Ant chart's `chart`). onReady runs once, when the chart is made, so the latest
 * onClick is read when a click comes.
 */
export const useElementClick = (onClick: (datum: Row) => void) => {
  const latest = useRef(onClick);
  latest.current = onClick;
  return useCallback((plot: unknown) => {
    const chart = (plot as { chart?: Emitter } | null)?.chart;
    chart?.on?.('element:click', (event) => latest.current(pickRow(event) as Row));
    chart?.on?.('plot:click', (event) => {
      const els = event.target?.ownerDocument?.getElementsByClassName?.('element');
      const row = els && nearRow(event, Array.from(els));
      if (row) latest.current(row);
    });
  }, []);
};

/** Whether a clicked datum was set (a cleared one is {}). */
export const hasClicked = (clicked: unknown): boolean => {
  if (Array.isArray(clicked)) return clicked.length > 0;
  return !!clicked && typeof clicked === 'object' && Object.keys(clicked as Row).length > 0;
};

export type MatchBy = {
  /** The fields that tell one mark from another (the x value, the series); empty ones are skipped. */
  keys: (string | undefined)[];
  /** The series field: a clicked line or area (its rows) matches by it alone. */
  series?: string;
  /** Only a clicked row (a bar, a point) matches, not a clicked line: for point marks on a line. */
  rowOnly?: boolean;
};

/** Whether a mark's datum is the clicked one. */
export const isClicked = (d: unknown, clicked: unknown, by: MatchBy): boolean => {
  const a = firstRow(d);
  const b = firstRow(clicked);
  if (!a || !b) return false;
  if (Array.isArray(clicked) && by.rowOnly) return false;
  const fields = Array.isArray(clicked) ? (by.series ? [by.series] : []) : by.keys.filter((k): k is string => !!k);
  return fields.every((k) => !(k in b) || String(a[k]) === String(b[k]));
};

export const FADED = 0.3;

type Opacity = (d: unknown) => number;

/**
 * Highlight clicked point for Ant's charts: style callbacks that keep the clicked mark at full strength and fade the
 * rest. While it is off or nothing is clicked (`active` false) every mark gets `base`, so the chart draws as without
 * it. The callbacks are always given, never left out: Ant merges a new config into the last one and keeps a key it is
 * not given, so the faded marks stayed faded after Highlight was turned off or the click cleared. They are the same
 * functions until the click changes: Ant redraws a chart whose config differs (functions by reference).
 */
export const useClickHighlight = (on: unknown, clicked: unknown) => {
  const active = on === true && hasClicked(clicked);
  return useMemo(() => {
    const made = new Map<string, Opacity>();
    return {
      active,
      /** An opacity callback: `base` for the clicked mark, `base * off` for the rest; `base` for all while inactive. */
      opacity: (by: MatchBy, base = 1, off = FADED): Opacity => {
        const id = JSON.stringify([by.keys, by.series ?? '', !!by.rowOnly, base, off]);
        let fn = made.get(id);
        if (!fn) {
          fn = active ? (d: unknown) => (isClicked(d, clicked, by) ? base : base * off) : () => base;
          made.set(id, fn);
        }
        return fn;
      },
    };
  }, [active, clicked]);
};
