/**
 * TextInput's exposure module (../../TextInput.js) against the real widget: what the mounted TextInput exposes must be
 * what `initial` computes from its resolved props and validator, and each state action must change exactly what its
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
import useStore from '@/AppBuilder/_stores/store';
import { textInputExposure } from '../../TextInput';

const ID = 'inp1';

const widget = createWidgetHarness({
  componentType: 'TextInput',
  handle: 'textinput1',
  id: ID,
  preload: ['Listview'],
  defaultProperties: {
    label: binding('Label'),
    placeholder: binding('Enter your input'),
    value: binding(''),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showClearBtn: binding('{{false}}'),
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
        componentType: 'TextInput',
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

describe('TextInput exposure module: parity with the widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['defaults', {}, {}],
    ['a value', { value: binding('hello') }, {}],
    ['value a number', { value: binding('{{42}}') }, {}],
    ['value 0', { value: binding('{{0}}') }, {}],
    ['value false', { value: binding('{{false}}') }, {}],
    ['value null', { value: binding('{{null}}') }, {}],
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
    ['mandatory and empty', {}, { mandatory: binding('{{true}}') }],
    ['mandatory and filled', { value: binding('x') }, { mandatory: binding('{{true}}') }],
    ['regex failing', { value: binding('ab') }, { regex: binding('^[0-9]+$') }],
    ['regex passing', { value: binding('123') }, { regex: binding('^[0-9]+$') }],
    ['min length failing', { value: binding('ab') }, { minLength: binding('{{3}}') }],
    ['max length failing', { value: binding('abcdef') }, { maxLength: binding('{{3}}') }],
    ['custom rule failing', { value: binding('bad') }, { customRule: binding("{{'bad value'}}") }],
  ])('on mount, exposes what initial computes: %s', async (_, properties, validation) => {
    widget.render({ properties, validation });
    await mounted();

    expect(valuesOf(widget.exposed())).toEqual(textInputExposure.initial(inputOf(ID)));
  });

  test('initial validates through the widget: its value keeps the first status, another value is validated', async () => {
    const initial = jest.spyOn(textInputExposure, 'initial');
    const validateWidget = jest.fn(store().validateWidget);
    useStore.setState({ validateWidget });
    try {
      widget.render({ properties: { value: binding('ab') }, validation: { regex: binding('^[0-9]+$') } });
      await mounted();
      const { validate } = initial.mock.calls[0][0];
      const calls = validateWidget.mock.calls.length;

      // The mounted value's status is the widget's own first one, not validated again on mount.
      expect(validate('ab')).toEqual({ isValid: false, validationError: 'The input should match pattern' });
      expect(validateWidget).toHaveBeenCalledTimes(calls);
      expect(widget.exposed().isValid).toBe(false);

      expect(validate('123').isValid).toBe(true);
      expect(validateWidget).toHaveBeenCalledTimes(calls + 1);
      expect(validateWidget.mock.calls[calls][0].widgetValue).toBe('123');
    } finally {
      initial.mockRestore();
      useStore.setState({ validateWidget: validateWidget.getMockImplementation() });
    }
  });

  test.each([
    ['setVisibility', [false]],
    ['setVisibility', ['yes']],
    ['setVisibility', []],
    ['visibility', [false]],
    ['visibility', [1]],
    ['setDisable', [true]],
    ['setDisable', ['']],
    ['disable', [true]],
    ['disable', [0]],
    ['setLoading', [true]],
    ['setLoading', ['no']],
  ])('%s(%j) changes exactly what its patch says', async (name, args) => {
    widget.render({ properties: { value: binding('abc') }, validation: { mandatory: binding('{{true}}') } });
    await mounted();
    const before = valuesOf(widget.exposed());

    await widget.act(name, ...args);
    await drain();

    expect(valuesOf(widget.exposed())).toEqual({
      ...before,
      ...textInputExposure.actions[name](before, args, inputOf(ID)),
    });
  });

  test('every exposed function is either a state action or a live action', async () => {
    widget.render();
    await mounted();

    const functions = Object.keys(widget.exposed()).filter((key) => typeof widget.exposed()[key] === 'function');
    expect(functions.sort()).toEqual(
      [...Object.keys(textInputExposure.actions), ...textInputExposure.liveActions].sort()
    );
  });
});

describe('TextInput exposure module: parity inside ListView rows', () => {
  const ROWS = [
    { name: 'first', disabled: false },
    { name: '', disabled: true },
    { name: 7, disabled: 'yes' },
    { name: null, disabled: false },
  ];
  let session;

  beforeEach(async () => {
    await widget.setup();
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'textinput-exposure-listview',
        name: 'TextInput exposure in ListView rows',
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
    const input = componentDefinition(ID, 'textinput1', 'TextInput', {
      label: binding('{{listItem.name}}'),
      value: binding('{{listItem.name}}'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.disabled}}'),
    });
    input.component.parent = 'lv1';
    input.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    input.component.definition.validation = { mandatory: binding('{{true}}') };
    seedApp({ lv1: lv, [ID]: input }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  test('each row exposes what initial computes from its own props, and a row action patches only that row', async () => {
    renderListview();
    await waitFor(() =>
      ROWS.forEach((_, row) => expect(listview().children?.[row]?.textinput1?.setText).toBeInstanceOf(Function))
    );
    await drain();

    ROWS.forEach((_, row) => {
      expect(valuesOf(listview().children[row].textinput1)).toEqual(textInputExposure.initial(inputOf(ID, row, 'lv1')));
    });

    const before = ROWS.map((_, row) => valuesOf(listview().children[row].textinput1));
    await session.store.act(async () => {
      await listview().children[1].textinput1.setDisable(false);
      await listview().children[2].textinput1.setVisibility(false);
    });
    await drain();

    expect(valuesOf(listview().children[1].textinput1)).toEqual({
      ...before[1],
      ...textInputExposure.actions.setDisable(before[1], [false], inputOf(ID, 1, 'lv1')),
    });
    expect(valuesOf(listview().children[2].textinput1)).toEqual({
      ...before[2],
      ...textInputExposure.actions.setVisibility(before[2], [false], inputOf(ID, 2, 'lv1')),
    });
    expect(valuesOf(listview().children[0].textinput1)).toEqual(before[0]);
    expect(valuesOf(listview().children[3].textinput1)).toEqual(before[3]);
  });
});
