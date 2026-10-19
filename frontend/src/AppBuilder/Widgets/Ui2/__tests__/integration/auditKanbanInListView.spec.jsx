/**
 * UI 2.0 Kanban inside a List view row: each custom card's components belong to that row and that card. From the
 * Codex audit (NESTED-KANBAN-CARD-SCOPE, auditNestedKanbanCardScope.spec.jsx): per-card scope was kept to top-level
 * boards, so inside a List view every card shared one entry. The second card showed the first card's data, a card's
 * button set another card's field, and with two outer rows the cards showed Gamma, Gamma, Delta, Delta.
 *
 * Real ListView, Kanban, Input and Button, real store and a real control-component workflow; jsdom is given a width.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadListView',
  id: 'outer1',
  handle: 'outer1',
  widgetWidth: 1000,
  widgetHeight: 650,
  capabilities: { dnd: true },
  preload: ['ShadKanban', 'ShadInput', 'ShadButton'],
});
let width;
beforeAll(() => {
  width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 900 });
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

const card = (id, title) => ({ id, title, status: 'todo', initial: title.toLowerCase() });
const place = (component, parent, top, height) => {
  component.component.parent = parent;
  component.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  component.layouts = { desktop: { top, left: 0, width: 40, height } };
  return component;
};
/** List rows (each a list of cards) holding a custom board; each card an Input and a Button that sets it. */
const mount = async (rows, { constant = false } = {}) => {
  const board = componentDefinition('board1', 'board1', 'ShadKanban', {
    data: binding('{{listItem.cards}}'),
    idField: binding('id'),
    titleField: binding('title'),
    statusField: binding('status'),
    columns: binding('{{["todo","done"]}}'),
    cardLayout: binding('custom'),
    cardHeight: binding('{{200}}'),
  });
  const input = componentDefinition('field1', 'field1', 'ShadInput', {
    label: binding('{{cardData.title}}'),
    defaultValue: binding(constant ? 'seed' : '{{cardData.initial}}'),
  });
  const button = componentDefinition('button1', 'button1', 'ShadButton', {
    text: binding('{{"Update "+cardData.title}}'),
  });
  w.render({
    currentMode: 'view',
    extraComponents: {
      board1: place(board, 'outer1', 0, 500),
      field1: place(input, 'board1', 0, 70),
      button1: place(button, 'board1', 85, 40),
    },
    properties: {
      data: binding(`{{${JSON.stringify(rows.map((cards, i) => ({ id: `row${i}`, cards })))}}}`),
      idField: binding('id'),
      itemHeight: binding('{{520}}'),
      enablePagination: binding('{{false}}'),
    },
  });
  const count = rows.reduce((n, cards) => n + cards.length, 0);
  await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(count));
  await act(async () =>
    w.setEvents([
      {
        id: 'set-sibling',
        index: 0,
        sourceId: 'button1',
        name: 'set-sibling',
        target: 'component',
        event: {
          eventId: 'onClick',
          actionId: 'control-component',
          componentId: 'field1',
          componentSpecificActionHandle: 'setText',
          componentSpecificActionParams: [{ handle: 'text', value: 'updated' }],
        },
      },
    ])
  );
};
const values = () => screen.queryAllByRole('textbox').map((box) => box.value);
const fields = () =>
  screen.getAllByRole('textbox').map((box) => ({ label: box.labels?.[0]?.textContent, value: box.value }));

test('a single card in a List view row keeps its own data and action (control)', async () => {
  await mount([[card('A', 'Alpha')]]);
  expect(values()).toEqual(['alpha']);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Update Alpha' })));
  expect(values()).toEqual(['updated']);
});

test('two cards in one List view row show their own data', async () => {
  await mount([[card('A', 'Alpha'), card('B', 'Beta')]]);
  expect(fields()).toEqual([
    { label: 'Alpha', value: 'alpha' },
    { label: 'Beta', value: 'beta' },
  ]);
});

test("the first card's button changes only its own Input", async () => {
  await mount([[card('A', 'Alpha'), card('B', 'Beta')]], { constant: true });
  expect(values()).toEqual(['seed', 'seed']);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Update Alpha' })));
  await waitFor(() => expect(values()).toEqual(['updated', 'seed']));
});

test('boards in two List view rows keep both the row and the card', async () => {
  await mount([
    [card('A', 'Alpha'), card('B', 'Beta')],
    [card('C', 'Gamma'), card('D', 'Delta')],
  ]);
  await waitFor(() =>
    expect(fields()).toEqual([
      { label: 'Alpha', value: 'alpha' },
      { label: 'Beta', value: 'beta' },
      { label: 'Gamma', value: 'gamma' },
      { label: 'Delta', value: 'delta' },
    ])
  );
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Update Gamma' })));
  await waitFor(() => expect(values()).toEqual(['alpha', 'beta', 'updated', 'delta']));
});
