/**
 * ToggleSwitchV2's exposure module (../../ToggleSwitchV2.js) against the real widget: what the mounted switch exposes
 * must be what `initial` computes from its resolved props and validator, and each state action must change exactly
 * what its patch says.
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
import useStore from '@/AppBuilder/_stores/store';
import { toggleSwitchV2Config } from '@tooljet/widget-definitions';
import { toggleSwitchV2Exposure } from '../../ToggleSwitchV2';

const ID = 'tgl1';

const widget = createWidgetHarness({
  componentType: 'ToggleSwitchV2',
  handle: 'toggleswitchv21',
  id: ID,
  preload: ['Listview'],
  defaultProperties: {
    label: binding('Label'),
    defaultValue: binding('{{false}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
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
        componentType: 'ToggleSwitchV2',
        nearestListviewId: listviewId,
        rowIndex: row ?? undefined,
        moduleId: MODULE_ID,
      }),
  };
};

/** Exposed values without the functions, and without `id` (RenderWidget exposes that). */
const valuesOf = (exposed) =>
  Object.fromEntries(Object.entries(exposed).filter(([key, value]) => key !== 'id' && typeof value !== 'function'));

const mounted = async (exposed = () => widget.exposed()) => {
  await waitFor(() => expect(exposed()?.setValue).toBeInstanceOf(Function));
  await drain();
};

/** The keys, in order, of what the widget exposes as it mounts: its setExposedVariables call that carries `action`. */
const mountKeys = async (action, options) => {
  const { setExposedValues } = store();
  const payloads = [];
  useStore.setState({
    setExposedValues: (id, ...rest) => {
      if (id === ID) payloads.push(rest[1]);
      return setExposedValues(id, ...rest);
    },
  });
  try {
    widget.render(options);
    await mounted();
  } finally {
    useStore.setState({ setExposedValues });
  }
  return Object.keys(payloads.find((values) => typeof values[action] === 'function'));
};

