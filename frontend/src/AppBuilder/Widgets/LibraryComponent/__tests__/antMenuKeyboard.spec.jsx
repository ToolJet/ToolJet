import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-16: the arrow keys and Enter did nothing on an Ant Design Menu, and a Dropdown opened from the keyboard could
// not be picked from. rc-menu finds its items for the arrow keys with document.querySelector, which never reaches into
// the shadow roots the pack draws its menus and lists in. The pack's Menu and Dropdown, the inline SDK and the host
// renderer (the widget's shadow root and the popup layer) are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

// jsdom lays nothing out, so no element has an offsetParent, and rc-util counts only drawn elements as ones the arrow
// keys can move to (rc-util Dom/isVisible): every element counts as drawn here.
let offsetParent;
beforeAll(() => {
  offsetParent = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get() {
      return this.parentElement;
    },
  });
});
afterAll(() => {
  if (offsetParent) Object.defineProperty(HTMLElement.prototype, 'offsetParent', offsetParent);
});

let mounts = 0;
const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey={`ant-menu-keys-${mounts}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`keys-${mounts}`}
    />
  );
  const shadow = () => view.container.querySelector(`[data-cy="keys-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('.tj-ant-root')).toBeTruthy());
  return { shadow, exposed };
};

// The element that has the focus, through the shadow roots it is in.
const focused = () => {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
};

const KEY_CODES = { ArrowDown: 40, Enter: 13 };
const press = (key) =>
  act(() => {
    fireEvent.keyDown(focused(), { key, code: key, keyCode: KEY_CODES[key], which: KEY_CODES[key] });
  });

describe('Ant Design Menu and Dropdown: keyboard', () => {
  test('[PackComponent-MENUKEYS-001] Menu: ArrowDown moves to the first item and Enter picks it', async () => {
    const menu = await mount('Menu', {});
    act(() => {
      menu.shadow().querySelector('ul.ant-menu').focus();
    });

    press('ArrowDown');
    await waitFor(() => expect(focused()?.textContent).toBe('Dashboard'));
    press('Enter');

    expect(menu.exposed.selectedKey).toBe('dashboard');
  });

  test('[PackComponent-MENUKEYS-002] Dropdown opened from the keyboard: ArrowDown and Enter pick from the list', async () => {
    const dropdown = await mount('Dropdown', {});
    const button = dropdown.shadow().querySelector('button');
    act(() => {
      button.focus();
    });

    // Enter on the button, then the click a browser makes of it.
    press('Enter');
    act(() => {
      fireEvent.click(button);
    });
    await waitFor(() => expect(focused()?.textContent).toBe('Edit'));
    press('ArrowDown');
    await waitFor(() => expect(focused()?.textContent).toBe('Duplicate'));
    press('Enter');

    expect(dropdown.exposed.selectedKey).toBe('duplicate');
  });
});
