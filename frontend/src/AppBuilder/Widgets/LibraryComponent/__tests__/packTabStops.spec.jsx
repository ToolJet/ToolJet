import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { nextTabbable } from '@/AppBuilder/Widgets/LibraryComponent/popupTabOrder';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA: Tab on pack components did not move from component to component as on ToolJet's. Within one component it stopped
// on parts a ToolJet component's Tab passes over (a clear x, a chip's Remove, a password's eye, a phone's country, a
// list's rows, a rating's row of stars, a segmented control's frame), skipped an Ant Color picker and a Link with no
// URL, and an open Ant select took Tab as a pick. Each field is now one stop as on ToolJet's, with Backspace or Delete
// clearing a choice as in ToolJet's dropdowns. The pack components, the inline SDK and the host renderer are the real
// ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const packs = {
  shadcn: require('../../../../../../packs/shadcn/src/index.ts'),
  antd: require('../../../../../../packs/antd/src/index.ts'),
  mui: require('../../../../../../packs/mui/src/index.ts'),
};

// jsdom lays nothing out, so no element has a box and none could take Tab. As in a browser, one that is on the page and
// drawn (no display: none on it or around it, across shadow roots) has one.
const drawn = (el) => {
  for (let node = el; node && node !== document; node = node instanceof ShadowRoot ? node.host : node.parentNode) {
    if (node instanceof Element && getComputedStyle(node).display === 'none') return false;
  }
  return el.isConnected;
};
beforeAll(() => {
  jest.spyOn(Element.prototype, 'getClientRects').mockImplementation(function rects() {
    return drawn(this) ? [{ x: 0, y: 0, width: 10, height: 10 }] : [];
  });
  // Radix's popper and Select call these, which jsdom lacks.
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
  if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
  if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});
afterAll(() => jest.restoreAllMocks());

afterEach(() => {
  document.body.innerHTML = '';
});

let mounts = 0;
// One pack component between two fields, as on a page.
const mount = async (pack, name, props = {}) => {
  loadLibraryModule.mockResolvedValue(packs[pack]);
  mounts += 1;
  const exposed = {};
  const events = [];
  const view = render(
    <div>
      <input aria-label="Before" />
      <InlineLibraryComponent
        bundleUrl={`${pack}.js`}
        cssUrl={`${pack}.css`}
        cacheKey={`tab-stops-${pack}`}
        componentName={name}
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={(key, value) => {
          exposed[key] = value;
        }}
        fireEvent={(event) => events.push(event)}
        actions={new Map()}
        host={{ ...makeHost(name, { validation: 'text' }), formField: true }}
        dataCy={`stops-${mounts}`}
      />
      <input aria-label="After" />
    </div>
  );
  const widget = view.container.querySelector(`[data-cy="stops-${mounts}"]`);
  await waitFor(() => expect(widget.shadowRoot?.querySelector('.tj-cc-root')?.childElementCount).toBeGreaterThan(0));
  return {
    root: () => widget.shadowRoot,
    exposed,
    events,
    before: view.getByLabelText('Before'),
    after: view.getByLabelText('After'),
  };
};

// The component's Tab stops: where Tab goes from the field before it until the field after it, in the page's order.
const stops = ({ before, after }) => {
  const found = [];
  for (let el = nextTabbable(before); el && el !== after && found.length < 20; el = nextTabbable(el)) found.push(el);
  return found;
};

const layer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;
const OPTIONS = [
  { label: 'One', value: 'one' },
  { label: 'Two', value: 'two' },
];

describe('Rocket 2.0: one Tab stop per field, as on ToolJet components', () => {
  test('[PackComponent-TAB-101] Password input: the field, not its show/hide eye', async () => {
    const w = await mount('shadcn', 'PasswordInput');
    expect(stops(w)).toEqual([w.root().querySelector('input')]);
  });

  test('[PackComponent-TAB-102] Phone input: the number, not the country button', async () => {
    const w = await mount('shadcn', 'PhoneInput');
    expect(stops(w)).toEqual([w.root().querySelector('input')]);
  });

  test('[PackComponent-TAB-103] Select with a choice: the field, not its clear x; Backspace there clears the choice', async () => {
    const w = await mount('shadcn', 'Select', { options: OPTIONS, defaultValue: 'two' });
    await waitFor(() => expect(w.exposed.value).toBe('two'));
    const field = w.root().querySelector('button[role="combobox"]');
    expect(w.root().querySelector('[aria-label="Clear selection"]')).toBeTruthy();
    expect(stops(w)).toEqual([field]);

    act(() => field.focus());
    fireEvent.keyDown(field, { key: 'Backspace' });
    await waitFor(() => expect(w.exposed.value).toBe(''));
  });

  test('[PackComponent-TAB-104] Combobox with a choice: the field, not its clear x; Delete there clears the choice', async () => {
    const w = await mount('shadcn', 'Combobox', { options: OPTIONS, defaultValue: 'two' });
    await waitFor(() => expect(w.exposed.value).toBe('two'));
    const field = w.root().querySelector('button[role="combobox"]');
    expect(stops(w)).toEqual([field]);

    act(() => field.focus());
    fireEvent.keyDown(field, { key: 'Delete' });
    await waitFor(() => expect(w.exposed.value).toBe(''));
  });

  test("[PackComponent-TAB-105] Multiselect with choices: the field, not the chips' Remove buttons or the clear x", async () => {
    const w = await mount('shadcn', 'MultiSelect', { options: OPTIONS, defaultValue: ['one', 'two'] });
    await waitFor(() => expect(w.root().querySelectorAll('.uc-chip-remove')).toHaveLength(2));
    expect(stops(w)).toEqual([w.root().querySelector('[role="combobox"]')]);
  });

  test('[PackComponent-TAB-106] List view of components: Tab passes the rows by, to the components in them', async () => {
    const w = await mount('shadcn', 'ListView', {
      data: [
        { id: 1, name: 'Harbour Lofts' },
        { id: 2, name: 'Mill Yard' },
      ],
      itemContent: 'components',
    });
    await waitFor(() => expect(w.root().querySelectorAll('[role="listitem"]')).toHaveLength(2));
    expect(stops(w)).toEqual([]);
  });

  test('[PackComponent-TAB-107] Select: the click that ends the press opening the list leaves the focus in the list', async () => {
    // Break this catches: Radix focusing the field on that click, so the focus left the open list and Tab went on to the
    // next component with the list still open.
    const w = await mount('shadcn', 'Select', { options: OPTIONS });
    const field = w.root().querySelector('button[role="combobox"]');
    act(() => field.focus());
    fireEvent.keyDown(field, { key: 'Enter' });
    await waitFor(() => expect(layer()?.activeElement?.getAttribute('role')).toBe('option'));

    fireEvent.click(field);

    expect(layer().activeElement?.getAttribute('role')).toBe('option');
    expect(w.root().activeElement).toBeNull();
  });
});

