import { addCard, boardCards, boardColumns, deleteCard, moveCard, updateCard } from '../../kanbanBoard';
import { kanbanCollision } from '../../ShadKanban';
import { defaultsOf, installGuards, mountCase, problemsOf, styleDefaultsOf } from './harness';

// The Kanban under drag and drop and board actions in any order (a user crashed it "dragging here and there").
installGuards();

const keysOf = (columns) => columns.flatMap((c) => c.cards.map((card) => card.__key));
const unique = (list) => new Set(list).size === list.length;

describe('board model', () => {
  it('gives every card its own drag key, whatever the ids', () => {
    const cards = [
      { id: 1, status: 'a' },
      { id: 1, status: 'b' },
      { id: '1', status: 'a' },
      { id: '', status: 'a' },
      { id: '', status: 'a' },
      { id: null, status: 'b' },
      'just text',
      42,
      null,
    ];
    const columns = boardColumns(cards, ['a', 'b'], 'status', 'id');
    expect(unique(keysOf(columns))).toBe(true);
    expect(boardCards(columns)).toHaveLength(9);
    expect(boardCards(columns).some((c) => '0' in c)).toBe(false);
  });

  it('a card added with an id already on the board still gets its own key', () => {
    const columns = boardColumns([{ id: 7, status: 'a' }], ['a'], 'status', 'id');
    const next = addCard(columns, { id: 7, title: 'again' }, 'a', 'status', 'id').columns;
    expect(unique(keysOf(next))).toBe(true);
  });

  it('ignores card and values that are not objects', () => {
    const columns = boardColumns([{ id: 1, status: 'a' }], ['a'], 'status', 'id');
    const added = addCard(columns, 'oops', 'a', 'status', 'id');
    expect(Object.keys(added.card)).toEqual(['id', 'status']);
    const updated = updateCard(columns, 1, 'oops', 'status', 'id');
    expect(updated.card).toEqual({ id: 1, status: 'a' });
  });

  it('survives 3000 random moves, adds, updates and deletes: no throw, no lost or doubled card, keys unique', () => {
    let seed = 7;
    const rand = (n) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    const statuses = ['todo', 'doing', 'done', 'gone'];
    const rows = Array.from({ length: 40 }, (_, i) => ({ id: i % 13 === 0 ? '' : i % 7, status: statuses[i % 3] }));
    let columns = boardColumns(rows, ['todo', 'doing', 'done'], 'status', 'id');
    let count = boardCards(columns).length;
    const junk = [undefined, null, '', 'nope', 1e9, {}, [], -1];
    for (let step = 0; step < 3000; step += 1) {
      const keys = keysOf(columns);
      const anyKey = () => (rand(10) === 0 ? junk[rand(junk.length)] : keys[rand(keys.length)]);
      const anyColumn = () => (rand(10) === 0 ? junk[rand(junk.length)] : statuses[rand(statuses.length)]);
      const op = rand(4);
      if (op === 0) {
        const before = rand(3) === 0 ? null : anyKey();
        columns = moveCard(columns, anyKey(), anyColumn(), before, 'status').columns;
      } else if (op === 1) {
        const result = addCard(
          columns,
          rand(4) ? { id: rand(5), status: anyColumn() } : junk[rand(junk.length)],
          undefined,
          'status',
          'id'
        );
        columns = result.columns;
        count += 1;
      } else if (op === 2) {
        columns = updateCard(
          columns,
          anyKey(),
          rand(3) ? { status: anyColumn(), title: 'x' } : junk[rand(junk.length)],
          'status',
          'id'
        ).columns;
      } else {
        const result = deleteCard(columns, anyKey());
        if (result.card) count -= 1;
        columns = result.columns;
      }
      expect(unique(keysOf(columns))).toBe(true);
      expect(boardCards(columns)).toHaveLength(count);
    }
  });
});

describe('drop target', () => {
  const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
  const container = (id, data) => ({ id, data: { current: data } });

  it('a drop on a folded column lands in it, even with a card corner nearer', () => {
    const containers = [
      container('col-folded', { type: 'column', columnId: 'folded' }),
      container('drop-c1', { type: 'card', key: 'c1', columnId: 'open' }),
    ];
    const droppableRects = new Map([
      ['col-folded', rect(300, 0, 44, 600)],
      ['drop-c1', rect(100, 0, 190, 80)],
    ]);
    const hits = kanbanCollision({
      active: { id: 'c9' },
      collisionRect: rect(250, 0, 190, 80),
      droppableRects,
      droppableContainers: containers,
      pointerCoordinates: { x: 320, y: 300 },
    });
    expect(hits[0].id).toBe('col-folded');
  });

  it('prefers a card under the pointer to its column, and falls back to the nearest off the board', () => {
    const containers = [
      container('col-open', { type: 'column', columnId: 'open' }),
      container('drop-c1', { type: 'card', key: 'c1', columnId: 'open' }),
    ];
    const droppableRects = new Map([
      ['col-open', rect(100, 0, 200, 600)],
      ['drop-c1', rect(105, 10, 190, 80)],
    ]);
    const args = {
      active: { id: 'c9' },
      collisionRect: rect(110, 20, 190, 80),
      droppableRects,
      droppableContainers: containers,
    };
    expect(kanbanCollision({ ...args, pointerCoordinates: { x: 150, y: 40 } })[0].id).toBe('drop-c1');
    expect(kanbanCollision({ ...args, pointerCoordinates: { x: 2000, y: 2000 } }).length).toBeGreaterThan(0);
    expect(kanbanCollision({ ...args, pointerCoordinates: null }).length).toBeGreaterThan(0);
  });
});

describe('reloading', () => {
  const data = [
    { id: 1, title: 'Card one', status: 'todo' },
    { id: 2, title: 'Card two', status: 'done' },
  ];
  const mount = (properties) =>
    mountCase({
      name: 'ShadKanban',
      properties: { ...defaultsOf('ShadKanban'), ...properties },
      styles: styleDefaultsOf('ShadKanban'),
    });

  it('keeps a board with cards on screen under a spinner while loading (a refetch after a move)', async () => {
    const { stats, unmount } = await mount({ data, columns: ['todo', 'done'], loadingState: true });
    expect(document.querySelectorAll('[data-collapsed]')).toHaveLength(2);
    expect(document.body.textContent).toContain('Card one');
    expect(document.querySelector('[aria-busy="true"] [role=status]')).toBeTruthy();
    expect(document.querySelector('[aria-roledescription=draggable][aria-disabled="true"]')).toBeTruthy();
    unmount();
    expect(problemsOf(stats)).toEqual([]);
  });

  it('shows the loading look before the first cards arrive', async () => {
    const { stats, unmount } = await mount({ data: [], loadingState: true });
    expect(document.querySelectorAll('[data-collapsed]')).toHaveLength(0);
    expect(document.querySelector('[role=status]')).toBeTruthy();
    unmount();
    expect(problemsOf(stats)).toEqual([]);
  });
});
