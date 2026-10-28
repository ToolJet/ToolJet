import React from 'react';
import { act, fireEvent, render, waitFor, within } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import * as mui from '../../../../../../../packs/mui/src/components/Select';
import {
  RadioGroup as MuiRadioGroup,
  ToggleButtonGroup as MuiToggleButtonGroup,
} from '../../../../../../../packs/mui/src/components/Selection';
import { List as MuiList } from '../../../../../../../packs/mui/src/components/Containers';
import { ListView } from '../../../../../../../packs/shadcn/src/components/ListView';

installBrowserStubs();

// Codex's browser-confirmed identity bugs in the Ant and MUI packs (2026-10-27): option widgets that told 1 from '1'
// apart on screen but not in what they exposed, and lists whose selection moved to another record when rows sharing an
// id were reordered. The pack components, the inline SDK and the host renderer are the real ones; only the module and
// CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const ant = require('../../../../../../../packs/antd/src/index.ts');

const PACKS = {
  ant,
  mui: {
    Select: mui.Select,
    Autocomplete: mui.Autocomplete,
    AutocompleteMultiple: mui.AutocompleteMultiple,
    RadioGroup: MuiRadioGroup,
    ToggleButtonGroup: MuiToggleButtonGroup,
    List: MuiList,
  },
  shadcn: { ListView },
};
let mounts = 0;

const mount = async (pack, name, props) => {
  loadLibraryModule.mockResolvedValue({ [name]: PACKS[pack][name] });
  const exposed = {};
  const events = [];
  const seen = [];
  const actions = new Map();
  const cacheKey = `identity-${pack}-${name}-${(mounts += 1)}`;
  const host = { ...makeHost(name, { validation: 'text' }), formField: true };
  const make = (p) => (
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
        seen.push({ event, exposed: JSON.parse(JSON.stringify(exposed)) });
      }}
      actions={actions}
      host={host}
      dataCy="identity-widget"
    />
  );
  const view = render(make(props));
  const root = () => view.container.querySelector('[data-cy="identity-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  await waitFor(() => expect(actions.size).toBeGreaterThan(0));
  const update = (p) => act(() => view.rerender(make(p)));
  const run = (action, ...args) => act(() => actions.get(action)(...args));
  return { root, exposed, events, seen, update, run };
};

const settle = () => act(() => new Promise((r) => setTimeout(r, 50)));

// Every element matching `selector` in the page, through open shadow roots (the popup layer is one).
const deepAll = (selector, root = document) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(selector, el.shadowRoot));
  return found;
};
const byText = (selector, text) => deepAll(selector).find((el) => el.textContent === text);

// Codex's fixture: two options whose values share their text in different types, a boolean, and a plain one.
const TYPED = [
  { label: 'Numeric one', value: 1 },
  { label: 'Text one', value: '1' },
  { label: 'Boolean false', value: false },
  { label: 'Other', value: 'other' },
];

let warn;
let error;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  error = jest.spyOn(console, 'error');
});
afterEach(() => {
  warn.mockRestore();
  error.mockRestore();
  document.body.innerHTML = '';
});
const warnings = (text) => warn.mock.calls.filter(([m]) => typeof m === 'string' && m.includes(text));
// React's duplicate-key warning, which names the key in a later argument.
const keyClashes = () =>
  error.mock.calls.filter((args) => args.some((a) => typeof a === 'string' && a.includes('same key')));

