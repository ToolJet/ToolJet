import { toToolbarFilters, splitFilters } from '../dataToolbarFilters';

describe('toToolbarFilters', () => {
  it('words a text filter as column, operator label and a quoted value', () => {
    expect(toToolbarFilters({ 0: { column: 'title', operator: 'eq', value: 'feature' } })).toEqual([
      { id: '0', label: 'title equals "feature"' },
    ]);
  });

  it('leaves a numeric value unquoted', () => {
    expect(toToolbarFilters({ 0: { column: 'id', operator: 'gt', value: '20' } })[0].label).toBe('id greater than 20');
  });

  it('falls back to the raw operator when it has no label', () => {
    expect(toToolbarFilters({ 0: { column: 'a', operator: 'fts', value: 'x' } })[0].label).toBe('a fts "x"');
  });

  it('skips filters that are not complete yet', () => {
    expect(
      toToolbarFilters({
        0: { column: 'a', operator: 'eq', value: '' },
        1: {},
        2: { column: 'b', operator: 'eq', value: 'y' },
      }).map((filter) => filter.id)
    ).toEqual(['2']);
  });

  it('keeps the store key as the id, in key order', () => {
    expect(
      toToolbarFilters({
        3: { column: 'c', operator: 'eq', value: '1' },
        1: { column: 'a', operator: 'eq', value: '1' },
      }).map((filter) => filter.id)
    ).toEqual(['1', '3']);
  });

  it('returns nothing for no filters', () => {
    expect(toToolbarFilters({})).toEqual([]);
  });
});

describe('splitFilters', () => {
  const items = ['a', 'b', 'c', 'd'];

  it('shows everything that fits', () => {
    expect(splitFilters(items, 4)).toEqual({ visible: items, overflow: [] });
    expect(splitFilters(items, 10)).toEqual({ visible: items, overflow: [] });
  });

  it('collapses the rest once past the limit', () => {
    expect(splitFilters(items, 2)).toEqual({ visible: ['a', 'b'], overflow: ['c', 'd'] });
  });

  it('collapses a single extra filter too', () => {
    expect(splitFilters(['a', 'b', 'c'], 2)).toEqual({ visible: ['a', 'b'], overflow: ['c'] });
  });
});
