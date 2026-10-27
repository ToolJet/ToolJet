/**
 * Pasting a widget into a narrower sub-container must bound it the same way DROPPING one does.
 *
 * Reported: a widget wider than the container it lands in is shrunk to the container's full
 * width when dragged in, but keeps its oversized width when pasted in.
 *
 * Both paths rescale the stored width out of the SOURCE canvas's grid units into the TARGET
 * canvas's, because a grid unit is a fraction of its own canvas's pixel width:
 *
 *   drop   appCanvasUtils.js:110         width = round(defaultWidth * mainCanvasGrid / targetGrid)
 *   paste  copyPasteWidgetsUtils.js:398  width = round(width * oldContainerGrid / newContainerGrid)
 *
 * Into a narrower container that quotient is > 1, so the rescaled width can exceed the
 * NO_OF_GRIDS (43) a canvas HAS. Only the drop path clamped it (appCanvasUtils.js:149-152).
 * `left` needs the same treatment on the CROSS-PAGE path, which returns early before
 * `calculateComponentPosition` ever runs (copyPasteWidgetsUtils.js:448,509).
 *
 * Seam: the exported `pasteComponents` driving the REAL composed store. Assertions read the
 * components the store actually holds afterwards — never a spy. The store's own paste action
 * adds the components before it attempts persistence and swallows a failed save, so the
 * layouts are observable without faking the action.
 */
import useStore from '@/AppBuilder/_stores/store';
import { useGridStore } from '@/_stores/gridStore';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { pasteComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// An external package adapter, which the mocking rules allow. Nothing is asserted on it.
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const PAGE_ID = 'page-1';
const OTHER_PAGE_ID = 'page-2';
const CONTAINER_ID = 'c1';
const WIDGET_ID = 't1';

// A grid unit is `canvasPixelWidth / 43`, so a container half the canvas's width has a grid
// unit half the size. These are those per-unit pixel widths, not canvas widths.
const CANVAS_GRID_UNIT_PX = 20; // 43 * 20 = 860px canvas
const CONTAINER_GRID_UNIT_PX = 8; // 43 *  8 = 344px container

const SOURCE_WIDTH = 40;
/** What SOURCE_WIDTH rescales to inside the container: far more than a canvas holds. */
const RESCALED_WIDTH = Math.round((SOURCE_WIDTH * CANVAS_GRID_UNIT_PX) / CONTAINER_GRID_UNIT_PX); // 100

function seed() {
  const container = componentDefinition(CONTAINER_ID, 'container1', 'Container');
  container.layouts = { desktop: { top: 0, left: 0, width: 20, height: 300 } };

  const widget = componentDefinition(WIDGET_ID, 'text1', 'Text');
  widget.component.parent = undefined;
  widget.layouts = { desktop: { top: 0, left: 0, width: SOURCE_WIDTH, height: 40 } };

  seedApp({ [CONTAINER_ID]: container, [WIDGET_ID]: widget }, { pageId: PAGE_ID });
  useStore.getState().setCurrentLayout('desktop');
  useStore.getState().setLastCanvasClickPosition(null);

  useGridStore.setState({
    subContainerWidths: { canvas: CANVAS_GRID_UNIT_PX, [CONTAINER_ID]: CONTAINER_GRID_UNIT_PX },
  });
}

/** The clipboard payload `copyComponents` writes for one selected widget. */
function clipboardFor(componentId, { pageId = PAGE_ID, left } = {}) {
  const source = useStore.getState().getCurrentPageComponents()[componentId];
  const layouts = { desktop: { ...source.layouts.desktop, ...(left !== undefined && { left }) } };
  return {
    newComponents: [
      { component: source.component, layouts, parent: source.component?.parent, id: componentId, events: [] },
    ],
    isCut: false,
    isCloning: false,
    pageId,
  };
}

/**
 * Runs a real paste and returns the component the store gained, read back from the store.
 * The paste mints a fresh uuid, so the new entry is whichever key is new.
 */
async function pasteAndReadBack(targetParentId, clipboard) {
  const before = new Set(Object.keys(useStore.getState().getCurrentPageComponents()));
  await pasteComponents(targetParentId, clipboard);

  const after = useStore.getState().getCurrentPageComponents();
  const added = Object.keys(after).filter((id) => !before.has(id));
  expect(added).toHaveLength(1);
  return after[added[0]];
}

describe('pasting a widget into a narrower sub-container', () => {
  beforeEach(() => seed());

  // Break this catches: the reported bug — the paste path rescaling the width into the
  // container's grid units without bounding it, so the widget overflows its new parent.
  test('[CopyPaste-WIDTH-001] a widget too wide for the container is clamped to the container width', async () => {
    // Guard the fixture: without a clamp the rescale really does overflow, so a future change
    // to these numbers cannot quietly turn this into a test of nothing.
    expect(RESCALED_WIDTH).toBeGreaterThan(NO_OF_GRIDS);

    const pasted = await pasteAndReadBack(CONTAINER_ID, clipboardFor(WIDGET_ID));

    expect(pasted.component.parent).toBe(CONTAINER_ID);
    expect(pasted.layouts.desktop.width).toBe(NO_OF_GRIDS);
    expect(pasted.layouts.desktop.left).toBe(0);
  });

  // Break this catches: clamping everything to full width — a widget that still fits after
  // the rescale must keep the size the user gave it.
  test('[CopyPaste-WIDTH-002] a widget that still fits keeps its rescaled width', async () => {
    useStore.getState().getCurrentPageComponents()[WIDGET_ID].layouts.desktop.width = 8;

    const pasted = await pasteAndReadBack(CONTAINER_ID, clipboardFor(WIDGET_ID));

    expect(pasted.layouts.desktop.width).toBe(20); // 8 * 20 / 8
  });

  // Break this catches: a clamp applied to every paste rather than only the ones that
  // overflow — pasting onto the canvas it was copied from must not resize anything.
  test('[CopyPaste-WIDTH-003] pasting back onto the same canvas leaves the width alone', async () => {
    const pasted = await pasteAndReadBack(undefined, clipboardFor(WIDGET_ID));

    expect(pasted.layouts.desktop.width).toBe(SOURCE_WIDTH);
  });

  // Break this catches: bounding only the same-page path. A cross-page paste returns before
  // calculateComponentPosition runs, so a widget rescaled to the full 43 while carrying a
  // nonzero source offset would start mid-canvas and run off the right-hand edge.
  test('[CopyPaste-WIDTH-004] a cross-page paste is bounded even though it skips position calculation', async () => {
    const clipboard = clipboardFor(WIDGET_ID, { pageId: OTHER_PAGE_ID, left: 5 });

    const pasted = await pasteAndReadBack(CONTAINER_ID, clipboard);

    const { left, width } = pasted.layouts.desktop;
    expect(width).toBe(NO_OF_GRIDS);
    expect(left).toBe(0);
    expect(left + width).toBeLessThanOrEqual(NO_OF_GRIDS);
  });
});
