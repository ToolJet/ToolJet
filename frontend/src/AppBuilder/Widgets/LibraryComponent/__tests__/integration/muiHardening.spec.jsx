import React from 'react';
import { act, fireEvent, render, waitFor, within } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import FormSignalContext from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs } from '../fuzz/packTestEnv';
import { TextField, NumberField } from '../../../../../../../packs/mui/src/components/TextField';
import { Select, Autocomplete, AutocompleteMultiple } from '../../../../../../../packs/mui/src/components/Select';
import { DatePicker } from '../../../../../../../packs/mui/src/components/Pickers';
import { Checkbox, Switch, RadioGroup, Rating, Slider } from '../../../../../../../packs/mui/src/components/Selection';
import { Menu } from '../../../../../../../packs/mui/src/components/Menu';
import { LinearProgress, Pagination, Stepper } from '../../../../../../../packs/mui/src/components/Display';
import { DataGrid } from '../../../../../../../packs/mui/src/components/DataGrid';
import { Tabs, Dialog, List } from '../../../../../../../packs/mui/src/components/Containers';
import { Kanban } from '../../../../../../../packs/mui/src/components/Kanban';
import { slotNames } from '../../../../../../../packs/mui/src/lib/data';

installBrowserStubs();

// The Material UI pack under the bug classes an audit of the shadcn pack found (2026-10-23): Form clear, emptied
// bindings, popups whose owner stops taking input, record selection across refreshes, section ids, and exposed values
// that disagree with what is drawn. The pack components, the inline SDK, the host renderer and the Form signal are the
// real ones; only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const COMPONENTS = {
  TextField,
  NumberField,
  Select,
  Autocomplete,
  AutocompleteMultiple,
  DatePicker,
  Checkbox,
  Switch,
  RadioGroup,
  Rating,
  Slider,
  Menu,
  LinearProgress,
  Pagination,
  Stepper,
  DataGrid,
  Tabs,
  Dialog,
  List,
  Kanban,
};
let mounts = 0;

const baseHost = (name, extra = {}) => ({
  formField: true,
  fieldId: `mui-${name}`,
  disabled: false,
  loading: false,
  useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
  setRows: () => {},
  rowSlotAttr: (i) => `tj-row-${i}`,
  registerPopupSlot: () => () => {},
  popupSlotAttr: (slot) => `tj-slot-${slot}`,
  ...extra,
});

// One pack widget on the inline host, inside a Form signal. `update` re-renders it with new properties, a new host
// state, a new wrapper (a parent turning inert) or a Form clear.
const mount = async (name, props, { host = {}, wrapper = {}, popup } = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const events = [];
  // What the exposed values were as each event fired, for checks that a handler reads the new state.
  const seen = [];
  const slots = [];
  const actions = new Map();
  const cacheKey = `mui-hardening-${name}-${(mounts += 1)}`;
  const make = (c) => (
    <FormSignalContext.Provider value={{ clearCount: c.clearCount, submitAttemptCount: 0 }}>
      <div {...c.wrapper}>
        <InlineLibraryComponent
          bundleUrl="pack.js"
          cssUrl="pack.css"
          cacheKey={cacheKey}
          componentName={name}
          componentProps={c.props}
          componentStyles={{}}
          renderSlot={(slot) => {
            slots.push(slot);
            return null;
          }}
          setExposedVariable={(key, value) => {
            exposed[key] = value;
          }}
          fireEvent={(event) => {
            events.push(event);
            seen.push({ event, exposed: JSON.parse(JSON.stringify(exposed)) });
          }}
          actions={actions}
          host={c.host}
          dataCy="mui-widget"
          popupSlotNames={popup ? Object.keys(popup) : undefined}
          renderPopupSlot={popup ? (slot) => popup[slot] : undefined}
        />
      </div>
    </FormSignalContext.Provider>
  );
  let current = { props, host: baseHost(name, host), wrapper, clearCount: 0 };
  const view = render(make(current));
  const root = () => view.container.querySelector('[data-cy="mui-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-mui-root')?.childElementCount).toBeGreaterThan(0));
  const update = (next) => {
    current = { ...current, ...next, host: next.host ? { ...current.host, ...next.host } : current.host };
    view.rerender(make(current));
  };
  const clearForm = () => update({ clearCount: current.clearCount + 1 });
  const act$ = (action, ...args) => act(() => actions.get(action)(...args));
  return { view, root, exposed, events, seen, slots, actions, update, clearForm, act: act$ };
};

const OPTIONS = [
  { label: 'One', value: 'one' },
  { label: 'Two', value: 'two' },
];
// Every element matching `selector` in the page, through open shadow roots: MUI portals into the popup layer, its own
// shadow root on the page.
const deepAll = (selector, root = document) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(selector, el.shadowRoot));
  return found;
};
const popupText = () => deepAll('[role="option"], [role="menuitem"], [role="dialog"]').map((el) => el.textContent).join(' ');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('a native Form clear empties what the MUI field shows, not only its value', () => {
  test('Checkbox and Switch untick', async () => {
    for (const name of ['Checkbox', 'Switch']) {
      const t = await mount(name, { checked: true });
      const box = () => t.root().querySelector('input[type="checkbox"]');
      expect(box().checked).toBe(true);
      t.clearForm();
      await waitFor(() => expect(box().checked).toBe(false));
      expect(t.exposed.checked).toBe(false);
      expect(t.events).not.toContain('onChange');
      t.view.unmount();
    }
  });

  test('Select clears its shown choice and selectedOption', async () => {
    const t = await mount('Select', { options: OPTIONS, value: 'two' });
    await waitFor(() => expect(t.exposed.selectedOption).toEqual({ label: 'Two', value: 'two', disabled: false }));
    expect(t.root().textContent).toContain('Two');
    t.clearForm();
    await waitFor(() => expect(t.root().textContent).not.toContain('Two'));
    expect(t.exposed.value).toBe('');
    expect(t.exposed.selectedOption).toEqual({});
  });

  test('Autocomplete drops a typed draft (which also survives the renders before it)', async () => {
    for (const name of ['Autocomplete', 'AutocompleteMultiple']) {
      const t = await mount(name, { options: OPTIONS });
      const input = () => t.root().querySelector('input');
      // Focused, as a user types: MUI resets the text of an unfocused field to the value's label.
      act(() => input().focus());
      fireEvent.focus(input());
      fireEvent.change(input(), { target: { value: 'Tw' } });
      await waitFor(() => expect(input().value).toBe('Tw'));
      t.clearForm();
      await waitFor(() => expect(input().value).toBe(''));
      expect(t.exposed.inputValue).toBe('');
      t.view.unmount();
    }
  });

  test('Autocomplete keeps text typed over a picked value across renders', async () => {
    // A new value object every render read to MUI as a change, which reset the text to the picked label.
    const t = await mount('Autocomplete', { options: OPTIONS, value: 'one' });
    const input = () => t.root().querySelector('input');
    await waitFor(() => expect(input().value).toBe('One'));
    act(() => input().focus());
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: 'Tw' } });
    t.update({ props: { options: OPTIONS, value: 'one', label: 'City again' } });
    await act(async () => {});
    expect(input().value).toBe('Tw');
  });

  test('NumberField drops an unfinished draft that reads as empty', async () => {
    const t = await mount('NumberField', {});
    const input = t.root().querySelector('input');
    // jsdom keeps any text in a number input; a browser reports '-' as '' to the change handler, as here.
    input.value = '-';
    t.clearForm();
    await waitFor(() => expect(input.value).toBe(''));
    expect(t.exposed.value).toBeNull();
  });

  test('DatePicker clears the shown date', async () => {
    const t = await mount('DatePicker', { value: '2026-10-23', format: 'YYYY-MM-DD' });
    const input = () => t.root().querySelector('input');
    await waitFor(() => expect(input().value).toBe('2026-10-23'));
    t.clearForm();
    await waitFor(() => expect(input().value).not.toContain('2026'));
    expect(t.exposed.value).toBe('');
  });

  test('a TextField still clears (control)', async () => {
    const t = await mount('TextField', { value: 'Ada' });
    t.clearForm();
    await waitFor(() => expect(t.root().querySelector('input').value).toBe(''));
  });
});

