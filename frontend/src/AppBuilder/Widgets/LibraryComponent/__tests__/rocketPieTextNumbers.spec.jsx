import { act } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-151): a Rocket 2.0 PieChart left out a slice whose value was a number written as text ("20"), and drew nothing
// when every value was text; a database often returns numbers as text, and the Rocket LineChart and BarChart draw them.
// The pack component, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced,
// and the chart box is given a size.
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
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => SIZE });
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => SIZE });
  Element.prototype.getBoundingClientRect = function () {
    return { x: 0, y: 0, left: 0, top: 0, right: SIZE, bottom: SIZE, width: SIZE, height: SIZE, toJSON() {} };
  };
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

// The slices drawn for some data (a slice with no share draws an empty path).
const slices = async (data) => {
  const v = await mountPack('shadcn', 'PieChart', { data, categoryField: 'type', valueField: 'value' });
  // The pie always animates its slices in (Recharts' 1.5s).
  await act(() => new Promise((resolve) => setTimeout(resolve, 1700)));
  return [...v.root().querySelectorAll('.recharts-pie-sector path')].filter(
    (p) => (p.getAttribute('d') ?? '').length > 0
  ).length;
};

describe('Rocket PieChart: a value written as text is drawn as a number', () => {
  test('[PackComponent-PIE-TEXT-001] 10 and "20" draw two slices', async () => {
    expect(
      await slices([
        { type: 'C', value: 10 },
        { type: 'D', value: '20' },
      ])
    ).toBe(2);
  });

  test('[PackComponent-PIE-TEXT-002] "10" and "20" draw two slices', async () => {
    expect(
      await slices([
        { type: 'C', value: '10' },
        { type: 'D', value: '20' },
      ])
    ).toBe(2);
  });

  test('[PackComponent-PIE-TEXT-003] control: numbers 10 and 20 draw two slices', async () => {
    expect(
      await slices([
        { type: 'C', value: 10 },
        { type: 'D', value: 20 },
      ])
    ).toBe(2);
  });
});
