import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Ant charts (@ant-design/plots, G2 with autoFit) mounted in a hidden Tabs pane measure 0 x 0, draw at G2's 640 x 480
// and re-fit only on a window resize. The pack re-fits a chart (plot.chart.forceFit) when its box changes size. jsdom has no
// layout and no canvas: box sizes are stubbed, ResizeObserver is driven by hand and the plots are fakes that hand their
// onReady a fake chart. The pack components and the inline SDK are the real ones.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../../../../../packs/antd/node_modules/@ant-design/plots', () => {
  const React = require('react');
  global.__fitCharts = [];
  const fake = (name) => {
    const Fake = (props) => {
      React.useEffect(() => {
        // The plot @ant-design/plots hands onReady holds the G2 chart (the one with forceFit).
        const chart = { name, chart: { forceFit: jest.fn() } };
        global.__fitCharts.push(chart);
        props.onReady?.(chart);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return React.createElement('div', { 'data-fake-plot': name });
    };
    return Fake;
  };
  const names = ['Area', 'Bar', 'Column', 'DualAxes', 'Funnel', 'Gauge', 'Heatmap', 'Line', 'Pie', 'Radar', 'Scatter'];
  const plots = Object.fromEntries(names.map((n) => [n, fake(n)]));
  return {
    __esModule: true,
    ...plots,
    RadialBar: fake('RadialBar'),
    Tiny: { Line: fake('Tiny.Line'), Area: fake('Tiny.Area'), Column: fake('Tiny.Column') },
  };
});

const SOURCE = {
  antd: require('../../../../../../packs/antd/src/index.ts'),
};
const { Frame } = require('../../../../../../packs/antd/src/components/Charts.tsx');
const { Line: FakeLine } = require('../../../../../../packs/antd/node_modules/@ant-design/plots');

const charts = () => global.__fitCharts;

// The box sizes the chart-fit hook reads (the Frame root and the Sparkline body).
const BOXES = ['tj-ant-chart', 'tj-ant-spark-body'];
const size = { w: 0, h: 0 };
const isBox = (el) => BOXES.some((c) => el.classList?.contains(c));
const protoStubs = [];
const stubLayout = (prop, pick) => {
  const real = Object.getOwnPropertyDescriptor(Element.prototype, prop);
  protoStubs.push(() => Object.defineProperty(Element.prototype, prop, real));
  Object.defineProperty(Element.prototype, prop, {
    configurable: true,
    get() {
      const hit = pick(this);
      return hit === undefined ? real.get.call(this) : hit;
    },
  });
};

// A ResizeObserver the test fires by hand.
const RealRO = window.ResizeObserver;
let observers = [];
const fire = () => act(() => observers.slice().forEach((o) => o.cb([], o)));
// requestAnimationFrame the test runs by hand.
const RealRAF = window.requestAnimationFrame;
const RealCAF = window.cancelAnimationFrame;
let frames = new Map();
let frameId = 0;
const flushFrame = () =>
  act(() => {
    const due = [...frames.values()];
    frames = new Map();
    due.forEach((cb) => cb(0));
  });

const setSize = (w, h) => {
  size.w = w;
  size.h = h;
};

beforeEach(() => {
  global.__fitCharts.length = 0;
  setSize(0, 0);
  observers = [];
  frames = new Map();
  window.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb;
      observers.push(this);
    }
    observe() {}
    unobserve() {}
    disconnect() {
      observers = observers.filter((o) => o !== this);
    }
  };
  window.requestAnimationFrame = (cb) => {
    frameId += 1;
    frames.set(frameId, cb);
    return frameId;
  };
  window.cancelAnimationFrame = (id) => frames.delete(id);
  stubLayout('clientWidth', (el) => (isBox(el) ? size.w : undefined));
  stubLayout('clientHeight', (el) => (isBox(el) ? size.h : undefined));
});
afterEach(() => {
  protoStubs.splice(0).forEach((undo) => undo());
  window.ResizeObserver = RealRO;
  window.requestAnimationFrame = RealRAF;
  window.cancelAnimationFrame = RealCAF;
});

