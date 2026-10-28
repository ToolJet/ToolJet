import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import FormSignalContext from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { hostValidation } from './fuzz/hostValidation';
import { slotNames } from '../../../../../../packs/antd/src/lib/slots';
import { ownerAvailable } from '../../../../../../packs/antd/src/lib/useOwnerGuard';

installBrowserStubs();

// The Ant pack's own source on the real inline SDK, host renderer and Form signal (only module and CSS loading is
// replaced), checked against the bug classes an audit of the sibling shadcn pack found (2026-10-23).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

let mounts = 0;
// Renders one pack component and returns its shadow root, what it exposed, the events it fired and its actions.
const mount = async (name, props = {}, { formField = true, disabled = false, useValidation, styles = {} } = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const events = [];
  const actions = new Map();
  const host = {
    ...makeHost(name, { validation: formField ? 'text' : undefined }),
    disabled,
    useValidation:
      useValidation ??
      hostValidation((key, value) => {
        exposed[key] = value;
      }),
  };
  let state = { props, clearCount: 0, host };
  // The exposed values as each event fired, for checks that a handler reads the new state.
  const seen = [];
  const view = { exposed, events, actions, seen };
  const element = () => (
    <FormSignalContext.Provider value={{ clearCount: state.clearCount, submitAttemptCount: 0 }}>
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey="ant-hardening"
        componentName={name}
        componentProps={state.props}
        componentStyles={styles}
        renderSlot={() => null}
        setExposedVariable={(key, value) => {
          exposed[key] = value;
        }}
        fireEvent={(event) => {
          events.push(event);
          seen.push({ event, exposed: { ...exposed } });
        }}
        actions={actions}
        host={state.host}
        dataCy={`ant-${mounts}`}
      />
    </FormSignalContext.Provider>
  );
  const rendered = render(element());
  const rerender = (next) => {
    state = { ...state, ...next };
    act(() => rendered.rerender(element()));
  };
  view.root = () => rendered.container.querySelector('[data-cy^="ant-"]').shadowRoot;
  view.wrapper = rendered.container;
  view.setProps = (next) => rerender({ props: { ...state.props, ...next } });
  view.clearForm = () => rerender({ clearCount: state.clearCount + 1 });
  view.setHost = (next) => rerender({ host: { ...state.host, ...next } });
  view.run = (action, ...args) => act(() => actions.get(action)(...args));
  view.unmount = () => rendered.unmount();
  await waitFor(() => expect(view.root()?.querySelector('.tj-ant-root')).toBeTruthy());
  return view;
};

// The popup layer the pack portals its lists, pickers and dialogs into.
const layer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;

afterEach(() => {
  document.body.innerHTML = '';
});

const input = (v) => v.root().querySelector('input');
const settle = () => act(() => new Promise((r) => setTimeout(r, 50)));

const OPTIONS = [
  { label: 'One', value: 'one' },
  { label: 'Two', value: 'two' },
];
const TREE = [{ title: 'Parent', value: 'parent', children: [{ title: 'Child', value: 'child' }] }];
const CASCADE = [{ label: 'Europe', value: 'europe', children: [{ label: 'Lisbon', value: 'lisbon' }] }];
const text = (v) => v.root().textContent;
const inputs = (v) => [...v.root().querySelectorAll('input')].map((el) => el.value).join('|');
const checked = (v) =>
  v.root().querySelectorAll('.ant-radio-wrapper-checked, .ant-checkbox-wrapper-checked, .ant-switch-checked').length;

// [component, props, what it shows while filled, the exposed values a clear empties]
const FIELDS = [
  ['Input', { value: 'hello' }, (v) => inputs(v).includes('hello'), { value: '' }],
  ['TextArea', { value: 'hello' }, (v) => v.root().querySelector('textarea').value === 'hello', { value: '' }],
  ['InputNumber', { value: 42 }, (v) => inputs(v).includes('42'), { value: null }],
  ['Select', { options: OPTIONS, value: 'two' }, (v) => text(v).includes('Two'), { value: '', selectedOption: {} }],
  // jsdom has no widths, so a responsive tag row draws no tags (the single Select checks what is drawn).
  [
    'Select',
    { options: OPTIONS, mode: 'multiple', value: ['one'] },
    (v) => v.exposed.selectedOptions?.length === 1,
    { value: [] },
  ],
  [
    'Combobox',
    { options: OPTIONS, value: 'two' },
    (v) => text(v).includes('Two'),
    { value: '', selectedOption: {}, selectedLabel: '' },
  ],
  ['DatePicker', { value: '2026-10-23' }, (v) => inputs(v).includes('2026-10-23'), { value: '' }],
  ['TimePicker', { value: '09:30' }, (v) => inputs(v).includes('09:30'), { value: '' }],
  ['RangePicker', { value: ['2026-10-01', '2026-10-09'] }, (v) => inputs(v).includes('2026-10-01'), { value: [] }],
  ['AutoComplete', { value: 'Laptop stand' }, (v) => inputs(v).includes('Laptop'), { value: '' }],
  ['TreeSelect', { treeData: TREE, value: 'child' }, (v) => text(v).includes('Child'), { value: '' }],
  ['TreeSelect', { treeData: TREE, multiple: true, value: ['child'] }, (v) => text(v).includes('Child'), { value: [] }],
  ['Cascader', { options: CASCADE, value: ['europe', 'lisbon'] }, (v) => text(v).includes('Lisbon'), { value: [] }],
  ['RadioGroup', { options: OPTIONS, value: 'one' }, (v) => checked(v) > 0, { value: '' }],
  [
    'Segmented',
    { options: OPTIONS, value: 'one' },
    (v) => !!v.root().querySelector('.ant-segmented-item-selected'),
    { value: '' },
  ],
  ['Rate', { value: 3 }, (v) => v.root().querySelectorAll('.ant-rate-star-full').length === 3, { value: null }],
  ['Checkbox', { checked: true }, (v) => checked(v) > 0, { checked: false }],
  ['Switch', { checked: true }, (v) => checked(v) > 0, { checked: false }],
  ['OTP', { value: '123456' }, (v) => inputs(v).replace(/\|/g, '') === '123456', { value: '', isComplete: false }],
  ['CurrencyInput', { value: 1250 }, (v) => inputs(v).includes('1,250'), { value: null, formattedValue: '' }],
  ['PhoneInput', { value: '+14155550123' }, (v) => inputs(v).includes('415'), { value: '', isValidNumber: false }],
  ['Password', { value: 'Secret#123' }, (v) => inputs(v).includes('Secret'), { value: '', strength: '' }],
  [
    'Transfer',
    { targetKeys: ['orders'] },
    (v) => v.root().querySelectorAll('.ant-transfer-list')[1].textContent.includes('Orders'),
    { targetKeys: [] },
  ],
];

