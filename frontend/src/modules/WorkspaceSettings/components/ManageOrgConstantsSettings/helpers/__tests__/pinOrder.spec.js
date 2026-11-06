/**
 * @jest-environment node
 */
import { canReorderPins, compareConstants, getDropIndex, insertPins, movePinnedId, orderRows } from '../pinOrder';

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
  const OPEN = { searchKey: '', isSourceFiltered: false, pinnedRowCount: 2 };

  test('allows reordering with no search, no source filter and two pinned rows', () => {
    expect(canReorderPins(OPEN)).toBe(true);
  });

  test.each([
    ['a search is active', { searchKey: 'api' }],
    ['a source filter is active', { isSourceFiltered: true }],
    ['only one row is pinned', { pinnedRowCount: 1 }],
    ['no row is pinned', { pinnedRowCount: 0 }],
  ])('blocks reordering when %s', (_, override) => {
    expect(canReorderPins({ ...OPEN, ...override })).toBe(false);
  });

  test('ignores a whitespace-only search', () => {
    expect(canReorderPins({ ...OPEN, searchKey: '   ' })).toBe(true);
  });
});

const item = (id, name = id.toUpperCase(), last_modified_at = null, source = 'workspace') => ({
  id,
  name,
  last_modified_at,
  source,
});

describe('orderRows', () => {
  const items = [item('a'), item('b'), item('c'), item('d')];

  test('lists pinned rows first in pin order, then the rest in server order', () => {
    const { rows, pinnedCount } = orderRows(items, ['c', 'a']);
    expect(rows.map(({ id }) => id)).toEqual(['c', 'a', 'b', 'd']);
    expect(pinnedCount).toBe(2);
  });

  test('ignores pins that are not on the loaded page', () => {
    const { rows, pinnedCount } = orderRows(items, ['gone', 'b']);
    expect(rows.map(({ id }) => id)).toEqual(['b', 'a', 'c', 'd']);
    expect(pinnedCount).toBe(1);
  });

  test('leaves the server order alone with no pins', () => {
    expect(orderRows(items, []).rows).toEqual(items);
  });
});

describe('compareConstants', () => {
  const sorted = (sort, list) => [...list].sort(compareConstants(sort)).map(({ id }) => id);
  const list = [
    item('1', 'banana', '2026-01-02T00:00:00Z'),
    item('2', 'Apple', '2026-03-01T00:00:00Z'),
    item('3', 'cherry', null),
    item('4', 'apple', '2026-02-01T00:00:00Z'),
  ];

  test('name_asc and name_desc compare names, falling back to id', () => {
    expect(sorted('name_asc', list)).toEqual(['2', '4', '1', '3']);
    expect(sorted('name_desc', list)).toEqual(['3', '1', '2', '4']);
  });

  test('modified_desc puts the newest first and rows without a date last', () => {
    expect(sorted('modified_desc', list)).toEqual(['2', '4', '1', '3']);
  });

  test('modified_asc puts the oldest first and rows without a date last', () => {
    expect(sorted('modified_asc', list)).toEqual(['1', '4', '2', '3']);
  });
});

describe('insertPins', () => {
  const items = [
    item('a', 'Alpha', '2026-01-01T00:00:00Z'),
    item('c', 'Charlie', '2026-03-01T00:00:00Z'),
    item('e', 'Echo', '2026-02-01T00:00:00Z'),
    item('b', 'Bravo', '2026-04-01T00:00:00Z'),
    item('d', 'Delta', '2026-05-01T00:00:00Z'),
  ];

  test('inserts before the first pin that sorts after it under the current sort', () => {
    expect(insertPins(['a', 'c', 'e'], items, ['d'], 'name_asc')).toEqual(['a', 'c', 'd', 'e']);
    expect(insertPins(['e', 'c', 'a'], items, ['d'], 'name_desc')).toEqual(['e', 'd', 'c', 'a']);
    expect(insertPins(['c', 'a'], items, ['e'], 'modified_desc')).toEqual(['c', 'e', 'a']);
  });

  test('appends when no pin sorts after it', () => {
    expect(insertPins(['a', 'c'], items, ['e'], 'name_asc')).toEqual(['a', 'c', 'e']);
  });

  test('skips pins that are not on the loaded page when comparing', () => {
    expect(insertPins(['gone', 'e'], items, ['b'], 'name_asc')).toEqual(['gone', 'b', 'e']);
  });

  test('inserts several ids one at a time in sort order, whatever order they were given', () => {
    expect(insertPins(['c'], items, ['e', 'a', 'd'], 'name_asc')).toEqual(['a', 'c', 'd', 'e']);
  });

  test('is a no-op for ids that are already pinned', () => {
    const pins = ['c', 'a'];
    expect(insertPins(pins, items, ['a', 'c'], 'name_asc')).toEqual(['c', 'a']);
  });

  test('skips environment constants and ids missing from the page', () => {
    const withEnv = [...items, item('env:Global:X', 'X', null, 'env')];
    expect(insertPins([], withEnv, ['env:Global:X', 'nope'], 'name_asc')).toEqual([]);
  });

  test('does not mutate the pins it was given', () => {
    const pins = ['a'];
    insertPins(pins, items, ['b'], 'name_asc');
    expect(pins).toEqual(['a']);
  });
});

describe('movePinnedId', () => {
  test('moves a pin among the loaded pins', () => {
    expect(movePinnedId(['a', 'b', 'c'], ['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a']);
  });

  test('keeps pins from other pages in their slots', () => {
    expect(movePinnedId(['a', 'off', 'b', 'c'], ['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'off', 'c', 'a']);
  });

  test('returns the pins unchanged for an unknown id or an unchanged index', () => {
    const pins = ['a', 'b'];
    expect(movePinnedId(pins, ['a', 'b'], 'x', 0)).toBe(pins);
    expect(movePinnedId(pins, ['a', 'b'], 'a', 0)).toBe(pins);
  });
});
