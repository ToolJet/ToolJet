// Property probes for the shadcn/ui pack (experiment): a property whose effect shows only in some state or after some
// interaction, with that state and interaction spelled out. Each probe mounts the widget twice through the real store,
// once with the property at its default and once with `value`, both in `context`, runs `steps`, and passes when the
// two differ (or `expect` holds). Shared by behaviours.spec.jsx.
import { act, fireEvent } from '@testing-library/react';
import { mountWidget } from './harness';

const settle = (ms = 60) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
const boxOf = (id) => document.querySelector(`[data-cy="draggable-widget-${id}"]`)?.parentElement || document.body;

/** Interaction steps, by name: what a user does to reveal the property. */
export const STEPS = {
  open: async (id) => {
    const trigger = boxOf(id).querySelector('[aria-haspopup], [role=combobox], button');
    if (!trigger) return;
    await act(async () => {
      fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse', ctrlKey: false });
      fireEvent.pointerUp(trigger, { button: 0, pointerType: 'mouse' });
      fireEvent.click(trigger);
    });
    await settle();
  },
  hover: async (id, selector) => {
    const target = (selector && boxOf(id).querySelector(selector)) || boxOf(id).firstElementChild || boxOf(id);
    await act(async () => {
      fireEvent.pointerEnter(target);
      fireEvent.mouseEnter(target);
      fireEvent.pointerMove(target);
      fireEvent.mouseOver(target);
      fireEvent.focus(target);
    });
    await settle(700);
  },
  escape: async () => {
    await act(async () => fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', keyCode: 27 }));
    await settle();
  },
  clickOutside: async () => {
    // A dialog's backdrop (react-bootstrap closes on a press on the .modal element itself), else the page.
    const target = document.querySelector('.modal') || document.body;
    await act(async () => {
      fireEvent.pointerDown(target, { button: 0 });
      fireEvent.mouseDown(target);
      fireEvent.mouseUp(target);
      fireEvent.click(target);
    });
    await settle();
  },
  focus: async (id) => {
    const el = boxOf(id).querySelector('input:not([type=hidden]), textarea') || boxOf(id).querySelector('button');
    await act(async () => {
      el?.focus?.();
      fireEvent.focus(el);
    });
    await settle();
  },
  wait: async (id, ms = 3500) => settle(ms),
  /** Clicks the nth match of a selector inside the widget (or the page), e.g. ['click', 'button', 0]. */
  click: async (id, selector, n = 0) => {
    const el = [...boxOf(id).querySelectorAll(selector), ...document.querySelectorAll(`body > * ${selector}`)][n];
    if (!el) throw new Error(`probe: nothing matches ${selector}`);
    await act(async () => {
      fireEvent.pointerDown(el, { button: 0, pointerType: 'mouse', ctrlKey: false });
      fireEvent.pointerUp(el, { button: 0, pointerType: 'mouse' });
      fireEvent.click(el);
    });
    await settle();
  },
  /** Loads every image in the widget, as the browser does once the src arrives. */
  load: async (id) => {
    await act(async () =>
      boxOf(id)
        .querySelectorAll('img')
        .forEach((img) => fireEvent.load(img))
    );
    await settle();
  },
  /** Fails every image in the widget, as a broken src does. */
  error: async (id) => {
    await act(async () =>
      boxOf(id)
        .querySelectorAll('img')
        .forEach((img) => fireEvent.error(img))
    );
    await settle();
  },
  /** A key on the widget's first focusable control (a slider thumb, an input). */
  keyDown: async (id, key, selector = '[role=slider], input, button, [tabindex]') => {
    const el = boxOf(id).querySelector(selector);
    await act(async () => {
      el?.focus?.();
      fireEvent.keyDown(el, { key });
    });
    await settle();
  },
  /** Drops files on the widget's file input: [name, type, content] each. */
  upload: async (id, files) => {
    const input = boxOf(id).querySelector('input[type=file]');
    const list = files.map(([name, type, content]) => new File([content], name, { type }));
    await act(async () => {
      fireEvent.change(input, { target: { files: list } });
    });
    await settle(400);
  },
  /** A double click on the nth match of a selector (its click first, as a browser sends). */
  dblclick: async (id, selector, n = 0) => {
    const el = [...boxOf(id).querySelectorAll(selector), ...document.querySelectorAll(`body > * ${selector}`)][n];
    if (!el) throw new Error(`probe: nothing matches ${selector}`);
    await act(async () => {
      fireEvent.click(el);
      fireEvent.click(el);
      fireEvent.doubleClick(el);
    });
    await settle();
  },
  /** The pointer entering the nth match of a selector. */
  mouseEnter: async (id, selector, n = 0) => {
    const el = [...boxOf(id).querySelectorAll(selector), ...document.querySelectorAll(`body > * ${selector}`)][n];
    if (!el) throw new Error(`probe: nothing matches ${selector}`);
    await act(async () => {
      fireEvent.mouseOver(el);
      fireEvent.mouseEnter(el);
      fireEvent.pointerEnter(el);
    });
    await settle();
  },
  /** Focuses the first match of a selector inside the widget. */
  focusOn: async (id, selector) => {
    const el = boxOf(id).querySelector(selector);
    if (!el) throw new Error(`probe: nothing matches ${selector}`);
    await act(async () => el.focus());
    await settle();
  },
  /** Clicks the innermost element (in the widget or a popup) whose own text is exactly `text`, or its button. */
  clickText: async (id, text) => {
    const all = [...boxOf(id).querySelectorAll('*'), ...document.querySelectorAll('body > * *')];
    const hit = all.find(
      (el) => el.textContent.trim() === text && ![...el.children].some((c) => c.textContent.trim() === text)
    );
    const el = hit?.closest('button, a, [role=button], [role=menuitem], [role=option], [role=tab]') || hit;
    if (!el) throw new Error(`probe: no element reads ${text}`);
    await act(async () => {
      fireEvent.pointerDown(el, { button: 0, pointerType: 'mouse', ctrlKey: false });
      fireEvent.pointerUp(el, { button: 0, pointerType: 'mouse' });
      fireEvent.click(el);
    });
    await settle();
  },
  /** A key pressed on the nth match of a selector (focused first), e.g. Enter on a select list's option. */
  keyOn: async (id, selector, n = 0, key = 'Enter') => {
    const el = [...boxOf(id).querySelectorAll(selector), ...document.querySelectorAll(`body > * ${selector}`)][n];
    if (!el) throw new Error(`probe: nothing matches ${selector}`);
    await act(async () => {
      el.focus?.();
      fireEvent.keyDown(el, { key });
    });
    await settle();
  },
  /** Focus leaving the page's focused element. */
  blur: async () => {
    await act(async () => {
      document.activeElement?.blur?.();
    });
    await settle();
  },
  /** A click inside a Recharts chart at a point (jsdom's mouse events carry no page coordinates, which it reads). */
  chartClick: async (id, x = 250, y = 120) => {
    const wrapper = boxOf(id).querySelector('.recharts-wrapper');
    if (!wrapper) throw new Error('probe: no chart');
    await act(async () => {
      for (const type of ['mousemove', 'click']) {
        const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
        Object.defineProperties(e, { pageX: { value: x }, pageY: { value: y } });
        fireEvent(wrapper, e);
      }
    });
    await settle();
  },
  type: async (id, text, selector = 'input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea') => {
    const input = boxOf(id).querySelector(selector) || document.querySelector(`body ${selector}`);
    await act(async () => fireEvent.change(input, { target: { value: text } }));
    await settle();
  },
};

// Steps that need the mounted widget itself: calling one of its exposed actions, or changing a property live (a
// query refetching new data).
const WIDGET_STEPS = {
  action: async (m, name, ...args) => {
    const useStore = require('@/AppBuilder/_stores/store').default;
    await act(async () => {
      await useStore
        .getState()
        .getExposedValueOfComponent(m.id, 'canvas')
        ?.[name]?.(...args);
    });
    await settle();
  },
  set: async (m, key, value) => m.change(key, value),
};

export const run = async (m, steps = []) => {
  for (const step of steps) {
    const [name, ...args] = Array.isArray(step) ? step : [step];
    if (WIDGET_STEPS[name]) await WIDGET_STEPS[name](m, ...args);
    else await STEPS[name](m.id, ...args);
  }
};

/** Runs one probe; returns { changed, a, b } with the two snapshots (or the expect result). */
export const runProbe = async ({
  widget,
  key,
  value,
  section = 'properties',
  context = {},
  steps = [],
  expect,
  offsetHeight,
}) => {
  const mountWith = async (extra) => {
    const m = await mountWidget(widget, {
      offsetHeight,
      properties: { ...(context.properties || {}), ...(section === 'properties' ? extra : {}) },
      styles: { ...(context.styles || {}), ...(section === 'styles' ? extra : {}) },
    });
    await run(m, steps);
    const snap = m.snapshot();
    const text =
      boxOf(m.id).textContent + [...document.querySelectorAll('body > *')].map((n) => n.textContent).join('');
    await m.unmount();
    return { ...snap, text };
  };
  const a = await mountWith({});
  const b = await mountWith({ [key]: value });
  if (expect) return { changed: !!expect(a, b), a, b };
  return { changed: a.geometry !== b.geometry || a.exposed !== b.exposed, a, b };
};
