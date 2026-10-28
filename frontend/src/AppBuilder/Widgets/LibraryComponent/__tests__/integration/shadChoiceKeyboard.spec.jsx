import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import useStore from '@/AppBuilder/_stores/store';
import { Select } from '../../../../../../../packs/shadcn/src/components/Select';
import { RadioGroup } from '../../../../../../../packs/shadcn/src/components/RadioGroup';
import { ToggleGroup } from '../../../../../../../packs/shadcn/src/components/ToggleGroup';
import { MultiSelect } from '../../../../../../../packs/shadcn/src/components/MultiSelect';
import { Combobox } from '../../../../../../../packs/shadcn/src/components/Combobox';
import { DropdownMenu } from '../../../../../../../packs/shadcn/src/components/DropdownMenu';
import { KeyValue } from '../../../../../../../packs/shadcn/src/components/KeyValue';
import { Questionnaire } from '../../../../../../../packs/shadcn/src/components/Questionnaire';
import { SplitPane } from '../../../../../../../packs/shadcn/src/components/SplitPane';
import { installBrowserStubs } from '../fuzz/packTestEnv';

// The shadcn pack's choice, menu and layout components as the inline runtime draws them, inside a shadow root (pack audit
// SP-08, SP-21 to SP-24, SP-27, SP-29, SP-30, SP-37 and SP-38, 2026-10-23): a required choice valued false is valid, a
// removed "All" choice stays removed, keyboard focus moves within the shadow root, a guarded popup close is a whole close,
// and the KeyValue rows and the SplitPane separator work from the keyboard. The pack components, the inline SDK and the
// host renderer are the real ones; only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

beforeAll(() => {
  installBrowserStubs();
  // Radix's popper and Select call these, which jsdom lacks.
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
  if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
  if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  document.body.innerHTML = '';
});

const COMPONENTS = { Select, RadioGroup, ToggleGroup, MultiSelect, Combobox, DropdownMenu, KeyValue, Questionnaire, SplitPane };

// Mounts one pack component; `exposed` holds its exposed values, `events` the events it fired, `actions` its actions.
const mount = async (name, props, hostExtra = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const events = [];
  const actions = new Map();
  const host = {
    formField: true,
    fieldId: `kb-${name}`,
    disabled: false,
    loading: false,
    useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
    ...hostExtra,
  };
  const make = (componentProps) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`shad-kb-${name}`}
      componentName={name}
      componentProps={componentProps}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={actions}
      host={host}
      dataCy="pack-kb"
    />
  );
  const view = render(make(props));
  const widget = () => view.container.querySelector('[data-cy="pack-kb"]');
  const root = () => widget().shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ui')).toBeTruthy());
  return {
    exposed,
    events,
    root,
    widget,
    view,
    act: (action, ...args) => act(() => actions.get(action)(...args)),
    rerender: (next) => view.rerender(make(next)),
  };
};

// The focused element as the shadow root holding `el` sees it (document.activeElement is only the host).
const focusedIn = (el) => el.getRootNode().activeElement;
const key = (el, k, extra = {}) => fireEvent.keyDown(el, { key: k, composed: true, ...extra });
// A frame for the owner guard's per-frame check, and Radix's deferred focus moves.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));
// The popup layer the pack portals into: a shadow root of its own on the page.
const popupRoot = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;

describe('SP-08: a required single choice valued false', () => {
  it('Select hands the host a value its mandatory check counts as filled, and keeps the exposed value false', async () => {
    const calls = [];
    const { exposed } = await mount(
      'Select',
      { options: [{ label: 'False value', value: false }, { label: 'One', value: 1 }], defaultValue: false },
      {
        useValidation: (value, present) => {
          calls.push({ value, present });
          return { isValid: true, error: '', required: true, touch: () => {} };
        },
      }
    );
    await waitFor(() => expect(exposed.value).toBe(false));
    const last = calls[calls.length - 1];
    expect(last.present).toBe(true);
    // The host's own validator, as it judges a present value (usePackHost useHostValidation).
    const status = useStore.getState().validateWidget({
      validationObject: { mandatory: { value: true } },
      widgetValue: last.value,
      componentType: 'LibraryComponent',
    });
    expect(status.isValid).toBe(true);
  });
});

