import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Ant's hover popups across the widget's shadow root and the popup layer's (lib/usePortalContainer enterAcrossRoots):
// React dropped the enter on a popup the pointer reached from its trigger, so a hover Dropdown and Menu submenus closed
// 0.1 s after the pointer left the trigger. jsdom retargets relatedTarget across shadow roots as a browser does.

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));
const pack = require('../../../../../../packs/antd/src/index.ts');

const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue(pack);
  const exposed = {};
  const events = [];
  const rendered = render(
    <div className="canvas">
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey="ant-hover"
        componentName={name}
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={(key, value) => (exposed[key] = value)}
        fireEvent={(event) => events.push(event)}
        actions={new Map()}
        host={makeHost(name)}
        dataCy="ant-hover"
      />
    </div>
  );
  const root = () => rendered.container.querySelector('[data-cy="ant-hover"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.tj-ant-root')).toBeTruthy());
  return { root, exposed, events, canvas: rendered.container.querySelector('.canvas') };
};

const layer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;
const openPopup = (selector) =>
  [...(layer()?.querySelectorAll(selector) ?? [])].find(
    (el) => !/-hidden\b/.test(el.className) && el.style.display !== 'none'
  );
const wait = (ms) => act(() => new Promise((r) => setTimeout(r, ms)));
// The pointer moving from `from` to `to` as a browser reports it: out on the old node, over on the new one, each
// event's relatedTarget the other node (the browser retargets it across shadow roots).
const movePointer = (from, to) => {
  if (from) fireEvent.mouseOut(from, { relatedTarget: to });
  fireEvent.mouseOver(to, { relatedTarget: from });
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Ant hover popups across the widget and the popup layer', () => {
  it('Dropdown (hover): opens when the pointer comes straight from the canvas', async () => {
    const v = await mount('Dropdown', { trigger: 'hover' });
    movePointer(v.canvas, v.root().querySelector('.ant-dropdown-trigger'));
    await waitFor(() => expect(openPopup('.ant-dropdown')).toBeTruthy());
  });

  it('Dropdown (hover): stays open while the pointer is over its menu, and a pick fires onClick', async () => {
    const v = await mount('Dropdown', { trigger: 'hover' });
    const button = v.root().querySelector('.ant-dropdown-trigger');
    movePointer(document.body, button);
    await waitFor(() => expect(openPopup('.ant-dropdown')).toBeTruthy());
    const item = openPopup('.ant-dropdown').querySelector('.ant-dropdown-menu-item');
    movePointer(button, item);
    await wait(400); // past Ant's mouseLeaveDelay (0.1 s)
    expect(openPopup('.ant-dropdown')).toBeTruthy();
    fireEvent.click(item);
    expect(v.events).toContain('onClick');
    expect(v.exposed.selectedKey).toBe('edit');
  });

  it('Dropdown (hover): closes once the pointer leaves the menu', async () => {
    const v = await mount('Dropdown', { trigger: 'hover' });
    const button = v.root().querySelector('.ant-dropdown-trigger');
    movePointer(document.body, button);
    await waitFor(() => expect(openPopup('.ant-dropdown')).toBeTruthy());
    const item = openPopup('.ant-dropdown').querySelector('.ant-dropdown-menu-item');
    movePointer(button, item);
    await wait(300);
    movePointer(item, document.body);
    await waitFor(() => expect(openPopup('.ant-dropdown')).toBeFalsy());
  });

  it('Menu (vertical): a submenu stays open while the pointer is over it', async () => {
    const v = await mount('Menu', { mode: 'vertical' });
    const title = v.root().querySelector('.ant-menu-submenu-title');
    movePointer(document.body, title);
    await waitFor(() => expect(openPopup('.ant-menu-submenu-popup')).toBeTruthy());
    const item = openPopup('.ant-menu-submenu-popup').querySelector('.ant-menu-item');
    movePointer(title, item);
    await wait(400);
    expect(openPopup('.ant-menu-submenu-popup')).toBeTruthy();
    fireEvent.click(item);
    expect(v.exposed.selectedKey).toBe('open');
  });
});

describe('enterAcrossRoots', () => {
  const { enterAcrossRoots } = require('../../../../../../packs/antd/src/lib/usePortalContainer');
  const setup = () => {
    const host = document.createElement('div');
    const slotted = document.createElement('span');
    host.appendChild(slotted);
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    const sibling = document.createElement('div');
    root.append(inner, sibling);
    const seen = [];
    inner.addEventListener('mouseover', (e) => seen.push([e.relatedTarget, e.fromElement]));
    enterAcrossRoots(root);
    enterAcrossRoots(root); // a second install is a no-op
    return { host, slotted, root, inner, sibling, seen };
  };
  const over = (target, related) => {
    const e = new MouseEvent('mouseover', { bubbles: true, composed: true, relatedTarget: related });
    Object.defineProperty(e, 'fromElement', { value: related, configurable: true });
    target.dispatchEvent(e);
  };

  it('clears relatedTarget and fromElement of an over event from outside the root', () => {
    const { inner, seen } = setup();
    over(inner, document.body);
    expect(seen).toEqual([[null, null]]);
  });

  it('leaves an over event from inside the root, or from a slotted child of its host, alone', () => {
    const { inner, sibling, slotted, seen } = setup();
    over(inner, sibling);
    over(inner, slotted);
    expect(seen).toEqual([
      [sibling, sibling],
      [slotted, slotted],
    ]);
  });
});
