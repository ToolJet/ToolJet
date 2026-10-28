import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { fieldMeta } from '@/AppBuilder/RightSideBar/Inspector/Components/LibraryComponent/utils';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import {
  addKeys,
  keptOptions,
  keyForValue,
  optionKey,
  toChoiceOptions,
  uniqueKeys,
} from '../../../../../../../packs/shadcn/src/lib/ui2/choice/options';
import { groupButtons } from '../../../../../../../packs/shadcn/src/lib/ui2/nav/model';

installBrowserStubs();

// The team's Button, Button group and Toggle group findings on the shadcn pack (2026-10-27), and the shared choice
// options model behind Select, Combobox, MultiSelect, RadioGroup and Toggle group (options sharing a value). The pack
// components, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK = path.resolve(__dirname, '../../../../../../../packs/shadcn');
const SOURCE = require('../../../../../../../packs/shadcn/src/index.ts');
const MANIFEST = path.join(PACK, 'dist/manifest.json');
const manifestOrSkip = fs.existsSync(MANIFEST) ? describe : describe.skip;
const manifest = () => JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const prop = (component, name) => manifest().components[component].props.find((p) => p.name === name);

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

let serial = 0;
async function mount(name, props = {}, hostState = {}) {
  loadLibraryModule.mockResolvedValue({ [name]: SOURCE[name] });
  const actions = new Map();
  const exposed = {};
  const events = [];
  const cacheKey = `buttons-team-${++serial}`;
  const host = makeHost(name, {});
  const element = (p, h = hostState) => (
    <InlineLibraryComponent
      bundleUrl={`shadcn-${name}.js`}
      cssUrl={`shadcn-${name}.css`}
      cacheKey={cacheKey}
      componentName={name}
      componentProps={p}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(k, v) => {
        exposed[k] = v;
      }}
      actions={actions}
      host={{ ...host, ...h }}
      dataCy="team"
      fireEvent={(event) => events.push({ event, value: exposed.value, values: exposed.values })}
    />
  );
  const view = render(element(props));
  const root = () => view.container.querySelector('[data-cy="team"]')?.shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.tj-cc-root')?.childElementCount).toBeGreaterThan(0));
  const run = async (action, ...args) => {
    await waitFor(() => expect(actions.has(action)).toBe(true));
    await act(async () => actions.get(action)(...args));
  };
  return {
    actions,
    exposed,
    events,
    root,
    run,
    update: async (p, h) => {
      await act(async () => view.rerender(element(p, h)));
    },
  };
}

// A host validation that records what the component hands it.
const recordingValidation = () => {
  const calls = [];
  return {
    calls,
    last: () => calls[calls.length - 1],
    useValidation: (value, present) => {
      calls.push({ value, present });
      return { isValid: true, error: '', required: true, touch: () => {} };
    },
  };
};

const pressed = (root) => Array.from(root.querySelectorAll('button[aria-pressed="true"]')).map((b) => b.textContent);
const buttonNamed = (root, text) => Array.from(root.querySelectorAll('button')).find((b) => b.textContent === text);

describe('Button', () => {
  manifestOrSkip('legacy fields', () => {
    test.each(['disabled', 'loading', 'fullWidth'])('%s stays in the manifest, hidden from the inspector', (name) => {
      expect(prop('Button', name)).toEqual(expect.objectContaining({ inspector: 'hidden', default: false }));
    });
  });

  test('a saved Disable (legacy) still disables the button, as the host Disable does', async () => {
    const legacy = await mount('Button', { disabled: true });
    expect(legacy.root().querySelector('button').disabled).toBe(true);
    const host = await mount('Button', {}, { disabled: true });
    expect(host.root().querySelector('button').disabled).toBe(true);
    const neither = await mount('Button', { disabled: false });
    expect(neither.root().querySelector('button').disabled).toBe(false);
  });

  test('a saved Show spinner still draws the loading look, as the host Loading does', async () => {
    const legacy = await mount('Button', { loading: true });
    expect(legacy.root().querySelector('.n2-spinner')).not.toBeNull();
    expect(legacy.root().querySelector('button').disabled).toBe(true);
    const host = await mount('Button', {}, { loading: true });
    expect(host.root().querySelector('.n2-spinner')).not.toBeNull();
  });

  test('Stretch in flex container changes nothing: the button fills its box either way', async () => {
    const off = await mount('Button', { fullWidth: false });
    const offHtml = off.root().querySelector('.tj-cc-root').innerHTML;
    const on = await mount('Button', { fullWidth: true });
    expect(on.root().querySelector('.tj-cc-root').innerHTML).toBe(offHtml);
  });
});