describe('a Form clear (clearForm)', () => {
  test.each(FIELDS)('%s: empties what it shows and every value it exposes', async (name, props, shows, cleared) => {
    const v = await mount(name, props);
    await waitFor(() => expect(shows(v)).toBe(true));
    v.clearForm();
    await settle();
    await waitFor(() => expect(shows(v)).toBe(false));
    for (const [key, value] of Object.entries(cleared)) expect([key, v.exposed[key]]).toEqual([key, value]);
  });

  it('Upload: drops a pick still being read, so the cleared Form stays empty', async () => {
    const v = await mount('Upload', { multiple: true });
    const file = new File(['café'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(v.root().querySelector('input[type=file]'), { target: { files: [file] } });
    v.clearForm();
    await settle();
    expect(v.exposed.fileList).toEqual([]);
    expect(v.root().querySelectorAll('.ant-upload-list-item')).toHaveLength(0);
  });
});

describe('an Upload', () => {
  it('exposes a text file as UTF-8 text, and the same file picked twice as two entries', async () => {
    const v = await mount('Upload', { multiple: true });
    const pick = () =>
      fireEvent.change(v.root().querySelector('input[type=file]'), {
        target: { files: [new File(['café'], 'notes.txt', { type: 'text/plain', lastModified: 1 })] },
      });
    pick();
    await waitFor(() => expect(v.exposed.fileList?.length).toBe(1));
    pick();
    await waitFor(() => expect(v.exposed.fileList?.length).toBe(2));
    expect(v.exposed.fileList[0].content).toBe('café');
    expect(v.exposed.fileList[0].uid).not.toBe(v.exposed.fileList[1].uid);
  });

  it('fires nothing for a read that finishes after it is gone', async () => {
    const v = await mount('Upload', {});
    fireEvent.change(v.root().querySelector('input[type=file]'), {
      target: { files: [new File(['x'], 'a.txt', { type: 'text/plain' })] },
    });
    v.unmount();
    await settle();
    expect(v.events).not.toContain('onChange');
  });
});

describe('an emptied bound value', () => {
  test.each([
    ['Select', { options: OPTIONS, value: 'two' }, (v) => text(v).includes('Two'), { selectedOption: {} }],
    ['Combobox', { options: OPTIONS, value: 'two' }, (v) => text(v).includes('Two'), { selectedLabel: '' }],
    ['DatePicker', { value: '2026-10-23' }, (v) => inputs(v).includes('2026-10-23'), {}],
    ['OTP', { value: '123456' }, (v) => inputs(v).includes('1'), { isComplete: false }],
    [
      'Calendar',
      { value: '2026-10-23' },
      (v) => !!v.root().querySelector('.ant-picker-cell-selected[title="2026-10-23"]'),
      {},
    ],
  ])('%s: clears the old selection', async (name, props, shows, cleared) => {
    const v = await mount(name, props, { formField: false });
    await waitFor(() => expect(shows(v)).toBe(true));
    v.setProps({ value: '' });
    await settle();
    expect(shows(v)).toBe(false);
    for (const [key, value] of Object.entries(cleared)) expect([key, v.exposed[key]]).toEqual([key, value]);
  });
});

describe('a required choice', () => {
  it('Select: a selected boolean false or 0 counts as given', async () => {
    const seen = [];
    const useValidation = (value, present) => {
      seen.push(present);
      return { isValid: true, error: '', required: true, touch: () => {} };
    };
    const options = [
      { label: 'No', value: false },
      { label: 'Zero', value: 0 },
    ];
    await mount('Select', { options, value: false }, { useValidation });
    expect(seen[seen.length - 1]).toBe(true);
    seen.length = 0;
    await mount('Select', { options, value: 0 }, { useValidation });
    expect(seen[seen.length - 1]).toBe(true);
  });
});

// The list or panel an Ant popup draws in the popup layer, while it is open.
const openPopup = (selector) =>
  [...(layer()?.querySelectorAll(selector) ?? [])].find(
    (el) => !/-hidden\b/.test(el.className) && el.style.display !== 'none'
  );

describe('an open popup whose owner stops taking input', () => {
  const blockers = [
    ['its own Disable', (v) => v.setHost({ disabled: true })],
    ['an inert parent', (v) => act(() => v.wrapper.setAttribute('inert', ''))],
    ['an aria-disabled parent', (v) => act(() => v.wrapper.setAttribute('aria-disabled', 'true'))],
  ];
  test.each(blockers)('Select closes through its close path on %s', async (_, block) => {
    const v = await mount('Select', { options: OPTIONS, showSearch: true });
    fireEvent.mouseDown(v.root().querySelector('.ant-select-selector'));
    await waitFor(() => expect(openPopup('.ant-select-dropdown')).toBeTruthy());
    expect(v.exposed.open).toBe(true);
    v.events.length = 0;
    block(v);
    await waitFor(() => expect(v.exposed.open).toBe(false));
    expect(v.events).toContain('onOpenChange');
    await waitFor(() => expect(openPopup('.ant-select-dropdown')).toBeFalsy());
  });

  test.each([
    ['DatePicker', {}, '.ant-picker-input input', '.ant-picker-dropdown'],
    ['TimePicker', {}, '.ant-picker-input input', '.ant-picker-dropdown'],
    ['TreeSelect', { treeData: TREE }, '.ant-select-selector', '.ant-select-dropdown'],
    ['Cascader', { options: CASCADE }, '.ant-select-selector', '.ant-select-dropdown'],
    ['Combobox', { options: OPTIONS }, '.ant-select-selector', '.ant-select-dropdown'],
  ])('%s closes once a parent turns inert', async (name, props, trigger, popup) => {
    const v = await mount(name, props);
    const el = v.root().querySelector(trigger);
    fireEvent.mouseDown(el);
    fireEvent.click(el);
    await waitFor(() => expect(openPopup(popup)).toBeTruthy());
    act(() => v.wrapper.setAttribute('inert', ''));
    await waitFor(() => expect(openPopup(popup)).toBeFalsy());
  });

  it('does not open while its owner takes no input', async () => {
    const v = await mount('Select', { options: OPTIONS });
    act(() => v.wrapper.setAttribute('inert', ''));
    fireEvent.mouseDown(v.root().querySelector('.ant-select-selector'));
    await settle();
    expect(v.exposed.open).toBe(false);
  });

  it('Dropdown: the menu closes and a pick in it is refused', async () => {
    const v = await mount('Dropdown', {}, { formField: false });
    fireEvent.click(v.root().querySelector('button'));
    await waitFor(() => expect(openPopup('.ant-dropdown')).toBeTruthy());
    const item = openPopup('.ant-dropdown').querySelector('.ant-dropdown-menu-item');
    act(() => v.wrapper.setAttribute('inert', ''));
    fireEvent.click(item);
    expect(v.events).not.toContain('onClick');
    await waitFor(() => expect(openPopup('.ant-dropdown')).toBeFalsy());
  });

  it('Image: the preview closes', async () => {
    const v = await mount('Image', { src: 'https://example.com/a.png' }, { formField: false });
    fireEvent.click(v.root().querySelector('.ant-image'));
    await waitFor(() => expect(layer().querySelector('.ant-image-preview-wrap, .ant-image-preview')).toBeTruthy());
    act(() => v.wrapper.setAttribute('inert', ''));
    await waitFor(() => {
      const preview = layer().querySelector('.ant-image-preview-wrap, .ant-image-preview');
      expect(!preview || preview.closest('[style*="display: none"]') || preview.style.display === 'none').toBeTruthy();
    });
  });

  it('Modal: stays open but refuses OK while its owner is disabled', async () => {
    const v = await mount('Modal', {}, { formField: false });
    v.run('show');
    await waitFor(() => expect(layer().querySelector('.ant-modal')).toBeTruthy());
    v.setHost({ disabled: true });
    const ok = () => layer().querySelector('.ant-modal-footer .ant-btn-primary');
    await waitFor(() => expect(ok().disabled).toBe(true));
    fireEvent.click(ok());
    expect(v.events).not.toContain('onOk');
    expect(v.exposed.open).toBe(true);
  });

  it('ownerAvailable reads inert and aria-disabled across the shadow root, and a removed owner', () => {
    const wrapper = document.createElement('div');
    const host = document.createElement('div');
    wrapper.appendChild(host);
    document.body.appendChild(wrapper);
    const anchor = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(anchor);
    expect(ownerAvailable(anchor)).toBe(true);
    wrapper.setAttribute('inert', '');
    expect(ownerAvailable(anchor)).toBe(false);
    wrapper.removeAttribute('inert');
    anchor.remove();
    expect(ownerAvailable(anchor)).toBe(false);
  });
});

describe('a selection of records', () => {
  const ROWS = [
    { id: 1, name: 'Maya' },
    { id: 2, name: 'Owen' },
    { id: 3, name: 'Priya' },
  ];
  it('Table: follows its rows by id across a refresh and a reorder, keeps the ids numbers, and drops removed rows', async () => {
    const v = await mount('Table', { dataSource: ROWS, rowSelection: 'checkbox', columns: [] }, { formField: false });
    v.run('selectRow', 2);
    expect(v.exposed.selectedRowKeys).toEqual([2]);
    expect(v.exposed.selectedRow).toEqual(ROWS[1]);
    v.setProps({
      dataSource: [
        { id: 3, name: 'Priya' },
        { id: 2, name: 'Owen Hart' },
        { id: 1, name: 'Maya' },
      ],
    });
    await settle();
    expect(v.exposed.selectedRow).toEqual({ id: 2, name: 'Owen Hart' });
    expect(v.exposed.selectedRows).toEqual([{ id: 2, name: 'Owen Hart' }]);
    v.setProps({ dataSource: [{ id: 1, name: 'Maya' }] });
    await settle();
    expect(v.exposed.selectedRow).toEqual({});
    expect(v.exposed.selectedRowKeys).toEqual([]);
    expect(v.exposed.selectedRows).toEqual([]);
  });

  it('Table: current names the page drawn when the rows shrink', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: i, name: `Row ${i}` }));
    const v = await mount('Table', { dataSource: many, pageSize: 10, columns: [] }, { formField: false });
    v.run('setCurrent', 3);
    v.setProps({ dataSource: many.slice(0, 15) });
    await settle();
    expect(v.exposed.current).toBe(2);
  });

  it('List: follows its record by id, keeps the id a number, and clears once it is gone', async () => {
    const v = await mount('List', { dataSource: ROWS }, { formField: false });
    v.run('selectItem', 2);
    expect(v.exposed.selectedItemKey).toBe(2);
    v.setProps({ dataSource: [ROWS[2], { id: 2, name: 'Owen Hart' }, ROWS[0]] });
    await settle();
    expect(v.exposed.selectedItem).toEqual({ id: 2, name: 'Owen Hart' });
    v.setProps({ dataSource: [ROWS[0]] });
    await settle();
    expect(v.exposed.selectedItem).toEqual({});
    expect(v.exposed.selectedItemKey).toBe('');
  });

  it('Tree: a selected node that is gone is no longer selected', async () => {
    const data = [
      { title: 'A', key: 'a' },
      { title: 'B', key: 'b' },
    ];
    const v = await mount('Tree', { treeData: data }, { formField: false });
    fireEvent.click([...v.root().querySelectorAll('.ant-tree-title')].find((el) => el.textContent === 'B'));
    expect(v.exposed.selectedKeys).toEqual(['b']);
    v.setProps({ treeData: [data[0]] });
    await settle();
    expect(v.exposed.selectedKeys).toEqual([]);
  });
});

