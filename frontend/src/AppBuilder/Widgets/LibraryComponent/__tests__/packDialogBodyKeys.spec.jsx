import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { deepActiveElement } from '@/AppBuilder/Widgets/LibraryComponent/packFocus';
import { nextTabbable } from '@/AppBuilder/Widgets/LibraryComponent/popupTabOrder';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA: in an open Ant Design Drawer, Tab went round its Close button only and never reached the components in its body;
// in a Rocket Dialog the body's components were never Tab stops; and Escape pressed in a body component of an Ant Modal
// or Drawer did not close it, as it does in a MUI or Rocket dialog. The body's components are the host's, light-DOM
// children of the popup layer projected through a <slot>. The pack components, the inline SDK and the host renderer are
// the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const packs = {
  shadcn: require('../../../../../../packs/shadcn/src/index.ts'),
  antd: require('../../../../../../packs/antd/src/index.ts'),
};

const flatParent = (node) => {
  if (node instanceof Element && node.assignedSlot) return node.assignedSlot;
  if (node.parentNode instanceof ShadowRoot) return node.parentNode.host;
  return node.parentNode;
};
// jsdom lays nothing out. As in Chrome: an element is drawn when it is on the page with no display: none on it or above
// it in the flat tree, and has a box of its own; a <slot> (display: contents by default) and any display: contents
// element have none, so checkVisibility() is false for them while what they hold is drawn. Measured in Chrome:
// checkVisibility() is false on a <slot> and on a display: contents div, true on the slotted element and the input in it.
const displayOf = (el) => (el instanceof HTMLSlotElement ? 'contents' : getComputedStyle(el).display);
const drawn = (el) => {
  if (!el.isConnected) return false;
  for (let node = el; node && node !== document; node = flatParent(node)) {
    if (node instanceof Element && getComputedStyle(node).display === 'none') return false;
  }
  return true;
};
beforeAll(() => {
  jest.spyOn(Element.prototype, 'getClientRects').mockImplementation(function rects() {
    return drawn(this) ? [{ x: 0, y: 0, width: 10, height: 10 }] : [];
  });
  Element.prototype.checkVisibility = function checkVisibility(options) {
    if (!drawn(this) || displayOf(this) === 'contents') return false;
    return !(options?.visibilityProperty && getComputedStyle(this).visibility === 'hidden');
  };
  // Radix's dialog calls these, which jsdom lacks.
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
  if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});
afterAll(() => {
  jest.restoreAllMocks();
  delete Element.prototype.checkVisibility;
});
afterEach(() => {
  document.body.innerHTML = '';
});

let mounts = 0;
// A pack dialog after a field on the page, with a text field in its body (as a ToolJet Text Input dropped there).
const mount = async (pack, name, props = {}) => {
  loadLibraryModule.mockResolvedValue(packs[pack]);
  mounts += 1;
  const exposed = {};
  const events = [];
  const actions = new Map();
  const view = render(
    <div>
      <input aria-label="Before" />
      <InlineLibraryComponent
        bundleUrl={`${pack}.js`}
        cssUrl={`${pack}.css`}
        cacheKey={`dialog-body-keys-${pack}`}
        componentName={name}
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={(key, value) => {
          exposed[key] = value;
        }}
        fireEvent={(event) => events.push(event)}
        actions={actions}
        host={makeHost(`${name}${mounts}`, {})}
        dataCy={`dialog-${mounts}`}
        popupSlotNames={['body']}
        renderPopupSlot={() => <input aria-label="Body field" />}
      />
    </div>
  );
  await waitFor(() => expect(actions.size).toBeGreaterThan(0));
  return { exposed, events, actions, before: view.getByLabelText('Before') };
};

const bodyField = () => document.querySelector('.tj-cc-popup-host input[aria-label="Body field"]');
const openDialog = () =>
  document.querySelector('.tj-cc-popup-host')?.shadowRoot?.querySelector('[data-tj-modal="open"]');

const open = async (w, action) => {
  act(() => w.actions.get(action)());
  await waitFor(() => expect(openDialog()).toBeTruthy());
  await waitFor(() => expect(bodyField()).toBeTruthy());
  // Let the dialog's own open focus (and its motion's timers) run before the keys.
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
};

// Tab as the browser takes it: the page's handlers first, then, unless one prevented it, on to the next control in the
// flat tree.
const pressTab = () => {
  const from = deepActiveElement();
  const moved = !fireEvent.keyDown(from, { key: 'Tab', code: 'Tab', keyCode: 9 });
  if (!moved) act(() => nextTabbable(from)?.focus());
  return deepActiveElement();
};

// Where the focus goes over `count` Tabs from the field before the dialog.
const tabStops = (w, count) => {
  act(() => w.before.focus());
  return Array.from({ length: count }, pressTab);
};

const escape = async (el) => {
  await act(async () => {
    // keyCode too: rc-dialog and rc-drawer read it, not key.
    el.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
};

describe('Tab reaches the components in a pack dialog body', () => {
  test('[PackComponent-DLGKEYS-001] Ant Drawer: Tab goes from its Close button to the field in its body', async () => {
    const w = await mount('antd', 'Drawer');
    await open(w, 'show');

    const stops = tabStops(w, 4);

    expect(stops).toContain(bodyField());
  });

  test('[PackComponent-DLGKEYS-002] Rocket Dialog: the field in its body is a Tab stop', async () => {
    const w = await mount('shadcn', 'Dialog', { showBody: true });
    await open(w, 'open');

    const stops = tabStops(w, 6);

    expect(stops).toContain(bodyField());
  });
});

describe('Escape in a body component closes an Ant dialog, as it does a MUI or Rocket one', () => {
  test('[PackComponent-DLGKEYS-003] Ant Modal: closes once, with onCancel', async () => {
    const w = await mount('antd', 'Modal');
    await open(w, 'show');

    await escape(bodyField());

    await waitFor(() => expect(w.exposed.open).toBe(false));
    expect(w.events.filter((e) => e === 'onCancel')).toHaveLength(1);
  });

  test('[PackComponent-DLGKEYS-004] Ant Drawer: closes once, with onClose', async () => {
    const w = await mount('antd', 'Drawer');
    await open(w, 'show');

    await escape(bodyField());

    await waitFor(() => expect(w.exposed.open).toBe(false));
    expect(w.events.filter((e) => e === 'onClose')).toHaveLength(1);
  });

  test('[PackComponent-DLGKEYS-005] Ant Drawer: Escape on its own Close button still closes it once', async () => {
    const w = await mount('antd', 'Drawer');
    await open(w, 'show');
    const close = openDialog().querySelector('.ant-drawer-close');

    await escape(close);

    await waitFor(() => expect(w.exposed.open).toBe(false));
    expect(w.events.filter((e) => e === 'onClose')).toHaveLength(1);
  });

  test('[PackComponent-DLGKEYS-006] Ant Modal: stays open when a body field used the Escape (an open list in it)', async () => {
    const w = await mount('antd', 'Modal');
    await open(w, 'show');
    const used = (e) => e.key === 'Escape' && e.preventDefault();
    bodyField().addEventListener('keydown', used);

    await escape(bodyField());

    expect(w.exposed.open).toBe(true);
    expect(w.events).not.toContain('onCancel');
  });
});
