import { useLayoutEffect, useState } from 'react';

export type LegendPlace = 'side' | 'bottom' | 'none';

// MUI X's legend item: a 13px mark, an 8px gap and the label in 14px type (about 7.5px a character); 16px between items
// and between the legend and the pie, 24px a row.
const ITEM = 13 + 8;
const CHAR = 7.5;
const GAP = 16;
const ROW = 24;
/** Below this the pie is a dot: the legend gives way. */
const MIN_PIE = 64;

/**
 * Where a pie's legend goes in a w by h box: at the side (MUI's own place) while the pie keeps at least the size it would
 * have with the legend under it, else under the pie, else nowhere (the pie alone). A side legend kept its full width
 * in a 108px box and left a 16px pie. An unlaid box (0 by 0, jsdom) keeps the side.
 */
export const pieLegendPlace = (w: number, h: number, labels: string[]): LegendPlace => {
  if (!(w > 0 && h > 0) || !labels.length) return 'side';
  const widths = labels.map((l) => ITEM + Math.ceil(l.length * CHAR));
  const side = Math.min(w - Math.max(...widths) - GAP, h);
  let rows = 1;
  let line = 0;
  for (const iw of widths) {
    if (line > 0 && line + GAP + iw > w) {
      rows += 1;
      line = iw;
    } else line += (line > 0 ? GAP : 0) + iw;
  }
  const bottom = Math.min(w, h - rows * ROW - 8);
  if (side >= bottom && side >= MIN_PIE) return 'side';
  if (bottom >= MIN_PIE) return 'bottom';
  return 'none';
};

/** The box's size, from a callback ref (MuiProvider mounts its children after the first render); 0 by 0 until laid out. */
export const useBoxSize = <T extends HTMLElement>() => {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  return [setEl, size] as const;
};