describe('an emptied binding clears the field', () => {
  test('Select drops its selectedOption when value becomes empty', async () => {
    const t = await mount('Select', { options: OPTIONS, value: 'one' });
    await waitFor(() => expect(t.exposed.selectedOption.value).toBe('one'));
    t.update({ props: { options: OPTIONS, value: '' } });
    await waitFor(() => expect(t.exposed.selectedOption).toEqual({}));
    expect(t.root().textContent).not.toContain('One');
  });

  test('Select drops its selectedOption when the option is gone', async () => {
    const t = await mount('Select', { options: OPTIONS, value: 'one' });
    await waitFor(() => expect(t.exposed.selectedOption.value).toBe('one'));
    t.update({ props: { options: [OPTIONS[1]], value: 'one' } });
    await waitFor(() => expect(t.exposed.selectedOption).toEqual({}));
  });

  test('AutocompleteMultiple drops its chips when value becomes []', async () => {
    const t = await mount('AutocompleteMultiple', { options: OPTIONS, value: ['one', 'two'] });
    await waitFor(() => expect(t.root().querySelectorAll('.MuiChip-root')).toHaveLength(2));
    t.update({ props: { options: OPTIONS, value: [] } });
    await waitFor(() => expect(t.root().querySelectorAll('.MuiChip-root')).toHaveLength(0));
  });

  test('DatePicker clears when value becomes empty', async () => {
    const t = await mount('DatePicker', { value: '2026-10-23', format: 'YYYY-MM-DD' });
    const input = () => t.root().querySelector('input');
    await waitFor(() => expect(input().value).toBe('2026-10-23'));
    t.update({ props: { value: '', format: 'YYYY-MM-DD' } });
    await waitFor(() => expect(input().value).not.toContain('2026'));
  });
});

describe('an open popup closes once its owner stops taking input', () => {
  const openSelect = async () => {
    const t = await mount('Select', { options: OPTIONS, value: '' });
    fireEvent.mouseDown(t.root().querySelector('[role="combobox"]'));
    await waitFor(() => expect(t.exposed.open).toBe(true));
    await waitFor(() => expect(popupText()).toContain('Two'));
    return t;
  };

  test('Select, when the host disables it: open goes false and onClose fires', async () => {
    const t = await openSelect();
    t.update({ host: { disabled: true } });
    await waitFor(() => expect(t.exposed.open).toBe(false));
    expect(t.events).toContain('onClose');
    expect(t.events).not.toContain('onChange');
  });

  test('Select, when a parent turns inert, and a pick in that instant is refused', async () => {
    const t = await openSelect();
    const option = [...deepAll('[role="option"]')].find((o) => o.textContent === 'Two');
    t.update({ wrapper: { inert: '' } });
    fireEvent.click(option);
    expect(t.exposed.value).toBe('');
    await waitFor(() => expect(t.exposed.open).toBe(false));
    expect(t.events).toContain('onClose');
  });

  test('Autocomplete, when the host disables it', async () => {
    const t = await mount('Autocomplete', { options: OPTIONS });
    fireEvent.mouseDown(t.root().querySelector('input'));
    await waitFor(() => expect(t.events).toContain('onOpen'));
    t.update({ host: { disabled: true } });
    await waitFor(() => expect(t.events).toContain('onClose'));
  });

  test('Menu, when a parent turns inert: it closes with onClose and refuses the pick', async () => {
    const t = await mount('Menu', {});
    fireEvent.click(t.root().querySelector('button'));
    await waitFor(() => expect(t.exposed.open).toBe(true));
    await waitFor(() => expect(popupText()).toContain('Delete'));
    const item = [...deepAll('[role="menuitem"]')].find((o) => o.textContent === 'Delete');
    t.update({ wrapper: { inert: '' } });
    fireEvent.click(item);
    expect(t.events).not.toContain('onItemClick');
    await waitFor(() => expect(t.exposed.open).toBe(false));
    expect(t.events).toContain('onClose');
  });

  test('Dialog refuses Confirm while disabled or inside an inert parent; Cancel still closes it', async () => {
    const t = await mount('Dialog', {});
    t.act('open');
    await waitFor(() => expect(popupText()).toContain('Confirm'));
    const button = (text) => deepAll('button').find((b) => b.textContent === text);
    t.update({ wrapper: { inert: '' } });
    fireEvent.click(button('Confirm'));
    expect(t.events).not.toContain('onConfirm');
    expect(t.exposed.open).toBe(true);
    t.update({ wrapper: {}, host: { disabled: true } });
    await waitFor(() => expect(button('Confirm').disabled).toBe(true));
    fireEvent.click(button('Cancel'));
    await waitFor(() => expect(t.exposed.open).toBe(false));
    expect(t.events).toContain('onCancel');
    expect(t.events).not.toContain('onConfirm');
  });
});