describe('Ant option widgets: 1 and "1" are two choices', () => {
  const openAnt = async (c) => {
    fireEvent.mouseDown(c.root().querySelector('.ant-select-selector'));
    await waitFor(() => expect(byText('.ant-select-item-option', 'Text one')).toBeTruthy());
  };
  const pickAnt = async (c, label) => {
    await openAnt(c);
    fireEvent.click(byText('.ant-select-item-option', label));
    await settle();
  };
  const shown = (c) => c.root().querySelector('.ant-select-selection-item')?.textContent;

  test.each([
    ['Text one', '1'],
    ['Numeric one', 1],
    ['Boolean false', false],
  ])('Select: a click on %s shows it and exposes its own value and option', async (label, value) => {
    const c = await mount('ant', 'Select', { options: TYPED, value: '' });
    await pickAnt(c, label);
    expect(shown(c)).toBe(label);
    expect(c.exposed.value).toBe(value);
    expect(c.exposed.selectedOption).toEqual({ label, value, disabled: false });
    // The onChange handler reads the same.
    const change = c.seen.find((s) => s.event === 'onChange');
    expect(change.exposed.value).toBe(value);
    expect(change.exposed.selectedOption.label).toBe(label);
  });

  test('Select: a bound value picks the option of its own type; the text "1" alone still picks the number 1', async () => {
    const c = await mount('ant', 'Select', { options: TYPED, value: '1' });
    await waitFor(() => expect(c.exposed.selectedOption).toEqual({ label: 'Text one', value: '1', disabled: false }));
    expect(shown(c)).toBe('Text one');
    c.update({ options: TYPED, value: 1 });
    await waitFor(() => expect(c.exposed.selectedOption.label).toBe('Numeric one'));
    expect(shown(c)).toBe('Numeric one');
    c.update({ options: [TYPED[0], TYPED[3]], value: '1' });
    await waitFor(() => expect(c.exposed.selectedOption.label).toBe('Numeric one'));
  });

  test('Select: setFieldValue keeps the type it is given, and a repeat of the value fires nothing', async () => {
    const c = await mount('ant', 'Select', { options: TYPED, value: '' });
    c.run('setFieldValue', '1');
    await settle();
    expect(c.exposed.value).toBe('1');
    expect(c.exposed.selectedOption.label).toBe('Text one');
    c.run('setFieldValue', 1);
    await settle();
    expect(c.exposed.value).toBe(1);
    expect(c.exposed.selectedOption.label).toBe('Numeric one');
    expect(c.events.filter((e) => e === 'onChange')).toHaveLength(2);
    c.run('setFieldValue', 1);
    expect(c.events.filter((e) => e === 'onChange')).toHaveLength(2);
  });

  test('Select multiple: both typed options can be picked, and each keeps its type', async () => {
    const c = await mount('ant', 'Select', { options: TYPED, value: [], mode: 'multiple' });
    await openAnt(c);
    fireEvent.click(byText('.ant-select-item-option', 'Text one'));
    await settle();
    fireEvent.click(byText('.ant-select-item-option', 'Numeric one'));
    await settle();
    expect(c.exposed.value).toEqual(['1', 1]);
    expect(c.exposed.selectedOptions.map((o) => o.label)).toEqual(['Text one', 'Numeric one']);
  });

  test('Select: options with the very same value draw apart and warn once', async () => {
    const twice = [
      { label: 'First', value: 'x' },
      { label: 'Second', value: 'x' },
    ];
    const c = await mount('ant', 'Select', { options: twice, value: '' });
    fireEvent.mouseDown(c.root().querySelector('.ant-select-selector'));
    await waitFor(() => expect(byText('.ant-select-item-option', 'Second')).toBeTruthy());
    expect(deepAll('.ant-select-item-option')).toHaveLength(2);
    c.update({ options: [...twice], value: '' });
    await settle();
    expect(warnings('more than one option has the value "x"')).toHaveLength(1);
    expect(keyClashes()).toHaveLength(0);
  });

  test('Combobox: a click on Text one exposes "1" and Text one', async () => {
    const c = await mount('ant', 'Combobox', { options: TYPED, value: '' });
    await pickAnt(c, 'Text one');
    expect(shown(c)).toBe('Text one');
    expect(c.exposed.value).toBe('1');
    expect(c.exposed.selectedOption).toEqual({ label: 'Text one', value: '1', disabled: false });
    expect(c.exposed.selectedLabel).toBe('Text one');
  });

  test('RadioGroup: a click on Text one checks it alone and exposes "1"', async () => {
    const c = await mount('ant', 'RadioGroup', { options: TYPED, value: '' });
    const wrapper = (label) =>
      [...c.root().querySelectorAll('.ant-radio-wrapper')].find((w) => w.textContent === label);
    fireEvent.click(wrapper('Text one').querySelector('input'));
    await settle();
    expect(c.exposed.value).toBe('1');
    expect([...c.root().querySelectorAll('.ant-radio-wrapper-checked')].map((w) => w.textContent)).toEqual([
      'Text one',
    ]);
    fireEvent.click(wrapper('Numeric one').querySelector('input'));
    await settle();
    expect(c.exposed.value).toBe(1);
    expect([...c.root().querySelectorAll('.ant-radio-wrapper-checked')].map((w) => w.textContent)).toEqual([
      'Numeric one',
    ]);
  });

  test('Segmented: a click on Text one selects it alone and exposes "1"', async () => {
    const c = await mount('ant', 'Segmented', { options: TYPED, value: 1 });
    const item = (label) => [...c.root().querySelectorAll('.ant-segmented-item')].find((w) => w.textContent === label);
    await waitFor(() =>
      expect(c.root().querySelector('.ant-segmented-item-selected')?.textContent).toBe('Numeric one')
    );
    fireEvent.click(item('Text one').querySelector('input'));
    await settle();
    expect(c.exposed.value).toBe('1');
    expect(c.root().querySelector('.ant-segmented-item-selected')?.textContent).toBe('Text one');
  });

  test('AutoComplete: typed options with one text draw apart, and a pick fills in the text', async () => {
    const c = await mount('ant', 'AutoComplete', { options: TYPED, value: '' });
    const input = c.root().querySelector('input');
    fireEvent.mouseDown(c.root().querySelector('.ant-select-selector'));
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.focus(input);
    await waitFor(() => expect(byText('.ant-select-item-option', 'Text one')).toBeTruthy());
    expect(['Numeric one', 'Text one'].every((l) => byText('.ant-select-item-option', l))).toBe(true);
    fireEvent.click(byText('.ant-select-item-option', 'Text one'));
    await settle();
    expect(c.exposed.value).toBe('1');
  });
});