describe('sectioned layouts', () => {
  it('distinct keys never share a slot, and plain keys keep their saved slot names', () => {
    const names = slotNames('tab', ['a-b', 'a_b', 'a b', 'tab1']);
    expect(new Set(names.values()).size).toBe(4);
    expect(names.get('a_b')).toBe('tab_a_b');
    expect(names.get('tab1')).toBe('tab_tab1');
    // Not by list order: reordering keeps each key's canvas.
    expect(slotNames('tab', ['a b', 'a-b']).get('a-b')).toBe(names.get('a-b'));
  });

  it('Collapse: panels with colliding keys get their own canvases; activeKey drops a removed panel', async () => {
    const items = [
      { key: 'p-1', label: 'One' },
      { key: 'p_1', label: 'Two' },
      { key: 'p2', label: 'Three' },
    ];
    const v = await mount('Collapse', { items, activeKey: ['p-1', 'p2'] }, { formField: false });
    const slots = [...v.root().querySelectorAll('[data-tj-slot]')].map((el) => el.getAttribute('data-tj-slot'));
    expect(new Set(slots).size).toBe(3);
    v.setProps({ items: items.slice(0, 2) });
    await settle();
    expect(v.exposed.activeKey).toEqual(['p-1']);
  });

  it('Tabs: activeKey exposes the tab shown once its tab is removed, and a numeric key opens its tab', async () => {
    const items = [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
    ];
    const v = await mount('Tabs', { items, activeKey: 'b' }, { formField: false });
    v.setProps({ items: [items[0]] });
    await settle();
    expect(v.exposed.activeKey).toBe('a');
    const w = await mount(
      'Tabs',
      {
        items: [
          { key: '1', label: 'One' },
          { key: '2', label: 'Two' },
        ],
        activeKey: 2,
      },
      { formField: false }
    );
    expect(w.root().querySelector('.ant-tabs-tab-active').textContent).toBe('Two');
    expect(w.events).not.toContain('onChange');
  });

  it('Steps: current exposes the step drawn', async () => {
    const v = await mount('Steps', { current: 9 }, { formField: false });
    await settle();
    expect(v.exposed.current).toBe(4);
  });
});

