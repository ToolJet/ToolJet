/**
 * Rows on demand (../../rows.js) for a row of input widgets: a long ListView whose row holds one of each input that has
 * an exposure module (../../widgets) reads and acts on a row it never drew, and needs no row drawn to do so.
 */
import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  binding,
  drain,
  option,
  radioButtonV2Defaults,
  widgetProps,
  preloadLazyComponent,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import {
  DEFAULT_PROPERTIES as MULTISELECT_PROPERTIES,
  DEFAULT_STYLES as MULTISELECT_STYLES,
  DEFAULT_VALIDATION as MULTISELECT_VALIDATION,
} from '@/AppBuilder/Widgets/MultiselectV2/__tests__/integration/multiselectV2Harness';
import { numberInputExposure } from '../../widgets/NumberInput';

// Integration specs that draw real rows: a CI runner takes several times as long as a laptop.
jest.setTimeout(60000);

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'listview-input-rows-on-demand',
  name: 'Listview rows of input widgets read and run without being drawn',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

const ROW_HEIGHT = 100;
const ROWS = Array.from({ length: 3000 }, (_, i) => ({
  name: `row ${i}`,
  n: i,
  odd: i % 2 === 1,
  pick: String(1 + (i % 3)),
  day: `${String(1 + (i % 28)).padStart(2, '0')}/01/2022`,
  hour: `${String(i % 24).padStart(2, '0')}:00`,
}));
const STATES = {
  visibility: binding('{{true}}'),
  loadingState: binding('{{false}}'),
  disabledState: binding('{{false}}'),
};
const DATE_VALIDATION = {
  minDate: binding(''),
  maxDate: binding(''),
  disabledDates: binding('{{[]}}'),
  customRule: binding(''),
  mandatory: binding('{{false}}'),
};
const TIME_VALIDATION = { minTime: binding(''), maxTime: binding('') };
const OPTIONS = [option('One', '1'), option('Two', '2', { isDefault: true }), option('Three', '3')];

/** One of each input widget with an exposure module: [id, handle, type, properties, styles, validation]. */
const WIDGETS = [
  ['chk1', 'checkbox1', 'Checkbox', { label: binding('{{listItem.name}}'), defaultValue: binding('{{listItem.odd}}') }],
  ['tgl1', 'toggleswitchv21', 'ToggleSwitchV2', { label: binding('Label'), defaultValue: binding('{{listItem.odd}}') }],
  [
    'num1',
    'numberinput1',
    'NumberInput',
    {
      value: binding('{{listItem.n}}'),
      label: binding('Label'),
      placeholder: binding('0'),
      decimalPlaces: binding('{{2}}'),
      showClearBtn: binding('{{false}}'),
      disableStepControls: binding('{{false}}'),
    },
  ],
  [
    'dd1',
    'dropdown1',
    'DropdownV2',
    {
      label: binding('{{listItem.name}}'),
      placeholder: binding('Select an option'),
      advanced: binding('{{false}}'),
      options: { value: OPTIONS },
      sort: binding('none'),
      optionsLoadingState: binding('{{false}}'),
      showClearBtn: binding('{{true}}'),
      showSearchInput: binding('{{true}}'),
      serverSideSearch: binding('{{false}}'),
    },
    { padding: binding('default') },
  ],
  [
    'ms1',
    'multiselect1',
    'MultiselectV2',
    { ...MULTISELECT_PROPERTIES, values: binding("{{[listItem.pick, '3']}}") },
    MULTISELECT_STYLES,
    { ...MULTISELECT_VALIDATION, mandatory: binding('{{listItem.odd}}') },
  ],
  [
    'radio1',
    'radiobutton1',
    'RadioButtonV2',
    {
      ...radioButtonV2Defaults.defaultProperties,
      advanced: binding('{{true}}'),
      schema: binding(
        "{{[{label: 'One', value: '1', visible: true, default: listItem.pick === '1'}," +
          "{label: 'Two', value: '2', visible: true, default: listItem.pick === '2'}]}}"
      ),
    },
    radioButtonV2Defaults.defaultStyles,
  ],
  [
    'dp1',
    'datepickerv21',
    'DatePickerV2',
    { label: binding('Label'), defaultValue: binding('{{listItem.day}}'), dateFormat: binding('DD/MM/YYYY') },
    {},
    {
      ...DATE_VALIDATION,
      minDate: binding("{{listItem.odd ? '15/01/2022' : ''}}"),
      disabledDates: binding("{{listItem.odd ? [] : ['02/01/2022']}}"),
      mandatory: binding('{{listItem.odd}}'),
    },
  ],
  [
    'tp1',
    'timepicker1',
    'TimePicker',
    { label: binding('Label'), defaultValue: binding('{{listItem.hour}}'), timeFormat: binding('HH:mm') },
    {},
    {
      ...TIME_VALIDATION,
      minTime: binding("{{listItem.odd ? '16:00' : ''}}"),
      customRule: binding(''),
      mandatory: binding('{{false}}'),
    },
  ],
  [
    'dtp1',
    'datetimepickerv21',
    'DatetimePickerV2',
    {
      label: binding('Label'),
      defaultValue: binding("{{listItem.day + ' ' + listItem.hour}}"),
      dateFormat: binding('DD/MM/YYYY'),
      timeFormat: binding('HH:mm'),
      isTimezoneEnabled: binding('{{listItem.odd}}'),
      displayTimezone: binding('UTC'),
      storeTimezone: binding('UTC'),
    },
    {},
    { ...DATE_VALIDATION, ...TIME_VALIDATION, maxTime: binding("{{listItem.odd ? '' : '10:00'}}") },
  ],
  [
    'drp1',
    'daterangepicker1',
    'DaterangePicker',
    {
      label: binding('Label'),
      defaultStartDate: binding('{{listItem.day}}'),
      defaultEndDate: binding('28/01/2022'),
      format: binding('DD/MM/YYYY'),
    },
    {},
    { ...DATE_VALIDATION, customRule: binding("{{listItem.odd ? 'odd rows fail' : ''}}") },
  ],
];
const HANDLES = WIDGETS.map(([, handle]) => handle);

