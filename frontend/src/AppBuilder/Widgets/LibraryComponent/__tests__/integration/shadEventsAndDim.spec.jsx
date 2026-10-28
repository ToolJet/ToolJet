import React from 'react';
import fs from 'fs';
import path from 'path';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule, toolJetSdk } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs } from '../fuzz/packTestEnv';

// The shadcn pack after the team's UI 2.0 review (R5, T6, T59; 2026-10-24): one user action fires one event, under the
// UI 2.0 name (the pack's earlier second names are gone); the OTP placeholder gives each box its own character; and a
// component the host disables carries the marker that keeps its self-dimming parts at full opacity, so it is dimmed
// once, by the host. The pack components (as the pack's index exports them), the inline SDK and the host renderer are
// the real ones; only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

installBrowserStubs();
const pack = require('../../../../../../../packs/shadcn/src/index.ts');
const PACK_SRC = path.resolve(__dirname, '../../../../../../../packs/shadcn/src');

beforeAll(() => {
  // Radix's popper calls these, which jsdom lacks.
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
  if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
  if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

let mounts = 0;
const HOST = {
  disabled: false,
  loading: false,
  useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
  setRows: () => {},
  rowSlotAttr: (index) => `tj-row-${index}`,
  registerPopupSlot: () => () => {},
  popupSlotAttr: (slot) => `tj-slot-${slot}`,
};

// One pack widget on the inline host; `events` holds what it fired, `run` calls one of its actions.
const mount = async (name, props = {}, hostExtra = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: pack[name] });
  const exposed = {};
  const events = [];
  // The exposed values as each event fired, for checks that a handler reads the new state.
  const seen = [];
  const actions = new Map();
  const cacheKey = `shad-events-${name}-${(mounts += 1)}`;
  const make = (p, h) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={cacheKey}
      componentName={name}
      componentProps={p}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => {
        events.push(event);
        seen.push({ event, exposed: { ...exposed } });
      }}
      actions={actions}
      host={h}
      dataCy="pack-events"
    />
  );
  const host = { ...HOST, fieldId: `ev-${name}`, ...hostExtra };
  const view = render(make(props, host));
  const root = () => view.container.querySelector('[data-cy="pack-events"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ui, [class*="ui"]')).toBeTruthy());
  const run = async (action, ...args) => {
    await waitFor(() => expect(actions.has(action)).toBe(true));
    await act(async () => {
      await actions.get(action)(...args);
    });
  };
  return { exposed, events, seen, root, run, rerender: (p, h = host) => view.rerender(make(p, { ...host, ...h })) };
};

// What a change fires, without the focus and blur a click may bring.
const changes = (events) => events.filter((e) => e !== 'onFocus' && e !== 'onBlur');

