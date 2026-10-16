import React, { Profiler } from 'react';
import { act, render, renderHook } from '@testing-library/react';

// A ResizeObserver whose entries the test delivers (observers are a controllable boundary). The hook keeps one
// observer at module scope, so the stub must be installed before the hook module loads.
let deliverEntries = () => {};
window.ResizeObserver = class {
  constructor(callback) {
    deliverEntries = (sizes) =>
      callback(sizes.map(([target, inlineSize]) => ({ target, borderBoxSize: [{ inlineSize }] })));
  }
  observe() {}
  unobserve() {}
};
const deliver = (target, inlineSize) => deliverEntries([[target, inlineSize]]);
const { useSubCanvasContentWidth } = require('@/AppBuilder/AppCanvas/Hooks/useSubCanvasContentWidth');

const FRAME_MS = 16;
const SETTLED_MS = 1000;

/** A sub-canvas: 1px hover padding and a 1px border, `borderBoxWidth` px wide (jsdom has no layout). */
function canvasElement(borderBoxWidth) {
  const element = document.createElement('div');
  element.style.boxSizing = 'border-box';
  element.style.width = `${borderBoxWidth}px`;
  element.style.padding = '1px';
  element.style.border = '1px solid';
  document.body.appendChild(element);
  return { current: element };
}

describe('useSubCanvasContentWidth (width a sub-canvas grid spans)', () => {
  // setupTests restores real timers after every test, so each test installs its own clock and lets every pending
  // flush run before it ends: the observer's scheduling state is module-level.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => act(() => jest.advanceTimersByTime(SETTLED_MS)));

  test('is the box the children are laid out in: border box minus padding and border', () => {
    const ref = canvasElement(404);

    const { result } = renderHook(() => useSubCanvasContentWidth(ref));

    expect(result.current).toBe(400);
  });

  test('follows the rendered box with fractional precision when it resizes', () => {
    const ref = canvasElement(404);
    const { result } = renderHook(() => useSubCanvasContentWidth(ref));

    act(() => {
      deliver(ref.current, 350.5);
      jest.advanceTimersByTime(FRAME_MS);
    });

    expect(result.current).toBe(346.5);
  });

  // A whole-pixel first reading (478) used to stick: the fractional one (477.53) was within the old 0.5px
  // tolerance, so the grid stayed 0.47px wider than its canvas.
  test('is exact from the first render, fractional pixels included', () => {
    const ref = canvasElement(479.53);

    const { result } = renderHook(() => useSubCanvasContentWidth(ref));

    expect(result.current).toBeCloseTo(475.53, 5);
  });

  test('ignores float noise from the observer', () => {
    const ref = canvasElement(404);
    const { result } = renderHook(() => useSubCanvasContentWidth(ref));

    act(() => {
      deliver(ref.current, 404.004);
      jest.advanceTimersByTime(FRAME_MS);
    });

    expect(result.current).toBe(400);
  });

  // A tab switched to for the first time: its canvas was hidden (0 wide) and shows. The browser reports the width
  // before painting; holding it to the next frame (or a settle timer, during the tab's slide) painted the tab's
  // components squeezed onto the estimated grid first.
  test('a hidden canvas that shows gets its width in the same observer callback, before paint', () => {
    const ref = canvasElement(0);
    const { result } = renderHook(() => useSubCanvasContentWidth(ref));
    expect(result.current).toBeUndefined();

    act(() => deliver(ref.current, 1004));

    expect(result.current).toBe(1000);
  });

  test('a canvas shows at once even in the middle of another canvas resizing', () => {
    const resizing = canvasElement(404);
    const hidden = canvasElement(0);
    const { result } = renderHook(() => [useSubCanvasContentWidth(resizing), useSubCanvasContentWidth(hidden)]);

    act(() => {
      deliver(resizing.current, 300);
      jest.advanceTimersByTime(FRAME_MS);
      deliver(resizing.current, 310);
      deliver(hidden.current, 804);
    });

    expect(result.current[1]).toBe(800);
  });

  test('is undefined when disabled, so the caller keeps its estimate', () => {
    const ref = canvasElement(404);

    const { result } = renderHook(() => useSubCanvasContentWidth(ref, false));

    expect(result.current).toBeUndefined();
  });

  // The app mounts with the legacy root, where updates from an observer callback are not batched by React.
  test('re-renders every sub-canvas that resized in one commit', () => {
    const refs = [canvasElement(404), canvasElement(404), canvasElement(404)];
    const SubCanvas = ({ canvasRef }) => {
      useSubCanvasContentWidth(canvasRef);
      return null;
    };
    let commits = 0;
    render(
      <Profiler id="sub-canvases" onRender={() => commits++}>
        {refs.map((ref, index) => (
          <SubCanvas key={index} canvasRef={ref} />
        ))}
      </Profiler>,
      { legacyRoot: true }
    );
    commits = 0;

    // Outside act(): act() batches legacy-root updates itself and would hide the difference.
    const previousActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
    global.IS_REACT_ACT_ENVIRONMENT = false;
    try {
      deliverEntries(refs.map((ref) => [ref.current, 300]));
      jest.advanceTimersByTime(FRAME_MS);
    } finally {
      global.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }

    expect(commits).toBe(1);
  });

  test('re-lays out once a continuous resize settles, not on every frame', () => {
    const ref = canvasElement(404);
    const { result } = renderHook(() => useSubCanvasContentWidth(ref));

    act(() => {
      deliver(ref.current, 390);
      jest.advanceTimersByTime(FRAME_MS);
    });
    expect(result.current).toBe(386);

    for (let width = 380; width >= 300; width -= 10) {
      act(() => {
        deliver(ref.current, width);
        jest.advanceTimersByTime(FRAME_MS);
      });
    }
    expect(result.current).toBe(386);

    act(() => jest.advanceTimersByTime(SETTLED_MS));
    expect(result.current).toBe(296);
  });

  test('keeps measuring a canvas while another subscriber on it unmounts', () => {
    const ref = canvasElement(404);
    const first = renderHook(() => useSubCanvasContentWidth(ref));
    const second = renderHook(() => useSubCanvasContentWidth(ref));

    first.unmount();
    act(() => {
      deliver(ref.current, 350);
      jest.advanceTimersByTime(FRAME_MS);
    });

    expect(second.result.current).toBe(346);
  });
});
