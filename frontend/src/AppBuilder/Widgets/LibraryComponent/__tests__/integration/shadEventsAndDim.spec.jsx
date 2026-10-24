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
      fireEvent={(event) => events.push(event)}
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
  return { exposed, events, root, run, rerender: (p, h = host) => view.rerender(make(p, { ...host, ...h })) };
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
  const marker = (root) => root().querySelector('.tj-cc-root > template[data-tj-host-disabled]');

  it('Button: the marker comes first in the root while the host disables it, without remounting the button', async () => {
    const { root, rerender } = await mount('Button', { text: 'Save' });
    const button = root().querySelector('button');
    expect(marker(root)).toBeNull();
    rerender({ text: 'Save' }, { disabled: true });
    await waitFor(() => expect(marker(root)).toBeTruthy());
    expect(root().querySelector('.tj-cc-root').firstElementChild).toBe(marker(root));
    expect(root().querySelector('button')).toBe(button);
    expect(button.disabled).toBe(true);
    rerender({ text: 'Save' }, { disabled: false });
    await waitFor(() => expect(marker(root)).toBeNull());
  });

  // A part the component disables on its own (Stepper's Back on the first step) keeps its own dim: no marker.
  it("Stepper: Back on the first step is disabled by the component itself, and draws no marker", async () => {
    const { root } = await mount('Stepper', { steps: [{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }], currentStep: 'one' });
    const back = Array.from(root().querySelectorAll('button')).find((b) => b.textContent === 'Back');
    expect(back.disabled).toBe(true);
    expect(marker(root)).toBeNull();
  });

  test.each(['Input', 'Switch', 'Checkbox', 'Select', 'RadioGroup', 'Textarea', 'Slider'])(
    '%s: draws the marker while the host disables it',
    async (name) => {
      const { root } = await mount(name, {}, { disabled: true });
      await waitFor(() => expect(marker(root)).toBeTruthy());
    }
  );

  it('ui.css keeps every self-dimming control at full opacity after the marker, outranking the rules that dim it', () => {
    const css = fs.readFileSync(path.join(PACK_SRC, 'styles/ui.css'), 'utf8');
    const start = css.indexOf('template[data-tj-host-disabled] ~ :is(');
    expect(start).toBeGreaterThan(-1);
    const rule = css.slice(start, css.indexOf('}', start));
    expect(rule).toMatch(/opacity: 1;/);
    for (const part of ['.ui-btn', '.ui-input', '.ui-textarea', '.ui-select-trigger', '.ui-checkbox', '.ui-switch', '.ui-radio', '.ui-toggle', '.ui-slider', '.uc-select-trigger', '.ui2-otp', '.ui2-group'])
      expect(rule).toContain(part);
    // The carousel's end arrows are hidden (opacity 0), not dimmed: never shown again under the marker.
    expect(rule).not.toContain('.ui-carousel-arrow');
  });

  // The components the index leaves unwrapped read no control state; wrapping one would add a Disable field to it.
  it('the index wraps every component but Card, Form, Separator, Skeleton and Spinner', () => {
    const unwrapped = Object.entries(pack)
      .filter(([, c]) => typeof c === 'function' && !c.displayName)
      .map(([name]) => name)
      .sort();
    expect(unwrapped).toEqual(['Card', 'Form', 'Separator', 'Skeleton', 'Spinner']);
  });
});
