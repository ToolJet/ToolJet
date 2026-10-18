/**
 * UI 2.0 widgets in a List view row publish their values per row (components[child][row]), and the list derives its
 * children from those rows. An action or a user's pick must land on both before its event fires and before an awaited
 * action returns: a handler or the next line of a query reads the new value through the row (components.<child>) and
 * through the list (components.<list>.children[row]). From the UI 2.0 audit round 2 (repeated publication order).
 *
 * Real store, real RenderWidget, real List view and pickers; jsdom's missing layout is given a width.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';

const ID = 'list1';
const OPTIONS = "{{[{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }]}}";

/** Opens row `row`'s picker the way a pointer does and picks "Two" (Select: by keyboard; the cmdk lists: by click). */
const userPick = {
  ShadSelect: async (row) => {
    await act(async () => {
      fireEvent.pointerDown(screen.getAllByRole('combobox')[row], { button: 0, pointerType: 'mouse', ctrlKey: false });
    });
    const option = await screen.findByRole('option', { name: 'Two' });
    await act(async () => fireEvent.keyDown(option, { key: 'Enter' }));
  },
  ShadCombobox: async (row) => {
    await act(async () => {
      fireEvent.pointerDown(screen.getAllByRole('combobox')[row], { button: 0, pointerType: 'mouse', ctrlKey: false });
      fireEvent.click(screen.getAllByRole('combobox')[row]);
    });
    const item = (await screen.findByText('Two')).closest('[cmdk-item]');
    await act(async () => fireEvent.click(item));
  },
  ShadMultiselect: async (row) => {
    await act(async () => fireEvent.click(screen.getAllByRole('combobox')[row]));
    const item = (await screen.findByText('Two')).closest('[cmdk-item]');
    await act(async () => fireEvent.click(item));
  },
};

// Each picker: its type, the action that picks `two`, the exposed value it sets (`key`) and what that then holds.
const PICKERS = [
  { type: 'ShadSelect', pick: ['selectOption', 'two'], key: 'value', value: 'two' },
  { type: 'ShadCombobox', pick: ['selectOption', 'two'], key: 'value', value: 'two' },
  { type: 'ShadMultiselect', pick: ['selectOptions', ['two']], key: 'values', value: ['two'] },
];

describe.each(PICKERS)('$type in a List view row', ({ type, pick, key, value }) => {
  const widget = createWidgetHarness({
    componentType: 'ShadListView',
    handle: 'list1',
    id: ID,
    widgetHeight: 500,
    widgetWidth: 600,
    capabilities: { dnd: true },
    preload: [type],
  });
  const exposed = () => widget.exposed() ?? {};
  /** The picker's own entry for `row` in the store (the row's values, as its components read them). */
  const rawRow = (row) => useStore.getState().resolvedStore.modules.canvas.exposedValues.components.picker1?.[row];
  const derivedRow = (row) => exposed().children?.[row]?.picker1;
  const action = (row) => rawRow(row)?.[pick[0]];

  const render = async () => {
    const picker = componentDefinition('picker1', 'picker1', type, { options: binding(OPTIONS) });
    picker.component.parent = ID;
    picker.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    picker.layouts = { desktop: { top: 0, left: 0, width: 25, height: 70 } };
    widget.render({
      currentMode: 'view',
      extraComponents: { picker1: picker },
      properties: { data: binding("{{[{ id: 'a' }, { id: 'b' }]}}"), idField: binding('id') },
    });
    await waitFor(() => expect(action(0)).toBeInstanceOf(Function));
    await waitFor(() => expect(action(1)).toBeInstanceOf(Function));
  };

  let restoreWidth;
  beforeAll(() => {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
    Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
    restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
  });
  afterAll(() => restoreWidth?.());
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test("a user's first pick fires onSelect with the new value readable through the row and the list", async () => {
    await render();
    widget.setEvents(
      [
        ...setVariableOn('picker1', 'onSelect', { key: 'row', value: `{{components.picker1[0].${key}}}` }),
        ...setVariableOn('picker1', 'onSelect', {
          key: 'list',
          value: `{{components.list1.children[0].picker1.${key}}}`,
        }),
      ].map((event, index) => ({ ...event, id: `seen-${index}` }))
    );
    await userPick[type](0);
    await waitFor(() => expect(widget.variables().list).toBeDefined());
    expect(widget.variables().row).toEqual(value);
    expect(widget.variables().list).toEqual(value);
    expect(derivedRow(1)[key]).not.toEqual(value);
  });

  test('the line after an awaited action reads the new value through the row and through the list', async () => {
    await render();
    let seen;
    await act(async () => {
      await action(0)(...pick.slice(1));
      seen = { row: rawRow(0)?.[key], list: derivedRow(0)?.[key] };
    });
    expect(seen).toEqual({ row: value, list: value });
    expect(derivedRow(1)[key]).not.toEqual(value);
  });

  test('an action that is not awaited has written its row by the time the call returns', async () => {
    await render();
    let seen;
    await act(async () => {
      const done = action(0)(...pick.slice(1));
      seen = rawRow(0)?.[key];
      await done;
    });
    expect(seen).toEqual(value);
  });
});
