import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { nextTabbable } from '@/AppBuilder/Widgets/LibraryComponent/popupTabOrder';
import { installBrowserStubs } from './fuzz/packTestEnv';

installBrowserStubs();

// QA: Tab on pack components did not go on to the next component as it does on ToolJet's. A pack draws its lists,
// calendars and panels in the library's shared popup layer, after every widget in the page's order: Tab from a popup's
// last control went on to the page around the canvas, a list that closed under the focus left it on the page's body,
// and a list that keeps Tab inside itself kept it there. The host now takes Tab past a popup's last control (or Shift+Tab
// past its first) on from the control that opened it, and gives the focus back to that control when a popup hides with
// the focus in it. The host renderer and its tab order are the real ones; the components are stand-ins for a pack's
// select and calendar, and only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

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
});
afterAll(() => jest.restoreAllMocks());

afterEach(() => {
  document.body.innerHTML = '';
});

// The popup layer a pack portals into (usePortalContainer reads it off the widget's shadow root).
const useOverlay = (anchor) => {
  const [overlay, setOverlay] = useState(null);
  useLayoutEffect(() => setOverlay(anchor.current.getRootNode().tjOverlay ?? null), [anchor]);
  return overlay;
};

// A pack's select: its button names the list it opens (aria-controls), the list's first option takes the focus, and
// Escape closes it, as Radix's and MUI's lists do. `modal` draws a modal dialog instead.
const Picker = ({ modal = false }) => {
  const anchor = useRef(null);
  const list = useRef(null);
  const overlay = useOverlay(anchor);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) list.current?.querySelector('button')?.focus();
  }, [open]);
  return (
    <div ref={anchor}>
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? 'picker-list' : undefined}
        onClick={() => setOpen(true)}
      >
        Pick
      </button>
      {open && overlay
        ? createPortal(
            <div
              id="picker-list"
              ref={list}
              role={modal ? 'dialog' : 'listbox'}
              aria-modal={modal || undefined}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            >
              <button onClick={() => setOpen(false)}>Alpha</button>
              <button onClick={() => setOpen(false)}>Beta</button>
            </div>,
            overlay
          )
        : null}
    </div>
  );
};
const ModalPicker = () => <Picker modal />;

// A pack's date field: its calendar stays mounted and hides once a day is picked (display: none, as Ant's does).
const Calendar = () => {
  const anchor = useRef(null);
  const overlay = useOverlay(anchor);
  const [open, setOpen] = useState(false);
  return (
    <div ref={anchor}>
      <input aria-label="Date" onClick={() => setOpen(true)} />
      {overlay
        ? createPortal(
            <div className="calendar" style={{ display: open ? 'block' : 'none' }}>
              <button onClick={() => setOpen(false)}>15</button>
            </div>,
            overlay
          )
        : null}
    </div>
  );
};

const Field = () => <input aria-label="Next" />;

let mounts = 0;
// The widgets in page order, each a pack component drawn by the host.
const renderPage = async (...names) => {
  loadLibraryModule.mockResolvedValue({ Picker, ModalPicker, Calendar, Field });
  mounts += 1;
  const view = render(
    <div>
      {names.map((name, i) => (
        <InlineLibraryComponent
          key={name}
          bundleUrl="pack.js"
          cssUrl="pack.css"
          cacheKey={`tab-order-${mounts}`}
          componentName={name}
          componentProps={{}}
          componentStyles={{}}
          renderSlot={() => null}
          setExposedVariable={() => {}}
          fireEvent={() => {}}
          actions={new Map()}
          dataCy={`w${i}`}
        />
      ))}
    </div>
  );
  const roots = names.map((_, i) => view.container.querySelector(`[data-cy="w${i}"]`));
  await waitFor(() => roots.forEach((el) => expect(el.shadowRoot?.querySelector('button, input')).toBeTruthy()));
  return roots.map((el) => el.shadowRoot);
};

const layer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;
const option = (name) => [...(layer()?.querySelectorAll('button') ?? [])].find((b) => b.textContent === name);
// The focused element as the shadow root holding `el` sees it (document.activeElement is only the host).
const focusedIn = (root) => root.activeElement;

const openPicker = async (picker) => {
  fireEvent.click(picker.querySelector('button'));
  await waitFor(() => expect(layer()?.activeElement).toBe(option('Alpha')));
};

// A Tab the page's handlers saw; true when none of them took its default.
const tab = (el, init = {}) => fireEvent.keyDown(el, { key: 'Tab', ...init });

