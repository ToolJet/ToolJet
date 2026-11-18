import { act, fireEvent, waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (RK-33, PF-173): in a Rocket 2.0 RadialChart's Categories mode the innermost ring's tooltip showed only on its outer
// half. The tooltip was found from the pointer's radius, and Recharts centres the innermost ring on the chart's inner
// radius, where that search starts, so the ring's inner half lay outside it. Each ring now shows its own tooltip when
// the pointer is over the ring itself (jsdom has no pointer geometry, so the ring's shape is hovered directly). The pack
// component, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced, and the
// chart box is given a size.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const SIZE = 300;
const realRect = Element.prototype.getBoundingClientRect;
const RealRO = window.ResizeObserver;
const realClient = {
  w: Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth'),
  h: Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight'),
};
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function () {
    return { x: 0, y: 0, left: 0, top: 0, right: SIZE, bottom: SIZE, width: SIZE, height: SIZE, toJSON() {} };
  };
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => SIZE });
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => SIZE });
  window.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe(el) {
      this.cb([{ target: el, contentRect: { width: SIZE, height: SIZE } }], this);
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

// The tooltip shown after hovering ring `index`'s track (0 is the innermost).
const tooltipOverRing = async (index) => {
  const v = await mountPack('shadcn', 'RadialChart', { mode: 'categories', animate: false });
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
  const rings = [...v.root().querySelectorAll('.recharts-radial-bar-background-sector')];
  // The track paths start at their outer radius: the smallest is the innermost ring.
  const radius = (el) => Number((el.getAttribute('d') ?? '').match(/A\s*([\d.]+)/)?.[1] ?? 0);
  const ring = [...rings].sort((a, b) => radius(a) - radius(b))[index];
  await act(async () => fireEvent.mouseEnter(ring));
  return waitFor(() => {
    const text = v.root().querySelector('.recharts-tooltip-wrapper')?.textContent ?? '';
    expect(text).not.toBe('');
    return text;
  });
};

describe('Rocket RadialChart (categories): every ring shows its tooltip over the whole ring', () => {
  test('[PackComponent-RADIAL-TIP-001] hovering the innermost ring shows its tooltip', async () => {
    // The last data row (Email, 120) is drawn innermost.
    expect(await tooltipOverRing(0)).toContain('Email');
  });

  test('[PackComponent-RADIAL-TIP-002] hovering the outermost ring shows its own tooltip', async () => {
    expect(await tooltipOverRing(3)).toContain('Direct');
  });
});