describe('ToggleSwitchV2 exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    ['on', { defaultValue: binding('{{true}}') }, {}],
    ['no default state', { defaultValue: undefined }, {}],
    ['default state not a boolean', { defaultValue: binding('{{1}}') }, {}],
    ['label a number', { label: binding('{{7}}') }, {}],
    ['empty label', { label: binding('') }, {}],
    ['hidden', { visibility: binding('{{false}}') }, {}],
    ['disabled', { disabledState: binding('{{true}}') }, {}],
    ['loading, not disabled (starts disabled, settles)', { loadingState: binding('{{true}}') }, {}],
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
    ['mandatory and off', {}, { mandatory: binding('{{true}}') }],
    ['mandatory and on', { defaultValue: binding('{{true}}') }, { mandatory: binding('{{true}}') }],
    ['custom rule failing', {}, { customRule: binding("{{'must be on'}}") }],
    ['custom rule passing', { defaultValue: binding('{{true}}') }, { customRule: binding('{{null}}') }],
    // The default state's schema is boolean: a falsy one reaches the widget (and initial) as false, so mandatory fails
    // (validateWidget would let 0 itself pass).
    ['mandatory and 0', { defaultValue: binding('{{0}}') }, { mandatory: binding('{{true}}') }, false],
    ['mandatory and an empty string', { defaultValue: binding('') }, { mandatory: binding('{{true}}') }, false],
    ['mandatory and a string', { defaultValue: binding('yes') }, { mandatory: binding('{{true}}') }, true],
    // The expected isValid, where a row gives one, is a rest parameter: Jest takes a parameter past a row's length for
    // a done callback.
  ])('on mount, exposes what initial computes: %s', async (_, properties, validation, ...[isValid]) => {
    widget.render({ properties, validation });
    await mounted();
    if (isValid !== undefined) expect(widget.exposed().isValid).toBe(isValid);

    // Exactly: the widget overwrites every one of the config's defaults the store starts from outside a ListView, so a
    // value initial left out shows.
    expect(valuesOf(widget.exposed())).toEqual(toggleSwitchV2Exposure.initial(inputOf(ID)));
  });

  test('initial validates through the widget: its value keeps the first status, another value is validated', async () => {
    const initial = jest.spyOn(toggleSwitchV2Exposure, 'initial');
    const validateWidget = jest.fn(store().validateWidget);
    useStore.setState({ validateWidget });
    try {
      widget.render({ validation: { mandatory: binding('{{true}}') } });
      await mounted();
      const { validate } = initial.mock.calls[0][0];
      const calls = validateWidget.mock.calls.length;

      expect(validate(false).isValid).toBe(false);
      expect(validateWidget).toHaveBeenCalledTimes(calls);
      expect(widget.exposed().isValid).toBe(false);

      expect(validate(true).isValid).toBe(true);
      expect(validateWidget).toHaveBeenCalledTimes(calls + 1);
      expect(validateWidget.mock.calls[calls][0].widgetValue).toBe(true);
    } finally {
      initial.mockRestore();
      useStore.setState({ validateWidget: validateWidget.getMockImplementation() });
    }
  });

  test.each([
    ['setVisibility', [false], {}],
    ['setVisibility', ['yes'], { visibility: binding('{{false}}') }],
    ['setVisibility', [], {}],
    ['setDisable', [true], {}],
    ['setDisable', [''], { disabledState: binding('{{true}}') }],
    ['setDisable', [false], { loadingState: binding('{{true}}') }],
    ['setLoading', [true], {}],
    ['setLoading', [0], { loadingState: binding('{{true}}') }],
    ['setLoading', ['no'], {}],
  ])('%s(%j) from %j changes exactly what its patch says', async (name, args, properties) => {
    widget.render({ properties, validation: { mandatory: binding('{{true}}') } });
    await mounted();
    const before = valuesOf(widget.exposed());

    await widget.act(name, ...args);
    await drain();

    expect(valuesOf(widget.exposed())).toEqual({
      ...before,
      ...toggleSwitchV2Exposure.actions[name](before, args, inputOf(ID)),
    });
  });

  test("the mount call exposes today's keys, in today's order", async () => {
    expect(await mountKeys('setValue')).toEqual([
      'setValue',
      'setVisibility',
      'setDisable',
      'setLoading',
      'label',
      'isMandatory',
      'isLoading',
      'isVisible',
      'isDisabled',
      'isValid',
      'value',
    ]);
  });

  test('every exposed function is either a state action or a live action', async () => {
    widget.render();
    await mounted();

    const functions = Object.keys(widget.exposed()).filter((key) => typeof widget.exposed()[key] === 'function');
    expect(functions.sort()).toEqual(
      [...Object.keys(toggleSwitchV2Exposure.actions), ...toggleSwitchV2Exposure.liveActions].sort()
    );
    expect(toggleSwitchV2Config.actions.map(({ handle }) => handle).sort()).toEqual(functions.sort());
    expect(toggleSwitchV2Exposure.keepsRow.every((name) => toggleSwitchV2Exposure.liveActions.includes(name))).toBe(
      true
    );
  });
});

describe('ToggleSwitchV2 exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { name: 'first', on: true, disabled: false },
    { name: '', on: false, disabled: true },
    { name: 7, on: 'yes', disabled: 'yes' },
    { name: null, on: null, disabled: false },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'toggleswitchv2-exposure-listview',
        name: 'ToggleSwitchV2 exposure in ListView rows',
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
    const toggle = componentDefinition(ID, 'toggleswitchv21', 'ToggleSwitchV2', {
      label: binding('{{listItem.name}}'),
      defaultValue: binding('{{listItem.on}}'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.disabled}}'),
    });
    toggle.component.parent = 'lv1';
    toggle.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    toggle.component.definition.validation = { mandatory: binding('{{true}}') };
    seedApp({ lv1: lv, [ID]: toggle }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    for (const row of ROWS.keys()) await mounted(() => listview()?.children?.[row]?.toggleswitchv21);

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].toggleswitchv21)).toEqual(
        toggleSwitchV2Exposure.initial(inputOf(ID, row, 'lv1'))
      );
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].toggleswitchv21));
    await session.store.act(async () => {
      await listview().children[1].toggleswitchv21.setDisable(false);
      await listview().children[2].toggleswitchv21.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].toggleswitchv21)).toEqual({
      ...before[1],
      ...toggleSwitchV2Exposure.actions.setDisable(before[1], [false], inputOf(ID, 1, 'lv1')),
    });
    expect(valuesOf(listview().children[2].toggleswitchv21)).toEqual({
      ...before[2],
      ...toggleSwitchV2Exposure.actions.setVisibility(before[2], [false], inputOf(ID, 2, 'lv1')),
    });
    expect(valuesOf(listview().children[0].toggleswitchv21)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].toggleswitchv21)).toEqual(before[3]);
  });
});
