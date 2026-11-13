/**
 * Edge auto-scroll for a component dragged in from the component panel.
 *
 * The panel sits over the canvas's right edge, so a drag from it reaches the canvas inside the right
 * auto-scroll zone. Scrolling straight away slid the whole canvas (page menu included) sideways the
 * moment the drag came in. Such a drag only scrolls at an edge once the pointer has been away from it.
 */
import { renderHook, act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { useCanvasAutoScroll } from '../../useCanvasAutoScroll';

const SIDEBAR_LEFT = 1250;
const NEAR_SIDEBAR = SIDEBAR_LEFT - 10; // inside the 30px right edge zone
const MID_CANVAS = 700;
const rect = (left, right) => ({ left, right, top: 0, bottom: 1000, width: right - left, height: 1000 });

let canvas;

const mount = (className, box) => {
  const el = document.createElement('div');
  el.className = className;
  el.getBoundingClientRect = () => box;
  document.body.appendChild(el);
  return el;
};

const frames = (n = 10) => act(() => jest.advanceTimersByTime(16 * n));

beforeEach(() => {
  jest.useFakeTimers();
  act(() => useStore.setState({ isRightSidebarOpen: true, isSidebarOpen: false }));
  canvas = mount('canvas-container', rect(0, 1600));
  Object.defineProperty(canvas, 'scrollWidth', { value: 1720 });
  Object.defineProperty(canvas, 'clientWidth', { value: 1600 });
  canvas.scrollLeft = 0;
  canvas.scrollBy = ({ left = 0 }) => {
    canvas.scrollLeft = Math.min(120, Math.max(0, canvas.scrollLeft + left));
  };
  mount('editor-sidebar', rect(SIDEBAR_LEFT, 1550));
});

afterEach(() => {
  document.body.innerHTML = '';
  jest.useRealTimers();
});

describe('canvas edge auto-scroll', () => {
  it('[AutoScroll-PANEL-001] does not scroll when a panel drag first reaches the canvas at the edge', () => {
    // Break this catches: arming the edge at drag start, which scrolls the canvas 120px right as soon
    // as a component from the panel comes over it.
    const { result } = renderHook(() => useCanvasAutoScroll());

    act(() => result.current.startAutoScroll(NEAR_SIDEBAR, 400, null, 'drag', { waitForEdgeExit: true }));
    frames();

    expect(canvas.scrollLeft).toBe(0);
  });

  it('[AutoScroll-PANEL-002] scrolls at the edge once the panel drag has been away from it', () => {
    const { result } = renderHook(() => useCanvasAutoScroll());

    act(() => result.current.startAutoScroll(NEAR_SIDEBAR, 400, null, 'drag', { waitForEdgeExit: true }));
    frames(2);
    act(() => result.current.updateMousePosition(MID_CANVAS, 400));
    frames(2);
    act(() => result.current.updateMousePosition(NEAR_SIDEBAR, 400));
    frames();

    expect(canvas.scrollLeft).toBeGreaterThan(0);
  });

  it('[AutoScroll-MOVE-001] scrolls straight away when moving a widget that starts at the edge', () => {
    const { result } = renderHook(() => useCanvasAutoScroll());

    act(() => result.current.startAutoScroll(NEAR_SIDEBAR, 400, null));
    frames();

    expect(canvas.scrollLeft).toBeGreaterThan(0);
  });
});
