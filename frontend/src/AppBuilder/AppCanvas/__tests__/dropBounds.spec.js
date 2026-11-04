/**
 * Regression: dropping a widget with the cursor just inside a container's left or top edge saved it
 * outside that container, because the drop position is read off the dragged element's corner rather
 * than the cursor.
 *
 * Assertions are on the persisted layout only, so any fix that keeps drops in bounds should pass.
 */
import { addNewWidgetToTheEditor } from '../appCanvasUtils';
import { NO_OF_GRIDS } from '../appCanvasConstants';

const PARENT_ID = 'container-slot-1';
const MAIN_CANVAS_GRID_WIDTH = 28;
const CONTAINER_GRID_WIDTH = 10;

jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({
      getCurrentPageComponents: () => ({}),
      getComponentTypeFromId: () => 'Container',
    }),
  },
}));

// The factory body runs lazily inside getState, so it can read the constants above.
jest.mock('@/_stores/gridStore', () => ({
  useGridStore: {
    getState: () => ({
      getGhostDragPosition: () => ({ e: { target: global.__ghostElement } }),
      subContainerWidths: {
        canvas: MAIN_CANVAS_GRID_WIDTH,
        [PARENT_ID]: CONTAINER_GRID_WIDTH,
      },
    }),
  },
}));

const CONTAINER_RECT = { left: 500, top: 200, width: NO_OF_GRIDS * CONTAINER_GRID_WIDTH, height: 400 };

// jsdom does no layout, so every rect the drop path reads has to be supplied explicitly.
const stubRect = (element, { left, top, width, height }) => {
  element.getBoundingClientRect = () => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
  });
};

const dropWidgetOverContainer = ({ ghostLeft, ghostTop = 250 }) => {
  document.body.innerHTML = '';

  const containerCanvas = document.createElement('div');
  containerCanvas.id = `canvas-${PARENT_ID}`;
  containerCanvas.setAttribute('component-type', 'Container');
  stubRect(containerCanvas, CONTAINER_RECT);
  containerCanvas.scrollTop = 0;
  document.body.appendChild(containerCanvas);

  const ghost = document.createElement('div');
  ghost.id = 'moveable-virtual-ghost-element';
  stubRect(ghost, { left: ghostLeft, top: ghostTop, width: 280, height: 30 });
  document.body.appendChild(ghost);
  global.__ghostElement = ghost;

  return addNewWidgetToTheEditor('Button', 'desktop', containerCanvas, PARENT_ID);
};

describe('dropping a widget into a container', () => {
  afterEach(() => {
    delete global.__ghostElement;
  });

  // Without these conditions the bug is unreachable and the tests below would pass vacuously.
  it('reproduces the conditions the bug requires', () => {
    const widget = dropWidgetOverContainer({ ghostLeft: CONTAINER_RECT.left });

    expect(widget.component.parent).toBe(PARENT_ID);
    // Width in columns must have grown, proving the container's narrower sub-grid was used — that
    // rescale is what turns a modest pixel overhang into a large negative column count.
    const mainCanvasWidthInColumns = Math.round(
      (widget.layouts.desktop.width * CONTAINER_GRID_WIDTH) / MAIN_CANVAS_GRID_WIDTH
    );
    expect(widget.layouts.desktop.width).toBeGreaterThan(mainCanvasWidthInColumns);
  });

  it('does not persist a widget to the left of the container it was dropped into', () => {
    const { left, width } = dropWidgetOverContainer({ ghostLeft: CONTAINER_RECT.left - 310 }).layouts.desktop;

    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + width).toBeLessThanOrEqual(NO_OF_GRIDS);
    expect(width).toBeGreaterThanOrEqual(1);
  });

  it('does not persist a widget above the container it was dropped into', () => {
    const { top } = dropWidgetOverContainer({
      ghostLeft: CONTAINER_RECT.left + 100,
      ghostTop: CONTAINER_RECT.top - 60,
    }).layouts.desktop;

    expect(top).toBeGreaterThanOrEqual(0);
  });

  // Already correct before the fix, which rewrote the code responsible for it.
  it('does not persist a widget past the right edge of the container it was dropped into', () => {
    const { left, width } = dropWidgetOverContainer({ ghostLeft: CONTAINER_RECT.left + 380 }).layouts.desktop;

    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + width).toBeLessThanOrEqual(NO_OF_GRIDS);
  });

  // Counterweight: keeping drops in bounds must not move widgets that were already in bounds.
  it('leaves a widget dropped in open space where its drag preview was', () => {
    const overhang = 100;
    const { left } = dropWidgetOverContainer({ ghostLeft: CONTAINER_RECT.left + overhang }).layouts.desktop;

    expect(left).toBe(overhang / CONTAINER_GRID_WIDTH);
  });
});