describe('R5: one user action fires one event, under the UI 2.0 name', () => {
  it('RadioGroup: selecting fires onSelectionChange only', async () => {
    const { events, run } = await mount('RadioGroup', { options: ['Alpha', 'Beta'], defaultValue: 'Alpha' });
    await run('selectOption', 'Beta');
    expect(changes(events)).toEqual(['onSelectionChange']);
  });

  it('Tabs: switching fires onTabSwitch only', async () => {
    const { events, run } = await mount('Tabs', {
      tabs: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      defaultTab: 'a',
    });
    await run('setTab', 'b');
    expect(changes(events)).toEqual(['onTabSwitch']);
  });

  it('TabsContainer: switching fires onTabSwitch only', async () => {
    const { events, run } = await mount('TabsContainer', {
      tabs: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ],
      defaultTab: 'a',
    });
    await run('setTab', 'b');
    expect(changes(events)).toEqual(['onTabSwitch']);
  });

  it('Checkbox: check fires onChange and onCheck, uncheck onChange and onUnCheck (not a third onUncheck)', async () => {
    const { events, run } = await mount('Checkbox', { label: 'Agree' });
    await run('toggle');
    expect(changes(events)).toEqual(['onChange', 'onCheck']);
    events.length = 0;
    await run('toggle');
    expect(changes(events)).toEqual(['onChange', 'onUnCheck']);
  });

  it('Alert: closing fires onClose only', async () => {
    const { events, run } = await mount('Alert', { title: 'Heads up', dismissible: true });
    await run('dismiss');
    expect(changes(events)).toEqual(['onClose']);
  });

  it('AccordionContainer: opening a section fires onExpand and onChange, not onToggle as well', async () => {
    const { events, run } = await mount('AccordionContainer', {
      sections: [
        { id: 'one', title: 'One' },
        { id: 'two', title: 'Two' },
      ],
      openSections: [],
    });
    await run('openSection', 'two');
    expect(changes(events)).toEqual(['onExpand', 'onChange']);
  });

  it('MultiSelect: removing a chip fires onSelect only', async () => {
    const { events, root } = await mount('MultiSelect', {
      options: [
        { label: 'Alpha', value: 'alpha' },
        { label: 'Beta', value: 'beta' },
      ],
      defaultValue: ['alpha', 'beta'],
    });
    fireEvent.click(root().querySelector('[aria-label="Remove Alpha"]'));
    await waitFor(() => expect(changes(events)).toEqual(['onSelect']));
  });

  it('Stepper: Finish on the last step fires onFinish only', async () => {
    const { events, root } = await mount('Stepper', {
      steps: [
        { id: 'one', label: 'One' },
        { id: 'two', label: 'Two' },
      ],
      currentStep: 'two',
    });
    const finish = () => Array.from(root().querySelectorAll('button')).find((b) => b.textContent === 'Finish');
    await waitFor(() => expect(finish()).toBeTruthy());
    fireEvent.click(finish());
    expect(changes(events)).toEqual(['onFinish']);
  });

  it('Timeline: clicking an item fires onItemClicked only', async () => {
    const { events, root } = await mount('Timeline', { items: [{ title: 'Placed' }, { title: 'Shipped' }] });
    fireEvent.click(root().querySelector('.n2-timeline-item'));
    expect(changes(events)).toEqual(['onItemClicked']);
  });

  // The earlier second names are no longer declared, so the inspector lists one event per behaviour.
  test.each([
    ['RadioGroup', 'onChange'],
    ['Tabs', 'onChange'],
    ['TabsContainer', 'onChange'],
    ['Checkbox', 'onUncheck'],
    ['Alert', 'onDismiss'],
    ['AccordionContainer', 'onToggle'],
    ['MultiSelect', 'onChange'],
    ['Stepper', 'onComplete'],
    ['Timeline', 'onItemClick'],
  ])('%s declares no %s', async (name, alias) => {
    const spy = jest.spyOn(toolJetSdk, 'useEventCallback');
    try {
      await mount(name);
      const declared = new Set(spy.mock.calls.map(([options]) => options.name));
      expect(declared.size).toBeGreaterThan(0);
      expect(declared.has(alias)).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('T59: the OTP placeholder gives each box its own character', () => {
  const boxes = (root) => Array.from(root().querySelectorAll('[data-slot="otp"]')).map((b) => b.textContent);

  it("'123456' reads 1 2 3 4 5 6 across six boxes", async () => {
    const { root } = await mount('OtpInput', { length: 6, placeholder: '123456' });
    expect(boxes(root)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('a single character fills every box', async () => {
    const { root } = await mount('OtpInput', { length: 4, placeholder: '-' });
    expect(boxes(root)).toEqual(['-', '-', '-', '-']);
  });

  it('a placeholder shorter than the code leaves the remaining boxes empty', async () => {
    const { root } = await mount('OtpInput', { length: 4, placeholder: '12' });
    expect(boxes(root)).toEqual(['1', '2', '', '']);
  });
});

describe('T6: a host-disabled component is dimmed once, by the host', () => {
  // The host marks the component's root while it disables it; the pack's CSS reads the mark, so the pack exports
  // its components plainly (no wrapper) and the CLI's static build sees them.
  const marked = (root) => root().querySelector('.tj-cc-root[data-tj-host-disabled]');

  it('Button: the host marks the root while it disables it, without remounting the button', async () => {
    const { root, rerender } = await mount('Button', { text: 'Save' });
    const button = root().querySelector('button');
    expect(marked(root)).toBeNull();
    rerender({ text: 'Save' }, { disabled: true });
    await waitFor(() => expect(marked(root)).toBeTruthy());
    expect(root().querySelector('button')).toBe(button);
    expect(button.disabled).toBe(true);
    rerender({ text: 'Save' }, { disabled: false });
    await waitFor(() => expect(marked(root)).toBeNull());
  });

  // A part the component disables on its own (Stepper's Back on the first step) keeps its own dim: no mark.
  it('Stepper: Back on the first step is disabled by the component itself, and the root is not marked', async () => {
    const { root } = await mount('Stepper', {
      steps: [
        { id: 'one', label: 'One' },
        { id: 'two', label: 'Two' },
      ],
      currentStep: 'one',
    });
    const back = Array.from(root().querySelectorAll('button')).find((b) => b.textContent === 'Back');
    expect(back.disabled).toBe(true);
    expect(marked(root)).toBeNull();
  });

  test.each(['Input', 'Switch', 'Checkbox', 'Select', 'RadioGroup', 'Textarea', 'Slider'])(
    '%s: the root is marked while the host disables it',
    async (name) => {
      const { root } = await mount(name, {}, { disabled: true });
      await waitFor(() => expect(marked(root)).toBeTruthy());
    }
  );

  it('ui.css keeps every self-dimming control at full opacity under the mark, outranking the rules that dim it', () => {
    const css = fs.readFileSync(path.join(PACK_SRC, 'styles/ui.css'), 'utf8');
    const start = css.indexOf('.tj-cc-root[data-tj-host-disabled] :is(');
    expect(start).toBeGreaterThan(-1);
    const rule = css.slice(start, css.indexOf('}', start));
    expect(rule).toMatch(/opacity: 1;/);
    for (const part of [
      '.ui-btn',
      '.ui-input',
      '.ui-textarea',
      '.ui-select-trigger',
      '.ui-checkbox',
      '.ui-switch',
      '.ui-radio',
      '.ui-toggle',
      '.ui-slider',
      '.uc-select-trigger',
      '.ui2-otp',
      '.ui2-group',
    ])
      expect(rule).toContain(part);
    // The carousel's end arrows are hidden (opacity 0), not dimmed: never shown again under the mark.
    expect(rule).not.toContain('.ui-carousel-arrow');
  });

  it('the index exports every component plainly, with no wrapper', () => {
    const wrapped = Object.entries(pack)
      .filter(([, c]) => typeof c === 'function' && c.displayName)
      .map(([name]) => name);
    expect(wrapped).toEqual([]);
  });
});

// The shared popup layer every popup of the pack portals into.
const popupLayer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;

describe('Q6: a Dialog handler reads the dialog as closed', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const openDialog = async () => {
    const t = await mount('Dialog', { title: 'Synthetic dialog', cancelText: 'Cancel', confirmText: 'Continue' });
    await t.run('open');
    await waitFor(() => expect(popupLayer()?.querySelector('[role="dialog"]')).toBeTruthy());
    expect(t.exposed).toMatchObject({ isOpen: true, show: true });
    return t;
  };
  const button = (label) => [...popupLayer().querySelectorAll('button')].find((b) => b.textContent === label);
  const closedAt = (seen, event) => seen.find((s) => s.event === event)?.exposed;

  it('Cancel: onCancel and onClose see show and isOpen false', async () => {
    const t = await openDialog();
    fireEvent.click(button('Cancel'));
    await waitFor(() => expect(t.events).toContain('onClose'));
    for (const event of ['onCancel', 'onClose'])
      expect(closedAt(t.seen, event)).toMatchObject({ isOpen: false, show: false });
  });

  it('Confirm: onConfirm and onClose see show and isOpen false', async () => {
    const t = await openDialog();
    fireEvent.click(button('Continue'));
    await waitFor(() => expect(t.events).toContain('onClose'));
    for (const event of ['onConfirm', 'onClose'])
      expect(closedAt(t.seen, event)).toMatchObject({ isOpen: false, show: false });
  });

  it('the close action: onClose sees show false, and open sets show true before onOpen', async () => {
    const t = await openDialog();
    expect(closedAt(t.seen, 'onOpen')).toMatchObject({ isOpen: true, show: true });
    await t.run('close');
    expect(closedAt(t.seen, 'onClose')).toMatchObject({ isOpen: false, show: false });
  });
});

describe('UI2-12: each tab names its panel and each panel its tab', () => {
  // The active tab's id, aria-controls to a role=tabpanel in the same shadow root, aria-labelledby back to the tab.
  const linked = (root) => {
    const tab = root().querySelector('[role="tab"][aria-selected="true"]');
    const panel = tab?.getAttribute('aria-controls') ? root().getElementById(tab.getAttribute('aria-controls')) : null;
    return {
      id: tab?.id,
      panelRole: panel?.getAttribute('role'),
      labelledBy: panel?.getAttribute('aria-labelledby'),
      hidden: panel?.hidden,
    };
  };

  it.each([
    [
      'Tabs',
      {
        tabs: [
          { value: 'a b', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        defaultTab: 'a b',
      },
    ],
    [
      'TabsContainer',
      {
        tabs: [
          { id: 'a b', title: 'A' },
          { id: 'b', title: 'B' },
        ],
        defaultTab: 'a b',
      },
    ],
  ])('%s: the active tab and its panel point at each other, ids scoped to the widget', async (name, props) => {
    const { root, run } = await mount(name, props);
    for (const next of ['a b', 'b']) {
      await run('setTab', next);
      const link = linked(root);
      expect(link.id).toMatch(new RegExp(`^ev-${name}-tab-`));
      // An id cannot hold a space in an IDREF list.
      expect(link.id).not.toMatch(/\s/);
      expect(link).toMatchObject({ panelRole: 'tabpanel', labelledBy: link.id, hidden: false });
    }
  });

  it('two Tabs on one page draw different tab ids', async () => {
    const a = await mount('Tabs', {}, { fieldId: 'tj-pack-one' });
    const b = await mount('Tabs', {}, { fieldId: 'tj-pack-two' });
    expect(a.root().querySelector('[role="tab"]').id).not.toBe(b.root().querySelector('[role="tab"]').id);
  });
});

describe('T9, T1: smaller shadcn items', () => {
  it('Tabs shows "Steps in order only" with the Steps style only', async () => {
    const spy = jest.spyOn(toolJetSdk, 'useStateBoolean');
    try {
      await mount('Tabs');
      const options = spy.mock.calls.map(([o]) => o).find((o) => o.name === 'linearSteps');
      expect(options.visibleWhen).toEqual({ key: 'variant', value: 'steps' });
    } finally {
      spy.mockRestore();
    }
  });

  // The sample content at the default drop, in whole rows: List view left a 64px band and Accordion 17px (Chrome).
  it.each([
    ['ListView', 24],
    ['Accordion', 17],
  ])('%s drops at %i rows', async (name, rows) => {
    const spy = jest.spyOn(toolJetSdk, 'useComponentSettings');
    try {
      await mount(name);
      expect(spy.mock.calls[0][0].defaultHeight).toBe(rows);
    } finally {
      spy.mockRestore();
    }
  });
});