describe('a literal value out of range', () => {
  it('Slider exposes the value it draws, and fits it again from what was asked when the bounds change', async () => {
    const v = await mount('Slider', { value: 150, max: 100 });
    await settle();
    expect(v.exposed.value).toBe(100);
    expect(v.events).not.toContain('onChange');
    v.setProps({ max: 200 });
    await settle();
    expect(v.exposed.value).toBe(150);
  });

  it('Rate exposes the stars it draws', async () => {
    const v = await mount('Rate', { value: 9, count: 5 });
    await settle();
    expect(v.exposed.value).toBe(5);
    expect(v.root().querySelectorAll('.ant-rate-star-full')).toHaveLength(5);
  });

  it('InputNumber draws what it exposes (Ant shows an out-of-range number as typed, marked)', async () => {
    const v = await mount('InputNumber', { value: 150, max: 100 });
    expect(input(v).value).toBe('150');
    expect(v.exposed.value).toBe(150);
  });
});

describe('a hidden Carousel', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fires no afterChange while its owner is inert, and stops its timers when it unmounts', async () => {
    jest.useRealTimers();
    const v = await mount('Carousel', { autoplay: true, autoplaySpeed: 500 }, { formField: false });
    act(() => v.wrapper.setAttribute('inert', ''));
    await act(() => new Promise((r) => setTimeout(r, 1800)));
    expect(v.events).not.toContain('afterChange');
    v.unmount();
  });
});

describe('keyboard inside the shadow root', () => {
  it('Select: the focus action focuses its input (the ref reached Ant)', async () => {
    const v = await mount('Select', { options: OPTIONS });
    v.run('focus');
    expect(v.root().activeElement?.tagName).toBe('INPUT');
  });
});

describe('selection in the composed lists', () => {
  const ROWS = [
    { id: 1, name: 'Maya', label: 'Maya', value: 10, title: 'Maya' },
    { id: 2, name: 'Owen', label: 'Owen', value: 20, title: 'Owen' },
    { id: 3, name: 'Priya', label: 'Priya', value: 30, title: 'Priya' },
  ];
  const clickable = { RecordList: '.ant-list-item', CardGrid: '.ant-card', ProgressList: '.ant-list-item' };
  test.each(Object.keys(clickable))(
    '%s: follows its record by id, keeps the id a number, and clears once it is gone',
    async (name) => {
      const v = await mount(name, { dataSource: ROWS }, { formField: false });
      fireEvent.click(v.root().querySelectorAll(clickable[name])[1]);
      expect(v.exposed.selectedItemId).toBe(2);
      expect(v.exposed.selectedItemIndex).toBe(1);
      const edited = { ...ROWS[1], name: 'Owen Hart', label: 'Owen Hart', title: 'Owen Hart' };
      v.setProps({ dataSource: [edited, ROWS[0], ROWS[2]] });
      await settle();
      expect(v.exposed.selectedItem).toEqual(edited);
      expect(v.exposed.selectedItemIndex).toBe(0);
      expect(v.root().querySelector('.is-selected').textContent).toContain('Owen Hart');
      v.setProps({ dataSource: [ROWS[0]] });
      await settle();
      expect(v.exposed.selectedItem).toEqual({});
      expect(v.exposed.selectedItemIndex).toBe(-1);
      expect(v.exposed.selectedItemId).toBe('');
    }
  );

  it('ButtonGroup: keeps its values the type the buttons give them', async () => {
    const buttons = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
    ];
    const v = await mount('ButtonGroup', { buttons, mode: 'multiple' }, { formField: false });
    fireEvent.click(v.root().querySelectorAll('button')[1]);
    fireEvent.click(v.root().querySelectorAll('button')[0]);
    expect(v.exposed.value).toEqual([2, 1]);
    expect(v.exposed.lastClicked).toBe(1);
    expect(v.root().querySelectorAll('.ant-btn-primary')).toHaveLength(2);
  });
});

describe('a popup of a control that renders its own provider', () => {
  const styles = { colorPrimary: '#ff0000' };
  test.each([
    ['DatePicker', {}, '.ant-picker-input input', '.ant-picker-dropdown'],
    ['TimePicker', {}, '.ant-picker-input input', '.ant-picker-dropdown'],
    ['RangePicker', {}, '.ant-picker-input input', '.ant-picker-dropdown'],
    ['TreeSelect', { treeData: TREE }, '.ant-select-selector', '.ant-select-dropdown'],
    ['Cascader', { options: CASCADE }, '.ant-select-selector', '.ant-select-dropdown'],
    ['Combobox', { options: OPTIONS }, '.ant-select-selector', '.ant-select-dropdown'],
    ['PhoneInput', {}, '.ant-select-selector', '.ant-select-dropdown'],
    ['CurrencyInput', { currencyOptions: ['USD', 'EUR'] }, '.ant-select-selector', '.ant-select-dropdown'],
    ['Dropdown', {}, 'button', '.ant-dropdown'],
    ['ColorPicker', {}, '.ant-color-picker-trigger', '.ant-popover'],
  ])('%s carries the component theme (its token overrides)', async (name, props, trigger, popup) => {
    const v = await mount(name, props, { styles });
    const el = v.root().querySelector(trigger);
    fireEvent.mouseDown(el);
    fireEvent.click(el);
    await waitFor(() => expect(openPopup(popup)).toBeTruthy());
    const root = openPopup(popup);
    const themed =
      root.closest('[style*="--tj-ant-color-primary"]') ?? root.querySelector('[style*="--tj-ant-color-primary"]');
    expect(themed).toBeTruthy();
  });
});

