import { kanbanAnnouncements, kanbanCoordinates } from '@/AppBuilder/Widgets/Ui2/Kanban/kanbanKeyboard';

// Keyboard moves on the Kanban took about a dozen arrow presses per column (dnd-kit's 25px default step), and the
// screen reader heard "Draggable item 1 was dropped over droppable area drop-2". Found in a headless browser.
const rect = (left, width = 240, top = 40, height = 400) => ({ left, width, top, height });
const context = (cardLeft) => ({
  collisionRect: { left: cardLeft, width: 200, top: 100, height: 60 },
  droppableRects: new Map([
    ['col-todo', rect(0)],
    ['drop-1', rect(20, 200, 100, 60)],
    ['col-doing', rect(260)],
    ['col-done', rect(520)],
  ]),
});
const press = (key, cardLeft, currentCoordinates = { x: cardLeft, y: 100 }) =>
  kanbanCoordinates({ key, preventDefault() {} }, { context: context(cardLeft), currentCoordinates });

describe('kanbanCoordinates', () => {
  it('jumps a card to the next and previous column with one arrow press', () => {
    expect(press('ArrowRight', 20)).toEqual({ x: 280, y: 100 });
    expect(press('ArrowLeft', 280)).toEqual({ x: 20, y: 100 });
  });
  it('stays at the board ends', () => {
    expect(press('ArrowLeft', 20)).toEqual({ x: 20, y: 100 });
    expect(press('ArrowRight', 540)).toEqual({ x: 540, y: 100 });
  });
  it('moves past one card with Up and Down, and ignores other keys', () => {
    expect(press('ArrowDown', 20)).toEqual({ x: 20, y: 168 });
    expect(press('ArrowUp', 20)).toEqual({ x: 20, y: 32 });
    expect(press('a', 20)).toBeUndefined();
  });
  it('counts a card over the gap between columns as in the left one', () => {
    expect(press('ArrowRight', 145)).toEqual({ x: 145 + (280 - 145), y: 100 });
  });
});

describe('kanbanAnnouncements', () => {
  const a = kanbanAnnouncements(
    (id) => (id === 'k1' ? 'Draft the brief' : 'card'),
    (id) => (id === 'col-doing' ? 'In progress' : 'a column')
  );
  it('speaks in card and column titles', () => {
    expect(a.onDragStart({ active: { id: 'k1' } })).toBe('Picked up Draft the brief.');
    expect(a.onDragOver({ active: { id: 'k1' }, over: { id: 'col-doing' } })).toBe(
      'Draft the brief is over In progress.'
    );
    expect(a.onDragEnd({ active: { id: 'k1' }, over: { id: 'col-doing' } })).toBe(
      'Draft the brief dropped in In progress.'
    );
    expect(a.onDragEnd({ active: { id: 'k1' }, over: null })).toBe('Draft the brief dropped back.');
    expect(a.onDragCancel({ active: { id: 'k1' } })).toBe('Moving Draft the brief cancelled.');
  });
});
