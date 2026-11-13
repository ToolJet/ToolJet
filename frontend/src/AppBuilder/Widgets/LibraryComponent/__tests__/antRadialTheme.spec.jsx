import React from 'react';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// jsdom has no canvas: the plots are fakes that record the props the pack gives them.
jest.mock('../../../../../../packs/antd/node_modules/@ant-design/plots', () => {
  const React = require('react');
  global.__plotProps = [];
  const fake = (name) => (props) => {
    global.__plotProps.push({ name, props });
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
const { seriesPalette, G2_PALETTE } = require('../../../../../../packs/antd/src/lib/chartTheme.ts');

afterEach(() => {
  document.body.innerHTML = '';
  global.__plotProps.length = 0;
});

const ROWS = [
  { name: 'a', value: 3 },
  { name: 'b', value: 5 },
];

const ringColours = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-radial-theme"
      componentName="RadialChart"
      componentProps={{ mode: 'categories', data: ROWS, ...props }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('RadialChart')}
      dataCy="ant-radial"
    />
  );
  await waitFor(() => expect(global.__plotProps.some((p) => p.name === 'RadialBar')).toBe(true));
  return global.__plotProps.filter((p) => p.name === 'RadialBar').pop().props.scale.color.range;
};

// Categories rings take the chart theme's palette (the app theme's brand colours), as the Pie does, not G2's stock
// blue, cyan and orange (AD-26). Without an app theme that is stock Ant's: antd's primary, then G2's palette.
describe('Ant RadialChart (categories) colours', () => {
  it('takes the chart theme palette when Colors is empty', async () => {
    const range = await ringColours({});
    expect(range).toEqual(
      seriesPalette({ brand: '#1677ff', success: '#52c41a', warning: '#faad14', error: '#ff4d4f', themed: false })
    );
    expect(range.slice(1)).toEqual(G2_PALETTE);
    expect(range).not.toContain('#1783FF');
  });

  it('keeps the Colors the user set', async () => {
    expect(await ringColours({ colors: ['#ff0000', '#00ff00'] })).toEqual(['#ff0000', '#00ff00']);
  });
});