describe("UI 2.0's column shape", () => {
  // As the AI builder writes it: hidden fields listed with columnVisibility: false, widths as columnSize.
  const columns = [
    { key: 'company', name: 'Company', columnSize: 180 },
    { key: 'stage', name: 'Stage', columnType: 'badge', badgeColors: { New: '#2576CE' } },
    { key: 'lead_id', name: 'lead_id', columnVisibility: false },
    { key: 'summary', name: 'summary', columnVisibility: '{{false}}' },
  ];
  it('Table: draws only the visible listed columns, never the hidden fields as raw columns', async () => {
    const dataSource = [
      { id: 1, company: 'Acme', stage: 'New', lead_id: 'L-1', summary: 'x', created_on: '2026-10-01' },
    ];
    const v = await mount('Table', { dataSource, columns }, { formField: false });
    const headers = [...v.root().querySelectorAll('.ant-table-thead th')]
      .map((th) => th.textContent.trim())
      .filter(Boolean);
    expect(headers).toEqual(['Company', 'Stage']);
  });
});

describe('a keyboard move into a long column', () => {
  // AM-10: the destination drew only its first 100 cards, so the moved card landed past the window, unmounted and
  // focus fell to the page.
  it('Kanban: the moved card stays drawn past the "Show more" window and keeps keyboard focus', async () => {
    const dataSource = [
      { id: 1, title: 'Mover', status: 'todo' },
      ...Array.from({ length: 150 }, (_, i) => ({ id: i + 2, title: `Card ${i + 1}`, status: 'doing' })),
    ];
    const columns = [
      { id: 'todo', title: 'To do' },
      { id: 'doing', title: 'Doing' },
    ];
    const v = await mount('Kanban', { dataSource, columns }, { formField: false });
    const card = () =>
      [...v.root().querySelectorAll('[aria-roledescription="Draggable card"]')].find((el) =>
        el.textContent.includes('Mover')
      );
    act(() => card().focus());
    fireEvent.keyDown(card(), { key: ' ' });
    fireEvent.keyDown(card(), { key: 'ArrowRight' });
    fireEvent.keyDown(card(), { key: 'Enter' });
    expect(v.exposed.lastCardMovement).toMatchObject({ cardId: 1, to: 'doing', toIndex: 150 });
    expect(card()).toBeTruthy();
    expect(v.root().activeElement).toBe(card());
  });
});

describe('a native Form reads every field', () => {
  // A Form reads value (or values, file, selectedDateRange): fields whose own state has Ant's name expose it as value
  // too, or the Form left them out of its data and submission, checked or not.
  it.each([
    ['Checkbox', { checked: true }, true, 'toggle', false],
    ['Switch', { checked: true }, true, 'toggle', false],
  ])('%s exposes its state as value', async (name, props, first, action, second) => {
    const v = await mount(name, props);
    await waitFor(() => expect(v.exposed.value).toBe(first));
    v.run(action);
    await waitFor(() => expect(v.exposed.value).toBe(second));
  });
  it('Transfer exposes its target keys as value', async () => {
    const v = await mount('Transfer', { targetKeys: ['orders'] });
    await waitFor(() => expect(v.exposed.value).toEqual(['orders']));
  });
});

describe('controls UI 2.0 has (team review, 2026-10-24)', () => {
  const { isClicked, hasClicked } = require('../../../../../../packs/antd/src/lib/chartHighlight');
  const message = (v) => v.root().querySelector('.ant-form-item-explain')?.textContent ?? '';

  it.each([
    ['email', 'nope', 'a@b.co', 'Enter a valid email address'],
    ['url', 'not a url', 'https://tooljet.com', 'Enter a valid URL'],
  ])('Input type %s reports a bad value once left, and isValid follows', async (type, bad, good, text) => {
    const v = await mount('Input', { type, value: bad });
    await waitFor(() => expect(v.exposed.isValid).toBe(false));
    expect(message(v)).toBe('');
    fireEvent.blur(input(v));
    await waitFor(() => expect(message(v)).toBe(text));
    v.setProps({ value: good });
    await waitFor(() => expect(v.exposed.isValid).toBe(true));
    expect(message(v)).toBe('');
  });

  it('RadioGroup with Allow deselect clears on a click on the picked option; without it the pick stays', async () => {
    const radios = (v) => v.root().querySelectorAll('input[type="radio"]');
    const off = await mount('RadioGroup', { options: OPTIONS, value: 'one' });
    fireEvent.click(radios(off)[0]);
    await settle();
    expect(off.exposed.value).toBe('one');
    expect(off.events).not.toContain('onChange');
    off.unmount();

    const v = await mount('RadioGroup', { options: OPTIONS, value: 'one', allowDeselect: true });
    expect(checked(v)).toBe(1);
    fireEvent.click(radios(v)[0]);
    await waitFor(() => expect(v.exposed.value).toBe(''));
    expect(v.events.filter((e) => e === 'onChange')).toHaveLength(1);
    expect(checked(v)).toBe(0);
    // A click on another option still picks it.
    fireEvent.click(radios(v)[1]);
    await waitFor(() => expect(v.exposed.value).toBe('two'));
  });

  it('Slider range draws two handles for [from, to], fits a single number to the whole range and clears with a Form', async () => {
    const handles = (v) => v.root().querySelectorAll('.ant-slider-handle').length;
    const v = await mount('Slider', { range: true, value: [20, 80] });
    expect(handles(v)).toBe(2);
    await settle();
    expect(v.exposed.value).toEqual([20, 80]);
    v.run('setFieldValue', [90, 10]);
    await waitFor(() => expect(v.exposed.value).toEqual([10, 90]));
    v.clearForm();
    await settle();
    expect(Array.isArray(v.exposed.value)).toBe(false);
    expect(handles(v)).toBe(2);
    v.unmount();

    const single = await mount('Slider', { range: true, value: 30 });
    await waitFor(() => expect(single.exposed.value).toEqual([0, 100]));
    expect(single.events).not.toContain('onChange');
    single.setProps({ range: false, value: [40, 60] });
    await waitFor(() => expect(single.exposed.value).toBe(40));
    expect(handles(single)).toBe(1);
  });

  it('Upload past maxCount keeps the files it has and says why; Clear all and clearFiles empty the list', async () => {
    const v = await mount('Upload', { multiple: true, maxCount: 2 });
    const files = ['a', 'b', 'c'].map((n) => new File([n], `${n}.txt`, { type: 'text/plain' }));
    fireEvent.change(v.root().querySelector('input[type=file]'), { target: { files } });
    await waitFor(() => expect(v.exposed.fileList?.length).toBe(2));
    expect(v.exposed.fileList.map((f) => f.name)).toEqual(['a.txt', 'b.txt']);
    await waitFor(() => expect(message(v)).toBe('You can upload up to 2 files'));
    // Full: a further pick is turned away whole, and the files stay.
    fireEvent.change(v.root().querySelector('input[type=file]'), {
      target: { files: [new File(['d'], 'd.txt', { type: 'text/plain' })] },
    });
    await settle();
    expect(v.exposed.fileList.map((f) => f.name)).toEqual(['a.txt', 'b.txt']);
    const clearAll = [...v.root().querySelectorAll('button')].find((b) => b.textContent === 'Clear all');
    fireEvent.click(clearAll);
    await waitFor(() => expect(v.exposed.fileList).toEqual([]));
    expect(message(v)).toBe('');
    expect([...v.root().querySelectorAll('button')].some((b) => b.textContent === 'Clear all')).toBe(false);
    fireEvent.change(v.root().querySelector('input[type=file]'), { target: { files: [files[0]] } });
    await waitFor(() => expect(v.exposed.fileList?.length).toBe(1));
    v.run('clearFiles');
    await waitFor(() => expect(v.exposed.fileList).toEqual([]));
  });

  it('Upload with maxCount 1 keeps Ant’s rule: a new pick replaces the file', async () => {
    const v = await mount('Upload', { maxCount: 1 });
    const pick = (n) =>
      fireEvent.change(v.root().querySelector('input[type=file]'), {
        target: { files: [new File([n], `${n}.txt`, { type: 'text/plain' })] },
      });
    pick('a');
    await waitFor(() => expect(v.exposed.fileList?.length).toBe(1));
    pick('b');
    await waitFor(() => expect(v.exposed.fileList.map((f) => f.name)).toEqual(['b.txt']));
    expect(message(v)).toBe('');
  });

  it.each(['Column', 'Bar', 'Line', 'Area', 'Pie', 'DualAxes', 'Funnel', 'Radar', 'Scatter', 'Heatmap'])(
    '%s takes Highlight clicked point and clears the clicked datum with clearClickedPoint',
    async (name) => {
      // A datum clicked before (hidden state seeded from a saved value) draws highlighted from the first render.
      const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
      const v = await mount(
        name,
        { highlightClicked: true, selectedDatum: { x: 'Jan', y: 42, stage: 'Visited' } },
        { formField: false }
      );
      await settle();
      expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
      expect(v.actions.has('clearClickedPoint')).toBe(true);
      v.run('clearClickedPoint');
      await waitFor(() => expect(v.exposed.selectedDatum).toEqual({}));
    }
  );

  it('a clicked mark matches by its x and series; a clicked line by its series alone', () => {
    const by = { keys: ['month', 'series'], series: 'series' };
    const jan = { month: 'Jan', series: 'sales', value: 4 };
    expect(isClicked({ month: 'Jan', series: 'sales', value: 9 }, jan, by)).toBe(true);
    expect(isClicked({ month: 'Feb', series: 'sales' }, jan, by)).toBe(false);
    expect(isClicked({ month: 'Jan', series: 'cost' }, jan, by)).toBe(false);
    // A line hands its rows to a style callback and to the click.
    const salesLine = [jan, { month: 'Feb', series: 'sales' }];
    expect(isClicked(salesLine, salesLine, by)).toBe(true);
    expect(isClicked([{ month: 'Jan', series: 'cost' }], salesLine, by)).toBe(false);
    expect(isClicked(jan, salesLine, { ...by, rowOnly: true })).toBe(false);
    expect(hasClicked({})).toBe(false);
    expect(hasClicked([])).toBe(false);
    expect(hasClicked(jan)).toBe(true);
  });
});