manifestOrSkip('Theme radius styles draw as the number field', () => {
  test('Button radius: a number field (no blank-invalid code field), the placeholder kept for fx', () => {
    const radius = manifest().components.Button.styles.find((s) => s.name === 'borderRadius');
    expect(radius).toEqual(expect.objectContaining({ inspector: 'numberInput', placeholder: 'Theme radius' }));
    expect('default' in radius).toBe(false);
    expect(fieldMeta(radius).type).toBe('numberInput');
    expect(fieldMeta(radius).tip).toMatch(/theme radius/i);
  });

  test('every shadcn style with the Theme radius placeholder does the same', () => {
    const radii = Object.entries(manifest().components).flatMap(([name, c]) =>
      (c.styles ?? []).filter((s) => s.placeholder === 'Theme radius').map((s) => ({ component: name, ...s }))
    );
    expect(radii.length).toBeGreaterThan(10);
    expect(radii.filter((s) => s.inspector !== 'numberInput').map((s) => `${s.component}.${s.name}`)).toEqual([]);
  });
});

describe('ButtonGroup', () => {
  const CUSTOM = [
    { label: 'Low', value: 'low' },
    { label: 'High', value: 'high' },
  ];

  test('the sample default (week) with custom buttons is no selection: value empty, validation unselected', async () => {
    const v = recordingValidation();
    const g = await mount('ButtonGroup', { buttons: CUSTOM, value: 'week' }, { useValidation: v.useValidation });
    await waitFor(() => expect(g.exposed.value).toBe(''));
    expect(g.exposed.selected).toEqual([]);
    expect(pressed(g.root())).toEqual([]);
    expect(v.last().present).toBe(false);
  });

  test('the sample default on the sample buttons still selects Week', async () => {
    const v = recordingValidation();
    const g = await mount('ButtonGroup', { value: 'week' }, { useValidation: v.useValidation });
    await waitFor(() => expect(g.exposed.selected).toEqual(['week']));
    expect(g.exposed.value).toBe('week');
    expect(pressed(g.root())).toEqual(['Week']);
    expect(v.last().present).toBe(true);
  });

  test('buttons that drop the selected value empty it', async () => {
    const g = await mount('ButtonGroup', { buttons: CUSTOM, value: 'low' });
    await waitFor(() => expect(g.exposed.value).toBe('low'));
    await g.update({ buttons: [{ label: 'High', value: 'high' }], value: 'low' });
    await waitFor(() => expect(g.exposed.value).toBe(''));
  });

  test('Multiple: value is the list of selected values, as selected is', async () => {
    const g = await mount('ButtonGroup', { mode: 'multiple', value: 'week' });
    await waitFor(() => expect(g.exposed.value).toEqual([]));
    fireEvent.click(buttonNamed(g.root(), 'Day'));
    fireEvent.click(buttonNamed(g.root(), 'Month'));
    await waitFor(() => expect(g.exposed.value).toEqual(['day', 'month']));
    expect(g.exposed.selected).toEqual(['day', 'month']);
    expect(g.events.filter((e) => e.event === 'onChange').map((e) => e.value)).toEqual([['day'], ['day', 'month']]);
    await g.run('setSelected', ['week']);
    expect(g.exposed.value).toEqual(['week']);
    await g.run('clear');
    expect(g.exposed.value).toEqual([]);
  });

  test('Multiple: a default list selects and exposes the list', async () => {
    const g = await mount('ButtonGroup', { mode: 'multiple', defaultValue: '["day","week"]' });
    await waitFor(() => expect(g.exposed.value).toEqual(['day', 'week']));
    expect(pressed(g.root())).toEqual(['Day', 'Week']);
  });

  test('buttons sharing a value all draw, and select together by value', async () => {
    const error = jest.spyOn(console, 'error');
    const buttons = [
      { label: 'A', value: 'x' },
      { label: 'B', value: 'x' },
      { label: 'C', value: 'y' },
    ];
    const g = await mount('ButtonGroup', { buttons, value: '' });
    expect(Array.from(g.root().querySelectorAll('.n2-group > button')).map((b) => b.textContent)).toEqual(['A', 'B', 'C']);
    fireEvent.click(buttonNamed(g.root(), 'B'));
    await waitFor(() => expect(g.exposed.value).toBe('x'));
    expect(pressed(g.root())).toEqual(['A', 'B']);
    expect(g.exposed.lastClicked).toEqual({ label: 'B', value: 'x' });
    expect(error.mock.calls.flat().join(' ')).not.toMatch(/same key/);
    expect(groupButtons(buttons)).toHaveLength(3);
  });

  manifestOrSkip('legacy fields', () => {
    test('Disable (legacy) is hidden and Buttons only (legacy) is no longer offered', () => {
      expect(prop('ButtonGroup', 'disabled')).toEqual(expect.objectContaining({ inspector: 'hidden' }));
      expect(prop('ButtonGroup', 'mode').enumValues).toEqual(['actions', 'single', 'multiple']);
    });
  });

  test('a saved Buttons only (none) mode still acts as Actions, and a saved Disable (legacy) still disables', async () => {
    const none = await mount('ButtonGroup', { mode: 'none' });
    expect(none.root().querySelectorAll('button[aria-pressed]')).toHaveLength(0);
    await waitFor(() => expect(none.exposed.value).toBe(''));
    fireEvent.click(buttonNamed(none.root(), 'Day'));
    expect(none.events.map((e) => e.event)).toEqual(['onClick']);
    const off = await mount('ButtonGroup', { disabled: true });
    expect(Array.from(off.root().querySelectorAll('.n2-group > button')).every((b) => b.disabled)).toBe(true);
  });
});

