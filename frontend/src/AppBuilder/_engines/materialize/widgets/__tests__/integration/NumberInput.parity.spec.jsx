/**
 * NumberInput's exposure module (../../NumberInput.js) against the real widget: what the mounted NumberInput exposes
 * must be what `initial` computes from its resolved props and validator, and each state action must change exactly
 * what its patch says.
 */
import React from 'react';
import { isEqual } from 'lodash';
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
import useStore from '@/AppBuilder/_stores/store';
import { numberInputExposure } from '../../NumberInput';

const ID = 'num1';

const widget = createWidgetHarness({
  componentType: 'NumberInput',
  handle: 'numberinput1',
  id: ID,
  preload: ['Listview'],
  // numberinput.js's own definition.properties.
  defaultProperties: {
    value: binding('0'),
    label: binding('Label'),
    placeholder: binding('0'),
    decimalPlaces: binding('{{2}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showClearBtn: binding('{{false}}'),
    disableStepControls: binding('{{false}}'),
  },
});

/** The props and validator the widget receives, read from the store as RenderWidget builds them. */
const inputOf = (id, row = null, listviewId) => {
  const resolved = store().getResolvedComponent(id, row, MODULE_ID);
  const customResolvables = listviewId ? store().resolvedStore.modules[MODULE_ID].customResolvables?.[listviewId] : {};
  return {
    properties: { ...resolved.general, ...resolved.properties },
    styles: { ...resolved.generalStyles, ...resolved.styles },
    general: resolved.general,
    validation: resolved.validation,
    validate: (value) =>
      store().validateWidget({
        widgetValue: value,
        validationObject: store().getComponentDefinition(id, MODULE_ID).component.definition.validation,
        customResolveObjects: customResolvables?.[row ?? undefined] ?? {},
        componentType: 'NumberInput',
        nearestListviewId: listviewId,
        rowIndex: row ?? undefined,
        moduleId: MODULE_ID,
      }),
  };
};

/** Exposed values without the functions, and without `id` (RenderWidget exposes that). */
const valuesOf = (exposed) =>
  Object.fromEntries(Object.entries(exposed).filter(([key, value]) => key !== 'id' && typeof value !== 'function'));

const mounted = async () => {
  await waitFor(() => expect(widget.exposed().setText).toBeInstanceOf(Function));
  await drain();
};

describe('NumberInput exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    ['a number authored as a string', { value: binding('7') }, {}],
    ['a value rounded to the decimal places', { value: binding('{{1.987}}') }, {}],
    ['no decimal places', { value: binding('{{1.987}}'), decimalPlaces: binding('{{0}}') }, {}],
    ['decimal places unset', { value: binding('3.6'), decimalPlaces: undefined }, {}],
    ['a negative value', { value: binding('{{-4.255}}'), decimalPlaces: binding('{{1}}') }, {}],
    ['value empty', { value: binding('') }, {}],
    ['value null', { value: binding('{{null}}') }, {}],
    ['value not a number', { value: binding('abc') }, {}],
    ['value true', { value: binding('{{true}}') }, {}],
    ['value an array', { value: binding('{{[5]}}') }, {}],
    ['value an object', { value: binding('{{{ a: 1 }}}') }, {}],
    ['label a number', { label: binding('{{7}}') }, {}],
    [
      'hidden, loading and disabled',
      { visibility: binding('{{false}}'), loadingState: binding('{{true}}'), disabledState: binding('{{true}}') },
      {},
    ],
    ['loading, not disabled', { loadingState: binding('{{true}}') }, {}],
    ['disabled, not loading', { disabledState: binding('{{true}}') }, {}],
    [
      'non-boolean states',
      { visibility: binding('yes'), loadingState: binding('{{1}}'), disabledState: binding('') },
      {},
    ],
    ['mandatory and empty', { value: binding('') }, { mandatory: binding('{{true}}') }],
    ['mandatory and filled', { value: binding('{{5}}') }, { mandatory: binding('{{true}}') }],
    ['over the maximum', { value: binding('{{99}}') }, { maxValue: binding('{{10}}') }],
    ['under the minimum', { value: binding('{{1}}') }, { minValue: binding('{{2}}') }],
    ['inside the bounds', { value: binding('{{5}}') }, { minValue: binding('{{2}}'), maxValue: binding('{{10}}') }],
    ['rounded into the bounds', { value: binding('{{10.004}}') }, { maxValue: binding('{{10}}') }],
    ['regex failing', { value: binding('{{12}}') }, { regex: binding('^[0-9]$') }],
    ['custom rule failing', { value: binding('{{3}}') }, { customRule: binding("{{'bad value'}}") }],
  ])('on mount, exposes what initial computes: %s', async (_, properties, validation) => {
    widget.render({ properties, validation });
    await mounted();

    expect(valuesOf(widget.exposed())).toEqual(numberInputExposure.initial(inputOf(ID)));
  });

  test.each([
    ['setVisibility', [false]],
    ['setVisibility', ['yes']],
    ['setVisibility', []],
    ['setDisable', [true]],
    ['setDisable', ['']],
    ['setLoading', [true]],
    ['setLoading', ['no']],
  ])('%s(%j) changes exactly what its patch says', async (name, args) => {
    widget.render({ properties: { value: binding('{{3.14159}}') }, validation: { mandatory: binding('{{true}}') } });
    await mounted();
    const before = valuesOf(widget.exposed());

    await widget.act(name, ...args);
    await drain();

    expect(valuesOf(widget.exposed())).toEqual({
      ...before,
      ...numberInputExposure.actions[name](before, args, inputOf(ID)),
    });
  });

  // Rounding -0 again gives 0. initial rounds the value as the widget receives it, once: its value is the one the widget
  // holds, whose first status it keeps, so it is validated no more than another value (on the first render, then by
  // the value effect), and the mount call exposes it as before. The store holds 0 then, as before: it finds -0 the same
  // as the 0 the value effect wrote.
  test.each([
    ['-0.4', '{{0}}', -0],
    ['{{-0.0001}}', '{{2}}', -0],
    ['0.4', '{{0}}', 0],
  ])('%s with %s decimal places: validated twice on mount, which exposes %d', async (value, decimalPlaces, rounded) => {
    const validateWidget = jest.fn(store().validateWidget);
    useStore.setState({ validateWidget });
    const { setExposedValues } = store();
    const payloads = [];
    useStore.setState({
      setExposedValues: (id, ...rest) => {
        if (id === ID) payloads.push(rest[1]);
        return setExposedValues(id, ...rest);
      },
    });
    try {
      widget.render({ properties: { value: binding(value), decimalPlaces: binding(decimalPlaces) } });
      await mounted();

      expect(validateWidget).toHaveBeenCalledTimes(2);
      expect(Object.is(payloads.find((values) => values.setText).value, rounded)).toBe(true);
      expect(isEqual(valuesOf(widget.exposed()), numberInputExposure.initial(inputOf(ID)))).toBe(true);
    } finally {
      useStore.setState({ validateWidget: validateWidget.getMockImplementation(), setExposedValues });
    }
  });

  test("initial is the widget's: it gets the props as the widget receives them, and what it computes is exposed", async () => {
    const actual = numberInputExposure.initial;
    const initial = jest
      .spyOn(numberInputExposure, 'initial')
      .mockImplementation((input) => ({ ...actual(input), label: 'from the module' }));
    try {
      widget.render({ properties: { value: binding('{{1.987}}') } });
      await mounted();

      expect(initial.mock.calls[0][0].properties.value).toBe(1.987);
      expect(widget.exposed().label).toBe('from the module');
    } finally {
      initial.mockRestore();
    }
  });

  test('every exposed function is either a state action or a live action', async () => {
    widget.render();
    await mounted();

    const functions = Object.keys(widget.exposed()).filter((key) => typeof widget.exposed()[key] === 'function');
    expect(functions.sort()).toEqual(
      [...Object.keys(numberInputExposure.actions), ...numberInputExposure.liveActions].sort()
    );
    expect(numberInputExposure.keepsRow.every((name) => numberInputExposure.liveActions.includes(name))).toBe(true);
  });
});

