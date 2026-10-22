import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A newly added UI 2.0 Button was 36px tall: between grid rows 3 and 4, so it never lined up with the widgets beside
 * it until its height was set by hand. Its default is a whole number of 10px rows, and it draws at its box's height
 * (ShadButton.spec.jsx).
 */
import { shadButtonConfig } from '@/AppBuilder/WidgetManager/widgets/shadButton';
import { GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

test('a new Button is a whole number of grid rows tall', () => {
  expect(shadButtonConfig.defaultSize.height % GRID_HEIGHT).toBe(0);
  expect(shadButtonConfig.defaultSize.height).toBe(40);
});
