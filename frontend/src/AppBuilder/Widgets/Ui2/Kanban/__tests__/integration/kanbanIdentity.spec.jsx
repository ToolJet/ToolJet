/**
 * UI 2.0 Kanban: a card's public identity is its idField value, in move payloads and for every action. From the UI 2.0
 * release audit; each test names its finding. The board's drag keys are internal and never published.
 *
 * Real store, real RenderWidget, real widget.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { fireEvent, screen } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'kb1';
const widget = createWidgetHarness({
  componentType: 'ShadKanban',
  handle: 'board1',
  id: ID,
  widgetHeight: 440,
  widgetWidth: 900,
  capabilities: { dnd: true },
});
const json = (value) => `{{${JSON.stringify(value)}}}`;
const exposed = () => widget.exposed() ?? {};
const cards = () => exposed().updatedCardData;

const render = (data, idField = 'id') => {
  widget.render({
    currentMode: 'view',
    properties: {
      data: binding(json(data)),
      columns: binding(json(['todo', 'done'])),
      idField: binding(idField),
      statusField: binding('stage'),
      titleField: binding('title'),
    },
  });
  widget.setEvents(
    setVariableOn(ID, 'onCardMoved', { key: 'movement', value: '{{components.board1.lastCardMovement}}' })
  );
};

describe('UI 2.0 Kanban card identity', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  describe('[finding 77] a move names the moved card by its idField', () => {
    test('not by an unrelated id field', async () => {
      render([{ id: 'database-99', code: 'A', title: 'Alpha', stage: 'todo' }], 'code');
      await widget.act('moveCard', 'A', 'done');
      expect(widget.variables().movement.cardId).toBe('A');
    });

    test('with its value type kept', async () => {
      render([{ code: 17, title: 'Seventeen', stage: 'todo' }], 'code');
      await widget.act('moveCard', 17, 'done');
      expect(widget.variables().movement.cardId).toBe(17);
    });

    test('so the moved id addresses the moved card in the next action', async () => {
      render(
        [
          { id: 'B', code: 'A', title: 'Alpha', stage: 'todo' },
          { id: 'A', code: 'B', title: 'Beta', stage: 'todo' },
        ],
        'code'
      );
      await widget.act('moveCard', 'A', 'done');
      await widget.act('updateCardData', widget.variables().movement.cardId, { note: 'moved' });
      expect(cards().find((card) => card.code === 'A').note).toBe('moved');
      expect(cards().find((card) => card.code === 'B').note).toBeUndefined();
    });

    test('a card without an id is still moved by the id the move published', async () => {
      render([{ title: 'No id', stage: 'todo' }]);
      const [card] = cards();
      expect(card.id).toBeUndefined();
      await widget.act('moveCard', 'todo-0', 'done');
      const { cardId } = widget.variables().movement;
      await widget.act('moveCard', cardId, 'todo');
      expect(cards()[0].stage).toBe('todo');
    });
  });

  describe('[finding 78] an id changed by updateCardData addresses the card from then on', () => {
    test('in its own column', async () => {
      render([{ id: 'A', title: 'Alpha', stage: 'todo' }]);
      await widget.act('updateCardData', 'A', { id: 'RENAMED' });
      expect(cards()[0].id).toBe('RENAMED');
      await widget.act('moveCard', 'RENAMED', 'done');
      expect(cards()[0].stage).toBe('done');
      await widget.act('moveCard', 'A', 'todo');
      expect(cards()[0].stage).toBe('done');
    });

    test('keeping the card selected', async () => {
      render([
        { id: 'A', title: 'Alpha', stage: 'todo' },
        { id: 'B', title: 'Beta', stage: 'todo' },
      ]);
      fireEvent.click(screen.getByText('Alpha'));
      expect(exposed().lastSelectedCard.id).toBe('A');
      await widget.act('updateCardData', 'A', { id: 'RENAMED' });
      expect(exposed().lastSelectedCard).toMatchObject({ id: 'RENAMED', title: 'Alpha' });
    });

    test('like a duplicate id in the data, a rename onto another card keeps both cards', async () => {
      render([
        { id: 'A', title: 'Alpha', stage: 'todo' },
        { id: 'B', title: 'Beta', stage: 'todo' },
      ]);
      await widget.act('updateCardData', 'A', { id: 'B' });
      expect(cards().map((card) => [card.id, card.title])).toEqual([
        ['B', 'Alpha'],
        ['B', 'Beta'],
      ]);
    });
  });
});
