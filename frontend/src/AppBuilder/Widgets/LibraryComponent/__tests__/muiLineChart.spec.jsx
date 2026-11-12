import { act, waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// What the MUI pack's Line and Area charts draw. The pack's charts and @mui/x-charts are the real ones. jsdom lays
// nothing out, so the spec sizes the chart (x-charts reads its layer container's computed width and height: 600 x 300)
// and measures text at 0.6em a character, both where x-charts measures a tick label (getBBox) and where the pack does
// (a canvas).
// - QA DVRL-89: with Show mark and Highlight clicked point on, an axis click set clickedIndex 2, but none of the 12
//   marks changed (count, stroke, fill and opacity identical).
// - QA DVRL-90: the last x label was cut: 'Week 12' drawn as 'Week…', 'December' as 'Dece…'.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const realGetComputedStyle = window.getComputedStyle;
const realGetContext = HTMLCanvasElement.prototype.getContext;
let errors;
beforeAll(() => {
  errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  window.getComputedStyle = function getComputedStyle(el, pseudo) {
    const cs = realGetComputedStyle.call(window, el, pseudo);
    if (!/MuiChartsLayerContainer-root/.test(String(el?.className ?? ''))) return cs;
    const size = { width: '600px', height: '300px' };
    return new Proxy(cs, {
      get: (target, key) => size[key] ?? (typeof target[key] === 'function' ? target[key].bind(target) : target[key]),
    });
  };
  window.SVGElement.prototype.getBBox = function getBBox() {
    const px = parseFloat(this.style?.fontSize) || 12;
    return { x: 0, y: 0, width: String(this.textContent ?? '').length * px * 0.6, height: px * 1.25 };
  };
  HTMLCanvasElement.prototype.getContext = function getContext() {
    const ctx = {
      font: '12px sans-serif',
      measureText(text) {
        const px = Number(/([\d.]+)px/.exec(ctx.font)?.[1] ?? 12);
        return { width: String(text).length * px * 0.6 };
      },
    };
    return new Proxy(ctx, { get: (target, key) => (key in target ? target[key] : () => ({ data: [] })) });
  };
});
afterAll(() => {
  errors.mockRestore();
  window.getComputedStyle = realGetComputedStyle;
  delete window.SVGElement.prototype.getBBox;
  HTMLCanvasElement.prototype.getContext = realGetContext;
});

const WEEKS = ['Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'];
const MONTHS = ['July', 'August', 'September', 'October', 'November', 'December'];
const rows = (labels) => labels.map((x, i) => ({ x, sales: 10 + i * 3, cost: 5 + i }));

const xLabels = (t) =>
  [...t.root().querySelectorAll('.MuiChartsAxis-directionX .MuiChartsAxis-tickLabel')].map((n) => n.textContent);
// The x of each x tick, where its points are drawn.
const xTicks = (t) =>
  [...t.root().querySelectorAll('.MuiChartsAxis-directionX .MuiChartsAxis-tickContainer')].map((n) =>
    Number(/translate\(([\d.]+)/.exec(n.getAttribute('transform'))[1])
  );
const marks = (t) => [...t.root().querySelectorAll('.MuiLineChart-markPlot [data-series][data-index]')];
// How a mark is painted: its fill, opacity, stroke width and inline style.
const look = (mark) => ['fill', 'opacity', 'stroke-width', 'style'].map((a) => mark.getAttribute(a)).join(' | ');

// A pointer tap on the chart at (x, y). jsdom has no PointerEvent: a MouseEvent with the pointer fields x-charts reads,
// composed as a real one is (x-charts listens on the document, outside the component's shadow root).
const tap = async (t, x, y) => {
  const svg = t.root().querySelector('svg.MuiChartsSvgLayer-root');
  const fire = (type, buttons) => {
    const init = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 0, buttons };
    const event = new MouseEvent(type, init);
    Object.defineProperties(event, {
      pointerId: { value: 1 },
      pointerType: { value: 'mouse' },
      isPrimary: { value: true },
    });
    svg.dispatchEvent(event);
  };
  await act(async () => {
    fire('pointerdown', 1);
    fire('pointerup', 0);
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
};

const mount = async (name, props) => {
  const t = await mountPack('mui', name, { dataset: rows(WEEKS), xAxis: 'x', series: ['sales', 'cost'], ...props });
  await waitFor(() => expect(xTicks(t)).toHaveLength(WEEKS.length));
  return t;
};

describe('DVRL-90: MUI Line and Area charts draw their x labels whole', () => {
  test.each([
    ['LineChart', WEEKS],
    ['AreaChart', WEEKS],
    ['LineChart', MONTHS],
  ])('%s, the last label too: %j', async (name, labels) => {
    const t = await mountPack('mui', name, { dataset: rows(labels), xAxis: 'x', series: ['sales'] });
    await waitFor(() => expect(xLabels(t)).toHaveLength(labels.length));
    expect(xLabels(t)).toEqual(labels);
  });
});

describe('DVRL-89: Highlight clicked point marks the clicked x on MUI Line and Area charts', () => {
  test.each(['LineChart', 'AreaChart'])('%s with Show mark: the clicked x stands out until cleared', async (name) => {
    const t = await mount(name, { showMark: true, highlightClicked: true });
    expect(marks(t)).toHaveLength(WEEKS.length * 2);
    expect(new Set(marks(t).map(look)).size).toBe(2); // one look a series (MUI draws each in its own colour)

    await tap(t, xTicks(t)[2], 150);
    expect(t.exposed.clickedIndex).toBe(2);
    expect(t.events).toEqual(['onAxisClick']);
    for (const series of ['sales', 'cost']) {
      const own = marks(t).filter((m) => m.dataset.series === series);
      const clicked = own.filter((m) => m.dataset.index === '2');
      const rest = own.filter((m) => m.dataset.index !== '2');
      expect(clicked).toHaveLength(1);
      expect(new Set(rest.map(look)).size).toBe(1);
      expect(look(clicked[0])).not.toBe(look(rest[0]));
    }

    await t.run('clearClickedPoint');
    expect(t.exposed.clickedIndex).toBe(-1);
    expect(new Set(marks(t).map(look)).size).toBe(2);
  });

  test('without Show mark, only the clicked x has marks', async () => {
    const t = await mount('LineChart', { showMark: false, highlightClicked: true });
    expect(marks(t)).toHaveLength(0);
    await tap(t, xTicks(t)[2], 150);
    expect(t.exposed.clickedIndex).toBe(2);
    expect(marks(t).map((m) => `${m.dataset.series} ${m.dataset.index}`)).toEqual(['sales 2', 'cost 2']);
  });
});
