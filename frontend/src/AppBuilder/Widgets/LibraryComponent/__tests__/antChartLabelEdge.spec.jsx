import React from 'react';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// With Label on, an Ant Area or Line chart draws each value centred above its point, so the last point's label hangs
// half its width past the right edge and is cut off ("148,750" read "148"). jsdom cannot draw a canvas, so this checks
// what the pack hands G2: every label drawn above a point must be kept inside the chart. The pack's charts,
// @ant-design/plots and G2 are the real ones.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');
const { Runtime } = require('../../../../../../packs/antd/node_modules/@antv/g2');

// The options of every G2 chart drawn.
const drawn = [];
const realRender = Runtime.prototype.render;
const renderSpy = jest.spyOn(Runtime.prototype, 'render').mockImplementation(function render(...args) {
  drawn.push(this.options());
  return realRender.apply(this, args);
});
afterAll(() => renderSpy.mockRestore());
beforeEach(() => {
  drawn.length = 0;
});

// The value labels in a chart's options, its layers' included.
const labelsOf = (node) => [...(node?.labels ?? []), ...(node?.children ?? []).flatMap(labelsOf)];

let mounts = 0;
const mount = (name, props) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-chart-label-edge"
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`chart-${mounts}`}
    />
  );
};

describe('Ant chart value labels at the edge of the chart', () => {
  it.each(['Area', 'Line', 'DualAxes'])('%s keeps a label above a point inside the chart', async (name) => {
    mount(name, { label: true });
    await waitFor(() => expect(labelsOf(drawn[drawn.length - 1]).some((l) => l.position === 'top')).toBe(true));

    const above = labelsOf(drawn[drawn.length - 1]).filter((l) => l.position === 'top');
    above.forEach((label) => expect(label.transform.map((t) => t.type)).toContain('exceedAdjust'));
  });
});
