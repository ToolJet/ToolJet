/**
 * UI 2.0 Kanban: values of components on custom cards, a List view on a card, and an emptied board. From the Codex
 * audit (KANBAN-NESTED-AND-EMPTY-VALUES, auditKanbanNestedListValues.spec.jsx):
 * - an emptied board (data refreshed to [] or every card deleted) kept its removed cards' component values in
 *   children, readable by workflows;
 * - a List view on a card: after the card moved or a card before it was removed, the Inputs showed the right values
 *   but children kept the nested values at the old card indexes. Marked test.failing: the cause is shared,
 *   takeRowValues (_shared/rowValues.ts) moves only the board's direct card components' values, not those of a
 *   component inside a nested List view (the same gap as a List view in a List view, NESTED-LIST-RECORD-VALUES).
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadKanban',
  id: 'board1',
  handle: 'board1',
  widgetWidth: 900,
  widgetHeight: 700,
  capabilities: { dnd: true },
  preload: ['ShadListView', 'ShadInput', 'ShadButton'],
});
const A = {
  id: 'A',
  title: 'Alpha',
  status: 'todo',
  children: [
    { id: 'a1', name: 'Alpha one' },
    { id: 'a2', name: 'Alpha two' },
  ],
};
const B = {
  id: 'B',
  title: 'Beta',
  status: 'todo',
  children: [
    { id: 'b1', name: 'Beta one' },
    { id: 'b2', name: 'Beta two' },
  ],
};
let width;
beforeAll(() => {
  width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 650 });
});
afterAll(() => {
  if (width) Object.defineProperty(Element.prototype, 'clientWidth', width);
  else delete Element.prototype.clientWidth;
});
beforeEach(() => {
  const host = document.createElement('div');
  host.className = 'canvas-content';
  host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
  document.body.appendChild(host);
  return w.setup();
});
afterEach(() => {
  w.teardown();
  document.querySelectorAll('.canvas-content').forEach((node) => node.remove());
});

const place = (component, parent, height) => {
  component.component.parent = parent;
  component.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  component.layouts = { desktop: { top: 0, left: 0, width: 30, height } };
  return component;
};
/** Cards Alpha and Beta, each with a List view of its children (an Input per child), or with one Input (`flat`). */
const mount = async (flat = false) => {
  const inner = flat
    ? componentDefinition('inner1', 'inner1', 'ShadInput', {
        label: binding('{{cardData.title}}'),
        defaultValue: binding('seed'),
      })
    : componentDefinition('inner1', 'inner1', 'ShadListView', {
        data: binding('{{cardData.children}}'),
        idField: binding('id'),
        enablePagination: binding('{{false}}'),
        itemHeight: binding('{{90}}'),
      });
  const field = componentDefinition('field1', 'field1', 'ShadInput', {
    label: binding('{{listItem.name}}'),
    defaultValue: binding('seed'),
  });
  const read = componentDefinition('readTop', 'readTop', 'ShadButton', { text: binding('Read board aggregate') });
  w.render({
    currentMode: 'view',
    extraComponents: {
      inner1: place(inner, 'board1', 220),
      ...(flat ? {} : { field1: place(field, 'inner1', 80) }),
      readTop: read,
    },
    also: [{ id: 'readTop', componentType: 'ShadButton', widgetHeight: 40, widgetWidth: 180 }],
    properties: {
      data: binding(`{{${JSON.stringify([A, B])}}}`),
      idField: binding('id'),
      titleField: binding('title'),
      statusField: binding('status'),
      cardLayout: binding('custom'),
      cardHeight: binding('{{250}}'),
      columns: binding('{{["todo","done"]}}'),
    },
  });
  await waitFor(() => expect(values()).toEqual(flat ? ['seed', 'seed'] : ['seed', 'seed', 'seed', 'seed']));
  const action = () =>
    flat
      ? w.exposed().children?.[1]?.inner1?.setText
      : w.exposed().children?.[1]?.inner1?.children?.[1]?.field1?.setText;
  await waitFor(() => expect(action()).toBeInstanceOf(Function));
};
const values = () => screen.queryAllByRole('textbox').map((box) => box.value);
const published = () =>
  Object.values(w.exposed().children || {}).flatMap((card) =>
    Object.values(card.inner1?.children || {}).map((row) => row.field1?.value)
  );
