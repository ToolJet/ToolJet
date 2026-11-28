import { cellNavigationReducer, scrollLeftToReveal, type CellNavState } from '../cellNavigation';

const dims = { rowCount: 3, columnIds: ['id', 'title', 'views'] };
const at = (rowIndex: number, columnId: string, editing = false): CellNavState => ({ rowIndex, columnId, editing });

describe('cellNavigationReducer | focus', () => {
  it('focuses the clicked cell', () => {
    expect(cellNavigationReducer(null, { type: 'focus', rowIndex: 1, columnId: 'title' })).toEqual(at(1, 'title'));
  });

  it('leaves the editor open when the focused cell is clicked again', () => {
    const state = at(1, 'title', true);

    expect(cellNavigationReducer(state, { type: 'focus', rowIndex: 1, columnId: 'title' })).toBe(state);
  });

  it('closes the editor when another cell is clicked', () => {
    expect(cellNavigationReducer(at(1, 'title', true), { type: 'focus', rowIndex: 2, columnId: 'title' })).toEqual(
      at(2, 'title')
    );
  });
});

describe('cellNavigationReducer | arrows', () => {
  it.each([
    ['up', at(1, 'title'), at(0, 'title')],
    ['down', at(1, 'title'), at(2, 'title')],
    ['left', at(1, 'title'), at(1, 'id')],
    ['right', at(1, 'title'), at(1, 'views')],
  ] as const)('moves %s', (direction, from, to) => {
    expect(cellNavigationReducer(from, { type: 'move', direction, ...dims })).toEqual(to);
  });

  it.each([
    ['up', at(0, 'title')],
    ['down', at(2, 'title')],
    ['left', at(1, 'id')],
    ['right', at(1, 'views')],
  ] as const)('stays put at the %s edge', (direction, from) => {
    expect(cellNavigationReducer(from, { type: 'move', direction, ...dims })).toBe(from);
  });

  it('starts at the first cell when nothing is focused', () => {
    expect(cellNavigationReducer(null, { type: 'move', direction: 'down', ...dims })).toEqual(at(0, 'id'));
  });

  it('focuses nothing in a grid without rows or columns', () => {
    expect(cellNavigationReducer(null, { type: 'move', direction: 'down', rowCount: 0, columnIds: ['id'] })).toBeNull();
    expect(cellNavigationReducer(null, { type: 'move', direction: 'down', rowCount: 2, columnIds: [] })).toBeNull();
  });

  it('does not move while a cell is being edited', () => {
    const state = at(1, 'title', true);

    expect(cellNavigationReducer(state, { type: 'move', direction: 'down', ...dims })).toBe(state);
  });
});

describe('cellNavigationReducer | tab', () => {
  it('moves right on Tab and left on Shift+Tab', () => {
    expect(cellNavigationReducer(at(1, 'id'), { type: 'tab', backwards: false, ...dims })).toEqual(at(1, 'title'));
    expect(cellNavigationReducer(at(1, 'views'), { type: 'tab', backwards: true, ...dims })).toEqual(at(1, 'title'));
  });

  it('returns the same state at the edge, so the caller can let Tab leave the grid', () => {
    const last = at(1, 'views');
    const first = at(1, 'id');

    expect(cellNavigationReducer(last, { type: 'tab', backwards: false, ...dims })).toBe(last);
    expect(cellNavigationReducer(first, { type: 'tab', backwards: true, ...dims })).toBe(first);
  });
});

describe('cellNavigationReducer | editing', () => {
  it('starts editing the focused cell', () => {
    expect(cellNavigationReducer(at(1, 'title'), { type: 'startEditing' })).toEqual(at(1, 'title', true));
  });

  it('starts nothing without a focused cell', () => {
    expect(cellNavigationReducer(null, { type: 'startEditing' })).toBeNull();
  });

  it('cancels editing on Escape and keeps the cell focused', () => {
    expect(cellNavigationReducer(at(1, 'title', true), { type: 'escape' })).toEqual(at(1, 'title'));
  });

  it('clears the focus on Escape when not editing', () => {
    expect(cellNavigationReducer(at(1, 'title'), { type: 'escape' })).toBeNull();
  });

  it('stops editing and keeps the cell focused', () => {
    expect(cellNavigationReducer(at(1, 'title', true), { type: 'stopEditing' })).toEqual(at(1, 'title'));
  });
});

describe('scrollLeftToReveal', () => {
  const view = { viewportWidth: 600, pinnedWidth: 160, trailingWidth: 0 };

  it('keeps the position when the cell is already visible', () => {
    expect(scrollLeftToReveal({ ...view, cellStart: 500, cellWidth: 100, scrollLeft: 300 })).toBeNull();
  });

  it('scrolls left so the cell clears the pinned columns', () => {
    expect(scrollLeftToReveal({ ...view, cellStart: 300, cellWidth: 100, scrollLeft: 300 })).toBe(140);
  });

  it('scrolls right so the cell ends at the viewport edge', () => {
    expect(scrollLeftToReveal({ ...view, cellStart: 800, cellWidth: 200, scrollLeft: 300 })).toBe(400);
  });

  it('leaves room for the sticky add column cell', () => {
    expect(scrollLeftToReveal({ ...view, trailingWidth: 45, cellStart: 800, cellWidth: 200, scrollLeft: 300 })).toBe(
      445
    );
  });
});