const ALL_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Alpha', value: 'alpha' },
  { label: 'Beta', value: 'beta' },
];
const WITHOUT_ALL = ALL_OPTIONS.slice(1);

describe('SP-21: a selected "All" choice (value \'\') that is removed', () => {
  test.each([
    ['Select', 'selectOption', (root) => root.querySelector('.uc-trigger').textContent.includes('All')],
    ['RadioGroup', 'selectOption', (root) => root.querySelector('[role="radio"][aria-checked="true"]') !== null],
    ['ToggleGroup', 'setSelected', (root) => root.querySelector('[data-state="on"]') !== null],
  ])('%s: stays deselected when it comes back', async (name, select, showsAll) => {
    const { exposed, root, rerender, act: run } = await mount(name, { options: ALL_OPTIONS, defaultValue: 'alpha' });
    await run(select, '');
    await waitFor(() => expect(showsAll(root())).toBe(true));
    rerender({ options: WITHOUT_ALL, defaultValue: 'alpha' });
    await waitFor(() => expect(showsAll(root())).toBe(false));
    rerender({ options: ALL_OPTIONS, defaultValue: 'alpha' });
    await settle();
    expect(showsAll(root())).toBe(false);
    if (name !== 'ToggleGroup') expect(exposed.selectedOption).toEqual({});
  });
});

describe('SP-22: keyboard focus inside the shadow root', () => {
  it('RadioGroup: ArrowDown moves to and selects the next enabled radio, once', async () => {
    const { exposed, events, root } = await mount('RadioGroup', {
      options: [
        { label: 'Alpha', value: 'alpha' },
        { label: 'Blocked', value: 'blocked', disabled: true },
        { label: 'Beta', value: 'beta' },
        { label: 'Gamma', value: 'gamma' },
      ],
      defaultValue: 'alpha',
    });
    const radios = () => Array.from(root().querySelectorAll('[role="radio"]'));
    act(() => radios()[0].focus());
    key(radios()[0], 'ArrowDown');
    await settle();
    expect(focusedIn(radios()[0])).toBe(radios()[2]);
    expect(exposed.value).toBe('beta');
    expect(events.filter((e) => e === 'onSelectionChange')).toEqual(['onSelectionChange']);
    key(radios()[2], 'End');
    await settle();
    expect(focusedIn(radios()[0])).toBe(radios()[3]);
    expect(exposed.value).toBe('gamma');
  });

  it('RadioGroup: Tab onto the group lands on the checked radio, not the last', async () => {
    const { root } = await mount('RadioGroup', { options: ['Alpha', 'Beta', 'Gamma'], defaultValue: 'Beta' });
    const group = root().querySelector('[role="radiogroup"]');
    act(() => group.focus());
    await settle();
    expect(focusedIn(group).getAttribute('aria-checked')).toBe('true');
    expect(focusedIn(group).getAttribute('data-choice-key')).toBe('Beta');
  });

  it('ToggleGroup: ArrowRight skips a disabled option to the next', async () => {
    const { root } = await mount('ToggleGroup', {
      options: [{ label: 'Alpha', value: 'alpha' }, { label: 'Blocked', value: 'blocked', disabled: true }, { label: 'Beta', value: 'beta' }],
      defaultValue: 'alpha',
    });
    const buttons = () => Array.from(root().querySelectorAll('button'));
    act(() => buttons()[0].focus());
    key(buttons()[0], 'ArrowRight');
    await settle();
    expect(focusedIn(buttons()[0])).toBe(buttons()[2]);
  });

  it('DropdownMenu: opened by keyboard starts on the first action; Home and End go to the ends', async () => {
    const { root } = await mount('DropdownMenu', {
      items: [
        { label: 'Edit', value: 'edit' },
        { label: 'Blocked', value: 'blocked', disabled: true },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Archive', value: 'archive' },
      ],
    });
    const trigger = root().querySelector('button');
    act(() => trigger.focus());
    key(trigger, 'Enter');
    await waitFor(() => expect(popupRoot()?.querySelector('[role="menu"]')).toBeTruthy());
    await settle();
    const items = () => Array.from(popupRoot().querySelectorAll('[role="menuitem"]'));
    const focused = () => focusedIn(items()[0]);
    expect(focused()).toBe(items()[0]);
    key(focused(), 'ArrowDown');
    await settle();
    expect(focused()).toBe(items()[2]);
    key(focused(), 'End');
    await settle();
    expect(focused()).toBe(items()[3]);
    key(focused(), 'Home');
    await settle();
    expect(focused()).toBe(items()[0]);
  });

  it('Questionnaire: ArrowDown moves from the focused answer to the next', async () => {
    const { root } = await mount('Questionnaire', {
      items: [{ name: 'pick', prompt: 'Pick one', type: 'single', choices: ['Alpha', 'Beta', 'Gamma'] }],
    });
    const cards = () => Array.from(root().querySelectorAll('[data-answer]'));
    act(() => cards()[1].focus());
    key(cards()[1], 'ArrowDown');
    expect(focusedIn(cards()[0])).toBe(cards()[2]);
  });
});

