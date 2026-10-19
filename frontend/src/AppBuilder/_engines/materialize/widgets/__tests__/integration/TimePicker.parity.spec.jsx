/**
 * TimePicker's exposure module (../../TimePicker.js) against the real widget: what the mounted picker exposes must be
 * what `initial` computes from its resolved props, and each state action must change exactly what its patch says.
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
import { timePickerConfig } from '@/AppBuilder/WidgetManager/widgets/timepicker';
import { timePickerExposure } from '../../TimePicker';
import * as timePickerModule from '../../TimePicker';

const ID = 'tp1';

const widget = createWidgetHarness({
  componentType: 'TimePicker',
  handle: 'timepicker1',
  id: ID,
  preload: ['Listview'],
  defaultProperties: {
    label: binding('Label'),
    defaultValue: binding('08:00'),
    timeFormat: binding('HH:mm'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  },
  defaultValidation: {
    minTime: binding(''),
    maxTime: binding(''),
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

describe('TimePicker exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    ['a 12-hour format', { defaultValue: binding('02:30 PM'), timeFormat: binding('hh:mm A') }, {}],
    ['a format with seconds', { defaultValue: binding('10:15:30'), timeFormat: binding('HH:mm:ss') }, {}],
    ['no default value', { defaultValue: binding('') }, {}],
    ['a default value that does not parse', { defaultValue: binding('not a time') }, {}],
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
    ['min time failing', { defaultValue: binding('08:00') }, { minTime: binding('09:00') }, false],
    ['min time passing', { defaultValue: binding('08:00') }, { minTime: binding('07:30') }, true],
    ['min time that does not parse', { defaultValue: binding('08:00') }, { minTime: binding('soon') }, true],
    ['max time failing', { defaultValue: binding('08:00') }, { maxTime: binding('07:30') }, false],
    ['max time passing', { defaultValue: binding('08:00') }, { maxTime: binding('09:00') }, true],
    ['custom rule failing', {}, { customRule: binding("{{'bad time'}}") }, false],
    ['custom rule passing', {}, { customRule: binding('{{null}}') }, true],
    // The expected isValid, where a row gives one, is a rest parameter: Jest takes a parameter past a row's length for
    // a done callback.
  ])('on mount, exposes what initial computes: %s', async (_, properties, validation, ...[isValid]) => {
    widget.render({ properties, validation });
    await mounted();
    if (isValid !== undefined) expect(widget.exposed().isValid).toBe(isValid);

    // Exactly: the widget overwrites every one of the config's defaults the store starts from outside a ListView, so a
    // value initial left out shows.
    expect(valuesOf(widget.exposed())).toEqual(timePickerExposure.initial(inputOf(ID)));
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
      ...timePickerExposure.actions[name](before, args, inputOf(ID)),
    });
  });

  // As before, the shared hook exposes validation.mandatory as resolved: unset, undefined (other inputs expose false),
  // which the store doesn't hold.
  test('mandatory unset: isMandatory is exposed as undefined', async () => {
    widget.render({ validation: { mandatory: undefined } });
    await mounted();

    expect(widget.exposed().isMandatory).toBeUndefined();
    expect(valuesOf(widget.exposed())).toEqual(timePickerExposure.initial(inputOf(ID)));
  });

  test('the widget takes its mount values and its validation from the module, with the bounds it holds', async () => {
    const actualValues = timePickerModule.timePickerValuesOf;
    const values = jest
      .spyOn(timePickerModule, 'timePickerValuesOf')
      .mockImplementation((...args) => ({ ...actualValues(...args), probe: 'from the module' }));
    const status = jest
      .spyOn(timePickerModule, 'timePickerStatusOf')
      .mockReturnValue({ isValid: false, validationError: 'from the module' });
    try {
      widget.render();
      await mounted();

      expect(widget.exposed().probe).toBe('from the module');
      expect(widget.exposed().isValid).toBe(false);
      const [, validation, , heldBounds] = status.mock.calls.at(-1);
      expect(validation).toEqual(inputOf(ID).validation);
      expect(Object.keys(heldBounds).sort()).toEqual(['maxTime', 'minTime']);
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
      [...Object.keys(timePickerExposure.actions), ...timePickerExposure.liveActions].sort()
    );
    // The config also lists setTime, which the widget never registers.
    expect(
      timePickerConfig.actions
        .map(({ handle }) => handle)
        .filter((handle) => handle !== 'setTime')
        .sort()
    ).toEqual(functions.sort());
    expect(timePickerExposure.keepsRow.every((name) => timePickerExposure.liveActions.includes(name))).toBe(true);
  });
});

describe('TimePicker exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { time: '14:45', disabled: false },
    { time: '', disabled: true },
    { time: '06:10', disabled: 'yes' },
    { time: 'garbage', disabled: false },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'timepicker-exposure-listview',
        name: 'TimePicker exposure in ListView rows',
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
    const picker = componentDefinition(ID, 'timepicker1', 'TimePicker', {
      label: binding('{{listItem.time}}'),
      defaultValue: binding('{{listItem.time}}'),
      timeFormat: binding('HH:mm'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.disabled}}'),
    });
    picker.component.parent = 'lv1';
    picker.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    picker.component.definition.validation = {
      mandatory: binding('{{true}}'),
      minTime: binding('07:00'),
    };
    seedApp({ lv1: lv, [ID]: picker }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    for (const row of ROWS.keys()) await mounted(() => listview()?.children?.[row]?.timepicker1);

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].timepicker1)).toEqual(timePickerExposure.initial(inputOf(ID, row)));
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].timepicker1));
    await session.store.act(async () => {
      await listview().children[1].timepicker1.setDisable(false);
      await listview().children[2].timepicker1.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].timepicker1)).toEqual({
      ...before[1],
      ...timePickerExposure.actions.setDisable(before[1], [false], inputOf(ID, 1)),
    });
    expect(valuesOf(listview().children[2].timepicker1)).toEqual({
      ...before[2],
      ...timePickerExposure.actions.setVisibility(before[2], [false], inputOf(ID, 2)),
    });
    expect(valuesOf(listview().children[0].timepicker1)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].timepicker1)).toEqual(before[3]);
  });
});
