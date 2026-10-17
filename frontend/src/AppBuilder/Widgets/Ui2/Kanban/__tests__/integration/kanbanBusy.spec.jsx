/**
 * UI 2.0 Kanban: while the board is disabled or loading it takes no input, including from a card or button that
 * already has focus and from a move already under way. From the UI 2.0 release audit (finding 30).
 *
 * Real store, real RenderWidget, real widget. A move under way ends in the board's onDragEnd, whatever sensor started
 * it (pointer, touch, keyboard); jsdom has no layout for dnd-kit to drag in, so the tests drop through the handlers the
 * board gives its DndContext, after the same pick-up the browser makes.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// The handlers the board last gave its DndContext.
const board = {};
jest.mock('@dnd-kit/core', () => {
  const actual = jest.requireActual('@dnd-kit/core');
  const { createElement } = jest.requireActual('react');
  return {
    ...actual,
    DndContext: (props) => {
      board.onDragStart = props.onDragStart;
      board.onDragEnd = props.onDragEnd;
      return createElement(actual.DndContext, props);
    },
  };
});

const ID = 'board1';
const widget = createWidgetHarness({
  componentType: 'ShadKanban',
  handle: 'board1',
  id: ID,
  widgetHeight: 500,
  widgetWidth: 900,
  capabilities: { dnd: true },
});
const exposed = () => widget.exposed() ?? {};
const card = (title) => screen.getByText(title).closest('[aria-roledescription]');
const stages = () => exposed().updatedCardData.map((row) => `${row.id}:${row.status}`);

const render = async (properties = {}) => {
  widget.render({
    currentMode: 'view',
    properties: {
      data: binding('{{[{id:"A",title:"Alpha",status:"todo"},{id:"B",title:"Beta",status:"todo"}]}}'),
      columns: binding('{{[{id:"todo",title:"To do"},{id:"done",title:"Done"}]}}'),
      titleField: binding('title'),
      idField: binding('id'),
      statusField: binding('status'),
      allowDelete: binding('{{true}}'),
      ...properties,
    },
  });
  await waitFor(() => expect(exposed().updatedCardData).toHaveLength(2));
};

describe('[finding 30] a busy UI 2.0 Kanban takes no input', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test.each(['setDisable', 'setLoading'])('after %s, Enter on a focused card does not select it', async (action) => {
    await render();
    const user = userEvent.setup({ delay: null });
    widget.setEvents(countInvocationsOn(ID, 'onCardSelected'));
    act(() => card('Alpha').focus());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(widget.variables().calls).toBe(1));

    act(() => card('Beta').focus());
    await widget.act(action, true);
    expect(document.activeElement).toBe(card('Beta'));
    await user.keyboard('{Enter}');
    expect(widget.variables().calls).toBe(1);
    expect(exposed().lastSelectedCard.id).toBe('A');
  });

  test('while loading, Enter on a focused Delete button removes nothing', async () => {
    await render();
    const user = userEvent.setup({ delay: null });
    widget.setEvents(countInvocationsOn(ID, 'onCardRemoved'));
    const button = screen.getAllByRole('button', { name: 'Delete card' })[0];
    act(() => button.focus());
    await widget.act('setLoading', true);
    expect(document.activeElement).toBe(button);
    await user.keyboard('{Enter}');
    expect(stages()).toEqual(['A:todo', 'B:todo']);
    expect(widget.variables().calls ?? 0).toBe(0);
  });

  describe('a move under way', () => {
    // Alpha is picked up and dropped on Done; `interrupt` runs between the two.
    const moveAlphaToDone = async (interrupt) => {
      widget.setEvents(countInvocationsOn(ID, 'onCardMoved'));
      await act(async () => board.onDragStart({ active: { id: 'A' } }));
      await interrupt?.();
      await act(async () =>
        board.onDragEnd({
          active: { id: 'A' },
          over: { id: 'col-done', data: { current: { type: 'column', columnId: 'done' } } },
        })
      );
    };

    test('drops the card when nothing changed (control)', async () => {
      await render();
      await moveAlphaToDone();
      expect(stages()).toEqual(['B:todo', 'A:done']);
      expect(widget.variables().calls).toBe(1);
    });

    test.each([
      ['setDisable', () => widget.act('setDisable', true)],
      ['setLoading', () => widget.act('setLoading', true)],
      ['allowDrag off', () => act(async () => widget.setComponentProperty(ID, 'allowDrag', '{{false}}', 'properties'))],
    ])('does not move the card after %s', async (_name, interrupt) => {
      await render();
      await moveAlphaToDone(interrupt);
      expect(stages()).toEqual(['A:todo', 'B:todo']);
      expect(widget.variables().calls ?? 0).toBe(0);
    });
  });
});
