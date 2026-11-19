import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { ScatterChart } from '../../../../../../packs/shadcn/src/components/ScatterChart';

installBrowserStubs();

// QA (RK-35, PF-182): a Rocket 2.0 ScatterChart in a short box (149 x 60, axes hidden) cut off its biggest bubble at
// the bottom edge and the left-most one at the left. The pack component, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced, and the boxes are given QA's sizes.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const BOX = { width: 149, height: 60 };
const PLOT = { width: 145, height: 56 };
const realRect = Element.prototype.getBoundingClientRect;
const RealRO = window.ResizeObserver;
const realClient = {
  w: Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth'),
  h: Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight'),
};
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function () {
    if (!this.classList?.contains('recharts-responsive-container')) return realRect.call(this);
    return { x: 0, y: 0, left: 0, top: 0, right: PLOT.width, bottom: PLOT.height, ...PLOT, toJSON() {} };
  };
  // The widget's box, which the chart measures to decide it is compact.
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => BOX.width });
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => BOX.height });
  window.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe(el) {
      this.cb([{ target: el, contentRect: PLOT }], this);
    }
    unobserve() {}
    disconnect() {}
  };
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = realRect;
  Object.defineProperty(Element.prototype, 'clientWidth', realClient.w);
  Object.defineProperty(Element.prototype, 'clientHeight', realClient.h);
  window.ResizeObserver = RealRO;
  document.body.innerHTML = '';
});

// Each bubble as drawn: its centre (the path's translate) and radius (the circle path starts at its edge).
const bubbles = async (props = { animate: false }) => {
  loadLibraryModule.mockResolvedValue({ ScatterChart });
  let view;
  await act(async () => {
    view = render(
      <InlineLibraryComponent
        bundleUrl="scatter-short.js"
        cssUrl="scatter-short.css"
        cacheKey="rocket-scatter-short"
        componentName="ScatterChart"
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        actions={new Map()}
        host={makeHost('ScatterChart', {})}
        dataCy="scatter"
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  const root = view.container.querySelector('[data-cy="scatter"]').shadowRoot;
  await waitFor(() => expect(root.querySelectorAll('.recharts-scatter-symbol path').length).toBeGreaterThan(0));
  return [...root.querySelectorAll('.recharts-scatter-symbol path')].map((p) => {
    const [x, y] = (p.getAttribute('transform') ?? '').match(/-?[\d.]+/g).map(Number);
    const r = Math.abs(Number((p.getAttribute('d') ?? '').match(/-?[\d.]+/)[0]));
    return { x, y, r };
  });
};

describe('Rocket ScatterChart: every bubble is drawn whole in a short box', () => {
  test('[PackComponent-SCATTER-FIT-001] no bubble crosses the bottom or top edge', async () => {
    const drawn = await bubbles();
    drawn.forEach(({ y, r }) => {
      expect(y + r).toBeLessThanOrEqual(PLOT.height);
      expect(y - r).toBeGreaterThanOrEqual(0);
    });
  });

  test('[PackComponent-SCATTER-FIT-002] no bubble crosses the left or right edge', async () => {
    const drawn = await bubbles();
    drawn.forEach(({ x, r }) => {
      expect(x - r).toBeGreaterThanOrEqual(0);
      expect(x + r).toBeLessThanOrEqual(PLOT.width);
    });
  });

  test('[PackComponent-SCATTER-FIT-003] control: the sample data draws its bubbles in different sizes', async () => {
    const drawn = await bubbles();
    expect(drawn.length).toBeGreaterThan(2);
    expect(new Set(drawn.map(({ r }) => Math.round(r))).size).toBeGreaterThan(1);
  });
});