describe('team UI 2.0 report: lists, box-sized layouts and the Statistic trend', () => {
  const TWINS = [
    { id: 1, title: 'Alpha', v: 1 },
    { id: 1, title: 'Alpha twin', v: 2 },
    { id: 2, title: 'Beta', v: 3 },
  ];
  const drawnSelected = (v) => [...v.root().querySelectorAll('.ant-list-item.is-selected')].map((el) => el.textContent);

  it('List: of two records sharing an id, only the picked one draws selected, and a refresh keeps it', async () => {
    const v = await mount('List', { dataSource: TWINS }, { formField: false });
    fireEvent.click(v.root().querySelectorAll('.ant-list-item')[1]);
    await settle();
    expect(v.exposed.selectedItem).toEqual(TWINS[1]);
    expect(drawnSelected(v)).toEqual(['Alpha twin']);
    v.setProps({ dataSource: TWINS.map((r) => ({ ...r, v: r.v + 10 })) });
    await settle();
    expect(v.exposed.selectedItem).toEqual({ ...TWINS[1], v: 12 });
    expect(v.exposed.selectedItemKey).toBe(1);
    expect(drawnSelected(v)).toEqual(['Alpha twin']);
  });

  it('List: a row without an id is followed by its content when a row is added before it', async () => {
    const rows = [{ title: 'One' }, { title: 'Two' }];
    const v = await mount('List', { dataSource: rows }, { formField: false });
    fireEvent.click(v.root().querySelectorAll('.ant-list-item')[1]);
    await settle();
    v.setProps({ dataSource: [{ title: 'Zero' }, ...rows] });
    await settle();
    expect(v.exposed.selectedItem).toEqual({ title: 'Two' });
    expect(drawnSelected(v)).toEqual(['Two']);
  });

  it.each([
    ['Alert', { message: 'Saved', description: 'A long description' }],
    ['Descriptions', {}],
    ['RecordList', {}],
    ['ProgressList', {}],
    ['List', {}],
    ['Table', { columns: [] }],
    ['Hero', {}],
  ])('%s fills its widget box and scrolls taller content inside it', async (name, props) => {
    const v = await mount(name, props, { formField: false });
    const root = v.root().querySelector('.tj-ant-root');
    expect(root.classList.contains('tj-ant--fill')).toBe(true);
    if (name !== 'Alert') expect(root.classList.contains('tj-ant-scroll')).toBe(true);
    else expect(root.classList.contains('tj-ant-alert')).toBe(true);
  });

  it('Collapse: drops with its first panel open', async () => {
    const v = await mount('Collapse', {}, { formField: false });
    await settle();
    expect(v.exposed.activeKey).toEqual(['panel1']);
    expect(v.root().querySelectorAll('.ant-collapse-item-active')).toHaveLength(1);
  });

  it('Statistic: setTrend sets the direction and, when given, the value', async () => {
    const v = await mount('Statistic', { trend: 'neutral', trendValue: '4%' }, { formField: false });
    v.run('setTrend', 'down', '-12%');
    await settle();
    expect(v.exposed.trend).toBe('down');
    expect(v.exposed.trendValue).toBe('-12%');
    const change = v.root().querySelector('.tj-ant-stat-change');
    expect(change.classList.contains('is-down')).toBe(true);
    expect(change.textContent).toContain('-12%');
    // A direction alone keeps the value; a word that is no direction changes nothing.
    v.run('setTrend', 'up');
    v.run('setTrend', 'sideways');
    await settle();
    expect(v.exposed.trend).toBe('up');
    expect(v.exposed.trendValue).toBe('-12%');
  });

  it('Statistic: loading draws a title, figure and trend placeholder inside the card, not one bar', async () => {
    const v = await mount(
      'Statistic',
      { title: 'Revenue', value: '1200', trend: 'up', trendValue: '4%' },
      { formField: false }
    );
    v.setHost({ loading: true });
    await settle();
    const card = v.root().querySelector('.tj-ant-stat.tj-ant-stat--card');
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect(card.querySelector('.ant-statistic-title .tj-ant-bone.is-title')).toBeTruthy();
    expect(card.querySelector('.ant-statistic-content .tj-ant-bone.is-figure')).toBeTruthy();
    expect(card.querySelector('.tj-ant-stat-trend .tj-ant-bone.is-trend')).toBeTruthy();
    expect(card.textContent).not.toContain('Revenue');
    v.setHost({ loading: false });
    await settle();
    expect(card.querySelector('.tj-ant-bone')).toBeNull();
    expect(card.textContent).toContain('Revenue');
  });
});

