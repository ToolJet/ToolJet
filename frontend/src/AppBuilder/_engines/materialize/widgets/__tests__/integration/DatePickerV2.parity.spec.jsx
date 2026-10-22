/**
 * DatePickerV2's exposure module (../../DatePickerV2.js) against the real widget: what the mounted picker exposes must
 * be what `initial` computes from its resolved props, and each state action must change exactly what its patch says.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  drain,
  store,
  widgetProps,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { datePickerV2Config } from '@tooljet/widget-definitions';
import { datePickerV2Exposure } from '../../DatePickerV2';
import * as datePickerV2Module from '../../DatePickerV2';

const ID = 'dp1';

const widget = createWidgetHarness({
  componentType: 'DatePickerV2',
  handle: 'datepickerv21',
  id: ID,
  preload: ['Listview'],
  defaultProperties: {
    label: binding('Label'),
    defaultValue: binding('01/01/2022'),
    dateFormat: binding('DD/MM/YYYY'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  },
  defaultValidation: {
    minDate: binding(''),
    maxDate: binding(''),
    disabledDates: binding('{{[]}}'),
    customRule: binding(''),
    mandatory: binding('{{false}}'),
  },
});

/** The props the widget receives, read from the store as RenderWidget builds them. */
const inputOf = (id, row = null) => {
  const resolved = store().getResolvedComponent(id, row, MODULE_ID);
  return {
    properties: { ...resolved.general, ...resolved.properties },
    styles: { ...resolved.generalStyles, ...resolved.styles },
    general: resolved.general,
    validation: resolved.validation,
  };
};

/** Exposed values without the functions, and without `id` (RenderWidget exposes that). */
const valuesOf = (exposed) =>
  Object.fromEntries(Object.entries(exposed).filter(([key, value]) => key !== 'id' && typeof value !== 'function'));

const mounted = async (exposed = () => widget.exposed()) => {
  await waitFor(() => expect(exposed()?.setValue).toBeInstanceOf(Function));
  await drain();
};

describe('DatePickerV2 exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    ['another format', { defaultValue: binding('2023-05-17'), dateFormat: binding('YYYY-MM-DD') }, {}],
    ['a format with month names', { defaultValue: binding('17 May 2023'), dateFormat: binding('DD MMM YYYY') }, {}],
    ['no default value', { defaultValue: binding('') }, {}],
    ['a unix timestamp', { defaultValue: binding('1700000000000') }, {}],
    ['a default value that does not parse', { defaultValue: binding('not a date') }, {}],
    ['label a number', { label: binding('{{7}}') }, {}],
    [
      'hidden, loading and disabled',
      { visibility: binding('{{false}}'), loadingState: binding('{{true}}'), disabledState: binding('{{true}}') },
      {},
    ],
    [
      'non-boolean states',
      { visibility: binding('yes'), loadingState: binding('{{1}}'), disabledState: binding('') },
      {},
    ],
    ['mandatory and empty', { defaultValue: binding('') }, { mandatory: binding('{{true}}') }, false],
    ['mandatory and filled', {}, { mandatory: binding('{{true}}') }, true],
    ['min date failing', {}, { minDate: binding('01/06/2022') }, false],
    ['min date passing', {}, { minDate: binding('01/12/2021') }, true],
    ['min date that does not parse', {}, { minDate: binding('soon') }],
    ['max date failing', {}, { maxDate: binding('01/12/2021') }, false],
    ['max date passing', {}, { maxDate: binding('01/06/2022') }, true],
    ['the default value disabled', {}, { disabledDates: binding('{{["01/01/2022", "nope"]}}') }, false],
    ['other dates disabled', {}, { disabledDates: binding('{{["02/01/2022"]}}') }, true],
    ['disabled dates not a list', {}, { disabledDates: binding('{{"01/01/2022"}}') }],
    ['custom rule failing', {}, { customRule: binding("{{'bad date'}}") }, false],
    ['custom rule passing', {}, { customRule: binding('{{null}}') }, true],
    // The expected isValid, where a row gives one, is a rest parameter: Jest takes a parameter past a row's length for
    // a done callback.
  ])('on mount, exposes what initial computes: %s', async (_, properties, validation, ...[isValid]) => {
    widget.render({ properties, validation });
    await mounted();
    if (isValid !== undefined) expect(widget.exposed().isValid).toBe(isValid);

    // Exactly: the widget overwrites every one of the config's defaults the store starts from outside a ListView, so a
    // value initial left out shows.
    expect(valuesOf(widget.exposed())).toEqual(datePickerV2Exposure.initial(inputOf(ID)));
  });

  test.each([
    ['setVisibility', [false], {}],
    ['setVisibility', ['yes'], { visibility: binding('{{false}}') }],
    ['setVisibility', [], {}],
    ['setDisable', [true], {}],
    ['setDisable', [0], { disabledState: binding('{{true}}') }],
    ['setLoading', [true], {}],
    ['setLoading', ['no'], { loadingState: binding('{{true}}') }],
  ])('%s(%j) from %j changes exactly what its patch says', async (name, args, properties) => {
    widget.render({ properties, validation: { mandatory: binding('{{true}}') } });
    await mounted();
    const before = valuesOf(widget.exposed());

    await widget.act(name, ...args);
    await drain();

    expect(valuesOf(widget.exposed())).toEqual({
      ...before,
      ...datePickerV2Exposure.actions[name](before, args, inputOf(ID)),
    });
  });

  // As before, the shared hook exposes validation.mandatory as resolved: unset, undefined (other inputs expose false),
  // which the store doesn't hold.
  test('mandatory unset: isMandatory is exposed as undefined', async () => {
    widget.render({ validation: { mandatory: undefined } });
    await mounted();

    expect(widget.exposed().isMandatory).toBeUndefined();
    expect(valuesOf(widget.exposed())).toEqual(datePickerV2Exposure.initial(inputOf(ID)));
  });

  test('the widget takes its mount values and its validation from the module, with the bounds it holds', async () => {
    const actualValues = datePickerV2Module.datePickerV2ValuesOf;
    const values = jest
      .spyOn(datePickerV2Module, 'datePickerV2ValuesOf')
      .mockImplementation((...args) => ({ ...actualValues(...args), probe: 'from the module' }));
    const status = jest
      .spyOn(datePickerV2Module, 'datePickerV2StatusOf')
      .mockReturnValue({ isValid: false, validationError: 'from the module' });
    try {
      widget.render();
      await mounted();

      expect(widget.exposed().probe).toBe('from the module');
      expect(widget.exposed().isValid).toBe(false);
      const [, validation, , heldBounds] = status.mock.calls.at(-1);
      expect(validation).toEqual(inputOf(ID).validation);
      expect(Object.keys(heldBounds).sort()).toEqual(['excludedDates', 'maxDate', 'minDate']);
    } finally {
      values.mockRestore();
      status.mockRestore();
    }
  });

  test('every exposed function is either a state action or a live action', async () => {
    widget.render();
    await mounted();

    const functions = Object.keys(widget.exposed()).filter((key) => typeof widget.exposed()[key] === 'function');
    expect(functions.sort()).toEqual(
      [...Object.keys(datePickerV2Exposure.actions), ...datePickerV2Exposure.liveActions].sort()
    );
    expect(datePickerV2Config.actions.map(({ handle }) => handle).sort()).toEqual(functions.sort());
    expect(datePickerV2Exposure.keepsRow.every((name) => datePickerV2Exposure.liveActions.includes(name))).toBe(true);
  });
});