describe('SP-23: removing a MultiSelect chip from its focused Remove button', () => {
  it('keeps focus in the field, on the next chip\'s Remove', async () => {
    const { exposed, root } = await mount('MultiSelect', {
      options: [{ label: 'Alpha', value: 'alpha' }, { label: 'Beta', value: 'beta' }, { label: 'Gamma', value: 'gamma' }],
      defaultValue: ['alpha', 'beta'],
    });
    const remove = (label) => root().querySelector(`[aria-label="Remove ${label}"]`);
    act(() => remove('Alpha').focus());
    // A focused button's Enter is its click.
    fireEvent.click(remove('Alpha'));
    await waitFor(() => expect(exposed.values).toEqual(['beta']));
    expect(focusedIn(remove('Beta'))).toBe(remove('Beta'));
  });
});

describe('SP-24: a popup closed because its owner stopped taking input', () => {
  const disableOwner = (widget) => widget().parentElement.setAttribute('aria-disabled', 'true');
  const enableOwner = (widget) => widget().parentElement.removeAttribute('aria-disabled');

  test.each(['Combobox', 'MultiSelect'])('%s: empties the search, counts as a blur, and focuses again afterwards', async (name) => {
    const { events, root, widget } = await mount(name, {
      options: [{ label: 'Alpha', value: 'alpha' }, { label: 'Beta', value: 'beta' }],
      defaultValue: name === 'MultiSelect' ? [] : '',
    });
    const field = () => root().querySelector(name === 'Combobox' ? 'button[role="combobox"]' : '[role="combobox"]');
    act(() => field().focus());
    fireEvent.click(field());
    await waitFor(() => expect(popupRoot()?.querySelector('input')).toBeTruthy());
    const search = popupRoot().querySelector('input');
    act(() => search.focus());
    fireEvent.change(search, { target: { value: 'Beta' } });
    act(() => field().blur());
    await settle();
    const count = (e) => events.filter((x) => x === e).length;
    expect(count('onFocus')).toBe(1);
    disableOwner(widget);
    await waitFor(() => expect(popupRoot()?.querySelector('input')).toBeFalsy());
    await settle();
    expect(count('onBlur')).toBe(1);
    enableOwner(widget);
    act(() => field().focus());
    await settle();
    act(() => field().blur());
    await settle();
    expect(count('onFocus')).toBe(2);
    expect(count('onBlur')).toBe(2);
    fireEvent.click(field());
    await waitFor(() => expect(popupRoot()?.querySelector('input')).toBeTruthy());
    expect(popupRoot().querySelector('input').value).toBe('');
  });

  it('DropdownMenu: exposes isOpen false and fires onClose once', async () => {
    const { exposed, events, root, widget } = await mount('DropdownMenu', { items: ['Edit', 'Archive'] });
    const trigger = root().querySelector('button');
    act(() => trigger.focus());
    key(trigger, 'Enter');
    await waitFor(() => expect(exposed.isOpen).toBe(true));
    disableOwner(widget);
    await waitFor(() => expect(popupRoot()?.querySelector('[role="menu"]')).toBeFalsy());
    await settle();
    expect(exposed.isOpen).toBe(false);
    expect(events.filter((e) => e === 'onClose')).toEqual(['onClose']);
  });
});

