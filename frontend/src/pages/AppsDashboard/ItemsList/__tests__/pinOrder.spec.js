/**
 * @jest-environment node
 */
import { canReorderPins, movePinnedItem } from '../pinOrder';

describe('canReorderPins', () => {
  const FULL_SET = { searchQuery: '', currentPage: 1, pinnedRowCount: 3, pinnedTotal: 3 };

  test('allows reordering when every pin is on the unsearched first page', () => {
    expect(canReorderPins(FULL_SET)).toBe(true);
  });

  test.each([
    ['a search is active', { searchQuery: 'inv' }],
    ['past the first page', { currentPage: 2 }],
    ['some pins are not loaded', { pinnedRowCount: 2 }],
    ['only one pin exists', { pinnedRowCount: 1, pinnedTotal: 1 }],
  ])('blocks reordering when %s', (_, override) => {
    expect(canReorderPins({ ...FULL_SET, ...override })).toBe(false);
  });

  test('ignores a whitespace-only search', () => {
    expect(canReorderPins({ ...FULL_SET, searchQuery: '  ' })).toBe(true);
  });
});

describe('movePinnedItem', () => {
  const item = (id, pinned) => ({ id, pinned });
  const ids = (items) => items.map((listItem) => listItem.id);

  test('moves a pinned item within the pinned rows and leaves unpinned rows in place', () => {
    const items = [item('a', true), item('b', true), item('c', true), item('x', false), item('y', false)];

    expect(ids(movePinnedItem(items, 0, 2))).toEqual(['b', 'c', 'a', 'x', 'y']);
    expect(ids(movePinnedItem(items, 2, 0))).toEqual(['c', 'a', 'b', 'x', 'y']);
  });
});
