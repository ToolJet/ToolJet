import { toSortingState } from '../sortState';

describe('toSortingState', () => {
  it('maps applied rules to TanStack sorting entries', () => {
    expect(
      toSortingState({
        '0': { column: 'tag', order: 'asc' },
        '1': { column: 'title', order: 'desc' },
      })
    ).toEqual([
      { id: 'tag', desc: false },
      { id: 'title', desc: true },
    ]);
  });

  it('keeps the order of the keys when some are missing after a delete', () => {
    expect(
      toSortingState({
        '0': { column: 'tag', order: 'asc' },
        '2': { column: 'title', order: 'desc' },
        '5': { column: 'id', order: 'asc' },
      }).map(({ id }) => id)
    ).toEqual(['tag', 'title', 'id']);
  });

  it('skips rules that are not complete', () => {
    expect(
      toSortingState({
        '0': { column: 'tag' },
        '1': { order: 'asc' },
        '2': { column: '', order: 'asc' },
        '3': { column: 'title', order: 'desc' },
      })
    ).toEqual([{ id: 'title', desc: true }]);
  });

  it('numbers a column by its first rule only, as the database orders by it', () => {
    expect(
      toSortingState({
        '0': { column: 'id', order: 'asc' },
        '1': { column: 'id', order: 'desc' },
        '2': { column: 'counter', order: 'asc' },
      })
    ).toEqual([
      { id: 'id', desc: false },
      { id: 'counter', desc: false },
    ]);
  });

  it('is empty when nothing is applied', () => {
    expect(toSortingState({})).toEqual([]);
    expect(toSortingState(undefined)).toEqual([]);
  });
});
