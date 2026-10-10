import { boardColumns, moveCard } from '../kanbanBoard';

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