describe('MUI option widgets: 1 and "1" are two choices', () => {
  const pickMui = async (c, label) => {
    fireEvent.mouseDown(c.root().querySelector('[role="combobox"]'));
    await waitFor(() => expect(byText('[role="option"]', label)).toBeTruthy());
    fireEvent.click(byText('[role="option"]', label));
    await settle();
  };
  const shown = (c) => c.root().querySelector('[role="combobox"]').textContent;

  test.each([
    ['Text one', '1'],
    ['Numeric one', 1],
    ['Boolean false', false],
  ])('Select: a click on %s shows it and exposes its own value and option', async (label, value) => {
    const c = await mount('mui', 'Select', { options: TYPED, value: '' });
    await pickMui(c, label);
    expect(shown(c)).toBe(label);
    expect(c.exposed.value).toBe(value);
    expect(c.exposed.selectedOption).toEqual({ label, value, disabled: false });
    const change = c.seen.find((s) => s.event === 'onChange');
    expect(change.exposed.selectedOption.label).toBe(label);
  });

  test('Select: a bound value picks the option of its own type; the text "1" alone still picks the number 1', async () => {
    const c = await mount('mui', 'Select', { options: TYPED, value: 1 });
    await waitFor(() => expect(c.exposed.selectedOption.label).toBe('Numeric one'));
    expect(shown(c)).toBe('Numeric one');
    c.update({ options: TYPED, value: '1' });
    await waitFor(() => expect(c.exposed.selectedOption.label).toBe('Text one'));
    c.update({ options: [TYPED[0], TYPED[3]], value: '1' });
    await waitFor(() => expect(c.exposed.selectedOption.label).toBe('Numeric one'));
  });

  test('Select: options with the very same value draw apart and warn once', async () => {
    const twice = [
      { label: 'First', value: 'x' },
      { label: 'Second', value: 'x' },
    ];
    const c = await mount('mui', 'Select', { options: twice, value: '' });
    fireEvent.mouseDown(c.root().querySelector('[role="combobox"]'));
    await waitFor(() => expect(byText('[role="option"]', 'Second')).toBeTruthy());
    expect(deepAll('[role="option"]')).toHaveLength(2);
    expect(warnings('more than one option has the value "x"')).toHaveLength(1);
    expect(keyClashes()).toHaveLength(0);
  });

  test('RadioGroup: a click on Text one checks it alone and exposes "1"', async () => {
    const c = await mount('mui', 'RadioGroup', { options: TYPED, value: '' });
    const radio = (label) => within(c.root()).getByLabelText(label);
    fireEvent.click(radio('Text one'));
    await settle();
    expect(c.exposed.value).toBe('1');
    expect(radio('Text one').checked).toBe(true);
    expect(radio('Numeric one').checked).toBe(false);
    fireEvent.click(radio('Boolean false'));
    await settle();
    expect(c.exposed.value).toBe(false);
  });

  test('ToggleButtonGroup: exclusive and multiple picks keep each value its type', async () => {
    const c = await mount('mui', 'ToggleButtonGroup', { options: TYPED, value: '', exclusive: true });
    const button = (label) => within(c.root()).getByText(label).closest('button');
    fireEvent.click(button('Text one'));
    await settle();
    expect(c.exposed.value).toBe('1');
    expect(button('Text one').getAttribute('aria-pressed')).toBe('true');
    expect(button('Numeric one').getAttribute('aria-pressed')).toBe('false');

    const m = await mount('mui', 'ToggleButtonGroup', { options: TYPED, value: [], exclusive: false });
    const mButton = (label) => [...m.root().querySelectorAll('button')].find((b) => b.textContent === label);
    fireEvent.click(mButton('Numeric one'));
    await settle();
    fireEvent.click(mButton('Text one'));
    await settle();
    expect(m.exposed.value).toEqual([1, '1']);
  });

  test('Autocomplete: a click on Text one exposes { label: Text one, value: "1" }', async () => {
    const c = await mount('mui', 'Autocomplete', { options: TYPED });
    fireEvent.mouseDown(c.root().querySelector('input'));
    await waitFor(() => expect(byText('[role="option"]', 'Text one')).toBeTruthy());
    fireEvent.click(byText('[role="option"]', 'Text one'));
    await settle();
    expect(c.exposed.value).toEqual({ label: 'Text one', value: '1' });
    expect(c.root().querySelector('input').value).toBe('Text one');
  });

  test('AutocompleteMultiple: both typed options can be picked', async () => {
    const c = await mount('mui', 'AutocompleteMultiple', { options: TYPED, value: [] });
    fireEvent.mouseDown(c.root().querySelector('input'));
    await waitFor(() => expect(byText('[role="option"]', 'Text one')).toBeTruthy());
    fireEvent.click(byText('[role="option"]', 'Text one'));
    await settle();
    fireEvent.click(byText('[role="option"]', 'Numeric one'));
    await settle();
    expect(c.exposed.value).toEqual([
      { label: 'Text one', value: '1' },
      { label: 'Numeric one', value: 1 },
    ]);
  });
});

