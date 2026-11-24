import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 22: at phone width the Material UI Date-Time Picker opened its desktop popper (calendar and time columns side
// by side, ~490px), so the minutes, AM/PM and OK ran off a 375px screen. MUI X switches to its mobile picker (a dialog
// with the date and the time one after another) through desktopModeMediaQuery; the pack forced the desktop one on
// every screen. Now a narrow screen or a touch screen gets MUI's mobile picker, a wide screen with a mouse keeps the
// popper. The pack's pickers, MUI X and the inline host are the real ones; only window.matchMedia stands in for a screen.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/mui/src/index.ts');

// A screen `width` px wide with a mouse (`fine`) or a finger: answers (min-width: Npx), (max-width: Npx) and
// (pointer: fine|coarse) clauses joined by "and", as a browser does.
const screen = (width, fine) => (query) => {
  const clauses = query
    .replace(/^@media\s*/, '')
    .split(/\s+and\s+/)
    .map((c) => c.trim().replace(/^\(|\)$/g, ''));
  const matches = clauses.every((clause) => {
    const [feature, raw] = clause.split(':').map((s) => s.trim());
    if (feature === 'min-width') return width >= parseFloat(raw);
    if (feature === 'max-width') return width <= parseFloat(raw);
    if (feature === 'pointer') return raw === (fine ? 'fine' : 'coarse');
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

// Every element matching `selector` in the page, through open shadow roots (MUI portals into the popup layer).
const deepAll = (selector, root = document) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(selector, el.shadowRoot));
  return found;
};

let mounts = 0;
// Mounts a picker on the given screen and opens it as a user would: the calendar button where the field has one (the
// desktop picker), else a click on the field (the mobile picker opens on it).
const openOn = async (name, width, fine) => {
  window.matchMedia = screen(width, fine);
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const cy = `mui-picker-${mounts}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl="mui.js"
      cssUrl="mui.css"
      cacheKey={`mui-picker-mobile-${mounts}`}
      componentName={name}
      componentProps={{ label: 'When' }}
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
  await waitFor(() => expect(root()?.querySelector('.MuiPickersInputBase-root')).toBeTruthy());
  const button = root().querySelector('.MuiInputAdornment-root button');
  fireEvent.click(button ?? root().querySelector('.MuiPickersInputBase-root'));
  await waitFor(() => expect(deepAll('.MuiPickersLayout-root').length).toBeGreaterThan(0));
  return {
    popper: deepAll('.MuiPickerPopper-root').length > 0,
    dialog: deepAll('.MuiDialog-root .MuiPickersLayout-root').length > 0,
  };
};

describe.each(['DateTimePicker', 'DatePicker', 'TimePicker'])('MUI %s picks its look from the screen', (name) => {
  test('a phone (375px, touch) gets the mobile picker, a dialog', async () => {
    expect(await openOn(name, 375, false)).toEqual({ popper: false, dialog: true });
  });

  test('a narrow browser window (375px, mouse) gets the mobile picker too', async () => {
    expect(await openOn(name, 375, true)).toEqual({ popper: false, dialog: true });
  });

  test('a wide screen with a mouse keeps the popper under the field', async () => {
    expect(await openOn(name, 1280, true)).toEqual({ popper: true, dialog: false });
  });
});
