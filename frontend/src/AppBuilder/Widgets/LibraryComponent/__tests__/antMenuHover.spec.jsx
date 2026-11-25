import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-04: an Ant Design Menu's sub-menus never opened in Horizontal mode, and in Vertical mode one closed as the
// pointer moved from its title into the open list. Ant opens a sub-menu on onMouseEnter, and React works out an enter
// from the element the pointer left: the canvas and the title belong to other roots than the element entered (the
// widget's shadow root, the popup layer's), so React left each enter to a listener that cannot see into the root, and
// nothing was entered. The pack's Menu, the inline SDK and the host renderer (its shadow root and popup layer) are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

// Orders first: jsdom measures no widths, and Ant's horizontal menu counts every item after the first as overflowing
// (no list of its own) until it has measured them.
const ITEMS = [
  {
    key: 'orders',
    label: 'Orders',
    children: [
      { key: 'open', label: 'Open' },
      { key: 'shipped', label: 'Shipped' },
    ],
  },
  { key: 'customers', label: 'Customers' },
];

let mounts = 0;
const mount = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const view = render(
    // The canvas: one of ToolJet's own elements around the widget, as in the editor and the viewer.
    <div data-testid="canvas" className="real-canvas">
      <InlineLibraryComponent
        bundleUrl="antd.js"
        cssUrl="antd.css"
        cacheKey={`ant-menu-hover-${mounts}`}
        componentName="Menu"
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={(key, value) => {
          exposed[key] = value;
        }}
        fireEvent={() => {}}
        actions={new Map()}
        host={makeHost('Menu', {})}
        dataCy={`menu-${mounts}`}
      />
    </div>
  );
  const shadow = () => view.container.querySelector(`[data-cy="menu-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('.ant-menu-submenu-title')).toBeTruthy());
  const orders = () =>
    [...shadow().querySelectorAll('.ant-menu-submenu-title')].find((title) => title.textContent.includes('Orders'));
  // The sub-menu lists open in the popup layer, by their items' text.
  const openLists = () =>
    [...document.querySelectorAll('.tj-cc-popup-host')]
      .flatMap((host) => [...host.shadowRoot.querySelectorAll('.ant-menu-submenu-popup')])
      .filter((popup) => !popup.className.includes('-hidden'))
      .map((popup) => [...popup.querySelectorAll('li')].map((item) => item.textContent));
  const listItem = (text) =>
    [...document.querySelectorAll('.tj-cc-popup-host')]
      .flatMap((host) => [...host.shadowRoot.querySelectorAll('.ant-menu-submenu-popup li')])
      .find((item) => item.textContent === text);
  return { canvas: view.getByTestId('canvas'), orders, openLists, listItem, exposed };
};

// The events a browser sends when the pointer moves from `from` onto `to`.
const pointerMove = (from, to) =>
  act(() => {
    from.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, composed: true, relatedTarget: to }));
    to.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true, relatedTarget: from }));
  });

// Longer than Ant's sub-menu open and close delays (0.1 s each).
const pause = () => act(() => new Promise((resolve) => setTimeout(resolve, 400)));

describe('Ant Design Menu: a sub-menu opens on hover', () => {
  test.each(['horizontal', 'vertical'])(
    '[PackComponent-MENU-001] %s: the pointer coming from the canvas onto Orders opens its list',
    async (mode) => {
      const menu = await mount({ mode, items: ITEMS });

      pointerMove(menu.canvas, menu.orders());

      await waitFor(() => expect(menu.openLists()).toEqual([['Open', 'Shipped']]));
      expect(menu.orders().getAttribute('aria-expanded')).toBe('true');
    }
  );

  test.each(['horizontal', 'vertical'])(
    '[PackComponent-MENU-002] %s: the list stays open as the pointer moves from Orders into it, and takes a pick',
    async (mode) => {
      const menu = await mount({ mode, items: ITEMS });
      pointerMove(menu.canvas, menu.orders());
      await waitFor(() => expect(menu.openLists()).toEqual([['Open', 'Shipped']]));

      pointerMove(menu.orders(), menu.listItem('Shipped'));
      await pause();

      expect(menu.orders().getAttribute('aria-expanded')).toBe('true');
      expect(menu.openLists()).toEqual([['Open', 'Shipped']]);
      act(() => {
        fireEvent.click(menu.listItem('Shipped'));
      });
      expect(menu.exposed.selectedKey).toBe('shipped');
    }
  );
});