// The three lists, with how each draws its rows and its selection, and the exposed id of the record { id: 2 } (the
// shadcn ListView exposes its id as text, as before).
const LISTS = [
  [
    'ant',
    'List',
    (rows) => ({ dataSource: rows }),
    '.ant-list-item',
    (el) => el.classList.contains('is-selected'),
    ['selectedItemKey', 2],
  ],
  [
    'mui',
    'List',
    (rows) => ({ items: rows }),
    '.MuiListItemButton-root',
    (el) => el.classList.contains('Mui-selected'),
    ['selectedItemKey', 2],
  ],
  [
    'shadcn',
    'ListView',
    (rows) => ({
      data: rows,
      idField: 'id',
      titleField: 'title',
      subtitleField: '',
      badgeField: '',
      actionLabel: '',
      showAvatar: false,
    }),
    '.u2l-list-item',
    (el) => el.classList.contains('is-selected'),
    ['selectedItemId', '2'],
  ],
];

describe.each(LISTS)(
  '%s %s: a selection on a repeated id never moves to another record',
  (pack, name, props, rowSel, isSelected, [idKey, idTwo]) => {
    const ALPHA = { id: 'same', title: 'Alpha' };
    const BETA = { id: 'same', title: 'Beta' };
    const rows = (c) => [...c.root().querySelectorAll(rowSel)];
    const drawnSelected = (c) =>
      rows(c)
        .filter(isSelected)
        .map((el) => el.textContent);
    const pickBeta = async (data = [ALPHA, BETA]) => {
      const c = await mount(pack, name, props(data));
      fireEvent.click(rows(c).find((el) => el.textContent.includes('Beta')));
      await settle();
      expect(c.exposed.selectedItem).toEqual(BETA);
      c.events.length = 0;
      return c;
    };

    test('a reverse keeps Beta selected (Codex repro)', async () => {
      const c = await pickBeta();
      c.update(props([BETA, ALPHA]));
      await settle();
      expect(c.exposed.selectedItem).toEqual(BETA);
      expect(drawnSelected(c)).toEqual([expect.stringContaining('Beta')]);
      expect(c.events).toEqual([]);
    });

    test('a same-order refresh keeps it, edited or not', async () => {
      const c = await pickBeta();
      c.update(props([{ ...ALPHA }, { ...BETA }]));
      await settle();
      expect(c.exposed.selectedItem).toEqual(BETA);
      const edited = [
        { ...ALPHA, n: 1 },
        { ...BETA, n: 2 },
      ];
      c.update(props(edited));
      await settle();
      expect(c.exposed.selectedItem).toEqual(edited[1]);
      expect(drawnSelected(c)).toEqual([expect.stringContaining('Beta')]);
    });

    test('a reverse that also edits Beta cannot be told from another record: the selection clears, with no event', async () => {
      const c = await pickBeta();
      c.update(props([{ ...BETA, n: 2 }, ALPHA]));
      await settle();
      expect(c.exposed.selectedItem).toEqual({});
      expect(drawnSelected(c)).toEqual([]);
      expect(c.events).toEqual([]);
    });

    test('Beta left alone with its id follows; Alpha left alone clears', async () => {
      const kept = await pickBeta();
      kept.update(props([BETA]));
      await settle();
      expect(kept.exposed.selectedItem).toEqual(BETA);
      expect(drawnSelected(kept)).toEqual([expect.stringContaining('Beta')]);

      const gone = await pickBeta();
      gone.update(props([ALPHA]));
      await settle();
      expect(gone.exposed.selectedItem).toEqual({});
    });

    test('two copies of the selected record cannot be told apart after a move: the selection clears', async () => {
      const c = await pickBeta();
      c.update(props([BETA, ALPHA, { ...BETA }]));
      await settle();
      // The key still names the second row of the id, which is now Alpha: not the record, and two rows are Beta.
      expect(c.exposed.selectedItem).toEqual({});
    });

    test('unique ids work as before: a reorder and an edit follow the record by id', async () => {
      const one = { id: 1, title: 'One' };
      const two = { id: 2, title: 'Two' };
      const c = await mount(pack, name, props([one, two]));
      fireEvent.click(rows(c).find((el) => el.textContent.includes('Two')));
      await settle();
      c.update(props([{ ...two, title: 'Two edited' }, one]));
      await settle();
      expect(c.exposed.selectedItem).toEqual({ id: 2, title: 'Two edited' });
      expect(c.exposed[idKey]).toBe(idTwo);
      expect(drawnSelected(c)).toEqual([expect.stringContaining('Two edited')]);
    });

    test('warns once that ids should be unique', async () => {
      const c = await mount(pack, name, props([ALPHA, BETA]));
      c.update(props([BETA, ALPHA]));
      await settle();
      const ours = warnings('ids should be unique');
      expect(ours).toHaveLength(1);
      expect(ours[0][0]).toContain('"same"');
    });
  }
);
