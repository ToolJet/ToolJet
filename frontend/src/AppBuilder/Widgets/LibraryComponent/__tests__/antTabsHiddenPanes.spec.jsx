// PKB-43: a component in Tab 2 / panel 2 had no exposed values until opened; every pane must mount its slot at load.
import React from 'react';
import { act, render } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));
const pack = require('../../../../../../packs/antd/src/index.ts');

const slotsAtLoad = async (name) => {
  loadLibraryModule.mockResolvedValue(pack);
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`${name}.js`}
      cssUrl={`${name}.css`}
      cacheKey={`hidden-${name}`}
      componentName={name}
      componentProps={{}}
      componentStyles={{}}
      renderSlot={(n) => <span data-rendered-slot={n} />}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`hidden-${name}`}
    />
  );
  await act(() => new Promise((r) => setTimeout(r, 50)));
  return [...view.container.querySelectorAll('[data-rendered-slot]')].map((e) => e.dataset.renderedSlot);
};

afterEach(() => {
  document.body.innerHTML = '';
});

it('Tabs mounts the slot of every tab at load', async () => {
  const slots = await slotsAtLoad('Tabs');
  expect(slots.filter((s) => s.startsWith('tab_')).length).toBeGreaterThanOrEqual(2);
});

it('Collapse mounts the slot of every panel at load', async () => {
  const slots = await slotsAtLoad('Collapse');
  expect(slots.filter((s) => s.startsWith('panel_')).length).toBeGreaterThanOrEqual(2);
});
