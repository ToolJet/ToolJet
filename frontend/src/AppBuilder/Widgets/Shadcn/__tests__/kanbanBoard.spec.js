import { addCard, boardCards, boardColumns, cardClamp, deleteCard, moveCard, updateCard } from '../kanbanBoard';

const cards = [
  { id: 1, title: 'Fix login', status: 'todo' },
  { id: 2, title: 'Write docs', status: 'doing' },
  { id: 3, title: 'Ship v2', status: 'todo' },
  { id: 4, title: 'Retro', status: 'done' },
];

describe('boardColumns', () => {
  it('groups cards by the status field in the order the columns are given', () => {
    const cols = boardColumns(cards, ['todo', 'doing', 'done'], 'status', 'id');
    expect(cols.map((c) => [c.id, c.cards.map((x) => x.id)])).toEqual([
      ['todo', [1, 3]],
      ['doing', [2]],
      ['done', [4]],
    ]);
  });

  it('takes column titles from objects and adds a column for a status nobody listed', () => {
    const cols = boardColumns(
      cards,
      [
        { id: 'todo', title: 'To do' },
        { id: 'doing', title: 'In progress' },
      ],
      'status',
      'id'
    );
    expect(cols.map((c) => [c.id, c.title])).toEqual([
      ['todo', 'To do'],
      ['doing', 'In progress'],
      ['done', 'done'],
    ]);
  });

  it('derives the columns from the data when none are given', () => {
    expect(boardColumns(cards, [], 'status', 'id').map((c) => c.id)).toEqual(['todo', 'doing', 'done']);
  });
});

describe('moveCard', () => {
  const cols = () => boardColumns(cards, ['todo', 'doing', 'done'], 'status', 'id');

  it('moves a card to the end of another column when dropped on the column', () => {
    const { columns, move } = moveCard(cols(), 1, 'done', null, 'status');
    expect(columns.find((c) => c.id === 'done').cards.map((x) => x.id)).toEqual([4, 1]);
    expect(columns.find((c) => c.id === 'todo').cards.map((x) => x.id)).toEqual([3]);
    expect(move).toMatchObject({ cardId: 1, from: 'todo', to: 'done', toIndex: 1 });
    expect(move.card.status).toBe('done');
  });

  it('inserts before the card it was dropped on', () => {
    const { columns, move } = moveCard(cols(), 2, 'todo', 3, 'status');
    expect(columns.find((c) => c.id === 'todo').cards.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(move.toIndex).toBe(1);
  });

  it('reorders within a column', () => {
    const { columns, move } = moveCard(cols(), 3, 'todo', 1, 'status');
    expect(columns.find((c) => c.id === 'todo').cards.map((x) => x.id)).toEqual([3, 1]);
    expect(move).toMatchObject({ from: 'todo', to: 'todo', toIndex: 0 });
  });

  it('returns nothing to do for a drop where the card already is', () => {
    expect(moveCard(cols(), 4, 'done', null, 'status').move).toBeNull();
  });
});

describe('editing cards', () => {
  const cols = () => boardColumns(cards, ['todo', 'doing', 'done'], 'status', 'id');
  const ids = (columns, id) => columns.find((c) => c.id === id).cards.map((x) => x.id);

  it('adds a card to the end of its status column, or of the column given', () => {
    let { columns, card } = addCard(cols(), { id: 5, title: 'New', status: 'doing' }, undefined, 'status', 'id');
    expect(ids(columns, 'doing')).toEqual([2, 5]);
    expect(card).toEqual({ id: 5, title: 'New', status: 'doing' });
    ({ columns, card } = addCard(cols(), { id: 6, title: 'Other' }, 'done', 'status', 'id'));
    expect(ids(columns, 'done')).toEqual([4, 6]);
    expect(card.status).toBe('done');
  });

  it('gives an added card without an id a unique one', () => {
    const { columns, card } = addCard(cols(), { title: 'No id', status: 'todo' }, undefined, 'status', 'id');
    expect(card.id).toBeDefined();
    expect(new Set(boardCards(columns).map((c) => String(c.id))).size).toBe(5);
  });

  it('deletes a card by id and returns it', () => {
    const { columns, card } = deleteCard(cols(), 3);
    expect(ids(columns, 'todo')).toEqual([1]);
    expect(card).toEqual({ id: 3, title: 'Ship v2', status: 'todo' });
    expect(deleteCard(cols(), 99).card).toBeNull();
  });

  it('updates a card in place, and moves it when its status changes', () => {
    let { columns, card } = updateCard(cols(), 1, { title: 'Fix sign-in' }, 'status', 'id');
    expect(ids(columns, 'todo')).toEqual([1, 3]);
    expect(card.title).toBe('Fix sign-in');
    ({ columns, card } = updateCard(cols(), 1, { status: 'done' }, 'status', 'id'));
    expect(ids(columns, 'todo')).toEqual([3]);
    expect(ids(columns, 'done')).toEqual([4, 1]);
    expect(updateCard(cols(), 99, { title: 'x' }, 'status', 'id').card).toBeNull();
  });

  it('lists the board as plain cards in board order', () => {
    const { columns } = moveCard(cols(), 2, 'todo', 3, 'status');
    expect(boardCards(columns).map((c) => [c.id, c.status])).toEqual([
      [1, 'todo'],
      [2, 'todo'],
      [3, 'todo'],
      [4, 'done'],
    ]);
    expect(boardCards(columns)[0].__key).toBeUndefined();
  });
});

describe('cardClamp', () => {
  it('does not collapse without a collapsed height, or when the content already fits', () => {
    expect(cardClamp('', 200, false)).toEqual({ collapsible: false, maxHeight: undefined });
    expect(cardClamp(120, 110, false)).toEqual({ collapsible: false, maxHeight: undefined });
  });

  it('clamps taller content to the collapsed height until the card is expanded', () => {
    expect(cardClamp(80, 200, false)).toEqual({ collapsible: true, maxHeight: 80 });
    expect(cardClamp('80', 200, true)).toEqual({ collapsible: true, maxHeight: undefined });
  });

  it('ignores a few pixels of overflow, which a toggle would only hide', () => {
    expect(cardClamp(80, 84, false).collapsible).toBe(false);
  });
});