describe('SP-27: an empty bound default', () => {
  it('MultiSelect: clears the earlier selection', async () => {
    const options = [{ label: 'Alpha', value: 'alpha' }, { label: 'Beta', value: 'beta' }];
    const { exposed, rerender } = await mount('MultiSelect', { options, defaultValue: ['alpha'] });
    await waitFor(() => expect(exposed.values).toEqual(['alpha']));
    rerender({ options, defaultValue: [] });
    await waitFor(() => expect(exposed.values).toEqual([]));
  });
});

describe('SP-29: KeyValue rows', () => {
  it('are one tab stop, move with the arrows and activate with Enter', async () => {
    const { exposed, events, root } = await mount('KeyValue', {
      data: [
        { label: 'Status', value: 'Active', type: 'badge' },
        { label: 'Plan', value: 'Pro' },
      ],
    });
    const rows = () => Array.from(root().querySelectorAll('.u2l-kv-row'));
    expect(rows().map((r) => r.tabIndex)).toEqual([0, -1]);
    expect(rows()[0].getAttribute('role')).toBe('button');
    act(() => rows()[0].focus());
    key(rows()[0], 'Enter');
    expect(events).toEqual(['onFieldClick']);
    expect(exposed.lastClickedField).toEqual({ label: 'Status', value: 'Active' });
    key(rows()[0], 'ArrowDown');
    expect(focusedIn(rows()[0])).toBe(rows()[1]);
    key(rows()[1], ' ');
    expect(exposed.lastClickedField).toEqual({ label: 'Plan', value: 'Pro' });
    expect(rows().map((r) => r.tabIndex)).toEqual([-1, 0]);
  });
});

describe('SP-30: a fixed-height Questionnaire', () => {
  it('scrolls within its box rather than clipping its footer', async () => {
    const { root } = await mount('Questionnaire', {});
    const box = root().querySelector('.ui2q-root');
    expect(box.style.maxHeight).toBe('100%');
    expect(box.style.overflowY).toBe('auto');
  });
});

describe('SplitPane', () => {
  const firstBasis = (root) => root().querySelector('.ui-split').firstElementChild?.style.flex ?? '';

  it('SP-37: setSplit(0) with minPane 0 draws and exposes 0', async () => {
    const { exposed, root, act: run } = await mount('SplitPane', { split: 40, minPane: 0 });
    await run('setSplit', 0);
    await waitFor(() => expect(exposed.split).toBe(0));
    const separator = root().querySelector('[role="separator"]');
    expect(separator.getAttribute('aria-valuenow')).toBe('0');
    expect(firstBasis(root)).toContain('calc(0% ');
  });

  it('SP-38: the separator is a tab stop that the arrows along its axis resize', async () => {
    const { exposed, events, root } = await mount('SplitPane', { split: 25, minPane: 15 });
    const separator = () => root().querySelector('[role="separator"]');
    expect(separator().tabIndex).toBe(0);
    expect(separator().getAttribute('aria-valuemin')).toBe('15');
    expect(separator().getAttribute('aria-valuemax')).toBe('85');
    act(() => separator().focus());
    key(separator(), 'ArrowRight');
    await waitFor(() => expect(exposed.split).toBe(26));
    expect(separator().getAttribute('aria-valuenow')).toBe('26');
    key(separator(), 'ArrowDown');
    expect(exposed.split).toBe(26);
    key(separator(), 'Home');
    await waitFor(() => expect(exposed.split).toBe(15));
    key(separator(), 'ArrowLeft');
    expect(events).toEqual(['onResize', 'onResize']);
  });
});

describe('a popup opened from inside a Dialog body', () => {
  it('DropdownMenu: stacks at the layer its owner declares (--ui-popup-layer)', async () => {
    const { root } = await mount('DropdownMenu', { items: ['Edit', 'Archive'] });
    root().querySelector('.ui').style.setProperty('--ui-popup-layer', '1010');
    const trigger = root().querySelector('button');
    act(() => trigger.focus());
    key(trigger, 'Enter');
    await waitFor(() => expect(popupRoot()?.querySelector('[role="menu"]')).toBeTruthy());
    expect(popupRoot().querySelector('[role="menu"]').style.zIndex).toBe('1010');
  });
});
