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

// The radii the Schedule sets: its frame reads the large one (--ant-border-radius-lg), the bookings the base one.
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
  return [style.getPropertyValue('--tj-ant-border-radius'), style.getPropertyValue('--tj-ant-border-radius-lg')];
};

// Radius rounds the outer frame too, by the same value, not a fixed 8px (AD-29).
describe('Ant Schedule Radius', () => {
  it.each([
    [0, ['0px', '0px']],
    [20, ['20px', '20px']],
  ])('Radius %s sets the bookings and the frame radius', async (r, expected) => {
    expect(await radii({ borderRadius: r })).toEqual(expected);
  });

  it("leaves both to the theme when Radius is not set (the frame keeps Ant's 8px)", async () => {
    expect(await radii({})).toEqual(['', '']);
  });
});
