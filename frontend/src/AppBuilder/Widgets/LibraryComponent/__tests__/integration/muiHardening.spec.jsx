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
const mount = async (name, props, { host = {}, wrapper = {} } = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const events = [];
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
          fireEvent={(event) => events.push(event)}
          actions={actions}
          host={c.host}
          dataCy="mui-widget"
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
  return { view, root, exposed, events, slots, actions, update, clearForm, act: act$ };
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
