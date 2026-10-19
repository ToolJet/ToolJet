/**
 * MultiselectV2's exposure module (../../MultiselectV2.js) against the real widget: what the mounted MultiselectV2
 * exposes must be what `initial` computes from its resolved props and validator, and each state action must change
 * exactly what its patch says.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  binding,
  option,
  drain,
  store,
  widgetProps,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { createMultiselectHarness } from '@/AppBuilder/Widgets/MultiselectV2/__tests__/integration/multiselectV2Harness';
import { multiselectV2Config } from '@/AppBuilder/WidgetManager/widgets/multiselectV2';
import { multiselectV2Exposure } from '../../MultiselectV2';

const ID = 'ms1';

// The shipped definition's defaults (multiselectV2Harness): options 1–3, values ['1', '2'].
const widget = createMultiselectHarness({ preload: ['Listview'] });

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
        componentType: 'MultiselectV2',
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
  await waitFor(() => {
    expect(exposed()?.setVisibility).toBeInstanceOf(Function);
    expect(exposed()?.deselectOptions).toBeInstanceOf(Function);
  });
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
const SCHEMA =
  "{{[{label: 'option1', value: 1, caption: null, disable: false, visible: true, default: true}," +
  "{label: 'option2', value: 2, caption: 'two', disable: false, visible: true, default: true}," +
  "{label: 'option3', value: 3, caption: null, disable: true, visible: true}]}}";
const advanced = (schema) => ({ advanced: binding('{{true}}'), schema: binding(schema) });

describe('MultiselectV2 exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    ['nothing selected', { values: binding('{{[]}}') }, {}],
    ['values not an array', { values: binding('abc') }, {}],
    ['values an object', { values: binding('{{{ a: 1 }}}') }, {}],
    ['a value no option has', { values: binding("{{['1', 'zz']}}") }, {}],
    [
      'a falsy option value (never picked)',
      { options: options([option('Zero', 0), option('One', 1)]), values: binding('{{[0, 1]}}') },
      {},
    ],
    [
      'a hidden option among the values',
      { options: options([option('A', 'a'), option('B', 'b', { visible: false })]), values: binding("{{['a', 'b']}}") },
      {},
    ],
    [
      'options sorted descending, with captions and disabled ones',
      {
        options: options([option('a', 'a', { caption: 'x' }), option('c', 'c', { disable: true }), option('b', 'b')]),
        values: binding("{{['c', 'a']}}"),
        sort: binding('desc'),
      },
      {},
    ],
    [
      'option labels not strings',
      { options: options([option(7, 7), option(null, 'n')]), values: binding('{{[7]}}') },
      {},
    ],
    ['schema defaults', advanced(SCHEMA), {}],
    [
      'schema defaults hidden or not strictly true',
      advanced(
        "{{[{label: 'x', value: 1, visible: true, default: 'yes'}, {label: 'y', value: 2, visible: false, default: true}," +
          "{label: 3, value: 3, default: true}, {label: 'z', value: 4, visible: 1, default: 1, caption: 'c'}]}}"
      ),
      {},
    ],
    ['schema not an array', advanced('{{"oops"}}'), {}],
    ['schema sorted ascending', { ...advanced(SCHEMA), sort: binding('asc') }, {}],
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
    ['mandatory, nothing selected', { values: binding('{{[]}}') }, { mandatory: binding('{{true}}') }],
    ['mandatory, defaults selected', {}, { mandatory: binding('{{true}}') }],
    ['custom rule failing', {}, { customRule: binding("{{'pick fewer'}}") }],
  ])('on mount, exposes what initial computes: %s', async (_, properties, validation) => {
    widget.render({ properties, validation });
    await mounted();

    // Exactly, so a value initial left out shows. Outside a ListView the store starts from the config's defaults, which
    // the widget overwrites, all but searchText: it exposes that once searched.
    expect(valuesOf(widget.exposed())).toEqual({
      searchText: multiselectV2Config.exposedVariables.searchText,
      ...multiselectV2Exposure.initial(inputOf(ID)),
    });
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
      ...multiselectV2Exposure.actions[name](before, args, inputOf(ID)),
    });
  });

  // values isn't among them: the default-selection effects expose it before.
  test("the mount call exposes today's keys, in today's order", async () => {
    expect(await mountKeys('setVisibility')).toEqual([
      'clear',
      'setVisibility',
      'setLoading',
      'setDisable',
      'label',
      'isVisible',
      'isLoading',
      'isDisabled',
      'isMandatory',
      'isValid',
      'selectedOptions',
      'options',
    ]);
  });

  test("initial is the widget's: what it computes is what the widget exposes on mount", async () => {
    const actual = multiselectV2Exposure.initial;
    const initial = jest
      .spyOn(multiselectV2Exposure, 'initial')
      .mockImplementation((input) => ({ ...actual(input), label: 'from the module' }));
    try {
      widget.render();
      await mounted();
      expect(initial).toHaveBeenCalled();
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
      [...Object.keys(multiselectV2Exposure.actions), ...multiselectV2Exposure.liveActions].sort()
    );
    expect(multiselectV2Config.actions.map(({ handle }) => handle).sort()).toEqual(functions.sort());
    expect(
      Object.keys(multiselectV2Exposure.actions).some((name) => multiselectV2Exposure.liveActions.includes(name))
    ).toBe(false);
    expect(multiselectV2Exposure.keepsRow.every((name) => multiselectV2Exposure.liveActions.includes(name))).toBe(true);
  });
});

describe('MultiselectV2 exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { name: 'first', values: ['a', 'b'], disabled: false },
    { name: '', values: [], disabled: true },
    { name: 7, values: 'b', disabled: 'yes' },
    { name: null, values: ['c', 'x'], disabled: false },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'multiselectv2-exposure-listview',
        name: 'MultiselectV2 exposure in ListView rows',
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
    const multiselect = componentDefinition(ID, 'multiselect1', 'MultiselectV2', {
      label: binding('{{listItem.name}}'),
      advanced: binding('{{false}}'),
      options: options([option('A', 'a'), option('B', 'b'), option('C', 'c', { caption: 'see' })]),
      values: binding('{{listItem.values}}'),
      sort: binding('none'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.disabled}}'),
    });
    multiselect.component.parent = 'lv1';
    multiselect.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    multiselect.component.definition.validation = { mandatory: binding('{{true}}') };
    seedApp({ lv1: lv, [ID]: multiselect }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    for (const row of ROWS.keys()) await mounted(() => listview()?.children?.[row]?.multiselect1);

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].multiselect1)).toEqual(
        multiselectV2Exposure.initial(inputOf(ID, row, 'lv1'))
      );
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].multiselect1));
    await session.store.act(async () => {
      await listview().children[1].multiselect1.setDisable(false);
      await listview().children[2].multiselect1.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].multiselect1)).toEqual({
      ...before[1],
      ...multiselectV2Exposure.actions.setDisable(before[1], [false], inputOf(ID, 1, 'lv1')),
    });
    expect(valuesOf(listview().children[2].multiselect1)).toEqual({
      ...before[2],
      ...multiselectV2Exposure.actions.setVisibility(before[2], [false], inputOf(ID, 2, 'lv1')),
    });
    expect(valuesOf(listview().children[0].multiselect1)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].multiselect1)).toEqual(before[3]);
  });
});
