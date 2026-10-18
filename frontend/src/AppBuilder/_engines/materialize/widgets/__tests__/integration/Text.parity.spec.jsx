/**
 * Text's exposure module (../../Text.js) against the real widget: what the mounted Text exposes must be what
 * `initial` computes from its resolved props, and each state action must change exactly what its patch says.
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
import { textExposure } from '../../Text';

const ID = 'txt1';

const widget = createWidgetHarness({
  componentType: 'Text',
  handle: 'text1',
  id: ID,
  preload: ['Listview'],
  defaultProperties: {
    text: binding('Hello, there!'),
    textFormat: binding('plainText'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
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

const mounted = async () => {
  await waitFor(() => expect(widget.exposed().setText).toBeInstanceOf(Function));
  await drain();
};

describe('Text exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}],
    ['text 0 (number)', { text: binding('{{0}}') }],
    ['text false', { text: binding('{{false}}') }],
    ['text a number', { text: binding('{{42}}') }],
    ['text an object', { text: binding('{{{ a: 1 }}}') }],
    ['text null', { text: binding('{{null}}') }],
    ['text empty', { text: binding('') }],
    [
      'hidden, loading and disabled',
      { visibility: binding('{{false}}'), loadingState: binding('{{true}}'), disabledState: binding('{{true}}') },
    ],
    ['visible but disabled', { disabledState: binding('{{true}}') }],
    ['non-boolean states', { visibility: binding('yes'), loadingState: binding('{{1}}'), disabledState: binding('') }],
  ])('on mount, exposes what initial computes: %s', async (_, properties) => {
    widget.render({ properties });
    await mounted();

    expect(valuesOf(widget.exposed())).toEqual(textExposure.initial(inputOf(ID)));
  });

  test.each([
    ['setText', ['changed']],
    ['setText', [42]],
    ['setText', [{ a: 1 }]],
    ['setText', []],
    ['clear', []],
    ['visibility', [false]],
    ['visibility', [0]],
    ['setVisibility', ['yes']],
    ['setVisibility', [false]],
    ['setLoading', [true]],
    ['setLoading', [1]],
    ['setDisable', [true]],
    ['setDisable', ['']],
  ])('%s(%j) changes exactly what its patch says', async (name, args) => {
    widget.render({ properties: { loadingState: binding('{{false}}') } });
    await mounted();
    const before = valuesOf(widget.exposed());

    await widget.act(name, ...args);
    await drain();

    expect(valuesOf(widget.exposed())).toEqual({
      ...before,
      ...textExposure.actions[name](before, args, inputOf(ID)),
    });
  });

  test('on mount, exposes its keys in the order it always has', async () => {
    widget.render();
    await mounted();

    expect(Object.keys(widget.exposed()).filter((key) => key !== 'id')).toEqual([
      'text',
      'setText',
      'clear',
      'isVisible',
      'isLoading',
      'isDisabled',
      'visibility',
      'setVisibility',
      'setLoading',
      'setDisable',
    ]);
  });

  test('has no live actions', () => {
    expect(textExposure.liveActions).toEqual([]);
  });
});

describe('Text exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { text: 'first', visible: true },
    { text: 0, visible: false },
    { text: false, visible: 'yes' },
    { text: null, visible: true },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'text-exposure-listview',
        name: 'Text exposure in ListView rows',
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
    const text = componentDefinition(ID, 'text1', 'Text', {
      text: binding('{{listItem.text}}'),
      textFormat: binding('plainText'),
      visibility: binding('{{listItem.visible}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.text === 0}}'),
    });
    text.component.parent = 'lv1';
    text.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    seedApp({ lv1: lv, [ID]: text }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    await waitFor(() =>
      ROWS.forEach((_, row) => expect(listview().children?.[row]?.text1?.setText).toBeInstanceOf(Function))
    );
    await drain();

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].text1)).toEqual(textExposure.initial(inputOf(ID, row)));
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].text1));
    await session.store.act(async () => {
      await listview().children[1].text1.setText('row one');
      await listview().children[2].text1.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].text1)).toEqual({
      ...before[1],
      ...textExposure.actions.setText(before[1], ['row one'], inputOf(ID, 1)),
    });
    expect(valuesOf(listview().children[2].text1)).toEqual({
      ...before[2],
      ...textExposure.actions.setVisibility(before[2], [false], inputOf(ID, 2)),
    });
    expect(valuesOf(listview().children[0].text1)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].text1)).toEqual(before[3]);
  });
});
