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
      cacheKey="ant-chart-config"
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

const dualAxes = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  const view = (p) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-dual-axes-series"
      componentName="DualAxes"
      componentProps={p}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('DualAxes')}
      dataCy="ant-dual"
    />
  );
  const rendered = render(view(props));
  dualAxes.update = (next) => rendered.rerender(view({ ...props, ...next }));
  await waitFor(() => expect(global.__plotProps.some((p) => p.name === 'DualAxes')).toBe(true));
  return global.__plotProps.filter((p) => p.name === 'DualAxes').pop().props;
};

// A tooltip item as G2 shows it for a row: a function item, or { field, valueFormatter }.
const tip = (layer, row) => {
  const item = layer.tooltip.items[0];
  return typeof item === 'function' ? item(row) : { name: item.field, value: item.valueFormatter(row[item.field]) };
};

const REGIONS = [
  { x: 'Q1', k: 'North', v: 10 },
  { x: 'Q1', k: 'South', v: 6 },
];

describe('Ant Dual Axes series', () => {
  // AD-14: the axis followed Y formatter and the tooltip showed the raw value.
  it('the tooltip writes values with Y formatter', async () => {
    const props = await dualAxes({ data: [{ x: 'A', y: 0.25, y2: 0.5 }], yFormatter: 'percent' });
    const [left, right] = props.children;
    expect(tip(left, { y: 0.25 })).toEqual({ name: 'y', value: '25%' });
    expect(tip(right, { y2: 0.5 })).toEqual({ name: 'y2', value: '50%' });
  });

  // AD-13: Color field was never read, so North and South drew as one series in one colour, legend "v".
  it('Color field splits a series into one per value, side by side, named in the tooltip', async () => {
    const props = await dualAxes({ data: REGIONS, yField: 'v', colorField: 'k' });
    const [bars] = props.children;
    expect(bars.colorField).toBe('k');
    expect(bars.transform).toEqual([{ type: 'dodgeX' }]);
    expect(bars.style.fill).toBeUndefined();
    expect(props.scale.color.range.length).toBeGreaterThan(2);
    expect(tip(bars, REGIONS[1])).toEqual({ name: 'South', value: '6' });
  });

  it('without Color field each series stays one colour', async () => {
    const props = await dualAxes({ data: [{ x: 'A', y: 1, y2: 2 }] });
    const [left, right] = props.children;
    expect(left.colorField).toBeUndefined();
    expect(left.style.fill).toBeTruthy();
    expect(right.style.stroke).toBeTruthy();
    expect(props.scale.color.range).toHaveLength(2);
  });

  // Ant merges a new config into the last one, so a setting turned off kept its effect (labels after Label off, the
  // shared range after Shared axis off): each of these draws a new chart instead.
  it.each([
    ['label', true],
    ['sharedAxis', true],
    ['colorField', 'k'],
  ])('turning %s off again draws a new chart', async (name, on) => {
    await dualAxes({ data: REGIONS, yField: 'v' });
    const mounts = () => global.__plotMounts;
    const first = mounts();
    act(() => dualAxes.update({ [name]: on }));
    await waitFor(() => expect(mounts()).toBe(first + 1));
    act(() => dualAxes.update({ [name]: name === 'colorField' ? '' : false }));
    await waitFor(() => expect(mounts()).toBe(first + 2));
  });
});

// Ant merges a new config into the last one and keeps a key it is not given: a Column's faded bars stayed faded after
// Highlight clicked point was turned off. The opacity is always given, full strength while nothing is highlighted.
describe('Ant charts: Highlight clicked point', () => {
  it.each([
    ['Highlight off', { highlightClicked: false }],
    ['Highlight on, nothing clicked', { highlightClicked: true }],
  ])('%s: the bars get an explicit full opacity', async (_, props) => {
    const column = await chart('Column', props);
    expect(typeof column.style.fillOpacity).toBe('function');
    expect(column.style.fillOpacity({ x: 'Jan' })).toBe(1);
  });
});