describe('Select events read the new selectedOption (AM-12)', () => {
  const at = (t, event) => t.seen.filter((s) => s.event === event);

  test('a pick: onChange and onClose see the picked option, not the previous one', async () => {
    const t = await mount('Select', { options: OPTIONS, value: 'one' });
    await waitFor(() => expect(t.exposed.selectedOption).toMatchObject(OPTIONS[0]));
    fireEvent.mouseDown(t.root().querySelector('[role="combobox"]'));
    await waitFor(() => expect(popupText()).toContain('Two'));
    fireEvent.click(deepAll('[role="option"]').find((o) => o.textContent === 'Two'));
    for (const event of ['onChange', 'onClose']) {
      expect(at(t, event)).toHaveLength(1);
      expect(at(t, event)[0].exposed.value).toBe('two');
      expect(at(t, event)[0].exposed.selectedOption).toMatchObject(OPTIONS[1]);
    }
  });

  test('setValue and clear: onChange sees the matching selectedOption', async () => {
    const t = await mount('Select', { options: OPTIONS, value: 'one' });
    await waitFor(() => expect(t.exposed.selectedOption).toMatchObject(OPTIONS[0]));
    t.act('setValue', 'two');
    t.act('clear');
    const changes = at(t, 'onChange').map((s) => [s.exposed.value, s.exposed.selectedOption.value]);
    expect(changes).toEqual([
      ['two', 'two'],
      ['', undefined],
    ]);
  });
});

describe('Select gives focus back to its trigger across shadow roots (AM-13)', () => {
  // The focused element through open shadow roots: the menu sits in the popup layer's shadow root, the trigger in the
  // widget's, so document.activeElement alone stops at an outer host.
  const focused = () => {
    let a = document.activeElement;
    while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
    return a;
  };
  const openSelect = async () => {
    const t = await mount('Select', { options: OPTIONS, value: 'one' });
    const combo = t.root().querySelector('[role="combobox"]');
    act(() => combo.focus());
    fireEvent.mouseDown(combo);
    await waitFor(() => expect(popupText()).toContain('Two'));
    await waitFor(() => expect(focused()?.getAttribute('role')).toBe('option'));
    return { t, combo };
  };

  test.each(['pick', 'Escape'])('after %s, focus is on the combobox and the field shows focused', async (how) => {
    const { t, combo } = await openSelect();
    const option = deepAll('[role="option"]').find((o) => o.textContent === (how === 'pick' ? 'Two' : 'One'));
    if (how === 'pick') fireEvent.click(option);
    else fireEvent.keyDown(option, { key: 'Escape' });
    await waitFor(() => expect(t.exposed.open).toBe(false));
    expect(focused()).toBe(combo);
    expect(t.root().querySelector('.MuiInputBase-root').classList.contains('Mui-focused')).toBe(true);
  });

  test('a menu closed because the host disabled the Select does not refocus it', async () => {
    const { t, combo } = await openSelect();
    t.update({ host: { disabled: true } });
    await waitFor(() => expect(t.exposed.open).toBe(false));
    expect(focused()).not.toBe(combo);
  });
});

describe('required validation sees a picked false or 0', () => {
  test.each([
    [false, [{ label: 'No', value: false }, { label: 'Yes', value: true }]],
    [0, [{ label: 'Zero', value: 0 }, { label: 'One', value: 1 }]],
  ])('RadioGroup and Select with %p', async (value, options) => {
    for (const name of ['RadioGroup', 'Select']) {
      const seen = [];
      const useValidation = (v, present) => {
        seen.push(present);
        return { isValid: true, error: '', required: true, touch: () => {} };
      };
      const t = await mount(name, { options, value }, { host: { useValidation } });
      expect(seen[seen.length - 1]).toBe(true);
      t.view.unmount();
    }
  });
});

