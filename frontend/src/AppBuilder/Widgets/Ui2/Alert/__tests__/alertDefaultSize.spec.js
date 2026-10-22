import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A new Alert was 72px tall while its content (the title alone) draws 56px with Dynamic height: in the editor the card
 * filled the box with a band of white under the title, and the viewer drew it shorter. Its default box is the content's
 * height rounded up to whole grid rows (measured in a browser: 56px drawn, 60px box).
 */
import { shadAlertConfig } from '@/AppBuilder/WidgetManager/widgets/shadAlert';
import { GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

const CONTENT_HEIGHT = 56; // padding 12 + border 1 each side, a 22px title line, RenderWidget's 2px padding each side

test("a new Alert's box is its content's height in whole grid rows", () => {
  const { height } = shadAlertConfig.defaultSize;
  expect(height % GRID_HEIGHT).toBe(0);
  expect(height).toBeGreaterThanOrEqual(CONTENT_HEIGHT);
  expect(height - CONTENT_HEIGHT).toBeLessThan(GRID_HEIGHT);
});
