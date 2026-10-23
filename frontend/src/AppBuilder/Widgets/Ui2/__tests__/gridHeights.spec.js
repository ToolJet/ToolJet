import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * The canvas snaps heights to its grid (GRID_HEIGHT px rows), but 36 UI 2.0 widgets were dropped at heights off it
 * (an Input at 64, a Badge at 24): the first resize jumped to the grid, and their bottoms never lined up with the
 * native widgets beside them. Every UI 2.0 widget's default height is now a whole number of grid rows, chosen to hold
 * what the widget draws at its defaults with the box's 2px padding above and below (a labelled field draws 58px, so
 * 70; a Checkbox 16px, so 20). Saved widgets keep their saved heights: the default is only read on a drop.
 */
import { GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { CONFIGS, TYPES } from './packWidgets';

test.each(TYPES)('a new %s is a whole number of grid rows tall', (type) => {
  const { height } = CONFIGS[type].defaultSize;
  expect(Number.isInteger(height / GRID_HEIGHT)).toBe(true);
});
