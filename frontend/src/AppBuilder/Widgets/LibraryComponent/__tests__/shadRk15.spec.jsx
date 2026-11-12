import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { PieChart } from '../../../../../../packs/shadcn/src/components/PieChart';
import { ScatterChart } from '../../../../../../packs/shadcn/src/components/ScatterChart';

installBrowserStubs();

// RK-15: with Highlight clicked point on, the first click of a double click redrew the pie's slices (and the scatter's
// points) as new elements, so the browser's second click landed on another node and no double click came. The pack component, the inline SDK and
// the host renderer are the real ones; only module and CSS loading is replaced, and the chart box is given a size.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const realRect = Element.prototype.getBoundingClientRect;
const RealRO = window.ResizeObserver;
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function () {
    if (!this.classList?.contains('recharts-responsive-container')) return realRect.call(this);
    return { x: 0, y: 0, left: 0, top: 0, right: 300, bottom: 240, width: 300, height: 240, toJSON() {} };
  };
  window.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe(el) {
      this.cb([{ target: el, contentRect: { width: 300, height: 240 } }], this);
    }
    unobserve() {}
    disconnect() {}
  };
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = realRect;
  window.ResizeObserver = RealRO;
  document.body.innerHTML = '';
});

const CHARTS = { PieChart, ScatterChart };

const mountChart = async (name, marks, props) => {
  loadLibraryModule.mockResolvedValue({ [name]: CHARTS[name] });
  const events = [];
  let view;
  await act(async () => {
    view = render(
      <InlineLibraryComponent
        bundleUrl={`rk15-${name}.js`}
        cssUrl={`rk15-${name}.css`}
        cacheKey={`shad-rk15-${name}`}
        componentName={name}
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={(event) => events.push(event)}
        actions={new Map()}
        host={makeHost(name, {})}
        dataCy="rk15"
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const root = () => view.container.querySelector('[data-cy="rk15"]').shadowRoot;
  await waitFor(() => expect(root().querySelectorAll(marks).length).toBeGreaterThan(0));
  return { root, events, paths: () => [...root().querySelectorAll(marks)] };
};
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));

// jsdom does not cascade a shadow root's <style> into computed styles, so its fill-opacity rules are applied here in
// order (each later rule is the more specific one) over the mark's own fill-opacity.
const shownOpacity = (root) => {
  const css = [...root.querySelectorAll('style')].map((el) => el.textContent).join('\n');
  const rules = [...css.matchAll(/([^{}]+)\{\s*fill-opacity:\s*([\d.]+);\s*\}/g)].map((m) => [
    m[1].trim(),
    Number(m[2]),
  ]);
  return (p) =>
    rules.reduce(
      (value, [selector, v]) => (p.matches(selector) ? v : value),
      Number(p.getAttribute('fill-opacity') ?? 1)
    );
};

// jsdom redraws the marks on any click, so the browser's symptom (a new node under the second click) cannot be seen
// here; the cause can: the highlight changed the marks' drawn attributes, which made Recharts redraw them.
describe.each([
  ['PieChart', '.recharts-pie-sector path'],
  ['ScatterChart', '.recharts-scatter-symbol path'],
])('RK-15: %s with Highlight clicked point keeps its marks on a click', (name, marks) => {
  it('a click leaves the marks drawn as they were, dims the others by CSS, and a double click fires once', async () => {
    const { root, events, paths } = await mountChart(name, marks, { highlightClicked: true });
    await settle();
    const drawn = () => paths().map((p) => p.getAttribute('fill-opacity'));
    const before = drawn();
    await act(async () => fireEvent.click(paths()[0]));
    await settle();
    expect(drawn()).toEqual(before);
    const base = Number(before[0] ?? 1);
    const [hit, ...others] = paths().map(shownOpacity(root()));
    expect(hit).toBeCloseTo(base);
    others.forEach((o) => expect(o).toBeCloseTo(base * 0.35));
    await act(async () => fireEvent.click(paths()[0]));
    await act(async () => fireEvent.dblClick(paths()[0]));
    expect(events.filter((e) => e === 'onDoubleClick')).toHaveLength(1);
    expect(events.filter((e) => e === 'onClick')).toHaveLength(2);
  });
});
