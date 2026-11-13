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

const pack = require('../../../../../../packs/antd/src/index.ts');

afterEach(() => {
  document.body.innerHTML = '';
});

// The radii the Schedule sets: Container radius rounds the frame (--ant-border-radius-lg), Event radius the bookings.
const VARS = ['--tj-ant-border-radius-lg', '--lk-event-radius', '--tj-ant-border-radius'];
const radii = async (styles) => {
  loadLibraryModule.mockResolvedValue(pack);
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-schedule-radius"
      componentName="Schedule"
      componentProps={{}}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('Schedule')}
      dataCy="ant-schedule"
    />
  );
  const root = () => document.querySelector('[data-cy="ant-schedule"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.ucs')).toBeTruthy());
  const style = root().querySelector('.ucs').style;
  return VARS.map((name) => style.getPropertyValue(name));
};

// One Radius used to round the frame and the bookings alike: each now has its own.
describe('Ant Schedule radii', () => {
  it.each([
    [{ borderRadius: 20 }, ['20px', '', '']],
    [{ eventRadius: 12 }, ['', '12px', '']],
    [{ borderRadius: 0, eventRadius: 20 }, ['0px', '20px', '']],
  ])('%j sets only its own radius', async (styles, expected) => {
    expect(await radii(styles)).toEqual(expected);
  });

  it("leaves both to the theme when neither is set (the frame keeps Ant's 8px)", async () => {
    expect(await radii({})).toEqual(['', '', '']);
  });
});