const editAlphaOne = () =>
  act(async () => fireEvent.change(screen.getByLabelText('Alpha one'), { target: { value: 'Alpha edit' } }));
const setData = (data) =>
  act(async () => w.setComponentProperty('board1', 'data', `{{${JSON.stringify(data)}}}`, 'properties'));
const emptied = () => ({
  keys: Object.keys(w.exposed().children || {}),
  data: w.exposed().updatedCardData,
});

describe('an emptied board', () => {
  test('a refresh to no cards clears the nested values from children', async () => {
    await mount();
    await editAlphaOne();
    await setData([]);
    await waitFor(() => expect(screen.queryAllByRole('textbox')).toHaveLength(0));
    await waitFor(() => expect({ ...emptied(), values: published() }).toEqual({ keys: [], data: [], values: [] }));
  });

  test.each(['a refresh', 'deleting every card'])('%s clears the card Inputs from children', async (route) => {
    await mount(true);
    await act(async () => fireEvent.change(screen.getByLabelText('Alpha'), { target: { value: 'Alpha edit' } }));
    if (route === 'a refresh') await setData([]);
    else {
      await w.act('deleteCard', 'B');
      await w.act('deleteCard', 'A');
    }
    await waitFor(() => expect(screen.queryAllByRole('textbox')).toHaveLength(0));
    await waitFor(() => expect(emptied()).toEqual({ keys: [], data: [] }));
  });

  test('cards that come back have fresh Inputs and values (control)', async () => {
    await mount();
    await editAlphaOne();
    await setData([]);
    await waitFor(() => expect(screen.queryAllByRole('textbox')).toHaveLength(0));
    await setData([B]);
    await waitFor(() => expect(values()).toEqual(['seed', 'seed']));
    await waitFor(() => expect(published()).toEqual(['seed', 'seed']));
    expect(w.exposed().updatedCardData.map((c) => c.id)).toEqual(['B']);
  });
});

describe('a List view on a card', () => {
  test('a refresh in the same order keeps the nested draft (control)', async () => {
    await mount();
    await editAlphaOne();
    await setData([{ ...A, extra: 1 }, B]);
    await waitFor(() => expect(values()).toEqual(['Alpha edit', 'seed', 'seed', 'seed']));
    expect(published()).toEqual(['Alpha edit', 'seed', 'seed', 'seed']);
  });

  test('a nested action kept from before a move still sets its own card (control)', async () => {
    await mount();
    const retained = w.exposed().children[0].inner1.children[0].field1.setText;
    await w.act('moveCard', 'A', 'done');
    await act(async () => retained('Alpha action'));
    expect(screen.getByLabelText('Alpha one')).toHaveValue('Alpha action');
    expect(screen.getByLabelText('Beta one')).toHaveValue('seed');
  });

  // Shared cause: takeRowValues (_shared/rowValues.ts) leaves field1's values at the old card index.
  test.failing('a card moved to another column takes its nested values along in children', async () => {
    await mount();
    await editAlphaOne();
    await w.act('moveCard', 'A', 'done');
    expect(w.exposed().updatedCardData.map((c) => c.id)).toEqual(['B', 'A']);
    await waitFor(() => expect(values()).toEqual(['seed', 'seed', 'Alpha edit', 'seed']));
    await waitFor(() => expect(published()).toEqual(['seed', 'seed', 'Alpha edit', 'seed']));
  });

  test.failing('a workflow reads the nested value of the card now first', async () => {
    await mount();
    await editAlphaOne();
    await act(async () =>
      w.setEvents(
        setVariableOn('readTop', 'onClick', {
          key: 'read',
          value:
            '{{({name:components.board1.updatedCardData[0].title,value:components.board1.children[0].inner1.children[0].field1.value})}}',
        })
      )
    );
    await w.act('moveCard', 'A', 'done');
    await waitFor(() => expect(screen.getByLabelText('Beta one')).toHaveValue('seed'));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Read board aggregate' })));
    await waitFor(() => expect(w.variables().read).toEqual({ name: 'Beta', value: 'seed' }));
  });

  test.failing('removing a card does not show its nested draft under the next card', async () => {
    await mount();
    await editAlphaOne();
    await setData([B]);
    await waitFor(() => expect(values()).toEqual(['seed', 'seed']));
    await waitFor(() => expect(published()).toEqual(['seed', 'seed']));
  });
});