describe('ToggleGroup: actions with Allow multiple', () => {
  test('setSelected takes a list or one value, setValue fires onChange, clear empties', async () => {
    const t = await mount('ToggleGroup', { multiple: true });
    await t.run('setSelected', ['Open', 'Closed']);
    await waitFor(() => expect(t.exposed.values).toEqual(['Open', 'Closed']));
    expect(Array.from(t.root().querySelectorAll('[data-state="on"]')).map((b) => b.textContent)).toEqual(['Open', 'Closed']);
    expect(t.events).toEqual([]);
    await t.run('setSelected', 'All');
    await waitFor(() => expect(t.exposed.values).toEqual(['All']));
    await t.run('setValue', ['Open']);
    await waitFor(() => expect(t.exposed.values).toEqual(['Open']));
    expect(t.events.map((e) => e.event)).toEqual(['onChange']);
    await t.run('setValue', 'Open');
    expect(t.events).toHaveLength(1);
    await t.run('setSelected', ['Nope']);
    expect(t.exposed.values).toEqual(['Open']);
    await t.run('clear');
    await waitFor(() => expect(t.exposed.values).toEqual([]));
    expect(t.root().querySelectorAll('[data-state="on"]')).toHaveLength(0);
  });

  test('single mode keeps its actions, and a list picks its first value', async () => {
    const t = await mount('ToggleGroup', {});
    await t.run('setSelected', ['Closed', 'Open']);
    await waitFor(() => expect(t.exposed.value).toBe('Closed'));
    await t.run('clear');
    await waitFor(() => expect(t.exposed.value).toBe(''));
  });
});

// Options sharing a value's text: 1 and '1' are two choices; the very same value twice is one choice drawn twice.
const SHARED = [
  { label: 'Number', value: 1 },
  { label: 'Text', value: '1' },
  { label: 'Again', value: 1 },
  { label: 'Two', value: 2 },
];

