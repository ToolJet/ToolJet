/**
 * RadioButtonV2's exposure module (../../RadioButtonV2.js) against the real widget: what the mounted RadioButtonV2
 * exposes must be what `initial` computes from its resolved props and validator, and each state action must change
 * exactly what its patch says.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  drain,
  option,
  radioButtonV2Defaults,
  store,
  widgetProps,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { radiobuttonV2Config } from '@/AppBuilder/WidgetManager/widgets/radioButtonV2';
import { radioButtonV2Exposure } from '../../RadioButtonV2';

const ID = 'radio1';

const OPTIONS = [option('One', '1'), option('Two', '2', { isDefault: true }), option('Three', '3', { disable: true })];

const widget = createWidgetHarness({
  componentType: 'RadioButtonV2',
  handle: 'radiobutton1',
  id: ID,
  preload: ['Listview'],
  defaultProperties: { ...radioButtonV2Defaults.defaultProperties, options: { value: OPTIONS } },
  defaultStyles: radioButtonV2Defaults.defaultStyles,
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
        componentType: 'RadioButtonV2',
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
  await waitFor(() => expect(exposed()?.setLoading).toBeInstanceOf(Function));
  await drain();
};

const withOptions = (options) => ({ options: { value: options } });
const withSchema = (schema) => ({ advanced: binding('{{true}}'), schema: binding(schema) });

describe('RadioButtonV2 exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    ['no default option', withOptions([option('One', '1'), option('Two', '2')]), {}],
    [
      'default option hidden',
      withOptions([option('One', '1'), option('Two', '2', { isDefault: true, visible: false })]),
      {},
    ],
    ['hidden options are not exposed', withOptions([option('One', '1', { visible: false }), option('Two', '2')]), {}],
    [
      'two defaults: the first wins',
      withOptions([option('A', 'a', { isDefault: true }), option('B', 'b', { isDefault: true })]),
      {},
    ],
    ['no options', withOptions([]), {}],
    [
      'dynamic options',
      withSchema(
        "{{[{label: 'x', value: 1}, {label: 2, value: 2, default: true, visible: true}, {label: {a: 1}, value: 3}]}}"
      ),
      {},
    ],
    ['dynamic options, default not strictly visible', withSchema("{{[{label: 'x', value: 1, default: true}]}}"), {}],
    [
      'dynamic options, default not strictly true',
      withSchema("{{[{label: 'x', value: 1, default: 'yes', visible: true}]}}"),
      {},
    ],
    [
      'dynamic options, a false value selected',
      withSchema("{{[{label: 'No', value: false, default: true, visible: true}]}}"),
      {},
    ],
    [
      'dynamic options, hidden ones skipped',
      withSchema("{{[{label: 'x', value: 1, visible: false}, null, {label: 'y'}]}}"),
      {},
    ],
    ['dynamic options not an array', withSchema("{{'nope'}}"), {}],
    ['dynamic options off, schema ignored', { schema: binding("{{[{label: 'x', value: 1}]}}") }, {}],
    ['label a number', { label: binding('{{7}}') }, {}],
    ['empty label', { label: binding('') }, {}],
    ['hidden', { visibility: binding('{{false}}') }, {}],
    ['disabled', { disabledState: binding('{{true}}') }, {}],
    ['loading', { loadingState: binding('{{true}}') }, {}],
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
    ['mandatory and selected', {}, { mandatory: binding('{{true}}') }],
    ['mandatory and nothing selected', withOptions([option('One', '1')]), { mandatory: binding('{{true}}') }],
    [
      'mandatory and a false value selected',
      withSchema("{{[{label: 'No', value: false, default: true, visible: true}]}}"),
      { mandatory: binding('{{true}}') },
    ],
    ['custom rule failing', {}, { customRule: binding("{{'pick another'}}") }],
    ['custom rule passing', {}, { customRule: binding('{{null}}') }],
  ])('on mount, exposes what initial computes: %s', async (_, properties, validation) => {
    widget.render({ properties, validation });
    await mounted();

    // Exactly: the widget overwrites every one of the config's defaults the store starts from outside a ListView, so a
    // value initial left out shows.
    expect(valuesOf(widget.exposed())).toEqual(radioButtonV2Exposure.initial(inputOf(ID)));
  });

  test('initial validates through the widget: its value keeps the first status, another value is validated', async () => {
    const initial = jest.spyOn(radioButtonV2Exposure, 'initial');
    const validateWidget = jest.fn(store().validateWidget);
    useStore.setState({ validateWidget });
    try {
      widget.render({ properties: withOptions([option('One', '1')]), validation: { mandatory: binding('{{true}}') } });
      await mounted();
      const { validate } = initial.mock.calls[0][0];
      const calls = validateWidget.mock.calls.length;

      expect(validate(undefined).isValid).toBe(false);
      expect(validateWidget).toHaveBeenCalledTimes(calls);
      expect(widget.exposed().isValid).toBe(false);

      expect(validate('1').isValid).toBe(true);
      expect(validateWidget).toHaveBeenCalledTimes(calls + 1);
      expect(validateWidget.mock.calls[calls][0].widgetValue).toBe('1');
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
      ...radioButtonV2Exposure.actions[name](before, args, inputOf(ID)),
    });
  });

  test('every exposed function is either a state action or a live action', async () => {
    widget.render();
    await mounted();

    const functions = Object.keys(widget.exposed()).filter((key) => typeof widget.exposed()[key] === 'function');
    expect(functions.sort()).toEqual(
      [...Object.keys(radioButtonV2Exposure.actions), ...radioButtonV2Exposure.liveActions].sort()
    );
    expect(radiobuttonV2Config.actions.map(({ handle }) => handle).sort()).toEqual(functions.sort());
    expect(radioButtonV2Exposure.keepsRow.every((name) => radioButtonV2Exposure.liveActions.includes(name))).toBe(true);
  });
});

describe('RadioButtonV2 exposure module: parity inside ListView rows', () => {
  const ROWS = [
    {
      name: 'first',
      opts: [
        { label: 'a', value: 'a', default: true, visible: true },
        { label: 'b', value: 'b' },
      ],
      off: false,
    },
    { name: '', opts: [{ label: 'c', value: 'c' }], off: true },
    { name: 7, opts: [{ label: 1, value: 0, default: true, visible: true }], off: 'yes' },
    { name: null, opts: null, off: false },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'radiobuttonv2-exposure-listview',
        name: 'RadioButtonV2 exposure in ListView rows',
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
    const radio = componentDefinition(ID, 'radiobutton1', 'RadioButtonV2', {
      ...radioButtonV2Defaults.defaultProperties,
      label: binding('{{listItem.name}}'),
      advanced: binding('{{true}}'),
      schema: binding('{{listItem.opts}}'),
      disabledState: binding('{{listItem.off}}'),
    });
    radio.component.parent = 'lv1';
    radio.component.definition.styles = { ...radioButtonV2Defaults.defaultStyles };
    radio.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    radio.component.definition.validation = { mandatory: binding('{{true}}') };
    seedApp({ lv1: lv, [ID]: radio }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    for (const row of ROWS.keys()) await mounted(() => listview()?.children?.[row]?.radiobutton1);

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].radiobutton1)).toEqual(
        radioButtonV2Exposure.initial(inputOf(ID, row, 'lv1'))
      );
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].radiobutton1));
    await session.store.act(async () => {
      await listview().children[1].radiobutton1.setDisable(false);
      await listview().children[2].radiobutton1.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].radiobutton1)).toEqual({
      ...before[1],
      ...radioButtonV2Exposure.actions.setDisable(before[1], [false], inputOf(ID, 1, 'lv1')),
    });
    expect(valuesOf(listview().children[2].radiobutton1)).toEqual({
      ...before[2],
      ...radioButtonV2Exposure.actions.setVisibility(before[2], [false], inputOf(ID, 2, 'lv1')),
    });
    expect(valuesOf(listview().children[0].radiobutton1)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].radiobutton1)).toEqual(before[3]);
  });
});
