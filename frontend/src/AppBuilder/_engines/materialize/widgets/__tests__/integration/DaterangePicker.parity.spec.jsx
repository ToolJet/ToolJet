/**
 * DaterangePicker's exposure module (../../DaterangePicker.js) against the real widget: what the mounted picker exposes
 * must be what `initial` computes from its resolved props, and each state action must change exactly what its patch
 * says.
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
import { daterangepickerConfig } from '@tooljet/widget-definitions';
import { daterangePickerExposure } from '../../DaterangePicker';
import * as daterangePickerModule from '../../DaterangePicker';

const ID = 'drp1';

const widget = createWidgetHarness({
  componentType: 'DaterangePicker',
  handle: 'daterangepicker1',
  id: ID,
  preload: ['Listview'],
  defaultProperties: {
    label: binding('Label'),
    defaultStartDate: binding('01/04/2022'),
    defaultEndDate: binding('10/04/2022'),
    format: binding('DD/MM/YYYY'),
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
  await waitFor(() => expect(exposed()?.setStartDate).toBeInstanceOf(Function));
  await drain();
};

describe('DaterangePicker exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    [
      'another format',
      { defaultStartDate: binding('2023-05-01'), defaultEndDate: binding('2023-05-17'), format: binding('YYYY-MM-DD') },
      {},
    ],
    ['only a start date', { defaultEndDate: binding('') }, {}],
    ['only an end date', { defaultStartDate: binding('') }, {}],
    ['no dates', { defaultStartDate: binding(''), defaultEndDate: binding('') }, {}],
    ['start after end', { defaultStartDate: binding('20/04/2022') }, {}],
    ['dates that do not parse', { defaultStartDate: binding('soon'), defaultEndDate: binding('later') }, {}],
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
    ['mandatory and no start date', { defaultStartDate: binding('') }, { mandatory: binding('{{true}}') }, false],
    ['mandatory and filled', {}, { mandatory: binding('{{true}}') }, true],
    ['min date failing', {}, { minDate: binding('05/04/2022') }, false],
    ['min date passing', {}, { minDate: binding('01/03/2022') }, true],
    ['max date failing', {}, { maxDate: binding('05/04/2022') }, false],
    ['max date passing', {}, { maxDate: binding('01/05/2022') }, true],
    ['a date in the range disabled', {}, { disabledDates: binding('{{["05/04/2022", "nope"]}}') }, false],
    ['dates outside the range disabled', {}, { disabledDates: binding('{{["15/04/2022"]}}') }, true],
    ['custom rule failing', {}, { customRule: binding("{{'bad range'}}") }, false],
    ['custom rule passing', {}, { customRule: binding('{{null}}') }, true],
    // The expected isValid, where a row gives one, is a rest parameter: Jest takes a parameter past a row's length for
    // a done callback.
  ])('on mount, exposes what initial computes: %s', async (_, properties, validation, ...[isValid]) => {
    widget.render({ properties, validation });
    await mounted();
    if (isValid !== undefined) expect(widget.exposed().isValid).toBe(isValid);

    // Exactly: the widget overwrites every one of the config's defaults the store starts from outside a ListView, so a
    // value initial left out shows.
    expect(valuesOf(widget.exposed())).toEqual(daterangePickerExposure.initial(inputOf(ID)));
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
      ...daterangePickerExposure.actions[name](before, args, inputOf(ID)),
    });
  });

  // As before, the shared hook exposes validation.mandatory as resolved: unset, undefined (other inputs expose false),
  // which the store doesn't hold.
  test('mandatory unset: isMandatory is exposed as undefined', async () => {
    widget.render({ validation: { mandatory: undefined } });
    await mounted();

    expect(widget.exposed().isMandatory).toBeUndefined();
    expect(valuesOf(widget.exposed())).toEqual(daterangePickerExposure.initial(inputOf(ID)));
  });

  test('the widget takes its mount values and its validation from the module, with the bounds it holds', async () => {
    const actualValues = daterangePickerModule.daterangePickerValuesOf;
    const values = jest
      .spyOn(daterangePickerModule, 'daterangePickerValuesOf')
      .mockImplementation((...args) => ({ ...actualValues(...args), probe: 'from the module' }));
    const status = jest
      .spyOn(daterangePickerModule, 'daterangePickerStatusOf')
      .mockReturnValue({ isValid: false, validationError: 'from the module' });
    try {
      widget.render();
      await mounted();

      expect(widget.exposed().probe).toBe('from the module');
      expect(widget.exposed().isValid).toBe(false);
      const [, , validation, , heldBounds] = status.mock.calls.at(-1);
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
      [...Object.keys(daterangePickerExposure.actions), ...daterangePickerExposure.liveActions].sort()
    );
    expect(daterangepickerConfig.actions.map(({ handle }) => handle).sort()).toEqual(functions.sort());
    expect(daterangePickerExposure.keepsRow.every((name) => daterangePickerExposure.liveActions.includes(name))).toBe(
      true
    );
  });
});

describe('DaterangePicker exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { start: '15/03/2024', end: '20/03/2024', disabled: false },
    { start: '', end: '01/02/2024', disabled: true },
    { start: '01/01/2020', end: '', disabled: 'yes' },
    { start: 'garbage', end: '10/10/2024', disabled: false },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'daterangepicker-exposure-listview',
        name: 'DaterangePicker exposure in ListView rows',
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
    const picker = componentDefinition(ID, 'daterangepicker1', 'DaterangePicker', {
      label: binding('{{listItem.start}}'),
      defaultStartDate: binding('{{listItem.start}}'),
      defaultEndDate: binding('{{listItem.end}}'),
      format: binding('DD/MM/YYYY'),
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
    for (const row of ROWS.keys()) await mounted(() => listview()?.children?.[row]?.daterangepicker1);

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].daterangepicker1)).toEqual(
        daterangePickerExposure.initial(inputOf(ID, row))
      );
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].daterangepicker1));
    await session.store.act(async () => {
      await listview().children[1].daterangepicker1.setDisable(false);
      await listview().children[2].daterangepicker1.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].daterangepicker1)).toEqual({
      ...before[1],
      ...daterangePickerExposure.actions.setDisable(before[1], [false], inputOf(ID, 1)),
    });
    expect(valuesOf(listview().children[2].daterangepicker1)).toEqual({
      ...before[2],
      ...daterangePickerExposure.actions.setVisibility(before[2], [false], inputOf(ID, 2)),
    });
    expect(valuesOf(listview().children[0].daterangepicker1)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].daterangepicker1)).toEqual(before[3]);
  });
});