describe('exposed values agree with what is drawn', () => {
  test('a literal out-of-range Slider value exposes the clamped thumb, with no onChange', async () => {
    const t = await mount('Slider', { value: 150, min: 0, max: 100 });
    await waitFor(() => expect(t.exposed.value).toBe(100));
    expect(t.root().querySelector('input[type="range"]').value).toBe('100');
    t.update({ props: { value: 150, min: 0, max: 40 } });
    await waitFor(() => expect(t.exposed.value).toBe(40));
    expect(t.events).not.toContain('onChange');
  });

  test('a literal Rating past max exposes max', async () => {
    const t = await mount('Rating', { value: 7, max: 5 });
    await waitFor(() => expect(t.exposed.value).toBe(5));
    expect(t.events).not.toContain('onChange');
  });

  test('LinearProgress and Pagination expose the drawn value', async () => {
    const p = await mount('LinearProgress', { value: 150 });
    await waitFor(() => expect(p.exposed.value).toBe(100));
    const g = await mount('Pagination', { count: 10, page: 50 });
    await waitFor(() => expect(g.exposed.page).toBe(10));
    expect(g.events).not.toContain('onChange');
  });

  test('Stepper exposes the step it falls back to when its steps shrink', async () => {
    const steps = [{ label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D' }];
    const t = await mount('Stepper', { steps, activeStep: 3 });
    t.update({ props: { steps: steps.slice(0, 2), activeStep: 3 } });
    await waitFor(() => expect(t.exposed.activeStep).toBe(2));
    expect(t.events).not.toContain('onChange');
  });
});

describe('sectioned layouts', () => {
  test('Tabs gives distinct values distinct canvases', async () => {
    const t = await mount('Tabs', { tabs: [{ value: 'a-b', label: 'Dash' }, { value: 'a_b', label: 'Under' }] });
    await waitFor(() => expect(new Set(t.slots).size).toBe(2));
    expect(slotNames('tab', ['a-b', 'a_b']).get('a_b')).toBe('tab_a_b');
  });

  test('Tabs exposes the tab it shows when the open one is removed', async () => {
    const tabs = [{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }];
    const t = await mount('Tabs', { tabs, value: 'two' });
    t.update({ props: { tabs: [tabs[0]], value: 'two' } });
    await waitFor(() => expect(t.exposed.value).toBe('one'));
    expect(t.events).not.toContain('onChange');
  });
});

const alpha = { id: 1, title: 'Alpha', total: 10 };
const beta = { id: 2, title: 'Beta', total: 20 };

describe('List selection follows the record by id', () => {
  const pickAlpha = async () => {
    const t = await mount('List', { items: [alpha, beta] });
    fireEvent.click(within(t.root()).getByText('Alpha'));
    expect(t.exposed.selectedItem).toEqual(alpha);
    expect(t.exposed.selectedItemKey).toBe(1);
    return t;
  };

  test('a refresh republishes the fresh record without another click event', async () => {
    const t = await pickAlpha();
    const fresh = { ...alpha, title: 'Alpha 2', total: 99 };
    t.update({ props: { items: [beta, fresh] } });
    await waitFor(() => expect(t.exposed.selectedItem).toEqual(fresh));
    expect(t.events.filter((e) => e === 'onItemClick')).toHaveLength(1);
  });

  test('a removal clears it', async () => {
    const t = await pickAlpha();
    t.update({ props: { items: [beta] } });
    await waitFor(() => expect(t.exposed.selectedItem).toEqual({}));
    expect(t.exposed.selectedItemKey).toBe('');
  });
});

describe('DataGrid selection follows the record by id', () => {
  const columns = [{ field: 'title' }, { field: 'total' }];
  const pickAlpha = async () => {
    const t = await mount('DataGrid', { rows: [alpha, beta], columns });
    t.act('selectRow', 1);
    expect(t.exposed.selectedRow).toEqual(alpha);
    // The row's id keeps its type.
    expect(t.exposed.selectedRowId).toBe(1);
    expect(t.exposed.rowSelectionModel).toEqual([1]);
    return t;
  };

  test('a refresh and a reorder republish the fresh record', async () => {
    const t = await pickAlpha();
    const fresh = { ...alpha, total: 99 };
    t.update({ props: { rows: [beta, fresh], columns } });
    await waitFor(() => expect(t.exposed.selectedRow).toEqual(fresh));
    expect(t.exposed.selectedRows).toEqual([fresh]);
    expect(t.exposed.selectedRowId).toBe(1);
  });

  test('a removal clears it, and it stays cleared when the record comes back', async () => {
    const t = await pickAlpha();
    t.update({ props: { rows: [beta], columns } });
    await waitFor(() => expect(t.exposed.selectedRow).toEqual({}));
    expect(t.exposed.selectedRowId).toBe('');
    expect(t.exposed.rowSelectionModel).toEqual([]);
    expect(t.exposed.selectedRows).toEqual([]);
    t.update({ props: { rows: [alpha, beta], columns } });
    await act(async () => {});
    expect(t.exposed.selectedRow).toEqual({});
  });
});

describe("DataGrid takes UI 2.0's column shape", () => {
  // As the AI builder writes it: hidden fields listed with columnVisibility: false, widths as columnSize, a badge
  // column with CSS colours.
  const columns = [
    { key: 'company', name: 'Company', columnSize: 180 },
    { key: 'stage', name: 'Stage', columnType: 'badge', badgeColors: { New: '#2576CE' } },
    { key: 'lead_id', name: 'lead_id', columnVisibility: false },
    { key: 'summary', name: 'summary', columnVisibility: '{{false}}' },
  ];
  test('only the visible listed columns are drawn, and a badge is a chip', async () => {
    const rows = [{ id: 1, company: 'Acme', stage: 'New', lead_id: 'L-1', summary: 'x', created_on: '2026-10-01' }];
    const t = await mount('DataGrid', { rows, columns });
    await waitFor(() => expect(t.root().querySelectorAll('.MuiDataGrid-columnHeaderTitle').length).toBeGreaterThan(0));
    const headers = [...t.root().querySelectorAll('.MuiDataGrid-columnHeaderTitle')].map((el) => el.textContent.trim());
    expect(headers).toEqual(['Company', 'Stage']);
    await waitFor(() => expect(t.root().querySelector('.MuiChip-label')?.textContent).toBe('New'));
  });
});

describe('a keyboard move into a long column', () => {
  // AM-10: the destination drew only its first 100 cards, so the moved card landed past the window, unmounted and
  // focus fell to the page.
  test('Kanban: the moved card stays drawn past the "Show more" window and keeps keyboard focus', async () => {
    const data = [
      { id: 1, title: 'Mover', status: 'todo' },
      ...Array.from({ length: 150 }, (_, i) => ({ id: i + 2, title: `Card ${i + 1}`, status: 'doing' })),
    ];
    const columns = [
      { id: 'todo', title: 'To do' },
      { id: 'doing', title: 'Doing' },
    ];
    const t = await mount('Kanban', { data, columns }, { host: { formField: false } });
    const card = () => [...t.root().querySelectorAll('[aria-roledescription="Draggable card"]')].find((el) => el.textContent.includes('Mover'));
    act(() => card().focus());
    fireEvent.keyDown(card(), { key: ' ' });
    fireEvent.keyDown(card(), { key: 'ArrowRight' });
    fireEvent.keyDown(card(), { key: 'Enter' });
    expect(t.exposed.lastCardMovement).toMatchObject({ cardId: 1, to: 'doing', toIndex: 150 });
    expect(card()).toBeTruthy();
    expect(t.root().activeElement).toBe(card());
  });
});

describe('DataGrid paging in a live app', () => {
  const rows = Array.from({ length: 32 }, (_, i) => ({ id: i + 1, title: `Row ${i + 1}` }));
  const footer = (t) => t.root().querySelector('.MuiTablePagination-displayedRows')?.textContent;
  test('Next advances, and stays there when bindings such as sortModel {{[]}} resolve to new arrays', async () => {
    const t = await mount('DataGrid', { rows, columns: [{ field: 'title' }], pageSize: 12, sortModel: [], paginationModel: { page: 0, pageSize: 10 } });
    await waitFor(() => expect(footer(t)).toBe('1–12 of 32'));
    // The exposed model matches the page drawn from the start.
    await waitFor(() => expect(t.exposed.paginationModel).toEqual({ page: 0, pageSize: 12 }));
    fireEvent.click(t.root().querySelector('button[aria-label="Go to next page"]'));
    await waitFor(() => expect(footer(t)).toBe('13–24 of 32'));
    // The host re-resolves every binding on each change: fresh arrays and objects with the same content.
    t.update({ props: { rows: rows.map((r) => ({ ...r })), columns: [{ field: 'title' }], pageSize: 12, sortModel: [], paginationModel: { page: 0, pageSize: 10 } } });
    await act(async () => {});
    expect(footer(t)).toBe('13–24 of 32');
    expect(t.exposed.paginationModel).toEqual({ page: 1, pageSize: 12 });
  });
});

describe('a native Form reads every MUI field', () => {
  // A Form reads value: Checkbox and Switch expose checked as value too, or the Form left them out, checked or not.
  test.each(['Checkbox', 'Switch'])('%s exposes checked as value', async (name) => {
    const t = await mount(name, { checked: true });
    await waitFor(() => expect(t.exposed.value).toBe(true));
    fireEvent.click(t.root().querySelector('input'));
    await waitFor(() => expect(t.exposed.value).toBe(false));
  });
});

describe('team UI 2.0 report: List twins, the Alert box and the StatCard trend', () => {
  const { Alert, StatCard } = require('../../../../../../../packs/mui/src/components/Display');
  Object.assign(COMPONENTS, { Alert, StatCard });
  const twins = [
    { id: 1, title: 'Alpha', v: 1 },
    { id: 1, title: 'Alpha twin', v: 2 },
    { id: 2, title: 'Beta', v: 3 },
  ];
  const drawnSelected = (t) => [...t.root().querySelectorAll('.Mui-selected')].map((el) => el.textContent);

  test('List: of two records sharing an id, only the picked one draws selected, and a refresh keeps it', async () => {
    const t = await mount('List', { items: twins });
    fireEvent.click(within(t.root()).getByText('Alpha twin'));
    expect(t.exposed.selectedItem).toEqual(twins[1]);
    await waitFor(() => expect(drawnSelected(t)).toEqual(['Alpha twin']));
    t.update({ props: { items: twins.map((r) => ({ ...r, v: r.v + 10 })) } });
    await waitFor(() => expect(t.exposed.selectedItem).toEqual({ ...twins[1], v: 12 }));
    expect(t.exposed.selectedItemKey).toBe(1);
    expect(drawnSelected(t)).toEqual(['Alpha twin']);
  });

  test('Alert fills its widget box, so a long message scrolls inside it', async () => {
    const t = await mount('Alert', { title: 'Heads up', children: 'A long message' });
    expect(t.root().querySelector('.tj-mui-root').classList.contains('tj-mui--fill')).toBe(true);
    expect(t.root().querySelector('.tj-mui-loading').classList.contains('tj-mui-loading--fill')).toBe(true);
  });

  test('StatCard: setTrend sets the direction and, when given, the chip label', async () => {
    const t = await mount('StatCard', { value: '1200', trend: 'neutral', trendLabel: '' });
    expect(t.root().querySelector('.MuiChip-root')).toBeNull();
    t.act('setTrend', 'down', '-8%');
    await waitFor(() => expect(t.exposed.trend).toBe('down'));
    expect(t.exposed.trendLabel).toBe('-8%');
    const chip = t.root().querySelector('.MuiChip-root');
    expect(chip.textContent).toContain('-8%');
    expect(chip.className).toContain('colorError');
    t.act('setTrend', 'up');
    t.act('setTrend', 'sideways');
    await waitFor(() => expect(t.exposed.trend).toBe('up'));
    expect(t.exposed.trendLabel).toBe('-8%');
  });

  test('StatCard: loading draws title, figure, chip and interval placeholders inside the card, not one block', async () => {
    const t = await mount('StatCard', { title: 'Users', value: '1200', trendLabel: '+5%', interval: 'Last 30 days' }, { host: { loading: true } });
    const card = t.root().querySelector('.MuiCard-root.tj-mui-stat');
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect(card.querySelector('.tj-mui-stat-head h2 .MuiSkeleton-text')).toBeTruthy();
    expect(card.querySelector('.tj-mui-stat-head .MuiSkeleton-rounded')).toBeTruthy();
    expect(card.querySelector('.tj-mui-stat-figure .MuiSkeleton-text')).toBeTruthy();
    expect(card.querySelector('.tj-mui-stat-interval .MuiSkeleton-text')).toBeTruthy();
    // No skeleton spans the whole card.
    expect(card.querySelector('.MuiSkeleton-rectangular')).toBeNull();
    expect(card.textContent).not.toContain('Users');
    t.update({ host: { loading: false } });
    await waitFor(() => expect(card.querySelector('.MuiSkeleton-root')).toBeNull());
    expect(card.textContent).toContain('Users');
    expect(card.querySelector('.MuiChip-root').textContent).toContain('+5%');
  });
});

describe('DataGrid columns typed for values that arrive formatted', () => {
  test('a number or date column whose values are already text draws that text, not empty cells', async () => {
    const rows = [{ id: 1, amount: '$1,234.56', on: '24 Oct 2026', n: 7 }];
    const columns = [
      { key: 'amount', name: 'Amount', type: 'number', format: 'currency:USD' },
      { key: 'on', name: 'Spent on', type: 'date', format: 'D MMM YYYY' },
      { key: 'n', name: 'Count', type: 'number', format: 'currency:EUR' },
    ];
    const t = await mount('DataGrid', { rows, columns });
    const cell = (field) => t.root().querySelector(`.MuiDataGrid-cell[data-field="${field}"]`)?.textContent;
    await waitFor(() => expect(cell('amount')).toBe('$1,234.56'));
    expect(cell('on')).toBe('24 Oct 2026');
    expect(cell('n')).toMatch(/€\s?7\.00|7\.00\s?€/);
  });
});

describe('controls UI 2.0 has (team review, 2026-10-24)', () => {
  const Charts = require('../../../../../../../packs/mui/src/components/Charts');
  const { highlightProps } = require('../../../../../../../packs/mui/src/lib/chartHighlight');
  Object.assign(COMPONENTS, { BarChart: Charts.BarChart, LineChart: Charts.LineChart, AreaChart: Charts.AreaChart, PieChart: Charts.PieChart });
  const helper = (t) => t.root().querySelector('.MuiFormHelperText-root')?.textContent ?? '';

  test.each([
    ['email', 'nope', 'a@b.co', 'Enter a valid email address'],
    ['url', 'not a url', 'https://tooljet.com', 'Enter a valid URL'],
  ])('TextField type %s reports a bad value once left, and isValid follows', async (type, bad, good, text) => {
    const t = await mount('TextField', { type, value: bad });
    await waitFor(() => expect(t.exposed.isValid).toBe(false));
    expect(helper(t)).toBe('');
    fireEvent.blur(t.root().querySelector('input'));
    await waitFor(() => expect(helper(t)).toBe(text));
    t.update({ props: { type, value: good } });
    await waitFor(() => expect(t.exposed.isValid).toBe(true));
    expect(helper(t)).toBe('');
  });

  test('TextField type password shows and hides the text with its eye button', async () => {
    const t = await mount('TextField', { type: 'password', value: 's3cret' });
    const box = () => t.root().querySelector('input');
    expect(box().type).toBe('password');
    fireEvent.click(t.root().querySelector('button[aria-label="Show password"]'));
    await waitFor(() => expect(box().type).toBe('text'));
    fireEvent.click(t.root().querySelector('button[aria-label="Hide password"]'));
    await waitFor(() => expect(box().type).toBe('password'));
    expect(t.exposed.value).toBe('s3cret');
    expect(t.root().querySelector('button[aria-label="Show password"]')).toBeTruthy();
    t.view.unmount();
    // Other types get no eye.
    const text = await mount('TextField', { type: 'text', value: 'x' });
    expect(text.root().querySelector('button[aria-label="Show password"]')).toBeNull();
  });

  test('Select shows a clear button while a value is picked; it empties the value and selectedOption', async () => {
    const clear = (t) => t.root().querySelector('button[aria-label="Clear"]');
    const t = await mount('Select', { options: OPTIONS, value: 'two' });
    await waitFor(() => expect(t.exposed.selectedOption).toMatchObject(OPTIONS[1]));
    fireEvent.click(clear(t));
    await waitFor(() => expect(t.exposed.value).toBe(''));
    expect(t.exposed.selectedOption).toEqual({});
    expect(t.events).toEqual(['onChange']);
    expect(clear(t)).toBeNull();
    expect(popupText()).not.toContain('One');
    t.view.unmount();

    const off = await mount('Select', { options: OPTIONS, value: 'two', disableClearable: true });
    expect(clear(off)).toBeNull();
  });

  test('Slider range draws two thumbs for [from, to], fits a single number to the whole range and clears with a Form', async () => {
    const thumbs = (t) => t.root().querySelectorAll('input[type="range"]').length;
    const t = await mount('Slider', { range: true, value: [20, 80] });
    expect(thumbs(t)).toBe(2);
    await act(async () => {});
    expect(t.exposed.value).toEqual([20, 80]);
    t.act('setValue', [90, 10]);
    await waitFor(() => expect(t.exposed.value).toEqual([10, 90]));
    fireEvent.change(t.root().querySelectorAll('input[type="range"]')[0], { target: { value: 30 } });
    await waitFor(() => expect(t.exposed.value).toEqual([30, 90]));
    expect(t.events).toContain('onChange');
    t.clearForm();
    await waitFor(() => expect(t.exposed.value).toEqual([0, 100]));
    t.view.unmount();

    const single = await mount('Slider', { range: true, value: 30 });
    await waitFor(() => expect(single.exposed.value).toEqual([0, 100]));
    expect(single.events).not.toContain('onChange');
    single.update({ props: { range: false, value: [40, 60] } });
    await waitFor(() => expect(single.exposed.value).toBe(40));
    expect(thumbs(single)).toBe(1);
  });

  test.each([
    ['BarChart', { clickedItem: {}, clickedSeries: '' }],
    ['LineChart', { clickedItem: {}, clickedIndex: -1 }],
    ['AreaChart', { clickedItem: {}, clickedIndex: -1 }],
    ['PieChart', { clickedItem: {} }],
  ])('%s takes Highlight clicked point and clearClickedPoint empties what was clicked', async (name, cleared) => {
    const t = await mount(name, { highlightClicked: true }, { host: { formField: false } });
    expect(t.actions.has('clearClickedPoint')).toBe(true);
    t.act('clearClickedPoint');
    await act(async () => {});
    for (const [key, value] of Object.entries(cleared)) expect([key, t.exposed[key]]).toEqual([key, value]);
  });

  test('a pinned item stays highlighted over hover; off, the chart keeps its own highlight', () => {
    const pin = { seriesId: 's1', dataIndex: 2 };
    const hover = { seriesId: 's1', dataIndex: 0 };
    expect(highlightProps(false, pin, hover, () => {})).toEqual({});
    expect(highlightProps(true, pin, hover, () => {}).highlightedItem).toBe(pin);
    expect(highlightProps(true, null, hover, () => {}).highlightedItem).toBe(hover);
    expect(highlightProps(true, null, null, () => {}).highlightedItem).toBeNull();
  });
});

describe('AM-04: Escape from a ToolJet component in the Dialog body', () => {
  // The body's components are the host's, projected through the body's <slot>: a light-DOM child of the popup layer.
  const BODY = {
    body: (
      <div>
        <input data-testid="draft" />
        <input data-testid="combo" aria-expanded="true" />
        <input data-testid="collapsed" aria-expanded="false" />
      </div>
    ),
  };
  const field = (id) => document.querySelector(`.tj-cc-popup-host [data-testid="${id}"]`);
  const escape = async (el, init = {}) => {
    await act(async () => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true, ...init }));
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  };
  const openWith = async (props = {}) => {
    const t = await mount('Dialog', props, { popup: BODY });
    t.act('open');
    await waitFor(() => expect(t.exposed.open).toBe(true));
    await waitFor(() => expect(field('draft')).toBeTruthy());
    return t;
  };

  test('the slot projects the field into the dialog content', async () => {
    await openWith();
    const content = deepAll('.MuiDialogContent-root')[0];
    expect(content.querySelector('slot')).toBeTruthy();
    expect(field('draft').closest('[slot]').assignedSlot).toBeTruthy();
  });

  test('closes the dialog once, with onClose, from a text field the host isolates', async () => {
    const t = await openWith();
    await escape(field('draft'));
    await waitFor(() => expect(t.exposed.open).toBe(false));
    expect(t.events.filter((e) => e === 'onClose')).toHaveLength(1);
  });

  test('stays open while Escape is disabled', async () => {
    const t = await openWith({ disableEscapeKeyDown: true });
    await escape(field('draft'));
    expect(t.exposed.open).toBe(true);
    expect(t.events).not.toContain('onClose');
  });

  test('stays open when an inner popup is expanded, or a field used the key', async () => {
    const t = await openWith();
    await escape(field('combo'));
    expect(t.exposed.open).toBe(true);
    const used = (e) => e.key === 'Escape' && e.preventDefault();
    field('draft').addEventListener('keydown', used);
    await escape(field('draft'));
    field('draft').removeEventListener('keydown', used);
    expect(t.exposed.open).toBe(true);
    expect(t.events).not.toContain('onClose');
  });

  test("closes from a collapsed combobox that prevents every Escape (ToolJet's Select)", async () => {
    const t = await openWith();
    const swallow = (e) => e.preventDefault();
    field('collapsed').addEventListener('keydown', swallow);
    await escape(field('collapsed'));
    await waitFor(() => expect(t.exposed.open).toBe(false));
  });

  test("Escape on the dialog's own Cancel still closes it once", async () => {
    const t = await openWith();
    const cancel = deepAll('button').find((b) => b.textContent === 'Cancel');
    await escape(cancel);
    await waitFor(() => expect(t.exposed.open).toBe(false));
    expect(t.events.filter((e) => e === 'onClose')).toHaveLength(1);
  });

  test('stops listening once closed', async () => {
    const t = await openWith();
    t.act('close');
    await waitFor(() => expect(t.exposed.open).toBe(false));
    await escape(field('draft'));
    expect(t.events).not.toContain('onClose');
  });
});

