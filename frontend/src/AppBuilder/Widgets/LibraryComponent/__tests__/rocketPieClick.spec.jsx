import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 43: a click on a Rocket PieChart slice exposed recharts' drawn sector as clickedDataPoint (payload, stroke,
// fill, cx, cy, ...), where every other Rocket chart exposes the clicked data row. The pack's PieChart and recharts are
// the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/shadcn/src/index.ts');

// jsdom lays nothing out: give every box a size, so recharts draws the slices.
const box = { width: 400, height: 300, top: 0, left: 0, right: 400, bottom: 300, x: 0, y: 0 };
beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ ...box }));
});
afterEach(() => jest.restoreAllMocks());

let mounts = 0;
const mount = async (props) => {
  mounts += 1;
  loadLibraryModule.mockResolvedValue(pack);
  const exposed = {};
  const events = [];
  const view = render(
    <InlineLibraryComponent
      bundleUrl="shadcn.js"
      cssUrl="shadcn.css"
      cacheKey="rocket-pie-click"
      componentName="PieChart"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={new Map()}
      host={makeHost('PieChart', {})}
      dataCy={`rocket-pie-${mounts}`}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="rocket-pie-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(root()?.querySelectorAll('.recharts-pie-sector').length).toBeGreaterThan(0));
  return { root: root(), exposed, events };
};

const data = [
  { category: 'Direct', value: 40, region: 'EU' },
  { category: 'Search', value: 25, region: 'US' },
];
const clickSlice = (root, i) => {
  const sector = root.querySelectorAll('.recharts-pie-sector')[i];
  fireEvent.click(sector.querySelector('path') ?? sector);
};

describe('a Rocket PieChart slice click', () => {
  it('exposes the clicked data row only, as the other Rocket charts do', async () => {
    const { root, exposed, events } = await mount({ data, categoryField: 'category', valueField: 'value' });
    clickSlice(root, 1);
    await waitFor(() => expect(events).toContain('onClick'));
    expect(exposed.clickedDataPoint).toEqual({ category: 'Search', value: 25, region: 'US' });
  });

  it('still emphasises the clicked slice with Highlight clicked point', async () => {
    const { root, events } = await mount({
      data,
      categoryField: 'category',
      valueField: 'value',
      highlightClicked: true,
    });
    clickSlice(root, 1);
    await waitFor(() => expect(events).toContain('onClick'));
    const opacity = (i) => root.querySelectorAll('.recharts-pie-sector path')[i].getAttribute('fill-opacity');
    await waitFor(() => expect(opacity(0)).toBe('0.35'));
    expect(opacity(1)).toBe('1');
  });
});
