import { useState } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import useCanvasResizing from '../../useCanvasResizing';

// The editor DOM that decides the main canvas width:
//   .canvas-container.page-container (8px padding)
//     .canvas-content (the scroller)
//       max-width wrapper (HotkeyProvider) — the app's canvas max width caps sidebar AND canvas together
//         .canvas-wrapper (flex row) → [page sidebar slot] [#real-canvas with a 1px hover-outline padding]
// Widgets are translated from #real-canvas's content edge, so the 43 columns must span its content box.
const EDITOR_CONTAINER_WIDTH = 1344;
const MAX_WIDTH_PX = 1000;
const SIDEBAR_EXPANDED = 256;
const SIDEBAR_COLLAPSED = 54;
const HOVER_OUTLINE_PADDING = 1;
const contentWidthOf = (canvasBorderBoxWidth) => canvasBorderBoxWidth - 2 * HOVER_OUTLINE_PADDING;

function mountEditorCanvasDom() {
  const container = document.createElement('div');
  container.className = 'canvas-container page-container';
  const scroller = document.createElement('div');
  scroller.className = 'canvas-content';
  const maxWidthWrapper = document.createElement('div');
  const row = document.createElement('div');
  row.className = 'canvas-wrapper';
  const sidebar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.id = 'real-canvas';
  canvas.className = 'real-canvas';
  canvas.style.padding = `${HOVER_OUTLINE_PADDING}px`;
  row.append(sidebar, canvas);
  maxWidthWrapper.append(row);
  scroller.append(maxWidthWrapper);
  container.append(scroller);
  document.body.append(container);
  return { container, scroller, row, sidebar, canvas };
}

// Every width the grid was laid out for, in order, so transient values can be asserted on too.
function renderCanvasWidth(initialProps) {
  const committed = [];
  const rendered = renderHook(
    (props) => {
      const [canvasWidth, setCanvasWidth] = useState(0);
      useCanvasResizing({ setCanvasWidth, moduleId: 'canvas', ...props });
      if (committed.at(-1) !== canvasWidth) committed.push(canvasWidth);
      return canvasWidth;
    },
    { initialProps }
  );
  return { ...rendered, committed };
}

// A ResizeObserver whose notifications the test triggers (observers are a controllable boundary).
function installControllableResizeObserver() {
  const callbacks = new Set();
  const installed = window.ResizeObserver;
  window.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      callbacks.add(this.callback);
    }
    unobserve() {}
    disconnect() {
      callbacks.delete(this.callback);
    }
  };
  return {
    notify: () => callbacks.forEach((callback) => callback([])),
    restore: () => {
      window.ResizeObserver = installed;
    },
  };
}

