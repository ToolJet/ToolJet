import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';

installBrowserStubs();

// Product decision 2026-10-25, the same in every pack: a value action that leaves the value as it is fires no change
// event; one that changes it fires exactly once. Values compare the way each component normalises them ('' and null
// are both empty, lists by content, dates by instant). packActions.spec.jsx checks it for every action of every
// component; this pins one valid call per component that changed, and Codex PERF-01's three text-field self-loops
// (a handler that clears the field on its own onChange) that now stop after one round.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const packs = {
  shadcn: require('../../../../../../../packs/shadcn/src/index.ts'),
  antd: require('../../../../../../../packs/antd/src/index.ts'),
  mui: require('../../../../../../../packs/mui/src/index.ts'),
};

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

let serial = 0;
async function mount(pack, name, { onEvent } = {}) {
  loadLibraryModule.mockResolvedValue({ [name]: packs[pack][name] });
  const actions = new Map();
  const exposed = {};
  const events = [];
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`${pack}-${name}.js`}
      cssUrl={`${pack}-${name}.css`}
      cacheKey={`same-value-${++serial}`}
      componentName={name}
      componentProps={{}}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(k, v) => {
        exposed[k] = v;
      }}
      actions={actions}
      host={makeHost(name, {})}
      dataCy="same-value"
      fireEvent={(event) => {
        events.push(event);
        onEvent?.(event, actions);
      }}
    />
  );
  const root = () => view.container.querySelector('[data-cy="same-value"]')?.shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.tj-cc-root')?.childElementCount).toBeGreaterThan(0));
  return { actions, exposed, events, root };
}

// [pack, component, action, a value different from the default, the change event]
const SETTERS = [
  ['shadcn', 'Input', 'setText', ['hello'], 'onChange'],
  ['shadcn', 'Textarea', 'setText', ['hello'], 'onChange'],
  ['shadcn', 'PasswordInput', 'setText', ['s3cret!'], 'onChange'],
  ['shadcn', 'NumberInput', 'setText', [7], 'onChange'],
  ['shadcn', 'CurrencyInput', 'setValue', [12], 'onChange'],
  ['shadcn', 'PhoneInput', 'setValue', ['+14155550123'], 'onChange'],
  ['shadcn', 'OtpInput', 'setText', ['1234'], 'onChange'],
  ['shadcn', 'Select', 'selectOption', [2], 'onSelect'],
  ['shadcn', 'Combobox', 'selectOption', ['ca'], 'onSelect'],
  ['shadcn', 'RadioGroup', 'selectOption', ['Premium'], 'onSelectionChange'],
  ['shadcn', 'ToggleGroup', 'setValue', ['Open'], 'onChange'],
  ['shadcn', 'Slider', 'setValue', [30], 'onChange'],
  ['shadcn', 'Switch', 'setValue', [true], 'onChange'],
  ['shadcn', 'Accordion', 'expand', [1], 'onExpand'],
  ['shadcn', 'Dialog', 'open', [], 'onOpen'],
  ['shadcn', 'Alert', 'dismiss', [], 'onClose'],
  ['shadcn', 'DataTable', 'setSort', ['name', 'desc'], 'onSort'],
  ['antd', 'Input', 'setFieldValue', ['hello'], 'onChange'],
  ['antd', 'TextArea', 'setFieldValue', ['hello'], 'onChange'],
  ['antd', 'InputNumber', 'setFieldValue', [5], 'onChange'],
  ['antd', 'Select', 'setFieldValue', ['engineering'], 'onChange'],
  ['antd', 'RadioGroup', 'setFieldValue', ['express'], 'onChange'],
  ['antd', 'Segmented', 'setFieldValue', ['weekly'], 'onChange'],
  ['antd', 'Rate', 'setFieldValue', [3], 'onChange'],
  ['antd', 'Slider', 'setFieldValue', [30], 'onChange'],
  ['antd', 'DatePicker', 'setFieldValue', ['2026-01-15'], 'onChange'],
  ['antd', 'TimePicker', 'setFieldValue', ['09:30'], 'onChange'],
  ['antd', 'AutoComplete', 'setFieldValue', ['Monitor arm'], 'onChange'],
  ['antd', 'Cascader', 'setFieldValue', [['europe', 'germany']], 'onChange'],
  ['antd', 'TreeSelect', 'setFieldValue', ['frontend'], 'onChange'],
  ['antd', 'Transfer', 'setFieldValue', [['orders']], 'onChange'],
  ['antd', 'Switch', 'setFieldValue', [true], 'onChange'],
  ['antd', 'Checkbox', 'setFieldValue', [true], 'onChange'],
  ['antd', 'ButtonGroup', 'setSelected', ['week'], 'onChange'],
  ['antd', 'Tabs', 'setActiveKey', ['tab2'], 'onChange'],
  ['antd', 'Steps', 'setCurrent', [2], 'onChange'],
  ['antd', 'Alert', 'dismiss', [], 'onClose'],
  ['mui', 'TextField', 'setValue', ['hello'], 'onChange'],
  ['mui', 'MultilineTextField', 'setValue', ['hello'], 'onChange'],
  ['mui', 'NumberField', 'setValue', [5], 'onChange'],
  ['mui', 'Select', 'setValue', ['pending'], 'onChange'],
  ['mui', 'Autocomplete', 'setValue', ['berlin'], 'onChange'],
  ['mui', 'AutocompleteMultiple', 'setValue', [['berlin']], 'onChange'],
  ['mui', 'RadioGroup', 'setValue', ['pro'], 'onChange'],
  ['mui', 'ToggleButtonGroup', 'setValue', ['week'], 'onChange'],
  ['mui', 'Rating', 'setValue', [3], 'onChange'],
  ['mui', 'Slider', 'setValue', [30], 'onChange'],
  ['mui', 'DatePicker', 'setValue', ['2026-01-15'], 'onChange'],
  ['mui', 'TimePicker', 'setValue', ['09:30'], 'onChange'],
  ['mui', 'Tabs', 'setValue', ['tab2'], 'onChange'],
  ['mui', 'Stepper', 'setActiveStep', [2], 'onChange'],
  ['mui', 'Switch', 'setChecked', [true], 'onChange'],
  ['mui', 'Checkbox', 'setChecked', [true], 'onChange'],
];