describe('NumberInput exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { amount: 1.987, disabled: false },
    { amount: '', disabled: true },
    { amount: 'abc', disabled: 'yes' },
    { amount: null, disabled: false },
    { amount: 42, disabled: false },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'numberinput-exposure-listview',
        name: 'NumberInput exposure in ListView rows',
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
    const input = componentDefinition(ID, 'numberinput1', 'NumberInput', {
      label: binding('Amount'),
      value: binding('{{listItem.amount}}'),
      decimalPlaces: binding('{{2}}'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.disabled}}'),
    });
    input.component.parent = 'lv1';
    input.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    input.component.definition.validation = { mandatory: binding('{{true}}'), maxValue: binding('{{10}}') };
    seedApp({ lv1: lv, [ID]: input }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    await waitFor(() =>
      ROWS.forEach((_, row) => expect(listview().children?.[row]?.numberinput1?.setText).toBeInstanceOf(Function))
    );
    await drain();

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].numberinput1)).toEqual(
        numberInputExposure.initial(inputOf(ID, row, 'lv1'))
      );
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].numberinput1));
    await session.store.act(async () => {
      await listview().children[1].numberinput1.setDisable(false);
      await listview().children[2].numberinput1.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].numberinput1)).toEqual({
      ...before[1],
      ...numberInputExposure.actions.setDisable(before[1], [false], inputOf(ID, 1, 'lv1')),
    });
    expect(valuesOf(listview().children[2].numberinput1)).toEqual({
      ...before[2],
      ...numberInputExposure.actions.setVisibility(before[2], [false], inputOf(ID, 2, 'lv1')),
    });
    [0, 3, 4].forEach((row) => expect(valuesOf(listview().children[row].numberinput1)).toEqual(before[row]));
  });
});