describe('useCanvasResizing (main canvas width that the 43-column grid is laid out over)', () => {
  let controls;
  let dom;

  // Lays the DOM out as the browser would for a px max width: the row is capped at MAX_WIDTH_PX and the
  // page sidebar takes its slot out of that, leaving the rest to the canvas.
  const layOut = ({ sidebarWidth, canvasWidth = MAX_WIDTH_PX - sidebarWidth }) => {
    controls.geometry.element(dom.container, { width: EDITOR_CONTAINER_WIDTH });
    controls.geometry.element(dom.row, { width: MAX_WIDTH_PX });
    controls.geometry.element(dom.sidebar, { width: sidebarWidth });
    controls.geometry.element(dom.canvas, { width: canvasWidth });
  };

  const props = (overrides = {}) => ({
    currentLayout: 'desktop',
    canvasMaxWidth: `${MAX_WIDTH_PX}px`,
    isRightSidebarOpen: false,
    isViewerSidebarPinned: true,
    position: 'side',
    currentMode: 'edit',
    ...overrides,
  });

  beforeEach(() => {
    controls = createAppBuilderControls();
    controls.observers.install();
    dom = mountEditorCanvasDom();
    act(() => {
      useStore.setState((state) => {
        state.globalSettings.canvasMaxWidth = MAX_WIDTH_PX;
        state.globalSettings.canvasMaxWidthType = 'px';
      });
      useStore.getState().setResolvedValueForOthers({ isPagesSidebarHidden: false }, 'canvas');
    });
  });

  afterEach(() => {
    // Unmount before the global store reset so the hook's store subscription doesn't update outside act().
    cleanup();
    jest.useRealTimers();
    dom.container.remove();
    controls.restore();
  });

  test('lays the grid over the canvas content box, not its border box', () => {
    layOut({ sidebarWidth: SIDEBAR_EXPANDED });

    const { result } = renderCanvasWidth(props({ isViewerSidebarPinned: true }));

    // 1000 (row) - 256 (sidebar) = 744 border box, minus the 1px padding on each side.
    expect(result.current).toBe(contentWidthOf(MAX_WIDTH_PX - SIDEBAR_EXPANDED));
  });

  // Reported bug: with a px canvas max width, collapsing/expanding the page sidebar left the grid sized
  // for a wider canvas than the one rendered (by the sidebar's width), so the right-most columns fell
  // past the canvas's clipped right edge — "less space on the right".
  test('stays in sync with the rendered canvas when the page sidebar is collapsed under a px max width', () => {
    layOut({ sidebarWidth: SIDEBAR_EXPANDED });
    const { result, rerender } = renderCanvasWidth(props({ isViewerSidebarPinned: true }));

    layOut({ sidebarWidth: SIDEBAR_COLLAPSED });
    rerender(props({ isViewerSidebarPinned: false }));

    expect(result.current).toBe(contentWidthOf(MAX_WIDTH_PX - SIDEBAR_COLLAPSED));
  });

  test('sizes the grid for the final sidebar width as soon as the sidebar starts animating', () => {
    layOut({ sidebarWidth: SIDEBAR_COLLAPSED });
    const { result, rerender } = renderCanvasWidth(props({ isViewerSidebarPinned: false }));

    // The sidebar animates its width over 200ms; at the first frame the DOM still shows the collapsed
    // slot, but the row width is unchanged, so the final canvas width is already known.
    rerender(props({ isViewerSidebarPinned: true }));

    expect(result.current).toBe(contentWidthOf(MAX_WIDTH_PX - SIDEBAR_EXPANDED));
  });

  describe('while the canvas is scrolled', () => {
    const SCROLLBAR_WIDTH = 6;
    let resizeObserver;

    beforeEach(() => {
      jest.useFakeTimers();
      resizeObserver = installControllableResizeObserver();
    });

    afterEach(() => resizeObserver.restore());

    const scroll = () => act(() => dom.scroller.dispatchEvent(new Event('scroll')));
    const elapse = (ms) => act(() => jest.advanceTimersByTime(ms));
    const resized = () => act(() => resizeObserver.notify());

    // The scroller shows its scrollbar only while scrolling; where scrollbars take layout space that
    // narrows the canvas for a moment. Following it re-rendered every widget on scroll start and stop.
    test('does not re-lay out the grid for the scrollbar shown during scrolling', () => {
      layOut({ sidebarWidth: SIDEBAR_EXPANDED });
      const { result, committed } = renderCanvasWidth(props());
      const settledWidth = contentWidthOf(MAX_WIDTH_PX - SIDEBAR_EXPANDED);

      scroll();
      layOut({ sidebarWidth: SIDEBAR_EXPANDED, canvasWidth: MAX_WIDTH_PX - SIDEBAR_EXPANDED - SCROLLBAR_WIDTH });
      resized();
      elapse(600);

      // The scrollbar hides again and the canvas returns to its width.
      layOut({ sidebarWidth: SIDEBAR_EXPANDED });
      resized();
      elapse(1000);

      expect(result.current).toBe(settledWidth);
      expect(committed).toEqual([0, settledWidth]);
    });

    test('still applies a real resize that happens while scrolling, once scrolling stops', () => {
      layOut({ sidebarWidth: SIDEBAR_EXPANDED });
      const { result } = renderCanvasWidth(props());

      scroll();
      layOut({ sidebarWidth: SIDEBAR_EXPANDED, canvasWidth: 700 });
      resized();
      elapse(1000);

      expect(result.current).toBe(contentWidthOf(700));
    });
  });
});