describe('DatePickerV2 exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { date: '15/03/2024', disabled: false },
    { date: '', disabled: true },
    { date: '01/01/2020', disabled: 'yes' },
    { date: 'garbage', disabled: false },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'datepickerv2-exposure-listview',
        name: 'DatePickerV2 exposure in ListView rows',
        primarySeam: 'rtl',
        surface: 'app-editor',
        edition: 'ce',
        environment: 'development',
        layout: 'desktop',
        version: 'draft',
        transferPath: 'not-applicable',
        access: 'authenticated',
        capabilities: { observers: true, media: { matches: false }, dnd: true },
      }),
    });
  });
  afterEach(widget.teardown);

  const listview = () => store().getExposedValueOfComponent('lv1', MODULE_ID);

  function renderListview() {
    store().setVariable('rows', ROWS, MODULE_ID);
    const lv = componentDefinition('lv1', 'listview1', 'Listview', {
      dataSourceSelector: binding('rawJson'),
      data: binding('{{variables.rows}}'),
      mode: binding('list'),
      rowHeight: binding('100'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{false}}'),
      enablePagination: binding('{{false}}'),
    });
    const picker = componentDefinition(ID, 'datepickerv21', 'DatePickerV2', {
      label: binding('{{listItem.date}}'),
      defaultValue: binding('{{listItem.date}}'),
      dateFormat: binding('DD/MM/YYYY'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.disabled}}'),
    });
    picker.component.parent = 'lv1';
    picker.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    picker.component.definition.validation = {
      mandatory: binding('{{true}}'),
      minDate: binding('01/01/2021'),
      disabledDates: binding('{{[]}}'),
    };
    seedApp({ lv1: lv, [ID]: picker }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    for (const row of ROWS.keys()) await mounted(() => listview()?.children?.[row]?.datepickerv21);

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].datepickerv21)).toEqual(datePickerV2Exposure.initial(inputOf(ID, row)));
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].datepickerv21));
    await session.store.act(async () => {
      await listview().children[1].datepickerv21.setDisable(false);
      await listview().children[2].datepickerv21.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].datepickerv21)).toEqual({
      ...before[1],
      ...datePickerV2Exposure.actions.setDisable(before[1], [false], inputOf(ID, 1)),
    });
    expect(valuesOf(listview().children[2].datepickerv21)).toEqual({
      ...before[2],
      ...datePickerV2Exposure.actions.setVisibility(before[2], [false], inputOf(ID, 2)),
    });
    expect(valuesOf(listview().children[0].datepickerv21)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].datepickerv21)).toEqual(before[3]);
  });
});
