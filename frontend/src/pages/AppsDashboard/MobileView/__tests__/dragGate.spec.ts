import { canDragPinnedItems } from '../helpers/groupItems';
import { makeApp, makePage } from './fixtures';

const pinnedApps = (n: number) => Array.from({ length: n }, (_, i) => makeApp(`p${i}`, { pinned: true }));

describe('canDragPinnedItems', () => {
  test('allows drag when every pin is loaded and there is more than one', () => {
    const pinned = pinnedApps(3);

    expect(canDragPinnedItems({ searchQuery: '', pinned, pinnedTotal: 3 })).toBe(true);
  });

  test('blocks drag while searching', () => {
    expect(canDragPinnedItems({ searchQuery: 'x', pinned: pinnedApps(3), pinnedTotal: 3 })).toBe(false);
  });

  test('blocks drag with a single pin', () => {
    expect(canDragPinnedItems({ searchQuery: '', pinned: pinnedApps(1), pinnedTotal: 1 })).toBe(false);
  });

  test('blocks drag until every pin is loaded', () => {
    expect(canDragPinnedItems({ searchQuery: '', pinned: pinnedApps(2), pinnedTotal: 3 })).toBe(false);
  });

  test('counts only items carrying the pinned flag', () => {
    const { items } = makePage([...pinnedApps(1), makeApp('x')]);

    expect(canDragPinnedItems({ searchQuery: '', pinned: items, pinnedTotal: 2 })).toBe(false);
  });
});
