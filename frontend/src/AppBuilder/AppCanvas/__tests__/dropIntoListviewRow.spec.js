/**
 * Where a component lands when it is dropped into a List View row.
 *
 * The clamp lives inside Grid's drag-end callback and reads the row canvas's measured height, which
 * jsdom reports as zero — so the arithmetic is exercised directly here instead.
 */
import { wrapDropIntoListviewRow } from '@/AppBuilder/AppCanvas/Grid/gridUtils';

// The row canvas is drawn one pixel taller than the row it holds, to make room for a hover outline.
const ROW_HEIGHT = 100;
const CANVAS_HEIGHT = ROW_HEIGHT + 1;

describe('Dropping into a List View row', () => {
  test('[Listview-BUG-025] a drop on a row boundary lands at the top of a row', () => {
    // Break this catches: comparing with `>` so a drop at exactly one row height is left alone, and
    // the component is filed in the row but drawn past the bottom of it, where nothing is visible.
    expect(wrapDropIntoListviewRow(ROW_HEIGHT, CANVAS_HEIGHT)).toBe(0);
    expect(wrapDropIntoListviewRow(ROW_HEIGHT * 2, CANVAS_HEIGHT)).toBe(0);
  });

  test('[Listview-BUG-025] a drop inside a lower row keeps its offset within that row', () => {
    // Break this catches: wrapping against the canvas height instead of the row height, which drops
    // a pixel on every row down — row three lands at 99 instead of 100.
    expect(wrapDropIntoListviewRow(ROW_HEIGHT + 20, CANVAS_HEIGHT)).toBe(20);
    expect(wrapDropIntoListviewRow(ROW_HEIGHT * 2 + 20, CANVAS_HEIGHT)).toBe(20);
  });

  test('[Listview-BUG-025] a drop inside the first row is left where it is', () => {
    // Guard, not a bug: the common case must keep working.
    expect(wrapDropIntoListviewRow(0, CANVAS_HEIGHT)).toBe(0);
    expect(wrapDropIntoListviewRow(30, CANVAS_HEIGHT)).toBe(30);
  });
});
