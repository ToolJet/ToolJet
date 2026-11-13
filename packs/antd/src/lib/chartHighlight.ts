import { useCallback, useMemo, useRef } from 'react';

type Row = Record<string, unknown>;

/** What G2 hands a style callback, and what an element click reports: one row, or a line's or area's rows. */
const firstRow = (d: unknown): Row | null => {
  const row = Array.isArray(d) ? d[0] : d;
  return row && typeof row === 'object' ? (row as Row) : null;
};

type ClickEvent = { data?: { data?: Row } };
type Emitter = { on?: (name: string, handler: (event: ClickEvent) => void) => void };

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
    chart?.on?.('element:click', (event) => latest.current(event?.data?.data ?? {}));
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
 * rest, or null while it is off or nothing is clicked (the chart then draws exactly as before). The callbacks are the
 * same functions until the click changes: Ant redraws a chart whose config differs (functions by reference), so new
 * callbacks each render would redraw it each render.
 */
export const useClickHighlight = (on: unknown, clicked: unknown) => {
  const active = on === true && hasClicked(clicked);
  return useMemo(() => {
    if (!active) return null;
    const made = new Map<string, Opacity>();
    return {
      /** An opacity callback: `base` for the clicked mark, `base * off` for the rest. */
      opacity: (by: MatchBy, base = 1, off = FADED): Opacity => {
        const id = JSON.stringify([by.keys, by.series ?? '', !!by.rowOnly, base, off]);
        let fn = made.get(id);
        if (!fn) {
          fn = (d: unknown) => (isClicked(d, clicked, by) ? base : base * off);
          made.set(id, fn);
        }
        return fn;
      },
    };
  }, [active, clicked]);
};