describe('Ant Design: Tab as on ToolJet components', () => {
  test('[PackComponent-TAB-201] Select: Tab on an open list goes on without choosing an option', async () => {
    // Break this catches: rc-select taking Tab as Enter (it picked the active option and kept the focus), so Tab out of
    // an open select needed a second press and chose an option on the way.
    const w = await mount('antd', 'Select', { options: OPTIONS });
    fireEvent.mouseDown(w.root().querySelector('.ant-select-selector'));
    await waitFor(() => expect(w.exposed.open).toBe(true));
    const input = w.root().querySelector('input');
    act(() => input.focus());

    expect(fireEvent.keyDown(input, { key: 'Tab', keyCode: 9, which: 9 })).toBe(true);

    expect(w.exposed.value).not.toBe('one');
    expect(w.events).not.toContain('onChange');
  });

  test("[PackComponent-TAB-202] Segmented: one stop, the chosen option's radio, not the frame around them", async () => {
    const w = await mount('antd', 'Segmented', {
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
      ],
      value: 'weekly',
    });
    const found = stops(w);
    expect(found).toHaveLength(1);
    expect(found[0].matches('input[type="radio"]')).toBe(true);
    expect(found[0].checked).toBe(true);
  });

  test('[PackComponent-TAB-203] Rate: a stop per star, as on a ToolJet Rating; the row of stars is none', async () => {
    const w = await mount('antd', 'Rate');
    const found = stops(w);
    expect(found).toHaveLength(5);
    found.forEach((star) => expect(star.getAttribute('role')).toBe('radio'));
  });

  test('[PackComponent-TAB-204] Color picker: the swatch is a stop; Enter opens the panel and Tab closes it', async () => {
    const w = await mount('antd', 'ColorPicker');
    const swatch = w.root().querySelector('.ant-color-picker-trigger');
    expect(stops(w)).toEqual([swatch]);

    act(() => swatch.focus());
    fireEvent.keyDown(swatch, { key: 'Enter' });
    await waitFor(() => expect(swatch.getAttribute('aria-expanded')).toBe('true'));
    expect(layer().querySelector('.ant-color-picker-inner')).toBeTruthy();

    fireEvent.keyDown(swatch, { key: 'Tab' });
    await waitFor(() => expect(swatch.getAttribute('aria-expanded')).toBe('false'));
  });

  test('[PackComponent-TAB-205] Link with no URL: a stop, and Enter clicks it', async () => {
    const w = await mount('antd', 'Link', { children: 'Docs' });
    const link = w.root().querySelector('a');
    expect(stops(w)).toEqual([link]);

    act(() => link.focus());
    fireEvent.keyDown(link, { key: 'Enter' });
    expect(w.events).toContain('onClick');
  });

  test('[PackComponent-TAB-206] Phone input: one stop, the number, not the country select', async () => {
    const w = await mount('antd', 'PhoneInput');
    expect(stops(w)).toEqual([w.root().querySelector('input.ant-input')]);
  });
});

describe('MUI: Tab as on ToolJet components', () => {
  test('[PackComponent-TAB-301] Select with a choice: the field, not its clear x; Backspace there clears the choice', async () => {
    const w = await mount('mui', 'Select', { options: OPTIONS, value: 'two' });
    await waitFor(() => expect(w.root().querySelector('.tj-mui-select-clear')).toBeTruthy());
    const field = w.root().querySelector('[role="combobox"]');
    expect(stops(w)).toEqual([field]);

    act(() => field.focus());
    fireEvent.keyDown(field, { key: 'Backspace' });
    await waitFor(() => expect(w.exposed.value).toBe(''));
  });
});
