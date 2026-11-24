import React from 'react';
import { act, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-17 and AD-18: an Ant Design Menu's pop-out sub-menu kept stock Ant's black on white under Text color and
// Container background, and an open Ant Design Modal took none of Primary color, Text color, Container background and
// Border radius. Both draw in the popup layer, where the pack's class (tj-ant) turns the component's token values into
// antd's colours and radius on the element that has the class: the values must be on that element or above it. jsdom
// works out no var(), so the spec checks that. The pack's Menu and Modal, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

const STYLES = { colorPrimary: '#ff0000', colorText: '#00aa00', colorBgContainer: '#ffeeaa', borderRadius: 20 };

let mounts = 0;
const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const actions = new Map();
  const view = render(
    <div data-testid="canvas">
      <InlineLibraryComponent
        bundleUrl="antd.js"
        cssUrl="antd.css"
        cacheKey={`ant-popup-theme-${mounts}`}
        componentName={name}
        componentProps={props}
        componentStyles={STYLES}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        actions={actions}
        host={makeHost(name, {})}
        dataCy={`themed-${mounts}`}
      />
    </div>
  );
  const shadow = () => view.container.querySelector(`[data-cy="themed-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('.tj-ant-root')).toBeTruthy());
  const layer = () => [...document.querySelectorAll('.tj-cc-popup-host')].pop().shadowRoot;
  return { canvas: view.getByTestId('canvas'), shadow, layer, actions };
};

// The token value an element works its colours out from: its own, or the nearest element above it that has one, up to
// the popup layer.
const tokenAt = (el, name) => {
  for (let node = el; node; node = node.parentElement) {
    const value = node.style?.getPropertyValue(name);
    if (value) return value.trim();
  }
  return '';
};

const pointerMove = (from, to) =>
  act(() => {
    from.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, composed: true, relatedTarget: to }));
    to.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true, relatedTarget: from }));
  });

describe('Ant Design popups take the component styles', () => {
  test('[PackComponent-POPTHEME-001] Menu: the pop-out sub-menu has the pack class and the component values', async () => {
    const menu = await mount('Menu', { mode: 'vertical' });
    const orders = [...menu.shadow().querySelectorAll('.ant-menu-submenu-title')].find((t) =>
      t.textContent.includes('Orders')
    );

    pointerMove(menu.canvas, orders);

    const popup = () => menu.layer().querySelector('.ant-menu-submenu-popup');
    await waitFor(() => expect(popup()).toBeTruthy());
    expect(popup().classList.contains('tj-ant')).toBe(true);
    expect(tokenAt(popup(), '--tj-ant-color-text')).toBe('#00aa00');
    expect(tokenAt(popup(), '--tj-ant-color-bg-container')).toBe('#ffeeaa');
  });

  test('[PackComponent-POPTHEME-002] Modal: the values are on the modal root or above it, where tj-ant reads them', async () => {
    const modal = await mount('Modal', {});

    act(() => {
      modal.actions.get('show')();
    });

    const root = () => modal.layer().querySelector('.ant-modal-root');
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().classList.contains('tj-ant')).toBe(true);
    expect(tokenAt(root(), '--tj-ant-color-primary')).toBe('#ff0000');
    expect(tokenAt(root(), '--tj-ant-color-text')).toBe('#00aa00');
    expect(tokenAt(root(), '--tj-ant-color-bg-container')).toBe('#ffeeaa');
    expect(tokenAt(root(), '--tj-ant-border-radius')).toBe('20px');
  });
});