describe('Tab around a pack popup', () => {
  test('[PackComponent-TAB-001] the next control in the page goes through shadow roots and slots, leaving popup layers out', () => {
    // Break this catches: the order a popup's Tab continues in skipping a slot's components, going into another popup
    // layer, or landing on a control that takes no Tab (tabindex -1, disabled).
    document.body.innerHTML =
      '<div id="w1"></div><div class="tj-cc-popup-host"></div><div id="w2"><input id="slotted"></div><input id="after">';
    const w1 = document.getElementById('w1').attachShadow({ mode: 'open' });
    w1.innerHTML = '<input id="a"><button tabindex="-1">Show</button>';
    document.querySelector('.tj-cc-popup-host').attachShadow({ mode: 'open' }).innerHTML = '<button>Option</button>';
    const w2 = document.getElementById('w2').attachShadow({ mode: 'open' });
    w2.innerHTML = '<button disabled>Off</button><slot></slot><input id="inner">';

    expect(nextTabbable(w1.getElementById('a'))).toBe(document.getElementById('slotted'));
    expect(nextTabbable(document.getElementById('slotted'))).toBe(w2.getElementById('inner'));
    expect(nextTabbable(w2.getElementById('inner'))).toBe(document.getElementById('after'));
  });

  test('[PackComponent-TAB-002] Tab from the last option closes the list and goes on to the next component', async () => {
    // Break this catches: Tab from an open list going to the page after the canvas, or staying in the list.
    const [picker, field] = await renderPage('Picker', 'Field');
    await openPicker(picker);
    act(() => option('Beta').focus());

    expect(tab(option('Beta'))).toBe(false);

    await waitFor(() => expect(focusedIn(field)).toBe(field.querySelector('input')));
    expect(option('Alpha')).toBeUndefined();
  });

  test('[PackComponent-TAB-003] Shift+Tab from the first option closes the list and goes back to its button', async () => {
    const [picker] = await renderPage('Picker', 'Field');
    await openPicker(picker);

    expect(tab(option('Alpha'), { shiftKey: true })).toBe(false);

    await waitFor(() => expect(focusedIn(picker)).toBe(picker.querySelector('button')));
    expect(option('Alpha')).toBeUndefined();
  });

  test('[PackComponent-TAB-004] Tab between the options of an open list is left to the list', async () => {
    // Break this catches: the host taking every Tab in a popup, so a calendar's arrows and days could not be reached.
    const [picker] = await renderPage('Picker', 'Field');
    await openPicker(picker);

    expect(tab(option('Alpha'))).toBe(true);

    expect(option('Beta')).toBeTruthy();
  });

  test('[PackComponent-TAB-005] the Escape that closes the list stays in the popup layer', async () => {
    // Break this catches: the Escape sent to close a pack's list reaching the page, where a ToolJet Modal around the
    // widget closes on it.
    const [picker, field] = await renderPage('Picker', 'Field');
    const keys = [];
    const record = (e) => keys.push(e.key);
    document.addEventListener('keydown', record);
    try {
      await openPicker(picker);
      act(() => option('Beta').focus());
      tab(option('Beta'));
      await waitFor(() => expect(focusedIn(field)).toBe(field.querySelector('input')));
    } finally {
      document.removeEventListener('keydown', record);
    }

    // The list closed on the Escape, and the page saw neither key.
    expect(option('Alpha')).toBeUndefined();
    expect(keys).toEqual([]);
  });

  test('[PackComponent-TAB-006] a modal dialog in the layer keeps its own Tab order', async () => {
    const [picker] = await renderPage('ModalPicker', 'Field');
    await openPicker(picker);
    act(() => option('Beta').focus());

    expect(tab(option('Beta'))).toBe(true);

    expect(option('Beta')).toBeTruthy();
  });
});

describe('the focus when a pack popup hides with the focus in it', () => {
  // The calendar open, and a day in it focused by the press on it (Ant's calendar takes the focus that way).
  const pressDay = async (calendar) => {
    const input = calendar.querySelector('input');
    act(() => input.focus());
    fireEvent.click(input);
    const day = option('15');
    await waitFor(() => expect(drawn(day)).toBe(true));
    return day;
  };

  test('[PackComponent-TAB-007] goes back to the field that opened it, so Tab goes on from there', async () => {
    // Break this catches: a day picked in an Ant calendar leaving the focus on the page's body, so the next Tab
    // started over at the top of the page (the page's menu).
    const [calendar] = await renderPage('Calendar', 'Field');
    const day = await pressDay(calendar);
    fireEvent.pointerDown(day);
    act(() => day.focus());
    fireEvent.click(day);
    // The browser takes the focus off an element that stops being drawn.
    act(() => day.blur());

    await waitFor(() => expect(focusedIn(calendar)).toBe(calendar.querySelector('input')));
  });

  test('[PackComponent-TAB-008] stays where a press outside the popup put it', async () => {
    // Break this catches: the field taking the focus back from a click elsewhere on the page.
    const [calendar] = await renderPage('Calendar', 'Field');
    const day = await pressDay(calendar);
    act(() => day.focus());
    fireEvent.pointerDown(document.body);
    fireEvent.click(day);
    act(() => day.blur());
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));

    expect(focusedIn(calendar)).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });
});