describe('UI2-12: MUI Tabs link each tab to its panel', () => {
  test('the active tab and its panel point at each other, ids scoped to the widget', async () => {
    const t = await mount('Tabs', { tabs: [{ value: 'a b', label: 'A' }, { value: 'b', label: 'B' }] });
    for (const next of ['a b', 'b']) {
      t.act('setValue', next);
      await waitFor(() => expect(t.exposed.value).toBe(next));
      const tab = t.root().querySelector('[role="tab"][aria-selected="true"]');
      const panel = t.root().getElementById(tab.getAttribute('aria-controls'));
      expect(tab.id).toMatch(/^mui-Tabs-tab-/);
      expect(tab.id).not.toMatch(/\s/);
      expect(panel.getAttribute('role')).toBe('tabpanel');
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
      expect(panel.hidden).toBe(false);
    }
  });
});

describe('T33: MUI default heights are whole grid rows', () => {
  // Read from the sources: a fractional row count (4.1, 6.9) left the box between grid rows.
  test('every useComponentSettings defaultHeight is an integer', () => {
    const fs = require('fs');
    const path = require('path');
    const dir = path.resolve(__dirname, '../../../../../../../packs/mui/src/components');
    const heights = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.tsx'))
      .flatMap((f) => [...fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/defaultHeight:\s*([\d.]+)/g)].map((m) => [f, Number(m[1])]));
    expect(heights.length).toBeGreaterThan(30);
    expect(heights.filter(([, h]) => !Number.isInteger(h))).toEqual([]);
  });
});

