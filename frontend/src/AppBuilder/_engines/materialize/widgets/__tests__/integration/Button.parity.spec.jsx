/**
 * Button: the module (../../Button.js) says what the real widget exposes, on its own and in ListView rows.
 *
 * Real store, real RenderWidget, real Button. Each case reads the props the widget received from the store and checks
 * the module against what the widget exposed: after mount (initial) and after each state action (actions).
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import {
  createWidgetHarness,
  binding,
  drain,
  store,
  widgetProps,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { AppBuilderTestSession, defineAppBuilderScenario, componentDefinition, seedApp } from '@/test/app-builder';
import { buttonConfig } from '@tooljet/widget-definitions';
import { buttonExposure } from '../../Button';

const ID = 'btn1';

const widget = createWidgetHarness({
  componentType: 'Button',
  handle: 'button1',
  id: ID,
  // No label by default: the cases set one, and one leaves it out (then it isn't a string).
  defaultProperties: {
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: { type: binding('primary') },
});

/** The exposed values without functions, and without `id` (RenderWidget's, not the widget's). */
const values = (exposed) =>
  Object.fromEntries(Object.entries(exposed).filter(([key, value]) => key !== 'id' && typeof value !== 'function'));

/** The module's input: the props as RenderWidget passes them to the widget. */
const inputOf = (resolveIndex = null) => {
  const resolved = store().getResolvedComponent(ID, resolveIndex, MODULE_ID);
  return {
    properties: { ...resolved.general, ...resolved.properties },
    styles: { ...resolved.generalStyles, ...store().debugger.getDefaultStyles(resolved.styles, 'Button') },
  };
};

const mounted = async (exposed = () => widget.exposed()) => {
  await waitFor(() => expect(exposed()?.setDisable).toBeInstanceOf(Function));
  await drain();
};

const LABEL = { text: binding('Button') };
const cases = {
  defaults: LABEL,
  'an empty label': { text: binding('') },
  'a number label (coerced to a string)': { text: binding('{{5}}') },
  'no label (buttonText unset)': {},
  hidden: { ...LABEL, visibility: binding('{{false}}') },
  disabled: { ...LABEL, disabledState: binding('{{true}}') },
  'loading, not disabled (starts disabled, settles)': { ...LABEL, loadingState: binding('{{true}}') },
  'loading and disabled': { ...LABEL, loadingState: binding('{{true}}'), disabledState: binding('{{true}}') },
  'hidden, disabled and loading': {
    ...LABEL,
    visibility: binding('{{false}}'),
    disabledState: binding('{{true}}'),
    loadingState: binding('{{true}}'),
  },
  'non-boolean states (kept as is)': { ...LABEL, visibility: binding('{{"yes"}}'), loadingState: binding('{{1}}') },
};

const render = (properties) => widget.render({ properties });

describe('Button exposure parity: initial', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each(Object.entries(cases))('%s', async (_, properties) => {
    render(properties);
    await mounted();

    // Outside a ListView the store starts from the config's defaults, which the widget's values then overwrite.
    expect(values(widget.exposed())).toEqual({
      ...buttonConfig.exposedVariables,
      ...buttonExposure.initial(inputOf()),
    });
  });

  test('every exposed function is a state action or a live action', async () => {
    render(LABEL);
    await mounted();

    const functions = Object.keys(widget.exposed()).filter((key) => typeof widget.exposed()[key] === 'function');
    expect(functions.sort()).toEqual([...Object.keys(buttonExposure.actions), ...buttonExposure.liveActions].sort());
  });
});

describe('Button exposure parity: actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const runs = [
    ['setText', ['Hello'], {}],
    ['setText', [''], { text: binding('Label') }],
    ['setText', [], {}],
    ['setLoading', [true], {}],
    ['setLoading', [0], { loadingState: binding('{{true}}') }],
    ['setVisibility', [false], {}],
    ['setVisibility', ['yes'], { visibility: binding('{{false}}') }],
    ['setDisable', [true], {}],
    ['setDisable', [false], { disabledState: binding('{{true}}') }],
    ['loading', [true], {}],
    ['visibility', [false], {}],
    ['disable', [true], {}],
    ['disable', [null], { disabledState: binding('{{true}}') }],
  ];

  test.each(runs)('%s(%j) from %j', async (name, args, properties) => {
    render({ ...LABEL, ...properties });
    await mounted();
    const before = values(widget.exposed());

    await widget.act(name, ...args);
    await drain();

    expect(values(widget.exposed())).toEqual({ ...before, ...buttonExposure.actions[name](before, args, inputOf()) });
  });
});

const LISTVIEW_SCENARIO = defineAppBuilderScenario({
  id: 'button-parity-listview',
  name: 'Button in ListView rows',
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

describe('Button exposure parity: ListView rows', () => {
  let session;
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const ROWS = [
    { label: 'first', busy: false, off: false },
    { label: 'second', busy: true, off: false },
    { label: 7, busy: true, off: true },
  ];
  const row = (index) => store().getExposedValueOfComponent(ID, MODULE_ID, index);

  function renderListview() {
    session = new AppBuilderTestSession({ scenario: LISTVIEW_SCENARIO });
    store().setVariable('rows', ROWS, MODULE_ID);
    const listview = componentDefinition('lv1', 'listview1', 'Listview', {
      dataSourceSelector: binding('rawJson'),
      data: binding('{{variables.rows}}'),
      mode: binding('list'),
      rowHeight: binding('60'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{false}}'),
      enablePagination: binding('{{false}}'),
    });
    const button = componentDefinition(ID, 'button1', 'Button', {
      text: binding('{{listItem.label}}'),
      loadingState: binding('{{listItem.busy}}'),
      visibility: binding('{{true}}'),
      disabledState: binding('{{listItem.off}}'),
    });
    button.component.parent = 'lv1';
    button.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    button.component.definition.styles = { type: binding('primary') };
    seedApp({ lv1: listview, [ID]: button }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes initial(its own props), and an action changes only its row', async () => {
    renderListview();
    for (const index of ROWS.keys()) await mounted(() => row(index));

    // No config defaults in rows: each row holds exactly what its widget exposed.
    for (const index of ROWS.keys()) {
      expect(values(row(index))).toEqual(buttonExposure.initial(inputOf(index)));
    }

    const before = ROWS.map((_, index) => values(row(index)));
    await session.store.act(async () => {
      await row(1).setText('changed');
      await row(1).setDisable(true);
    });
    await drain();

    let expected = { ...before[1], ...buttonExposure.actions.setText(before[1], ['changed'], inputOf(1)) };
    expected = { ...expected, ...buttonExposure.actions.setDisable(expected, [true], inputOf(1)) };
    expect(values(row(1))).toEqual(expected);
    expect(values(row(0))).toEqual(before[0]);
    expect(values(row(2))).toEqual(before[2]);
  });
});