describe('choice options sharing a value', () => {
  test('the model keeps every option, keys 1 and "1" apart, and finds the option of a value\'s own type', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const options = toChoiceOptions(SHARED, 'Test');
    expect(options.map((o) => o.label)).toEqual(['Number', 'Text', 'Again', 'Two']);
    const keys = options.map((o) => optionKey(o));
    expect(keys[0]).toBe('1');
    expect(keys[1]).not.toBe('1');
    expect(keys[2]).toBe('1');
    expect(keyForValue(options, 1)).toBe(keys[0]);
    expect(keyForValue(options, '1')).toBe(keys[1]);
    expect(keyForValue(options, '2')).toBe('2'); // text still names a number option
    expect(uniqueKeys(keys)).toEqual(['1', keys[1], '1\u00021', '2']);
    expect(new Set(uniqueKeys(keys)).size).toBe(4);
    expect(keptOptions(options, [keys[0], keys[1]], null).map((o) => o.label)).toEqual(['Number', 'Text']);
    expect(addKeys([], [1, '1', 1], options)).toEqual([keys[0], keys[1]]);
    expect(warn.mock.calls.map((c) => c[0])).toEqual(['Test: more than one option has the value 1; they are drawn and selected as one value.']);
    toChoiceOptions(SHARED, 'Test');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['Select', 'selectOption'],
    ['Combobox', 'selectOption'],
    ['RadioGroup', 'selectOption'],
    ['ToggleGroup', 'setValue'],
  ])('%s: 1 and "1" select apart, keeping their type, with no key clash', async (name, action) => {
    const error = jest.spyOn(console, 'error');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const c = await mount(name, { options: SHARED, defaultValue: '' });
    await c.run(action, '1');
    await waitFor(() => expect(c.exposed.value).toBe('1'));
    await c.run(action, 1);
    await waitFor(() => expect(c.exposed.value).toBe(1));
    await c.run(action, 2);
    await waitFor(() => expect(c.exposed.value).toBe(2));
    expect(error.mock.calls.flat().join(' ')).not.toMatch(/same key|duplicate/i);
  });

  test('MultiSelect: 1 and "1" are two picks, the same value twice one', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const c = await mount('MultiSelect', { options: SHARED, defaultValue: [] });
    await c.run('selectOptions', [1, '1', 1]);
    await waitFor(() => expect(c.exposed.values).toEqual([1, '1']));
    await c.run('deselectOptions', ['1']);
    await waitFor(() => expect(c.exposed.values).toEqual([1]));
  });

  test('RadioGroup and ToggleGroup draw every option, the same value twice selected together', async () => {
    const error = jest.spyOn(console, 'error');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const radio = await mount('RadioGroup', { options: SHARED, defaultValue: 1 });
    expect(Array.from(radio.root().querySelectorAll('label')).map((l) => l.textContent)).toEqual(expect.arrayContaining(['Number', 'Text', 'Again', 'Two']));
    expect(radio.root().querySelectorAll('[role="radio"]')).toHaveLength(4);
    const ids = Array.from(radio.root().querySelectorAll('[role="radio"]')).map((r) => r.id);
    expect(new Set(ids).size).toBe(4);
    expect(radio.root().querySelectorAll('[role="radio"][aria-checked="true"]')).toHaveLength(2);
    const toggle = await mount('ToggleGroup', { options: SHARED, defaultValue: 1 });
    expect(Array.from(toggle.root().querySelectorAll('button')).map((b) => b.textContent)).toEqual(['Number', 'Text', 'Again', 'Two']);
    expect(Array.from(toggle.root().querySelectorAll('[data-state="on"]')).map((b) => b.textContent)).toEqual(['Number', 'Again']);
    expect(error.mock.calls.flat().join(' ')).not.toMatch(/same key/);
  });

  test('a default given as text still picks a number option', async () => {
    const c = await mount('Select', { options: [{ label: 'One', value: 1 }], defaultValue: '1' });
    await waitFor(() => expect(c.exposed.value).toBe(1));
  });
});