describe('round two: theme-backed style defaults, hints and theme gaps (2026-10-24)', () => {
  const fs = require('fs');
  const path = require('path');
  const PACK = path.resolve(__dirname, '../../../../../../../packs/mui');
  const Display = require('../../../../../../../packs/mui/src/components/Display');
  const Charts = require('../../../../../../../packs/mui/src/components/Charts');
  const { Button } = require('../../../../../../../packs/mui/src/components/Button');
  const theme = require('../../../../../../../packs/mui/src/lib/theme');
  const { ownColor, THEME_TOKEN } = require('../../../../../../../packs/mui/src/lib/themeStyle');
  Object.assign(COMPONENTS, { Button, Alert: Display.Alert, StatCard: Display.StatCard, BarChart: Charts.BarChart, PieChart: Charts.PieChart });
  const manifest = () => JSON.parse(fs.readFileSync(path.join(PACK, 'dist/manifest.json'), 'utf8')).components;

  // A canvas that parses colours as a browser's does for hex and rgb(), so normalizeColor works in jsdom (the shared
  // stub's context reads every property as a function). theme.ts makes its probe on the first colour it parses.
  const realGetContext = HTMLCanvasElement.prototype.getContext;
  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = () => {
      let fill = '#000000';
      return {
        get fillStyle() {
          return fill;
        },
        set fillStyle(v) {
          const t = String(v).trim().toLowerCase();
          if (/^#[0-9a-f]{6}$/.test(t) || /^rgba?\(/.test(t)) fill = t;
        },
      };
    };
  });
  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = realGetContext;
  });

  // One widget with given Styles (the shared mount passes none).
  const mountStyled = async (name, props, styles) => {
    loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
    const view = render(
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey={`mui-round2-${name}-${(mounts += 1)}`}
        componentName={name}
        componentProps={props}
        componentStyles={styles}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        actions={new Map()}
        host={baseHost(name)}
        dataCy="mui-widget"
      />
    );
    const root = () => view.container.querySelector('[data-cy="mui-widget"]').shadowRoot;
    await waitFor(() => expect(root().querySelector('.tj-mui-root')?.childElementCount).toBeGreaterThan(0));
    return { view, root };
  };
  /** Every element's class list under the widget: Emotion's class names hash the styles, so equal lists draw alike. */
  const classes = (root) => [...root.querySelectorAll('.tj-mui-root *')].map((el) => el.getAttribute('class') ?? '').join('|');
  const defaultsOf = (name) =>
    Object.fromEntries(manifest()[name].styles.filter((s) => s.default !== undefined).map((s) => [s.name, s.default]));

  test('every MUI colour style (but the shared Kanban hook\'s) defaults to a theme token; every radius shows a placeholder', () => {
    // The Kanban's board styles come from the hook it shares with the Ant pack (lib/ui2/display/kanban/useKanban.ts).
    const shared = (s) => s.component === 'Kanban' && !['primary', 'textPrimary', 'backgroundPaper', 'divider', 'borderRadius'].includes(s.name);
    const fields = Object.entries(manifest())
      .flatMap(([name, c]) => c.styles.map((s) => ({ component: name, ...s })))
      .filter((s) => !shared(s));
    const colours = fields.filter((s) => s.inspector === 'color');
    expect(colours.length).toBe(37 * 4 + 3);
    expect(colours.filter((s) => !/^var\(--cc-[\w-]+\)$/.test(String(s.default)))).toEqual([]);
    const radii = fields.filter((s) => s.name === 'borderRadius');
    expect(radii.length).toBe(37);
    expect(radii.filter((s) => !s.placeholder)).toEqual([]);
  });

  test('a colour style at its theme default, or cleared, adds nothing; any other value is its own', () => {
    for (const token of Object.values(THEME_TOKEN)) {
      expect(ownColor(token, token)).toBeUndefined();
      expect(ownColor(token.toUpperCase().replace('(', '( '), token)).toBeUndefined();
      expect(ownColor('', token)).toBeUndefined();
    }
    expect(ownColor('#ff0000', THEME_TOKEN.brand)).toBe('#ff0000');
    expect(ownColor('var(--cc-success-systemStatus)', THEME_TOKEN.brand)).toBe('var(--cc-success-systemStatus)');
  });

  test.each(['Button', 'Alert', 'StatCard'])('%s left at its new style defaults draws exactly what blank styles drew', async (name) => {
    const defaults = defaultsOf(name);
    expect(defaults.primary).toBe('var(--cc-primary-brand)');
    const blank = Object.fromEntries(Object.keys(defaults).map((k) => [k, '']));
    const a = await mountStyled(name, {}, defaults);
    const b = await mountStyled(name, {}, blank);
    expect(classes(a.root())).toBe(classes(b.root()));
    // ... while a style of its own still changes the look (each of these draws on Paper).
    const c = await mountStyled(name, {}, { ...defaults, primary: '#ff0000', backgroundPaper: '#ff0000' });
    expect(classes(c.root())).not.toBe(classes(b.root()));
  });

  test('the theme mapping: defaults add nothing over the app theme, with and without one', () => {
    const themed = {
      mode: 'light',
      brand: '#4f46e5',
      onBrand: '#ffffff',
      surface: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
      borderWeak: '#e2e8f0',
      radius: 12,
      font: 'Inter',
    };
    const atDefaults = { primary: undefined, textPrimary: undefined, backgroundPaper: undefined, divider: undefined, borderRadius: undefined };
    for (const app of [{ mode: 'light' }, { mode: 'dark' }, themed, { ...themed, mode: 'dark', surface: '#111a2e' }]) {
      const a = theme.buildTheme(app, theme.resolveOverrides(atDefaults, null), null);
      const b = theme.buildTheme(app, {}, null);
      expect(JSON.stringify(a.palette)).toBe(JSON.stringify(b.palette));
      expect(JSON.stringify(a.components)).toBe(JSON.stringify(b.components));
      expect(a.shape).toEqual(b.shape);
    }
  });

  test('a theme swatch picked for a style resolves to its colour where the component is drawn', () => {
    const el = document.createElement('div');
    el.style.setProperty('--cc-success-systemStatus', '#1e823b');
    document.body.appendChild(el);
    expect(theme.resolveColor('var(--cc-success-systemStatus)', el)).toBe('#1e823b');
    expect(theme.resolveColor('var(--cc-missing, #123456)', el)).toBe('#123456');
    expect(theme.resolveColor('var(--cc-missing)', el)).toBeUndefined();
    expect(theme.resolveColor('#ABCDEF', el)).toBe('#abcdef');
  });

  test('with an app theme: info is the brand, pickers and fields take its border, DataGrid its surface, the Slider label its radius', () => {
    const app = { mode: 'dark', brand: '#818cf8', onBrand: '#0a0a0a', surface: '#111a2e', border: '#334155', radius: 12 };
    const t = theme.buildTheme(app, {}, null);
    expect(t.palette.info.main).toBe('#818cf8');
    expect(t.palette.DataGrid).toEqual({ bg: '#111a2e', headerBg: '#111a2e', pinnedBg: '#111a2e' });
    expect(t.components.MuiPickersOutlinedInput.styleOverrides.notchedOutline.borderColor).toBe('#334155');
    expect(t.components.MuiOutlinedInput.styleOverrides.notchedOutline.borderColor).toBe('#334155');
    expect(t.components.MuiSlider.styleOverrides.valueLabel.borderRadius).toBe(12);
    // Without one, MUI's stock look stands.
    const stock = theme.buildTheme({ mode: 'dark' }, {}, null);
    expect(stock.palette.info.main).toBe('#29b6f6');
    expect(stock.palette.DataGrid).toBeUndefined();
    expect(stock.components.MuiPickersOutlinedInput).toBeUndefined();
    expect(stock.components.MuiSlider).toBeUndefined();
  });

  test('the charts’ default series palette leads with the brand, then tints and a shade of it', () => {
    const p = theme.seriesPalette('#4f46e5');
    expect(p[0]).toBe('#4f46e5');
    expect(p.length).toBeGreaterThanOrEqual(8);
    expect(new Set(p).size).toBe(p.length);
    // Computed colours MUI X can parse (it fades and highlights series), never color-mix().
    expect(p.every((c) => /^(#|rgb)/.test(c))).toBe(true);
  });

  test.each(['BarChart', 'PieChart'])('%s with no colors list draws the Primary style’s brand first, not MUI X’s palette', async (name) => {
    const t = await mountStyled(name, {}, { ...defaultsOf(name), primary: '#4f46e5' });
    const fills = () => [...t.root().querySelectorAll('[fill]')].map((el) => el.getAttribute('fill').toLowerCase());
    await waitFor(() => expect(fills()).toContain('#4f46e5'));
    expect(fills()).not.toContain('#4254fb');
    // An explicit colors list still wins.
    const own = await mountStyled(name, { colors: ['#ff0000', '#00ff00', '#0000ff'] }, { ...defaultsOf(name), primary: '#4f46e5' });
    await waitFor(() => expect([...own.root().querySelectorAll('[fill]')].map((el) => el.getAttribute('fill'))).toContain('#ff0000'));
  });

  test('Alert severity Custom draws its Custom styles, and they show only for it', async () => {
    const m = manifest().Alert;
    expect(m.props.find((p) => p.name === 'severity').enumValues).toContain('custom');
    const custom = m.styles.filter((s) => s.section === 'Custom severity');
    expect(custom.map((s) => s.name)).toEqual(['customAccent', 'customBackground', 'customText']);
    expect(custom.every((s) => s.visibleWhen?.key === 'severity' && s.visibleWhen?.value === 'custom')).toBe(true);
    const plain = await mountStyled('Alert', { severity: 'custom', title: 'T', children: 'M' }, defaultsOf('Alert'));
    const styled = await mountStyled('Alert', { severity: 'custom', title: 'T', children: 'M' }, { ...defaultsOf('Alert'), customAccent: '#ff0000', customText: '#00ff00' });
    expect(plain.root().querySelector('.MuiAlert-root')).not.toBeNull();
    expect(classes(styled.root())).not.toBe(classes(plain.root()));
  });

  test('hints: StatCard samples a number shown compact, option props use the options editor, Kanban names cardData', async () => {
    const m = manifest();
    const prop = (c, p) => m[c].props.find((x) => x.name === p);
    expect(prop('StatCard', 'value').default).toBe('14000');
    expect(prop('StatCard', 'format').default).toBe('compact');
    const t = await mountStyled('StatCard', {}, {});
    expect(t.root().textContent).toContain('14K');
    for (const [c, p] of [
      ['Select', 'options'],
      ['Autocomplete', 'options'],
      ['AutocompleteMultiple', 'options'],
      ['RadioGroup', 'options'],
      ['ToggleButtonGroup', 'options'],
      ['Menu', 'items'],
    ])
      expect(`${c}.${p}:${prop(c, p).inspector}`).toBe(`${c}.${p}:options`);
    expect(fs.readFileSync(path.join(PACK, 'src/components/Kanban.tsx'), 'utf8')).toContain('{{cardData}}');
  });
});