describe('a value setter fires once for a new value and nothing for the same one', () => {
  test.each(SETTERS)('%s %s.%s', async (pack, name, action, args, event) => {
    expect(packs[pack][name]).toBeDefined();
    const w = await mount(pack, name);
    await waitFor(() => expect(w.actions.has(action)).toBe(true));
    const count = () => w.events.filter((e) => e === event).length;
    w.events.length = 0;
    await act(async () => w.actions.get(action)(...args));
    expect(count()).toBe(1);
    w.events.length = 0;
    await act(async () => w.actions.get(action)(...args));
    expect(count()).toBe(0);
    // Twice in one batch, before React renders again: the second compares with the first.
    w.events.length = 0;
    await act(async () => {
      w.actions.get(action)(...args);
      w.actions.get(action)(...args);
    });
    expect(count()).toBe(0);
  });

  test.each([
    ['shadcn', 'Input', 'clear', 'onChange'],
    ['shadcn', 'Textarea', 'clear', 'onChange'],
    ['shadcn', 'NumberInput', 'clear', 'onChange'],
    ['shadcn', 'Select', 'clear', 'onSelect'],
    ['shadcn', 'Accordion', 'collapseAll', 'onChange'],
    ['shadcn', 'DataTable', 'clearFilters', 'onFilterChanged'],
    ['antd', 'Upload', 'clearFiles', 'onChange'],
    ['antd', 'ButtonGroup', 'clear', 'onChange'],
    ['mui', 'TextField', 'clear', 'onChange'],
    ['mui', 'Select', 'clear', 'onChange'],
  ])('%s %s.%s of what is already clear fires nothing', async (pack, name, action, event) => {
    const w = await mount(pack, name);
    await waitFor(() => expect(w.actions.has(action)).toBe(true));
    // The first clears whatever the component starts with (a NumberInput starts on 1); the second has nothing to clear.
    await act(async () => w.actions.get(action)());
    w.events.length = 0;
    await act(async () => w.actions.get(action)());
    expect(w.events.filter((e) => e === event)).toHaveLength(0);
  });

  test.each([
    ['antd', 'Steps', 'prev'],
    ['mui', 'Stepper', 'back'],
    ['mui', 'Stepper', 'reset'],
  ])('%s %s.%s at the first step fires nothing', async (pack, name, action) => {
    const w = await mount(pack, name);
    await waitFor(() => expect(w.actions.has(action)).toBe(true));
    w.events.length = 0;
    await act(async () => w.actions.get(action)());
    expect(w.events.filter((e) => e === 'onChange')).toHaveLength(0);
  });

  test('a value equal by normalisation is the same value (number input text "7.0" after 7)', async () => {
    const w = await mount('shadcn', 'NumberInput');
    await waitFor(() => expect(w.actions.has('setText')).toBe(true));
    await act(async () => w.actions.get('setText')(7));
    w.events.length = 0;
    await act(async () => w.actions.get('setText')('7.0'));
    expect(w.events.filter((e) => e === 'onChange')).toHaveLength(0);
  });
});

// Codex PERF-01: an onChange handler that clears its own field looped (each clear fired onChange again) until the
// host's event-burst cap. Now the clear of an empty field fires nothing, so the loop stops after one round.
describe('PERF-01: a text field cleared from its own onChange stops after one round', () => {
  test.each([
    ['shadcn', 'Input', 'clear', 'input'],
    ['antd', 'Input', 'resetFields', 'input'],
    ['mui', 'TextField', 'clear', 'input'],
  ])('%s %s: onChange -> %s', async (pack, name, action, selector) => {
    let rounds = 0;
    const w = await mount(pack, name, {
      onEvent: (event, actions) => {
        if (event !== 'onChange' || rounds > 50) return;
        rounds += 1;
        actions.get(action)?.();
      },
    });
    await waitFor(() => expect(w.actions.has(action)).toBe(true));
    const input = w.root().querySelector(selector);
    expect(input).toBeTruthy();
    await act(async () => {
      fireEvent.change(input, { target: { value: 'typed' } });
    });
    // The user's change, then the clear's: two rounds, not the cap.
    expect(rounds).toBe(2);
    expect(w.exposed.value).toBe('');
  });
});