let mounts = 0;
const mount = async (name, props = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: SOURCE.antd[name] });
  mounts += 1;
  let view;
  await act(async () => {
    view = render(
      <InlineLibraryComponent
        bundleUrl={`cf-${mounts}.js`}
        cssUrl={`cf-${mounts}.css`}
        cacheKey={`chart-fit-${name}-${mounts}`}
        componentName={name}
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        actions={new Map()}
        host={makeHost(name, {})}
        fit={false}
        dataCy="cf-widget"
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  await waitFor(() => expect(charts().length).toBeGreaterThan(0));
  return view;
};

const CHART_NAMES = [
  'Column',
  'Line',
  'Area',
  'Pie',
  'Bar',
  'DualAxes',
  'Funnel',
  'Gauge',
  'Radar',
  'Scatter',
  'Heatmap',
];

describe('Ant charts re-fit when their box changes size (chart mounted in a hidden Tabs pane)', () => {
  it('a Line mounted hidden (0 x 0) and then shown re-fits once', async () => {
    await mount('Line');
    const chart = charts()[0];
    expect(chart.chart.forceFit).not.toHaveBeenCalled();
    setSize(234, 240);
    await fire();
    await flushFrame();
    expect(chart.chart.forceFit).toHaveBeenCalledTimes(1);
  });

  it('does not re-fit when the box keeps its size', async () => {
    setSize(234, 240);
    await mount('Line');
    const chart = charts()[0];
    await fire();
    await flushFrame();
    expect(chart.chart.forceFit).not.toHaveBeenCalled();
    setSize(300, 200);
    await fire();
    await flushFrame();
    expect(chart.chart.forceFit).toHaveBeenCalledTimes(1);
    await fire();
    await flushFrame();
    expect(chart.chart.forceFit).toHaveBeenCalledTimes(1);
  });

  it.each([
    [0, 0],
    [0, 240],
    [234, 0],
  ])('does not re-fit while the box is hidden (%i x %i)', async (w, h) => {
    setSize(234, 240);
    await mount('Line');
    const chart = charts()[0];
    setSize(w, h);
    await fire();
    await flushFrame();
    expect(chart.chart.forceFit).not.toHaveBeenCalled();
  });

  it('a fire before the chart is ready is a no-op and does not throw', async () => {
    // The plot does not call onReady yet: the observer fires first.
    const Silent = () => <div />;
    const ref = React.createRef();
    render(
      <Frame title="" empty={false} loading={false} chartRef={ref}>
        <Silent />
      </Frame>
    );
    setSize(234, 240);
    await expect(fire()).resolves.not.toThrow();
    await flushFrame();
    expect(charts()).toHaveLength(0);
  });

  it('several fires in one frame re-fit once', async () => {
    await mount('Line');
    const chart = charts()[0];
    setSize(234, 240);
    await fire();
    setSize(250, 240);
    await fire();
    setSize(260, 250);
    await fire();
    await flushFrame();
    expect(chart.chart.forceFit).toHaveBeenCalledTimes(1);
  });

  it('stops observing and cancels a pending frame on unmount', async () => {
    const view = await mount('Line');
    const chart = charts()[0];
    setSize(234, 240);
    await fire();
    expect(frames.size).toBe(1);
    view.unmount();
    expect(frames.size).toBe(0);
    await flushFrame();
    expect(chart.chart.forceFit).not.toHaveBeenCalled();
  });

  it('a rejected forceFit does not throw', async () => {
    await mount('Line');
    charts()[0].chart.forceFit.mockImplementation(() => Promise.reject(new Error('render aborted')));
    setSize(234, 240);
    await fire();
    await expect(flushFrame()).resolves.not.toThrow();
  });

  it("keeps a chart's own onReady (composes with it) for a chart under Frame", async () => {
    const own = jest.fn();
    const ref = React.createRef();
    render(
      <Frame title="" empty={false} loading={false} chartRef={ref}>
        <FakeLine onReady={own} />
      </Frame>
    );
    expect(own).toHaveBeenCalledTimes(1);
    const chart = charts()[0];
    expect(own).toHaveBeenCalledWith(chart);
    // ...and Frame's own fit still runs.
    setSize(234, 240);
    await fire();
    await flushFrame();
    expect(chart.chart.forceFit).toHaveBeenCalledTimes(1);
  });

  it.each(CHART_NAMES)('%s re-fits when its box goes from 0 to a size', async (name) => {
    await mount(name);
    expect(charts()).toHaveLength(1);
    const chart = charts()[0];
    expect(chart.chart.forceFit).not.toHaveBeenCalled();
    setSize(234, 240);
    await fire();
    await flushFrame();
    expect(chart.chart.forceFit).toHaveBeenCalledTimes(1);
  });

  it('Sparkline re-fits when its box goes from 0 to a size', async () => {
    await mount('Sparkline');
    const chart = charts().find((c) => c.name.startsWith('Tiny'));
    expect(chart).toBeTruthy();
    setSize(234, 240);
    await fire();
    await flushFrame();
    expect(chart.chart.forceFit).toHaveBeenCalledTimes(1);
  });

  it('RadialChart (categories) re-fits when its box goes from 0 to a size', async () => {
    BOXES.push('tj-ant-chart-fill');
    try {
      await mount('RadialChart', { mode: 'categories', data: [{ name: 'a', value: 3 }] });
      const chart = charts().find((c) => c.name === 'RadialBar');
      expect(chart).toBeTruthy();
      setSize(234, 240);
      await fire();
      await flushFrame();
      expect(chart.chart.forceFit).toHaveBeenCalledTimes(1);
    } finally {
      BOXES.pop();
    }
  });
});
