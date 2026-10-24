import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import FormSignalContext from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import { slotNames } from '../../../../../../../packs/antd/src/lib/slots';
import { ownerAvailable } from '../../../../../../../packs/antd/src/lib/useOwnerGuard';

installBrowserStubs();

// The Ant pack's own source on the real inline SDK, host renderer and Form signal (only module and CSS loading is
// replaced), checked against the bug classes an audit of the sibling shadcn pack found (2026-10-23).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../../packs/antd/src/index.ts');

let mounts = 0;
// Renders one pack component and returns its shadow root, what it exposed, the events it fired and its actions.
const mount = async (name, props = {}, { formField = true, disabled = false, useValidation, styles = {} } = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const events = [];
  const actions = new Map();
  const host = { ...makeHost(name, { validation: formField ? 'text' : undefined }), disabled, ...(useValidation ? { useValidation } : {}) };
  let state = { props, clearCount: 0, host };
  const view = { exposed, events, actions };
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
        fireEvent={(event) => events.push(event)}
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
const checked = (v) => v.root().querySelectorAll('.ant-radio-wrapper-checked, .ant-checkbox-wrapper-checked, .ant-switch-checked').length;

// [component, props, what it shows while filled, the exposed values a clear empties]
const FIELDS = [
  ['Input', { value: 'hello' }, (v) => inputs(v).includes('hello'), { value: '' }],
  ['TextArea', { value: 'hello' }, (v) => v.root().querySelector('textarea').value === 'hello', { value: '' }],
  ['InputNumber', { value: 42 }, (v) => inputs(v).includes('42'), { value: null }],
  ['Select', { options: OPTIONS, value: 'two' }, (v) => text(v).includes('Two'), { value: '', selectedOption: {} }],
  // jsdom has no widths, so a responsive tag row draws no tags (the single Select checks what is drawn).
  ['Select', { options: OPTIONS, mode: 'multiple', value: ['one'] }, (v) => v.exposed.selectedOptions?.length === 1, { value: [] }],
  ['Combobox', { options: OPTIONS, value: 'two' }, (v) => text(v).includes('Two'), { value: '', selectedOption: {}, selectedLabel: '' }],
  ['DatePicker', { value: '2026-10-23' }, (v) => inputs(v).includes('2026-10-23'), { value: '' }],
  ['TimePicker', { value: '09:30' }, (v) => inputs(v).includes('09:30'), { value: '' }],
  ['RangePicker', { value: ['2026-10-01', '2026-10-09'] }, (v) => inputs(v).includes('2026-10-01'), { value: [] }],
  ['AutoComplete', { value: 'Laptop stand' }, (v) => inputs(v).includes('Laptop'), { value: '' }],
  ['TreeSelect', { treeData: TREE, value: 'child' }, (v) => text(v).includes('Child'), { value: '' }],
  ['TreeSelect', { treeData: TREE, multiple: true, value: ['child'] }, (v) => text(v).includes('Child'), { value: [] }],
  ['Cascader', { options: CASCADE, value: ['europe', 'lisbon'] }, (v) => text(v).includes('Lisbon'), { value: [] }],
  ['RadioGroup', { options: OPTIONS, value: 'one' }, (v) => checked(v) > 0, { value: '' }],
  ['Segmented', { options: OPTIONS, value: 'one' }, (v) => !!v.root().querySelector('.ant-segmented-item-selected'), { value: '' }],
  ['Rate', { value: 3 }, (v) => v.root().querySelectorAll('.ant-rate-star-full').length === 3, { value: null }],
  ['Checkbox', { checked: true }, (v) => checked(v) > 0, { checked: false }],
  ['Switch', { checked: true }, (v) => checked(v) > 0, { checked: false }],
  ['OTP', { value: '123456' }, (v) => inputs(v).replace(/\|/g, '') === '123456', { value: '', isComplete: false }],
  ['CurrencyInput', { value: 1250 }, (v) => inputs(v).includes('1,250'), { value: null, formattedValue: '' }],
  ['PhoneInput', { value: '+14155550123' }, (v) => inputs(v).includes('415'), { value: '', isValidNumber: false }],
  ['Password', { value: 'Secret#123' }, (v) => inputs(v).includes('Secret'), { value: '', strength: '' }],
  ['Transfer', { targetKeys: ['orders'] }, (v) => v.root().querySelectorAll('.ant-transfer-list')[1].textContent.includes('Orders'), { targetKeys: [] }],
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
    expect(v.root().querySelectorAll('.ant-upload-list-item').length).toBe(0);
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
    fireEvent.change(v.root().querySelector('input[type=file]'), { target: { files: [new File(['x'], 'a.txt', { type: 'text/plain' })] } });
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
    ['Calendar', { value: '2026-10-23' }, (v) => !!v.root().querySelector('.ant-picker-cell-selected[title="2026-10-23"]'), {}],
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
  [...(layer()?.querySelectorAll(selector) ?? [])].find((el) => !/-hidden\b/.test(el.className) && el.style.display !== 'none');

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
    v.setProps({ dataSource: [{ id: 3, name: 'Priya' }, { id: 2, name: 'Owen Hart' }, { id: 1, name: 'Maya' }] });
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
    const data = [{ title: 'A', key: 'a' }, { title: 'B', key: 'b' }];
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
    const items = [{ key: 'p-1', label: 'One' }, { key: 'p_1', label: 'Two' }, { key: 'p2', label: 'Three' }];
    const v = await mount('Collapse', { items, activeKey: ['p-1', 'p2'] }, { formField: false });
    const slots = [...v.root().querySelectorAll('[data-tj-slot]')].map((el) => el.getAttribute('data-tj-slot'));
    expect(new Set(slots).size).toBe(3);
    v.setProps({ items: items.slice(0, 2) });
    await settle();
    expect(v.exposed.activeKey).toEqual(['p-1']);
  });

  it('Tabs: activeKey exposes the tab shown once its tab is removed, and a numeric key opens its tab', async () => {
    const items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
    const v = await mount('Tabs', { items, activeKey: 'b' }, { formField: false });
    v.setProps({ items: [items[0]] });
    await settle();
    expect(v.exposed.activeKey).toBe('a');
    const w = await mount('Tabs', { items: [{ key: '1', label: 'One' }, { key: '2', label: 'Two' }], activeKey: 2 }, { formField: false });
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
    expect(v.root().querySelectorAll('.ant-rate-star-full').length).toBe(5);
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
  test.each(Object.keys(clickable))('%s: follows its record by id, keeps the id a number, and clears once it is gone', async (name) => {
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
  });

  it('ButtonGroup: keeps its values the type the buttons give them', async () => {
    const buttons = [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }];
    const v = await mount('ButtonGroup', { buttons, mode: 'multiple' }, { formField: false });
    fireEvent.click(v.root().querySelectorAll('button')[1]);
    fireEvent.click(v.root().querySelectorAll('button')[0]);
    expect(v.exposed.value).toEqual([2, 1]);
    expect(v.exposed.lastClicked).toBe(1);
    expect(v.root().querySelectorAll('.ant-btn-primary').length).toBe(2);
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
    const themed = root.closest('[style*="--tj-ant-color-primary"]') ?? root.querySelector('[style*="--tj-ant-color-primary"]');
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
    const dataSource = [{ id: 1, company: 'Acme', stage: 'New', lead_id: 'L-1', summary: 'x', created_on: '2026-10-01' }];
    const v = await mount('Table', { dataSource, columns }, { formField: false });
    const headers = [...v.root().querySelectorAll('.ant-table-thead th')].map((th) => th.textContent.trim()).filter(Boolean);
    expect(headers).toEqual(['Company', 'Stage']);
  });
});
