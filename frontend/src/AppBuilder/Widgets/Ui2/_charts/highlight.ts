// ToolJet UI 2.0 charts: Highlight clicked point. The clicked datum draws emphasised and the others fade until the
// Clear clicked point action empties it (chartParts' SafeFrame hands each chart the datum to highlight).

const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};
/** Whether `row` is the clicked datum: the same row, or one whose every field the clicked datum holds alike (a chart
 *  may copy its rows, and Recharts adds its own fields to a clicked slice's). */
export const sameDatum = (row: unknown, clicked: unknown): boolean => {
  if (row === clicked) return true;
  if (!row || !clicked || typeof row !== 'object' || typeof clicked !== 'object') return false;
  const fields = Object.entries(row as Record<string, unknown>);
  return fields.length > 0 && fields.every(([key, value]) => same(value, (clicked as Record<string, unknown>)[key]));
};
/** How far the other data fade while one is highlighted. */
export const DIMMED = 0.35;
/** The opacity a datum draws at: whole when nothing is highlighted or it is the highlighted one. */
export const emphasis = (row: unknown, highlighted: unknown): number =>
  highlighted == null || sameDatum(row, highlighted) ? 1 : DIMMED;

/** The clicked datum to highlight, or null while none is (it starts, and is cleared to, an empty object). */
export const highlightOf = (clicked: unknown): unknown =>
  clicked && typeof clicked === 'object' && Object.keys(clicked).length ? clicked : null;
