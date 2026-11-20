import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// jsdom has no canvas: the plots are fakes that record the config the pack gives them.
jest.mock('../../../../../../packs/antd/node_modules/@ant-design/plots', () => {
  const React = require('react');
  global.__plotProps = [];
  global.__plotMounts = 0;
  const fake = (name) => (props) => {
    global.__plotProps.push({ name, props });
    React.useEffect(() => {
      global.__plotMounts += 1;
    }, []);
    return React.createElement('div', { 'data-fake-plot': name });
  };
  const names = ['Area', 'Bar', 'Column', 'DualAxes', 'Funnel', 'Gauge', 'Heatmap', 'Line', 'Pie', 'Radar', 'Scatter'];
  return {
    __esModule: true,
    ...Object.fromEntries(names.map((n) => [n, fake(n)])),
    RadialBar: fake('RadialBar'),
    Tiny: { Line: fake('Tiny.Line'), Area: fake('Tiny.Area'), Column: fake('Tiny.Column') },
  };
});

const pack = require('../../../../../../packs/antd/src/index.ts');

afterEach(() => {
  document.body.innerHTML = '';
  global.__plotProps.length = 0;
});

const chart = async (componentName, props) => {
  loadLibraryModule.mockResolvedValue(pack);
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-chart-stale"
      componentName={componentName}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(componentName)}
      dataCy="ant-chart"
    />
  );
  await waitFor(() => expect(global.__plotProps.some((p) => p.name === componentName)).toBe(true));
  return global.__plotProps.filter((p) => p.name === componentName).pop().props;
};

const view = (name, p) => (
  <InlineLibraryComponent
    bundleUrl="pack.js"
    cssUrl="pack.css"
    cacheKey="ant-chart-stale"
    componentName={name}
    componentProps={p}
    componentStyles={{}}
    renderSlot={() => null}
    setExposedVariable={() => {}}
    fireEvent={() => {}}
    actions={new Map()}
    host={makeHost(name)}
    dataCy="ant-chart"
  />
);
const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue(pack);
  const r = render(view(name, props));
  await waitFor(() => expect(global.__plotProps.some((p) => p.name === name)).toBe(true));
  const last = () => global.__plotProps.filter((p) => p.name === name).pop().props;
  return { r, last, update: (next) => r.rerender(view(name, { ...props, ...next })) };
};

const ROWS = [
  { x: 'Jan', y: 1, k: 'a', z: 3 },
  { x: 'Feb', y: 2, k: 'b', z: 4 },
];

// Ant merges a new config into the last one: a key left undefined keeps its old effect.
describe('Ant charts: settings turned off', () => {
  it.each([
    ['Line', 'line'],
    ['Area', 'area'],
  ])('%s: Smooth off gives an explicit shape', async (name, shape) => {
    const c = await mount(name, { data: ROWS, smooth: true });
    expect(c.last().shapeField).toBe('smooth');
    act(() => c.update({ smooth: false }));
    await waitFor(() => expect(c.last().shapeField).toBe(shape));
    if (name === 'Area') expect(c.last().line.shapeField).toBe('line');
  });

  it.each(['Column', 'Line', 'Area', 'Bar', 'Radar'])('%s: clearing Color field draws a new chart', async (name) => {
    const c = await mount(name, { data: ROWS });
    const first = global.__plotMounts;
    act(() => c.update({ colorField: 'k' }));
    await waitFor(() => expect(global.__plotMounts).toBe(first + 1));
    act(() => c.update({ colorField: '' }));
    await waitFor(() => expect(global.__plotMounts).toBe(first + 2));
  });

  it.each([
    ['colorField', 'k'],
    ['sizeField', 'z'],
  ])('Scatter: clearing %s draws a new chart', async (name, v) => {
    const c = await mount('Scatter', { data: ROWS, xField: 'y', yField: 'z' });
    const first = global.__plotMounts;
    act(() => c.update({ [name]: v }));
    await waitFor(() => expect(global.__plotMounts).toBe(first + 1));
    act(() => c.update({ [name]: '' }));
    await waitFor(() => expect(global.__plotMounts).toBe(first + 2));
  });
});
