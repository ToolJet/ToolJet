import React from 'react';
import { render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-15: an Ant Design Heatmap's colour legend (the word 'value' and the numbers) stayed dark grey under Text color
// and on a dark theme, while the title, the axis labels and the cell values followed them. The shade legend is a
// continuous one, which reads title and label colours, not the item label colour the chart gave it. The pack's
// Heatmap, @ant-design/plots and G2 are the real ones; the spec reads the texts G2 drew from its scene graph (jsdom
// paints nothing). jsdom works out no theme colour either, so the check is that the legend takes the chart's text
// colour, the one its cell values take, whatever that is.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');
// The G2 that @ant-design/plots draws with, from the pack's own dependencies.
const { Runtime } = require('../../../../../../packs/antd/node_modules/@antv/g2');

const renders = jest.spyOn(Runtime.prototype, 'render');
afterAll(() => renders.mockRestore());

// The texts G2 drew, by the part of the chart they are in.
const textsIn = (chart, part) => {
  const out = [];
  const walk = (node, inPart) => {
    const here = inPart || part.test(String(node.className ?? ''));
    if (here && node.nodeName === 'text' && node.style?.text !== undefined && String(node.style.text) !== '')
      out.push({ text: String(node.style.text), fill: node.style.fill });
    (node.childNodes ?? []).forEach((child) => walk(child, here));
  };
  walk(chart.getContext().canvas.getRoot(), false);
  return out;
};

describe('Ant Design Heatmap: the colour legend text', () => {
  test('[PackComponent-HEATLEGEND-001] the legend title and numbers take the chart text colour, as the cell values do', async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    loadLibraryModule.mockResolvedValue(pack);
    render(
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey="ant-heatmap-legend"
        componentName="Heatmap"
        componentProps={{ label: true }}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        actions={new Map()}
        host={makeHost('Heatmap', {})}
        dataCy="heatmap"
      />
    );
    await waitFor(() => expect(renders.mock.instances.length).toBeGreaterThan(0));
    const chart = renders.mock.instances[renders.mock.instances.length - 1];
    await waitFor(() => expect(textsIn(chart, /legend/i).length).toBeGreaterThan(1));

    const cellValue = textsIn(chart, /label/i)[0];
    const legend = textsIn(chart, /legend/i);
    expect(cellValue).toBeTruthy();
    expect(legend.map((t) => t.fill)).toEqual(legend.map(() => cellValue.fill));
    errors.mockRestore();
  });
});
