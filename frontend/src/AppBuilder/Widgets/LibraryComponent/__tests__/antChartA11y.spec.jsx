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

jest.mock('../../../../../../packs/antd/node_modules/@ant-design/plots', () => {
  const React = require('react');
  const fake = (name) => () => React.createElement('div', { 'data-fake-plot': name });
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
});

const body = async (name, props) => {
  loadLibraryModule.mockResolvedValue(pack);
  const { container } = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-chart-a11y"
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name)}
      dataCy="ant-chart"
    />
  );
  const q = () => container.querySelector('[data-cy="ant-chart"]').shadowRoot?.querySelector('.tj-ant-chart-body');
  await waitFor(() => expect(q()).toBeTruthy());
  return q();
};

const ROWS = [{ x: 'Jan', y: 1 }];
const NAMES = {
  Column: 'Column chart',
  Line: 'Line chart',
  Area: 'Area chart',
  Pie: 'Pie chart',
  Bar: 'Bar chart',
  DualAxes: 'Dual axes chart',
  Funnel: 'Funnel chart',
  Gauge: 'Gauge',
  Radar: 'Radar chart',
  Scatter: 'Scatter chart',
  Heatmap: 'Heatmap',
};

describe('Ant charts: accessibility', () => {
  it.each(Object.entries(NAMES))('%s body is a focusable image named by its type', async (comp, name) => {
    const el = await body(comp, { data: ROWS });
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toContain(name);
    expect(el.tabIndex).toBe(0);
  });

  it('the title names the chart, and an empty chart says it has no data', async () => {
    expect((await body('Column', { data: ROWS, title: 'Sales' })).getAttribute('aria-label')).toBe('Sales');
    document.body.innerHTML = '';
    expect((await body('Column', { data: [], title: 'Sales' })).getAttribute('aria-label')).toBe('Sales, no data');
  });
});