describe("T38: Ant Alert takes UI 2.0's action and close", () => {
  const button = (v, text) => [...v.root().querySelectorAll('button')].find((b) => b.textContent === text);

  test('actionText draws a button that fires onActionClicked; empty draws none', async () => {
    const v = await mount('Alert', { message: 'Update ready', actionText: 'Reload' }, { formField: false });
    fireEvent.click(button(v, 'Reload'));
    expect(v.events).toEqual(['onActionClicked']);
    v.setProps({ actionText: '' });
    await waitFor(() => expect(button(v, 'Reload')).toBeUndefined());
  });

  test('the action button follows the host Disable', async () => {
    const v = await mount(
      'Alert',
      { message: 'Update ready', actionText: 'Reload' },
      { formField: false, disabled: true }
    );
    expect(button(v, 'Reload').disabled).toBe(true);
  });

  test('the close button dismisses it: onClose reads dismissed true, show brings it back', async () => {
    const v = await mount('Alert', { message: 'Saved', closable: true }, { formField: false });
    expect(v.exposed.dismissed).toBe(false);
    fireEvent.click(v.root().querySelector('.ant-alert-close-icon'));
    await waitFor(() => expect(v.root().querySelector('.ant-alert')).toBeNull());
    expect(v.events).toEqual(['onClose']);
    expect(v.seen[0].exposed.dismissed).toBe(true);
    v.run('show');
    await waitFor(() => expect(v.root().querySelector('.ant-alert')).toBeTruthy());
    expect(v.exposed.dismissed).toBe(false);
  });

  test('the dismiss action hides it and fires onClose once', async () => {
    const v = await mount('Alert', { message: 'Saved' }, { formField: false });
    v.run('dismiss');
    await waitFor(() => expect(v.root().querySelector('.ant-alert')).toBeNull());
    expect(v.events).toEqual(['onClose']);
    expect(v.exposed.dismissed).toBe(true);
  });
});

describe('T7/T41: colour styles default to the theme colour they draw, and draw nothing new there', () => {
  const TOKENS = ['colorPrimary', 'colorText', 'colorBgContainer', 'colorBorder', 'borderRadius'];
  const blank = Object.fromEntries(TOKENS.map((t) => [t, '']));
  const themed = {
    colorPrimary: 'var(--cc-primary-brand)',
    colorText: 'var(--cc-primary-text)',
    colorBgContainer: 'var(--cc-surface1-surface)',
    colorBorder: 'var(--cc-default-border)',
  };
  // The --tj-ant-* overrides (and the Kanban, Map, Schedule and Alert look variables) a root declares inline.
  const overrides = (v) => {
    const style = v.root().querySelector('.tj-ant-root').style;
    return [...Array(style.length).keys()].map((i) => style[i]).filter((p) => /^--(tj-ant|kb|lk|tj-alert)-/.test(p));
  };

  test.each(['Button', 'Alert', 'Select', 'Table', 'Column', 'Tabs'])(
    '%s: a fresh drop (styles at their defaults), a saved blank and the default values set no token',
    async (name) => {
      for (const styles of [{}, blank, themed]) {
        const v = await mount(name, {}, { formField: false, styles });
        expect(overrides(v)).toEqual([]);
        v.unmount();
      }
    }
  );

  test('a colour or radius set away from its default still overrides the token', async () => {
    const v = await mount('Button', {}, { formField: false, styles: { colorPrimary: '#ff0000', borderRadius: 10 } });
    const style = v.root().querySelector('.tj-ant-root').style;
    expect(style.getPropertyValue('--tj-ant-color-primary')).toBe('#ff0000');
    expect(style.getPropertyValue('--tj-ant-border-radius')).toBe('10px');
  });

  test('another theme swatch than the default is kept as a theme value', async () => {
    const v = await mount(
      'Button',
      {},
      { formField: false, styles: { colorPrimary: 'var(--cc-success-systemStatus)' } }
    );
    expect(v.root().querySelector('.tj-ant-root').style.getPropertyValue('--tj-ant-color-primary')).toBe(
      'var(--cc-success-systemStatus)'
    );
  });

  test.each([
    [
      'Kanban',
      {
        columnBackgroundColor: 'var(--cc-surface2-surface)',
        cardBackgroundColor: 'var(--cc-surface1-surface)',
        progressColor: 'var(--cc-primary-brand)',
      },
    ],
    [
      'Map',
      {
        backgroundColor: 'var(--cc-surface2-surface)',
        accentColor: 'var(--cc-primary-brand)',
        clusterColor: 'var(--cc-primary-text)',
      },
    ],
    [
      'Schedule',
      {
        backgroundColor: 'var(--cc-surface1-surface)',
        accentColor: 'var(--cc-primary-brand)',
        nowColor: 'var(--cc-error-systemStatus)',
      },
    ],
  ])(
    '%s: its own colour styles at their defaults set no look variable (the card shadow is an option, set as before)',
    async (name, defaults) => {
      for (const styles of [{}, defaults]) {
        const v = await mount(name, {}, { formField: false, styles });
        await settle();
        const set = [...v.root().querySelectorAll('[style]')].flatMap((el) =>
          [...Array(el.style.length).keys()]
            .map((i) => el.style[i])
            .filter((p) => /^--(kb|lk|tj-ant)-/.test(p) && p !== '--kb-card-shadow')
        );
        expect(set).toEqual([]);
        v.unmount();
      }
    }
  );
});

