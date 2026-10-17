/**
 * UI 2.0 Kanban custom cards: every card renders the board's one card canvas, and its components belong to that
 * card, as a List view row's do: their values, their actions and the events they fire. From the UI 2.0 release audit
 * (finding 13): every card's components wrote one shared entry, so a card's button acted on another card.
 *
 * Real store, real RenderWidget, real widgets; jsdom's missing layout is given a width so cards mount their canvas.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'board1';
const widget = createWidgetHarness({
  componentType: 'ShadKanban',
  handle: 'board1',
  id: ID,
  widgetHeight: 500,
  widgetWidth: 900,
  capabilities: { dnd: true },
  preload: ['ShadInput', 'ShadButton'],
});

const onCard = (component, top) => {
  component.component.parent = ID;
  component.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  component.layouts = { desktop: { top, left: 0, width: 20, height: 70 } };
  return component;
};
const values = () => screen.getAllByRole('textbox').map((box) => box.value);

/** Two cards, each with an Input (its card's value) and a Button that sets that Input's text. */
const render = async (betaStatus = 'done') => {
  widget.render({
    currentMode: 'view',
    extraComponents: {
      input1: onCard(
        componentDefinition('input1', 'input1', 'ShadInput', { defaultValue: binding('{{cardData.value}}') }),
        0
      ),
      button1: onCard(
        componentDefinition('button1', 'button1', 'ShadButton', { text: binding('{{"Update " + cardData.title}}') }),
        100
      ),
    },
    properties: {
      data: binding(
        `{{[{id:1,title:"Alpha",status:"todo",value:"alpha"},{id:2,title:"Beta",status:"${betaStatus}",value:"beta"}]}}`
      ),
      idField: binding('id'),
      cardLayout: binding('custom'),
      cardHeight: binding('{{200}}'),
      columns: binding('{{["todo","done"]}}'),
    },
  });
  await waitFor(() => expect(values()).toEqual(['alpha', 'beta']));
  await act(async () =>
    widget.setEvents([
      {
        id: 'set-sibling',
        index: 0,
        sourceId: 'button1',
        name: 'set-sibling',
        target: 'component',
        event: {
          eventId: 'onClick',
          actionId: 'control-component',
          componentId: 'input1',
          componentSpecificActionHandle: 'setText',
          componentSpecificActionParams: [{ handle: 'text', value: 'updated' }],
        },
      },
    ])
  );
};
const press = (name) => act(async () => fireEvent.click(screen.getByRole('button', { name })));

let restoreWidth;
beforeAll(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
  restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
});
afterAll(() => restoreWidth?.());

describe('[finding 13] UI 2.0 Kanban custom card components belong to their card', () => {
  beforeEach(() => {
    const host = document.createElement('div');
    host.className = 'canvas-content';
    host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
    document.body.appendChild(host);
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    document.querySelectorAll('.canvas-content').forEach((node) => node.remove());
  });

  test("a card's button acts on that card's components", async () => {
    await render();
    await press('Update Alpha');
    await waitFor(() => expect(values()).toEqual(['updated', 'beta']));
    await press('Update Beta');
    await waitFor(() => expect(values()).toEqual(['updated', 'updated']));
  });

  test('after a reorder, a typed value stays with its card and each button acts on its own card', async () => {
    await render('todo');
    await act(async () => fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Alpha edited' } }));
    // Alpha moves to the end of To do: board order Beta, Alpha.
    await act(async () => widget.exposed().moveCard(1, 'todo'));
    await waitFor(() => expect(values()).toEqual(['beta', 'Alpha edited']));
    await press('Update Beta');
    await waitFor(() => expect(values()).toEqual(['updated', 'Alpha edited']));
    await press('Update Alpha');
    await waitFor(() => expect(values()).toEqual(['updated', 'updated']));
  });

  test('after a card moves to another column, each button acts on its own card', async () => {
    await render();
    // Alpha moves after Beta in Done: board order Beta, Alpha (a card in another column is drawn anew).
    await act(async () => widget.exposed().moveCard(1, 'done'));
    await waitFor(() => expect(values()).toEqual(['beta', 'alpha']));
    await press('Update Alpha');
    await waitFor(() => expect(values()).toEqual(['beta', 'updated']));
    await press('Update Beta');
    await waitFor(() => expect(values()).toEqual(['updated', 'updated']));
  });
});
