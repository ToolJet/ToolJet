/**
 * DropdownV2's exposure module (../../DropdownV2.js) against the real widget: what the mounted DropdownV2 exposes must
 * be what `initial` computes from its resolved props and validator, and each state action must change exactly what its
 * patch says.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  option,
  drain,
  store,
  widgetProps,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { dropdownV2Config } from '@tooljet/widget-definitions';
import { dropdownV2Exposure } from '../../DropdownV2';

const ID = 'dd1';

const OPTIONS = [option('Alpha', 'a'), option('Beta', 'b'), option('Gamma', 'c')];

const widget = createWidgetHarness({
  componentType: 'DropdownV2',
  handle: 'dropdown1',
  id: ID,
  preload: ['Listview'],
  defaultProperties: {
    label: binding('Letter'),
    placeholder: binding('Select an option'),
    advanced: binding('{{false}}'),
    options: { value: OPTIONS },
    sort: binding('none'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    optionsLoadingState: binding('{{false}}'),
    showClearBtn: binding('{{true}}'),
    showSearchInput: binding('{{true}}'),
    serverSideSearch: binding('{{false}}'),
  },
  defaultStyles: { padding: binding('default') },
  offsetHeight: 300,
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
        componentType: 'DropdownV2',
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
  await waitFor(() => expect(exposed()?.selectOption).toBeInstanceOf(Function));
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

const options = (list) => ({ value: list });

describe('DropdownV2 exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    ['a default option', { options: options([option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })]) }, {}],
    [
      'two default options (the first wins)',
      { options: options([option('Alpha', 'a', { isDefault: true }), option('Beta', 'b', { isDefault: true })]) },
      {},
    ],
    [
      'a hidden default option',
      { options: options([option('Alpha', 'a'), option('Beta', 'b', { isDefault: true, visible: false })]) },
      {},
    ],
    [
      'a disabled default option with a caption',
      { options: options([option('Alpha', 'a', { isDefault: true, disable: true, caption: 'first' })]) },
      {},
    ],
    [
      'options sharing a value',
      { options: options([option('One', 'x', { caption: 'c1' }), option('Two', 'x', { isDefault: true })]) },
      {},
    ],
    ['options sorted ascending', { options: options([option('b', 2), option('a', 1)]), sort: binding('asc') }, {}],
    [
      'options sorted descending, default among them',
      { options: options([option('a', 1, { isDefault: true }), option('b', 2)]), sort: binding('desc') },
      {},
    ],
    ['option labels not strings', { options: options([option(7, 7, { isDefault: true }), option(null, 'n')]) }, {}],
    ['no options', { options: options([]) }, {}],
    [
      'schema with a default',
      {
        advanced: binding('{{true}}'),
        schema: binding(
          "{{[{label: 'x', value: 1, visible: true, default: true}, {label: 'y', value: 2, visible: true}]}}"
        ),
      },
      {},
    ],
    [
      'schema, default not strictly true, an option without visible',
      {
        advanced: binding('{{true}}'),
        schema: binding(
          "{{[{label: 'x', value: 1, visible: 'yes', default: true}, {label: 'y', value: 2, caption: 'c'}]}}"
        ),
      },
      {},
    ],
    ['schema not an array', { advanced: binding('{{true}}'), schema: binding('{{"oops"}}') }, {}],
    ['advanced without a schema', { advanced: binding('{{true}}') }, {}],
    ['label a number', { label: binding('{{7}}') }, {}],
    ['hidden', { visibility: binding('{{false}}') }, {}],
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
    ['mandatory, nothing selected', {}, { mandatory: binding('{{true}}') }],
    [
      'mandatory, a default selected',
      { options: options([option('Alpha', 'a', { isDefault: true })]) },
      { mandatory: binding('{{true}}') },
    ],
    ['custom rule failing', {}, { customRule: binding("{{'pick one'}}") }],
    [
      'custom rule passing',
      { options: options([option('Alpha', 'a', { isDefault: true })]) },
      { customRule: binding('') },
    ],
  ])('on mount, exposes what initial computes: %s', async (_, properties, validation) => {
    widget.render({ properties, validation });
    await mounted();

    // Exactly: the widget overwrites every one of the config's defaults the store starts from outside a ListView, so a
    // value initial left out shows.
    expect(valuesOf(widget.exposed())).toEqual(dropdownV2Exposure.initial(inputOf(ID)));
  });

  test('initial validates through the widget: its value keeps the first status, another value is validated', async () => {
    const initial = jest.spyOn(dropdownV2Exposure, 'initial');
    const validateWidget = jest.fn(store().validateWidget);
    useStore.setState({ validateWidget });
    try {
      widget.render({ validation: { mandatory: binding('{{true}}') } });
      await mounted();
      const { validate } = initial.mock.calls[0][0];
      const calls = validateWidget.mock.calls.length;

      // The mounted value's status is the widget's own first one, not validated again on mount.
      expect(validate(undefined).isValid).toBe(false);
      expect(validateWidget).toHaveBeenCalledTimes(calls);
      expect(widget.exposed().isValid).toBe(false);

      expect(validate('a').isValid).toBe(true);
      expect(validateWidget).toHaveBeenCalledTimes(calls + 1);
      expect(validateWidget.mock.calls[calls][0].widgetValue).toBe('a');
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
    widget.render({
      properties: { options: options([option('Alpha', 'a', { isDefault: true }), option('Beta', 'b')]), ...properties },
      validation: { mandatory: binding('{{true}}') },
    });
    await mounted();
    const before = valuesOf(widget.exposed());

    await widget.act(name, ...args);
    await drain();

    expect(valuesOf(widget.exposed())).toEqual({
      ...before,
      ...dropdownV2Exposure.actions[name](before, args, inputOf(ID)),
    });
  });

  // selectedOption isn't among them: the default-selection effect exposes it before.
  test("the mount call exposes today's keys, in today's order", async () => {
    expect(await mountKeys('selectOption')).toEqual([
      'clear',
      'setVisibility',
      'setLoading',
      'setDisable',
      'selectOption',
      'options',
      'value',
      'label',
      'searchText',
      'isValid',
      'isVisible',
      'isLoading',
      'isDisabled',
      'isMandatory',
    ]);
  });

  test('every exposed function is either a state action or a live action', async () => {
    widget.render();
    await mounted();

    const functions = Object.keys(widget.exposed()).filter((key) => typeof widget.exposed()[key] === 'function');
    expect(functions.sort()).toEqual(
      [...Object.keys(dropdownV2Exposure.actions), ...dropdownV2Exposure.liveActions].sort()
    );
    expect(dropdownV2Config.actions.map(({ handle }) => handle).sort()).toEqual(functions.sort());
    expect(Object.keys(dropdownV2Exposure.actions).some((name) => dropdownV2Exposure.liveActions.includes(name))).toBe(
      false
    );
    expect(dropdownV2Exposure.keepsRow.every((name) => dropdownV2Exposure.liveActions.includes(name))).toBe(true);
  });
});

describe('DropdownV2 exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { name: 'first', options: [{ label: 'A', value: 'a', visible: true, default: true }], disabled: false },
    { name: '', options: [{ label: 'B', value: 'b', visible: true }], disabled: true },
    { name: 7, options: 'none', disabled: 'yes' },
    {
      name: null,
      options: [
        { label: 'D', value: 'd', visible: false, default: true },
        { label: 'E', value: 'e', visible: true, default: true, caption: 'e!' },
      ],
      disabled: false,
    },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'dropdownv2-exposure-listview',
        name: 'DropdownV2 exposure in ListView rows',
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
    const dropdown = componentDefinition(ID, 'dropdown1', 'DropdownV2', {
      label: binding('{{listItem.name}}'),
      advanced: binding('{{true}}'),
      schema: binding('{{listItem.options}}'),
      sort: binding('none'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.disabled}}'),
    });
    dropdown.component.parent = 'lv1';
    dropdown.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    dropdown.component.definition.validation = { mandatory: binding('{{true}}') };
    seedApp({ lv1: lv, [ID]: dropdown }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    for (const row of ROWS.keys()) await mounted(() => listview()?.children?.[row]?.dropdown1);

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].dropdown1)).toEqual(dropdownV2Exposure.initial(inputOf(ID, row, 'lv1')));
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].dropdown1));
    await session.store.act(async () => {
      await listview().children[1].dropdown1.setDisable(false);
      await listview().children[2].dropdown1.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].dropdown1)).toEqual({
      ...before[1],
      ...dropdownV2Exposure.actions.setDisable(before[1], [false], inputOf(ID, 1, 'lv1')),
    });
    expect(valuesOf(listview().children[2].dropdown1)).toEqual({
      ...before[2],
      ...dropdownV2Exposure.actions.setVisibility(before[2], [false], inputOf(ID, 2, 'lv1')),
    });
    expect(valuesOf(listview().children[0].dropdown1)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].dropdown1)).toEqual(before[3]);
  });
});
