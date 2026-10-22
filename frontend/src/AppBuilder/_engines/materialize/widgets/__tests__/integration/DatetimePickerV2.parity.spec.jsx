/**
 * DatetimePickerV2's exposure module (../../DatetimePickerV2.js) against the real widget: what the mounted picker
 * exposes must be what `initial` computes from its resolved props, and each state action must change exactly what its
 * patch says.
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
import { datetimePickerV2Config } from '@tooljet/widget-definitions';
import { datetimePickerV2Exposure } from '../../DatetimePickerV2';
import * as datetimePickerV2Module from '../../DatetimePickerV2';

const ID = 'dtp1';

const widget = createWidgetHarness({
  componentType: 'DatetimePickerV2',
  handle: 'datetimepickerv21',
  id: ID,
  preload: ['Listview'],
  defaultProperties: {
    label: binding('Label'),
    defaultValue: binding('01/01/2022'),
    dateFormat: binding('DD/MM/YYYY'),
    timeFormat: binding('HH:mm'),
    isTimezoneEnabled: binding('{{false}}'),
    displayTimezone: binding('UTC'),
    storeTimezone: binding('UTC'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  },
  defaultValidation: {
    minDate: binding(''),
    maxDate: binding(''),
    minTime: binding(''),
    maxTime: binding(''),
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

describe('DatetimePickerV2 exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    ['a date and time', { defaultValue: binding('17/05/2023 14:45') }, {}],
    ['an ISO value', { defaultValue: binding('2023-05-17T10:30:00.000Z') }, {}],
    [
      'other formats',
      {
        defaultValue: binding('2023-05-17 02:30 PM'),
        dateFormat: binding('YYYY-MM-DD'),
        timeFormat: binding('hh:mm A'),
      },
      {},
    ],
    ['no default value', { defaultValue: binding('') }, {}],
    ['a default value that does not parse', { defaultValue: binding('not a date') }, {}],
    [
      'time zones managed',
      {
        defaultValue: binding('17/05/2023 14:45'),
        isTimezoneEnabled: binding('{{true}}'),
        displayTimezone: binding('Asia/Seoul'),
        storeTimezone: binding('America/Bogota'),
      },
      {},
    ],
    [
      'time zones given but not managed',
      { displayTimezone: binding('Asia/Seoul'), storeTimezone: binding('America/Bogota') },
      {},
    ],
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
    ['max date failing', {}, { maxDate: binding('01/12/2021') }, false],
    ['min time failing', { defaultValue: binding('01/01/2022 08:00') }, { minTime: binding('09:00') }, false],
    ['min time passing', { defaultValue: binding('01/01/2022 08:00') }, { minTime: binding('07:30') }, true],
    ['max time failing', { defaultValue: binding('01/01/2022 18:00') }, { maxTime: binding('09:00') }, false],
    ['the default value disabled', {}, { disabledDates: binding('{{["01/01/2022"]}}') }, false],
    ['other dates disabled', {}, { disabledDates: binding('{{["02/01/2022"]}}') }, true],
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
    expect(valuesOf(widget.exposed())).toEqual(datetimePickerV2Exposure.initial(inputOf(ID)));
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
      ...datetimePickerV2Exposure.actions[name](before, args, inputOf(ID)),
    });
  });

  // As before, the shared hook exposes validation.mandatory as resolved: unset, undefined (other inputs expose false),
  // which the store doesn't hold.
  test('mandatory unset: isMandatory is exposed as undefined', async () => {
    widget.render({ validation: { mandatory: undefined } });
    await mounted();

    expect(widget.exposed().isMandatory).toBeUndefined();
    expect(valuesOf(widget.exposed())).toEqual(datetimePickerV2Exposure.initial(inputOf(ID)));
  });

  test('the widget takes its mount values and its validation from the module, with the bounds it holds', async () => {
    const actualValues = datetimePickerV2Module.datetimePickerV2ValuesOf;
    const values = jest
      .spyOn(datetimePickerV2Module, 'datetimePickerV2ValuesOf')
      .mockImplementation((...args) => ({ ...actualValues(...args), probe: 'from the module' }));
    const status = jest
      .spyOn(datetimePickerV2Module, 'datetimePickerV2StatusOf')
      .mockReturnValue({ isValid: false, validationError: 'from the module' });
    try {
      widget.render();
      await mounted();

      expect(widget.exposed().probe).toBe('from the module');
      expect(widget.exposed().isValid).toBe(false);
      const [, validation, , heldBounds] = status.mock.calls.at(-1);
      expect(validation).toEqual(inputOf(ID).validation);
      expect(Object.keys(heldBounds).sort()).toEqual(['excludedDates', 'maxDate', 'maxTime', 'minDate', 'minTime']);
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
      [...Object.keys(datetimePickerV2Exposure.actions), ...datetimePickerV2Exposure.liveActions].sort()
    );
    expect(datetimePickerV2Config.actions.map(({ handle }) => handle).sort()).toEqual(functions.sort());
    expect(datetimePickerV2Exposure.keepsRow.every((name) => datetimePickerV2Exposure.liveActions.includes(name))).toBe(
      true
    );
  });
});

describe('DatetimePickerV2 exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { date: '15/03/2024 09:30', disabled: false },
    { date: '', disabled: true },
    { date: '01/01/2020', disabled: 'yes' },
    { date: 'garbage', disabled: false },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'datetimepickerv2-exposure-listview',
        name: 'DatetimePickerV2 exposure in ListView rows',
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
    const picker = componentDefinition(ID, 'datetimepickerv21', 'DatetimePickerV2', {
      label: binding('{{listItem.date}}'),
      defaultValue: binding('{{listItem.date}}'),
      dateFormat: binding('DD/MM/YYYY'),
      timeFormat: binding('HH:mm'),
      isTimezoneEnabled: binding('{{false}}'),
      displayTimezone: binding('UTC'),
      storeTimezone: binding('UTC'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.disabled}}'),
    });
    picker.component.parent = 'lv1';
    picker.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    picker.component.definition.validation = {
      mandatory: binding('{{true}}'),
      minDate: binding('01/01/2021'),
      minTime: binding('08:00'),
      disabledDates: binding('{{[]}}'),
    };
    seedApp({ lv1: lv, [ID]: picker }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    for (const row of ROWS.keys()) await mounted(() => listview()?.children?.[row]?.datetimepickerv21);

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].datetimepickerv21)).toEqual(
        datetimePickerV2Exposure.initial(inputOf(ID, row))
      );
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].datetimepickerv21));
    await session.store.act(async () => {
      await listview().children[1].datetimepickerv21.setDisable(false);
      await listview().children[2].datetimepickerv21.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].datetimepickerv21)).toEqual({
      ...before[1],
      ...datetimePickerV2Exposure.actions.setDisable(before[1], [false], inputOf(ID, 1)),
    });
    expect(valuesOf(listview().children[2].datetimepickerv21)).toEqual({
      ...before[2],
      ...datetimePickerV2Exposure.actions.setVisibility(before[2], [false], inputOf(ID, 2)),
    });
    expect(valuesOf(listview().children[0].datetimepickerv21)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].datetimepickerv21)).toEqual(before[3]);
  });
});
