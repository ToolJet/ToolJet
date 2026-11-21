import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 11 (PKB-08): clicking a bar, slice or point of an Ant chart never fired On element click and left
// selectedDatum {}. G2 emits that click as 'element:click', but Ant's chart passes G2's events on (and to onEvent)
// under the pointer event's own type, 'click', so the chart's check for 'element:click' never matched. The pack's
// charts, @ant-design/plots and G2 are the real ones; the click is emitted on the chart's G2 instance as G2's event
// interaction emits it (an element event whose own type is 'click'), since jsdom cannot hit-test a canvas.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');
// The G2 that @ant-design/plots draws with, from the pack's own dependencies.
const { Runtime } = require('../../../../../../packs/antd/node_modules/@antv/g2');

// Every G2 chart made, with the events listened for on it.
const charts = new Map();
const onSpy = jest.spyOn(Runtime.prototype, 'on');
beforeEach(() => {
  charts.clear();
  onSpy.mockImplementation(function on(name, handler, once) {
    if (!charts.has(this)) charts.set(this, new Set());
    charts.get(this).add(name);
    return this._emitter.on(name, handler, once);
  });
});
afterAll(() => onSpy.mockRestore());

let mounts = 0;
const mount = async (name, props = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const events = [];
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-chart-clicks"
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`chart-${mounts}`}
    />
  );
  // The chart is made once its theme is read: wait for the G2 chart whose events the pack listens to.
  await waitFor(() => expect(charts.size).toBeGreaterThan(0));
  return { exposed, events };
};

// What G2's event interaction emits for a click on a mark: the pointer event, own type 'click', with the row.
const clickElement = (datum) =>
  act(() => {
    charts.forEach((_, chart) => chart.emit('element:click', { type: 'click', data: { data: datum } }));
  });

describe('an Ant chart element click', () => {
  it.each(['Column', 'Bar', 'Line', 'Area', 'Pie', 'DualAxes', 'Funnel', 'Radar', 'Scatter', 'Heatmap'])(
    '%s fires On element click with the clicked row in selectedDatum',
    async (name) => {
      const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { exposed, events } = await mount(name);
      clickElement({ x: 'Apr', y: 57 });
      await waitFor(() => expect(events).toContain('onElementClick'));
      expect(exposed.selectedDatum).toEqual({ x: 'Apr', y: 57 });
      errors.mockRestore();
    }
  );

  it("Radial chart's categories fire On click with the clicked ring in clickedDataPoint", async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { exposed, events } = await mount('RadialChart', { mode: 'categories' });
    clickElement({ name: 'Direct', value: 40 });
    await waitFor(() => expect(events).toContain('onClick'));
    expect(exposed.clickedDataPoint).toEqual({ name: 'Direct', value: 40 });
    errors.mockRestore();
  });
});
