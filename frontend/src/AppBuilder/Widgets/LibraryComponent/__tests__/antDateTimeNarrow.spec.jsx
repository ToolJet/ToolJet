import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
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
// A screen `width` px wide: answers (min-width: Npx) and (max-width: Npx) clauses joined by "and", as a browser does.
const screen = (width) => (query) => {
  const matches = query
    .replace(/^@media\s*/, '')
    .split(/\s+and\s+/)
    .every((clause) => {
      const [feature, raw] = clause
        .trim()
        .replace(/^\(|\)$/g, '')
        .split(':')
        .map((s) => s.trim());
      if (feature === 'min-width') return width >= parseFloat(raw);
      if (feature === 'max-width') return width <= parseFloat(raw);
      return false;
    });
  return {
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
};

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
});

const deepAll = (selector, root = document) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(selector, el.shadowRoot));
  return found;
};

// QA PF-069: the DateTimePicker popup is 401px (288 date panel + 113 time panel), wider than a 390px phone. On Ant's xs
// screens the popup carries tj-ant-datetime--stack (controls.css stacks the time panel under the dates). Only with a
// time panel: a plain DatePicker never gets it. jsdom lays nothing out, so the CSS is checked in the browser.
let mounts = 0;
const stacked = async (width, name, props = {}) => {
  window.matchMedia = screen(width);
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const cy = `ant-dt-${mounts}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey={`ant-dt-${mounts}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={cy}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="${cy}"]`).shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ant-picker-input input')).toBeTruthy());
  const input = root().querySelector('.ant-picker-input input');
  act(() => input.focus());
  fireEvent.mouseDown(input);
  fireEvent.click(input);
  await waitFor(() => expect(deepAll('.ant-picker-dropdown .ant-picker-panel').length).toBeGreaterThan(0));
  return deepAll('.ant-picker-dropdown')[0].classList.contains('tj-ant-datetime--stack');
};

describe('Ant DateTimePicker at phone width', () => {
  test('a phone screen stacks the time panel', async () => {
    expect(await stacked(375, 'DateTimePicker')).toBe(true);
  });
  test('DatePicker with showTime stacks too', async () => {
    expect(await stacked(375, 'DatePicker', { showTime: true })).toBe(true);
  });
  test('a wide screen does not', async () => {
    expect(await stacked(1280, 'DateTimePicker')).toBe(false);
  });
  test('a plain DatePicker on a phone does not', async () => {
    expect(await stacked(375, 'DatePicker')).toBe(false);
  });
});
