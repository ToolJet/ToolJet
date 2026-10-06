/**
 * Pasting a widget into a narrower sub-container must clamp its width the same way
 * DROPPING one does.
 *
 * Reported: a widget wider than the container it lands in is shrunk to the container's
 * full width when dragged in, but keeps its oversized width when pasted in.
 *
 * Both paths rescale the stored width out of the SOURCE canvas's grid units and into the
 * TARGET canvas's, because a grid unit is a fraction of its own canvas's pixel width:
 *
 *   drop   appCanvasUtils.js:110   width = round(defaultWidth * mainCanvasGrid / targetGrid)
 *   paste  copyPasteWidgetsUtils.js:398  width = round(width * oldContainerGrid / newContainerGrid)
 *
 * Into a narrower container that quotient is > 1, so the rescaled width can exceed the
 * NO_OF_GRIDS (43) that a canvas HAS. Only the drop path clamps it back
 * (appCanvasUtils.js:149-152); the paste path clamps `left` alone
 * (copyPasteWidgetsUtils.js:148-152) and lets the width overflow the container.
 *
 * Seam: the exported `pasteComponents`, asserted on the layouts it hands to the store's
 * `pasteComponents` action — that payload is what gets persisted and rendered.
 */
import useStore from '@/AppBuilder/_stores/store';
import { useGridStore } from '@/_stores/gridStore';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { pasteComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const PAGE_ID = 'page-1';
const CONTAINER_ID = 'c1';
const WIDGET_ID = 't1';

// A grid unit is `canvasPixelWidth / 43`, so a container half the canvas's width has a
// grid unit half the size. These are those per-unit pixel widths, not canvas widths.
const CANVAS_GRID_UNIT_PX = 20; // 43 * 20 = 860px canvas
const CONTAINER_GRID_UNIT_PX = 8; // 43 *  8 = 344px container

/** Width in canvas grid units that rescales to far more than a canvas holds. */
const SOURCE_WIDTH = 40;
const RESCALED_WIDTH = Math.round((SOURCE_WIDTH * CANVAS_GRID_UNIT_PX) / CONTAINER_GRID_UNIT_PX); // 100

function seed() {
  const container = componentDefinition(CONTAINER_ID, 'container1', 'Container');
  container.layouts = { desktop: { top: 0, left: 0, width: 20, height: 300 } };

  const widget = componentDefinition(WIDGET_ID, 'text1', 'Text');
  widget.component.parent = undefined;
  widget.layouts = { desktop: { top: 0, left: 0, width: SOURCE_WIDTH, height: 40 } };

  seedApp({ [CONTAINER_ID]: container, [WIDGET_ID]: widget }, { pageId: PAGE_ID });
  useStore.getState().setCurrentLayout('desktop');

  useGridStore.setState({
    subContainerWidths: { canvas: CANVAS_GRID_UNIT_PX, [CONTAINER_ID]: CONTAINER_GRID_UNIT_PX },
  });
}

/** The clipboard payload `copyComponents` writes for a single selected widget. */
function clipboardFor(componentId) {
  const components = useStore.getState().getCurrentPageComponents();
  return {
    newComponents: [
      {
        component: components[componentId].component,
        layouts: components[componentId].layouts,
        parent: components[componentId].component?.parent,
        id: componentId,
        events: [],
      },
    ],
    isCut: false,
    isCloning: false,
    pageId: PAGE_ID,
  };
}

/** Runs a real paste and returns the layouts handed to the store. */
async function pasteInto(targetParentId, clipboard) {
  const captured = jest.fn().mockResolvedValue(true);
  useStore.setState({ pasteComponents: captured });

  await pasteComponents(targetParentId, clipboard);

  expect(captured).toHaveBeenCalledTimes(1);
  return captured.mock.calls[0][0];
}

describe('pasting a widget into a narrower sub-container', () => {
  beforeEach(() => {
    seed();
    useStore.getState().setLastCanvasClickPosition(null);
  });

  // Break this catches: the reported bug — the paste path rescaling the width into the
  // container's grid units without clamping it, so the widget overflows its new parent.
  test('[CopyPaste-WIDTH-001] a widget too wide for the container is clamped to the container width', async () => {
    const pasted = await pasteInto(CONTAINER_ID, clipboardFor(WIDGET_ID));

    expect(pasted).toHaveLength(1);
    const { width, left } = pasted[0].layouts.desktop;

    // Guard the fixture: without a clamp the rescale really does overflow, so a future
    // change to these numbers cannot quietly turn this into a test of nothing.
    expect(RESCALED_WIDTH).toBeGreaterThan(NO_OF_GRIDS);

    expect(width).toBe(NO_OF_GRIDS);
    expect(left).toBe(0);
  });

  // Break this catches: clamping everything to full width — a widget that still fits
  // after the rescale must keep the size the user gave it.
  test('[CopyPaste-WIDTH-002] a widget that still fits keeps its rescaled width', async () => {
    const components = useStore.getState().getCurrentPageComponents();
    components[WIDGET_ID].layouts.desktop.width = 8; // rescales to 20, still under 43

    const pasted = await pasteInto(CONTAINER_ID, clipboardFor(WIDGET_ID));

    expect(pasted[0].layouts.desktop.width).toBe(20);
  });

  // Break this catches: a clamp applied to every paste rather than only the ones that
  // overflow — pasting onto the canvas it was copied from must not resize anything.
  test('[CopyPaste-WIDTH-003] pasting back onto the same canvas leaves the width alone', async () => {
    const pasted = await pasteInto(undefined, clipboardFor(WIDGET_ID));

    expect(pasted[0].layouts.desktop.width).toBe(SOURCE_WIDTH);
  });
});
