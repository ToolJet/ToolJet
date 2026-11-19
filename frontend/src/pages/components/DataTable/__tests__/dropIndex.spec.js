/**
 * @jest-environment node
 */
import { getDropIndex } from '../dropIndex';

const IDS = ['a', 'b', 'c', 'd'];

describe('getDropIndex', () => {
  test.each([
    ['above an earlier row', 'c', 'a', 'before', 0],
    ['below an earlier row', 'c', 'a', 'after', 1],
    ['above a later row', 'a', 'c', 'before', 1],
    ['below a later row', 'a', 'c', 'after', 2],
    ['below the last row', 'a', 'd', 'after', 3],
    ['above the first row', 'd', 'a', 'before', 0],
  ])('moves a row dropped %s', (_, activeId, overId, side, expected) => {
    expect(getDropIndex(IDS, activeId, overId, side)).toBe(expected);
  });

  test.each([
    ['onto itself (upper half)', 'b', 'b', 'before'],
    ['onto itself (lower half)', 'b', 'b', 'after'],
    ['below the row just above it', 'b', 'a', 'after'],
    ['above the row just below it', 'b', 'c', 'before'],
  ])('returns null when dropped %s, since the order would not change', (_, activeId, overId, side) => {
    expect(getDropIndex(IDS, activeId, overId, side)).toBeNull();
  });

  test('returns null when either row is not a reorderable row', () => {
    expect(getDropIndex(IDS, 'x', 'a', 'before')).toBeNull();
    expect(getDropIndex(IDS, 'a', 'x', 'before')).toBeNull();
  });
});