describe("T40: Ant Alert's Custom type", () => {
  test('Custom draws the alert in its own colours; left at the defaults, in the container colours', async () => {
    const v = await mount('Alert', { message: 'Heads up', type: 'custom' }, { formField: false });
    const root = v.root().querySelector('.tj-ant-root');
    expect(root.classList.contains('tj-ant-alert--custom')).toBe(true);
    expect(v.root().querySelector('.ant-alert-info')).toBeTruthy();
    expect(root.style.getPropertyValue('--tj-alert-bg')).toBe('');
    v.unmount();
    const w = await mount(
      'Alert',
      { message: 'Heads up', type: 'custom' },
      {
        formField: false,
        styles: { customBackgroundColor: '#fef3c7', customTextColor: '#78350f', customBorderColor: '#f59e0b' },
      }
    );
    const style = w.root().querySelector('.tj-ant-root').style;
    expect(style.getPropertyValue('--tj-alert-bg')).toBe('#fef3c7');
    expect(style.getPropertyValue('--tj-alert-fg')).toBe('#78350f');
    expect(style.getPropertyValue('--tj-alert-border')).toBe('#f59e0b');
  });

  test('the Custom colours do nothing for the other types', async () => {
    const v = await mount(
      'Alert',
      { message: 'Saved', type: 'success' },
      { formField: false, styles: { customBackgroundColor: '#fef3c7' } }
    );
    const root = v.root().querySelector('.tj-ant-root');
    expect(root.classList.contains('tj-ant-alert--custom')).toBe(false);
    expect(root.style.getPropertyValue('--tj-alert-bg')).toBe('');
    expect(v.root().querySelector('.ant-alert-success')).toBeTruthy();
  });
});

describe('V-02: the Kanban right-edge fade follows the content, not only the box', () => {
  const observers = [];
  let Original;
  beforeEach(() => {
    Original = window.ResizeObserver;
    observers.length = 0;
    window.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.targets = new Set();
        observers.push(this);
      }
      observe(el) {
        this.targets.add(el);
      }
      unobserve(el) {
        this.targets.delete(el);
      }
      disconnect() {
        this.targets.clear();
      }
    };
  });
  afterEach(() => {
    window.ResizeObserver = Original;
  });
  const size = (el, scrollWidth, clientWidth) => {
    Object.defineProperty(el, 'scrollWidth', { configurable: true, get: () => scrollWidth });
    Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => clientWidth });
  };
  // Fires the observers watching `el`, as the browser does when it resizes.
  const resized = (el) =>
    act(() => {
      observers.filter((o) => o.targets.has(el)).forEach((o) => o.callback([{ target: el }]));
    });

  test('a column that settles narrower clears the fade; a board that really overflows keeps it', async () => {
    const v = await mount('Kanban', {}, { formField: false });
    await settle();
    const board = v.root().querySelector('.tj-ant-kb');
    const column = board.querySelector('.tj-ant-kb-col');
    expect(column).toBeTruthy();
    // Real overflow: the fade shows.
    size(board, 900, 555);
    resized(board);
    expect(board.classList.contains('has-more-right')).toBe(true);
    // The columns settle to the measured width: the box does not resize, only its content does.
    size(board, 555, 555);
    expect(observers.some((o) => o.targets.has(column))).toBe(true);
    resized(column);
    expect(board.classList.contains('has-more-right')).toBe(false);
    // And back to a real overflow from the content alone.
    size(board, 1200, 555);
    resized(column);
    expect(board.classList.contains('has-more-right')).toBe(true);
  });
});

describe('Calendar: each day keeps its number in place and its events inside its cell', () => {
  const EVENTS = [
    { date: '2026-10-14', title: '1 task due', type: 'warning' },
    { date: '2026-10-15', title: '2 tasks due', type: 'error' },
    { date: '2026-10-15', title: 'Review', type: 'success' },
  ];
  const cell = (v, date) => v.root().querySelector(`td[title="${date}"]`);

  test('the card calendar draws dots under the number, the labels as the tooltip', async () => {
    const v = await mount('Calendar', { value: '2026-10-14', fullscreen: false, events: EVENTS }, { formField: false });
    expect(v.root().querySelector('.ant-picker-calendar-mini')).toBeTruthy();
    const marks = cell(v, '2026-10-15').querySelector('.ant-picker-calendar-date-content .tj-ant-cal-marks');
    expect(marks.getAttribute('title')).toBe('2 tasks due, Review');
    expect([...marks.querySelectorAll('.tj-ant-cal-dots i')].map((i) => i.className)).toEqual([
      'is-error',
      'is-success',
    ]);
    expect(marks.querySelector('.tj-ant-cal-count').textContent).toBe('2');
    // The number is drawn the same way in a marked and an unmarked day: before the marks, in its own element.
    for (const date of ['2026-10-15', '2026-10-16']) {
      expect(cell(v, date).querySelector('.ant-picker-calendar-date > .ant-picker-calendar-date-value')).toBeTruthy();
    }
    expect(cell(v, '2026-10-16').querySelector('.tj-ant-cal-marks')).toBeNull();
  });

  test('the month grid keeps the labels, at most three a day', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ date: '2026-10-20', title: `Task ${i + 1}` }));
    const v = await mount('Calendar', { value: '2026-10-14', fullscreen: true, events: many }, { formField: false });
    const items = [...cell(v, '2026-10-20').querySelectorAll('.tj-ant-cal-events li')].map((li) => li.textContent);
    expect(items).toEqual(['Task 1', 'Task 2', 'Task 3']);
    expect(cell(v, '2026-10-20').querySelector('.tj-ant-cal-count').textContent).toBe('5');
  });
});

describe('Charts draw their hover tooltip in the popup layer, not inside the widget box', () => {
  test.each(['Line', 'Column', 'Pie', 'DualAxes', 'Sparkline'])(
    '%s: a themed tooltip layer while mounted, gone after',
    async (name) => {
      const v = await mount(name, {}, { formField: false });
      await settle();
      const tips = () => layer()?.querySelectorAll('.tj-ant-chart-tips') ?? [];
      expect(tips()).toHaveLength(1);
      expect(tips()[0].classList.contains('tj-ant')).toBe(true);
      v.unmount();
      expect(tips()).toHaveLength(0);
    }
  );

  test('the layer carries the component token overrides', async () => {
    await mount('Line', {}, { formField: false, styles: { colorText: '#123456' } });
    await settle();
    expect(layer().querySelector('.tj-ant-chart-tips').style.getPropertyValue('--tj-ant-color-text')).toBe('#123456');
  });
});
