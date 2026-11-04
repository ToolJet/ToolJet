/**
 * @jest-environment node
 */
import { canReorderPins, getDropIndex, movePinnedItem } from '../pinOrder';

const PINNED_IDS = ['a', 'b', 'c', 'd'];

describe('getDropIndex', () => {
  test.each([
    ['above an earlier row', 'c', 'a', 'before', 0],
    ['below an earlier row', 'c', 'a', 'after', 1],
    ['above a later row', 'a', 'c', 'before', 1],
    ['below a later row', 'a', 'c', 'after', 2],
    ['below the last row', 'a', 'd', 'after', 3],
    ['above the first row', 'd', 'a', 'before', 0],
  ])('moves a row dropped %s', (_, activeId, overId, side, expected) => {
    expect(getDropIndex(PINNED_IDS, activeId, overId, side)).toBe(expected);
  });

  test.each([
    ['onto itself (upper half)', 'b', 'b', 'before'],
    ['onto itself (lower half)', 'b', 'b', 'after'],
    ['below the row just above it', 'b', 'a', 'after'],
    ['above the row just below it', 'b', 'c', 'before'],
  ])('returns null when dropped %s, since the order would not change', (_, activeId, overId, side) => {
    expect(getDropIndex(PINNED_IDS, activeId, overId, side)).toBeNull();
  });

  test('returns null when either row is not a pinned row', () => {
    expect(getDropIndex(PINNED_IDS, 'x', 'a', 'before')).toBeNull();
    expect(getDropIndex(PINNED_IDS, 'a', 'x', 'before')).toBeNull();
  });
});

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
