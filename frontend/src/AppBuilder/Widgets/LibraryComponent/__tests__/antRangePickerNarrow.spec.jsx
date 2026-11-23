import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 22: at phone width the Ant Design Range Picker opened two months side by side (576px), so the second month
// ran off a 375px screen and the first had no "next" arrows. Ant has no phone layout for it; on Ant's xs screens
// (below its sm breakpoint, 576px) the pack now shows one month (the popup carries tj-ant-range--single; pack.css hides
// the second month and shows the first one's arrows). Ant draws the end date in the second month when the range
// spans months, so with one month shown the end field must open on the end month itself. The pack, Ant and the inline
// host are the real ones; only window.matchMedia stands in for a screen. jsdom lays nothing out, so what is hidden is
// checked in the browser, not here.
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

const RANGE = ['2026-11-10', '2027-01-05'];
let mounts = 0;
// Mounts the Range Picker on a screen `width` px wide and opens it from its start (0) or end (1) field.
const openOn = async (width, field) => {
  window.matchMedia = screen(width);
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const cy = `ant-range-${mounts}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey={`ant-range-narrow-${mounts}`}
      componentName="RangePicker"
      componentProps={{ value: RANGE }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('RangePicker', {})}
      dataCy={cy}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="${cy}"]`).shadowRoot;
  await waitFor(() => expect(root()?.querySelectorAll('.ant-picker-input input')).toHaveLength(2));
  const input = root().querySelectorAll('.ant-picker-input input')[field];
  // A real focus (React listens for focusin): Ant takes the field to edit from it.
  act(() => input.focus());
  fireEvent.mouseDown(input);
  fireEvent.click(input);
  await waitFor(() => expect(deepAll('.ant-picker-dropdown .ant-picker-panel').length).toBeGreaterThan(0));
  const dropdown = deepAll('.ant-picker-dropdown')[0];
  return {
    single: dropdown.classList.contains('tj-ant-range--single'),
    // The header's month and year are separate buttons.
    months: deepAll('.ant-picker-dropdown .ant-picker-panel .ant-picker-header-view').map((h) =>
      [...h.children].map((part) => part.textContent.trim()).join(' ')
    ),
  };
};

describe('Ant Design Range Picker at phone width', () => {
  test('a phone screen shows one month', async () => {
    expect((await openOn(375, 0)).single).toBe(true);
  });

  test('from the start field on a phone, the shown month is the start month', async () => {
    expect((await openOn(375, 0)).months[0]).toBe('Nov 2026');
  });

  test('from the end field on a phone, the shown month is the end month, not the month before it', async () => {
    expect((await openOn(375, 1)).months[0]).toBe('Jan 2027');
  });

  test('a wide screen keeps two months, the end month second', async () => {
    const wide = await openOn(1280, 1);
    expect(wide.single).toBe(false);
    expect(wide.months).toEqual(['Dec 2026', 'Jan 2027']);
  });
});
