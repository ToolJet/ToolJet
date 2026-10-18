import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import {
  addCard,
  boardCards,
  boardColumns,
  cardClamp,
  cardDateLabel,
  cardDetails,
  deleteCard,
  moveCard,
  updateCard,
} from '@/AppBuilder/Widgets/Ui2/Kanban/kanbanBoard';

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

describe('duplicate ids', () => {
  // Audit finding 54: each duplicate probed its suffixes from ~2 again, so n cards sharing an id cost n(n+1)/2 key
  // checks before the board drew (2,001,000 for 2,000 cards).
  it('get unique keys in linear work', () => {
    const cards = Array.from({ length: 2000 }, (_, i) => ({ id: 'same', status: i % 2 ? 'todo' : 'done' }));
    const has = jest.spyOn(Set.prototype, 'has');
    const columns = boardColumns(cards, [], 'status', 'id');
    const probes = has.mock.calls.length;
    has.mockRestore();
    const keys = columns.flatMap((c) => c.cards.map((card) => card.__key));
    expect(new Set(keys).size).toBe(2000);
    expect(keys).toContain('same');
    expect(probes).toBeLessThan(3 * 2000);
  });

  it('skip a suffix the data already uses', () => {
    const columns = boardColumns(
      [{ id: 'a' }, { id: 'a~2' }, { id: 'a' }, { id: 'a' }].map((card) => ({ ...card, status: 'todo' })),
      [],
      'status',
      'id'
    );
    expect(columns[0].cards.map((card) => card.__key)).toEqual(['a', 'a~2', 'a~3', 'a~4']);
  });
});

describe('moveCard', () => {
  const cols = () => boardColumns(cards, ['todo', 'doing', 'done'], 'status', 'id');

  it('moves a card to the end of another column when dropped on the column', () => {
    const { columns, move } = moveCard(cols(), 1, 'done', null, 'status', 'id');
    expect(columns.find((c) => c.id === 'done').cards.map((x) => x.id)).toEqual([4, 1]);
    expect(columns.find((c) => c.id === 'todo').cards.map((x) => x.id)).toEqual([3]);
    expect(move).toMatchObject({ cardId: 1, from: 'todo', to: 'done', toIndex: 1 });
    expect(move.card.status).toBe('done');
  });

  it('inserts before the card it was dropped on', () => {
    const { columns, move } = moveCard(cols(), 2, 'todo', 3, 'status', 'id');
    expect(columns.find((c) => c.id === 'todo').cards.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(move.toIndex).toBe(1);
  });

  it('reorders within a column', () => {
    const { columns, move } = moveCard(cols(), 3, 'todo', 1, 'status', 'id');
    expect(columns.find((c) => c.id === 'todo').cards.map((x) => x.id)).toEqual([3, 1]);
    expect(move).toMatchObject({ from: 'todo', to: 'todo', toIndex: 0 });
  });

  // Apps and agents bind the native Kanban's names (cardDetails.id, destinationColumnId); without them a save on
  // onCardMoved matched no row and still reported success (Luna builds, 18 Oct).
  it("also carries the native Kanban's names for the move", () => {
    const { move } = moveCard(cols(), 1, 'done', null, 'status', 'id');
    expect(move).toMatchObject({
      originColumnId: 'todo',
      destinationColumnId: 'done',
      originCardIndex: 0,
      destinationIndex: 1,
      cardDetails: { id: 1, title: 'Fix login', status: 'done' },
    });
    expect(move.cardDetails).toEqual(move.card);
  });

  it('returns nothing to do for a drop where the card already is', () => {
    expect(moveCard(cols(), 4, 'done', null, 'status', 'id').move).toBeNull();
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
    const { columns } = moveCard(cols(), 2, 'todo', 3, 'status', 'id');
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

describe('cardDetails', () => {
  it('lists an object as label and value rows, in key order, skipping empty values', () => {
    expect(cardDetails({ 'Deal size': '$24,000', Owner: '', 'Last note': 'Asked about reporting' })).toEqual([
      { label: 'Deal size', value: '$24,000' },
      { label: 'Last note', value: 'Asked about reporting' },
    ]);
  });

  it('takes a list of { label, value } rows, or plain text as one unlabelled row', () => {
    expect(cardDetails([{ label: 'Budget', value: 5000 }, { label: 'Empty' }])).toEqual([
      { label: 'Budget', value: '5000' },
    ]);
    expect(cardDetails('Called on Monday')).toEqual([{ label: '', value: 'Called on Monday' }]);
  });

  it('shows nothing for missing details and caps a huge object at 12 rows', () => {
    expect(cardDetails(undefined)).toEqual([]);
    expect(cardDetails(null)).toEqual([]);
    const big = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i]));
    expect(cardDetails(big)).toHaveLength(12);
  });

  it('shows a stored date among the details as a short date', () => {
    const year = new Date().getFullYear();
    expect(cardDetails({ 'Last contact': `${year}-10-10` })).toEqual([{ label: 'Last contact', value: 'Oct 10' }]);
  });

  it('turns nested values into text instead of crashing', () => {
    expect(cardDetails({ Items: ['a', 'b'], Meta: { x: 1 } })).toEqual([
      { label: 'Items', value: 'a, b' },
      { label: 'Meta', value: '{"x":1}' },
    ]);
  });
});

describe('cardDetails with a value that contains itself', () => {
  it('stops at a few levels instead of overflowing the stack', () => {
    const loop = ['a'];
    loop.push(loop);
    expect(() => cardDetails({ Loop: loop })).not.toThrow();
    expect(cardDetails({ Loop: loop })[0].label).toBe('Loop');
  });
});

describe('cardDateLabel', () => {
  // Kanban cards showed raw stored dates ("2026-10-14T00:00:00.000Z" wrapped over three lines): a value that is a whole
  // ISO date or timestamp reads as a short date, with the year only when it is not this year.
  const now = new Date(2026, 9, 12);
  it('shows a date this year as month and day', () => {
    expect(cardDateLabel('2026-10-14', now)).toBe('Oct 14');
    expect(cardDateLabel('2026-10-14T15:30:00.000Z', now)).toMatch(/^Oct 1[45]$/);
  });

  it('adds the year for another year', () => {
    expect(cardDateLabel('2025-03-02', now)).toBe('Mar 2, 2025');
  });

  it('leaves everything else alone', () => {
    expect(cardDateLabel('Follow-up Oct 14', now)).toBeNull();
    expect(cardDateLabel('2026-13-40', now)).toBeNull();
    expect(cardDateLabel(42, now)).toBeNull();
    expect(cardDateLabel(null, now)).toBeNull();
  });
});
