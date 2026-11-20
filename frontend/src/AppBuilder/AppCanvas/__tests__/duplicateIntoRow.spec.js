/**
 * Where a duplicated child lands when its parent is a row.
 *
 * A row is a fixed-height box that hides whatever runs past it, so a copy placed below the original
 * can end up filed in the row and drawn outside it. The copy's position is computed by a function
 * shared with every other duplicate in the product, so the fold is applied only for a row parent.
 */
import { clampDuplicateTopToRow } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';

const ROW_HEIGHT = 100;

describe('Duplicating a child of a row', () => {
  test('[Listview-BUG-035] a copy that would land past the row is pulled back inside', () => {
    // Break this catches: stepping the copy down with no upper bound, so duplicating the row's own
    // default Image, top 10 and height 80, puts the copy at 90 and its bottom edge at 170.
    expect(clampDuplicateTopToRow(90, 80, ROW_HEIGHT)).toBe(20);
    expect(clampDuplicateTopToRow(300, 30, ROW_HEIGHT)).toBe(70);
  });

  test('[Listview-BUG-035] a copy that already fits is left alone', () => {
    // Guard, not a bug: the common case must keep the position the overlap search chose.
    expect(clampDuplicateTopToRow(60, 30, ROW_HEIGHT)).toBe(60);
    expect(clampDuplicateTopToRow(0, 100, ROW_HEIGHT)).toBe(0);
  });

  test('[Listview-BUG-035] a child taller than the row starts at the top', () => {
    // A copy that cannot fit at all is at least reachable from the top edge.
    expect(clampDuplicateTopToRow(40, 200, ROW_HEIGHT)).toBe(0);
  });
});