let session;

function renderListview(rows) {
  state().setVariable('rows', rows, MODULE_ID);
  const listview = componentDefinition('lv1', 'listview1', 'Listview', {
    dataSourceSelector: binding('rawJson'),
    data: binding('{{variables.rows}}'),
    mode: binding('list'),
    rowHeight: binding(String(ROW_HEIGHT)),
    enablePagination: binding('{{false}}'),
    ...STATES,
  });
  const children = Object.fromEntries(
    WIDGETS.map(([id, handle, type, properties, styles = {}, validation = {}]) => {
      const def = componentDefinition(id, handle, type, { ...STATES, ...properties });
      def.component.parent = 'lv1';
      Object.assign(def.component.definition, {
        styles,
        validation,
        others: { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') },
      });
      return [id, def];
    })
  );
  seedApp({ lv1: listview, ...children }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
}

const listview = () => state().getExposedValueOfComponent('lv1', MODULE_ID);
const rowElements = () =>
  [...document.querySelectorAll('[data-cy*="-row-"]')].filter((e) => e.closest('.listview-scroll-container'));
const renderedRows = () => rowElements().map((e) => Number(e.getAttribute('data-cy').split('-row-').pop()));
const scrollTo = async (top) => {
  const el = document.querySelector('.listview-scroll-container');
  await act(async () => {
    el.scrollTop = top;
    fireEvent.scroll(el);
  });
  await drain();
  await drain();
};
/** Exposed values without functions. */
const values = (exposed) =>
  Object.fromEntries(Object.entries(exposed ?? {}).filter(([, value]) => typeof value !== 'function'));
const functionsOf = (exposed) => Object.keys(exposed ?? {}).filter((key) => typeof exposed[key] === 'function');
/** Waits until every child of `row` has mounted and exposed its actions. */
const drawn = (row) =>
  waitFor(() =>
    HANDLES.forEach((handle) => expect(listview().children?.[row]?.[handle]?.setDisable).toBeInstanceOf(Function))
  );

beforeAll(() =>
  Promise.all(
    ['Listview', ...WIDGETS.map(([, , type]) => type)].map((type) => preloadLazyComponent(getComponentToRender(type)))
  )
);

describe('Listview rows on demand — a row of input widgets', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });
  afterEach(() => jest.restoreAllMocks());

  test('a row never drawn is computed, reads what it exposes once drawn, and takes state actions', async () => {
    renderListview(ROWS);
    await drain();
    await drain();
    await waitFor(() => expect(renderedRows()).toContain(0));
    await drawn(0);

    // Every child is computed: no row needs drawing to read it.
    await waitFor(() => expect(state().estimateListviewRows('lv1', {}, MODULE_ID).ready).toBe(true));
    expect(state().estimateListviewRows('lv1', {}, MODULE_ID)).toMatchObject({ drawnChildren: [], drawnWidgets: 0 });
    expect(state().uncomputedRowChildren('lv1', 2007, MODULE_ID)).toEqual([]);

    const read = state().readListviewRow('lv1', 2007, MODULE_ID);
    expect(listview().children[2007]).toBeUndefined();
    expect(Object.keys(read)).toEqual(HANDLES);
    expect(read.checkbox1).toMatchObject({ value: true, label: 'row 2007' });
    expect(read.toggleswitchv21.value).toBe(true);
    expect(read.numberinput1.value).toBe(2007);
    expect(read.dropdown1).toMatchObject({ value: '2', label: 'row 2007' });
    // Options, values, dates, times, time zones and validation are the row's own (2007: odd, pick '1', the 20th, 15:00).
    expect(read.multiselect1).toMatchObject({ values: ['1', '3'], isMandatory: true, isValid: true });
    expect(read.radiobutton1.value).toBe('1');
    expect(read.datepickerv21).toMatchObject({ selectedDate: '20/01/2022', minDate: '15/01/2022', isValid: true });
    expect(read.timepicker1).toMatchObject({ value: '15:00', minTime: '16:00', isValid: false });
    expect(read.datetimepickerv21).toMatchObject({
      selectedDate: '20/01/2022',
      selectedTime: '15:00',
      storeTimezone: 'UTC',
      isValid: true,
    });
    expect(read.daterangepicker1).toMatchObject({ selectedDateRange: '20/01/2022 - 28/01/2022', isValid: false });
    // 2008: even, pick '2', the 21st, 16:00.
    const even = state().readListviewRow('lv1', 2008, MODULE_ID);
    expect(even.multiselect1).toMatchObject({ values: ['2', '3'], isMandatory: false });
    expect(even.radiobutton1.value).toBe('2');
    expect(even.datepickerv21).toMatchObject({ selectedDate: '21/01/2022', minDate: '', isValid: true });
    expect(even.timepicker1).toMatchObject({ value: '16:00', isValid: true });
    expect(even.datetimepickerv21.isValid).toBe(false);
    expect(even.daterangepicker1.isValid).toBe(true);

    // State actions on each child, with values that aren't booleans: kept for the row, not drawn.
    await act(async () => {
      await Promise.all(HANDLES.map((handle) => read[handle].setDisable(true)));
      await Promise.all(HANDLES.map((handle) => read[handle].setLoading(1)));
      await Promise.all(HANDLES.map((handle) => read[handle].setVisibility('')));
    });
    await drain();
    expect(renderedRows()).not.toContain(2007);
    const changed = state().readListviewRow('lv1', 2007, MODULE_ID);
    HANDLES.forEach((handle) => {
      expect(changed[handle].isDisabled).toBe(true);
      expect(changed[handle].isLoading).toBeTruthy();
      expect(changed[handle].isVisible).toBeFalsy();
      expect(listview().data[2007][handle].isDisabled).toBe(true);
    });

    // Drawn, the row exposes what it read, with the action applied.
    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toContain(2007));
    await drawn(2007);
    await drain();
    HANDLES.forEach((handle) => {
      const shown = listview().children[2007][handle];
      expect(values(shown)).toEqual(values(changed[handle]));
      expect(functionsOf(shown)).toEqual(expect.arrayContaining(functionsOf(changed[handle])));
    });
  });

  test('a module that throws for a row leaves that child without values, as its crashed widget, and its siblings read', async () => {
    renderListview(ROWS);
    await drain();
    await drain();
    await waitFor(() => expect(renderedRows()).toContain(0));
    await drawn(0);

    const { initial } = numberInputExposure;
    jest.spyOn(numberInputExposure, 'initial').mockImplementation((input) => {
      if (input.properties.value === 2007) throw new RangeError('toFixed() digits argument must be between 0 and 100');
      return initial(input);
    });
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    const read = state().readListviewRow('lv1', 2007, MODULE_ID);
    expect(Object.keys(read)).toEqual(HANDLES);
    expect(values(read.numberinput1)).toEqual({ id: 'num1' });
    expect(read.checkbox1).toMatchObject({ value: true, label: 'row 2007' });
    expect(read.dropdown1).toMatchObject({ value: '2', label: 'row 2007' });
    expect(error).toHaveBeenCalledWith(expect.stringContaining('num1'), expect.any(RangeError));
    // Other rows compute it as before.
    expect(state().readListviewRow('lv1', 2008, MODULE_ID).numberinput1.value).toBe(2008);
  });
});
