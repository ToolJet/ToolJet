import { getFilterableColumns, createDefaultFilter, describeFilter, moveFilter } from '../filterConfigUtils';

const columns = [
  { id: 'c-name', name: 'Name', columnType: 'string' },
  { id: 'c-open', name: 'Open', columnType: 'button' },
  { id: 'c-status', name: 'Status', columnType: 'select' },
  { id: 'c-age', name: 'Age', columnType: 'number' },
];

describe('Table-FILTERUI-011 columns a default filter can use', () => {
  test('Table-FILTERUI-011 button columns are left out and the order is kept', () => {
    // Break this catches: a button column offered in the list, which the table cannot filter on.
    expect(getFilterableColumns(columns).map((column) => column.id)).toEqual(['c-name', 'c-status', 'c-age']);
  });

  test('Table-FILTERUI-011 no columns, or something that is not a list, gives none', () => {
    // Break this catches: a table without columns crashing the popup.
    expect(getFilterableColumns(undefined)).toEqual([]);
    expect(getFilterableColumns(null)).toEqual([]);
  });
});

describe('Table-FILTERUI-010 a new default filter', () => {
  test('Table-FILTERUI-010 starts on the first filterable column with contains and no value', () => {
    // Break this catches: a new filter on a button column, or one that is already half filled in.
    expect(createDefaultFilter(columns)).toEqual({
      id: expect.any(String),
      column: 'c-name',
      condition: 'contains',
      value: '',
    });
  });

  test('Table-FILTERUI-010 every new filter gets its own id', () => {
    // Break this catches: two filters sharing an id, so editing one edits both.
    expect(createDefaultFilter(columns).id).not.toBe(createDefaultFilter(columns).id);
  });

  test('Table-FILTERUI-010 a table with nothing to filter on gives no filter', () => {
    // Break this catches: a filter pointing at a column that does not exist.
    expect(createDefaultFilter([{ id: 'c-open', name: 'Open', columnType: 'button' }])).toBeNull();
  });
});

describe('Table-FILTERUI-011 the title of a default filter', () => {
  test('Table-FILTERUI-011 reads the column and the operator, ending in an ellipsis while a value is expected', () => {
    // Break this catches: a title that does not follow the choices.
    expect(describeFilter({ column: 'c-status', condition: 'equals' }, columns)).toBe('Status equals…');
    expect(describeFilter({ column: 'c-age', condition: 'gte' }, columns)).toBe('Age greater than or equals…');
  });

  test('Table-FILTERUI-011 is empty and is not empty need no value, so there is no ellipsis', () => {
    // Break this catches: an ellipsis promising a value that is never asked for.
    expect(describeFilter({ column: 'c-age', condition: 'isEmpty' }, columns)).toBe('Age is empty');
    expect(describeFilter({ column: 'c-age', condition: 'isNotEmpty' }, columns)).toBe('Age is not empty');
  });

  test('Table-FILTERUI-011 a column that no longer exists still gets a title', () => {
    // Break this catches: a deleted column leaving "undefined contains…" in the popup.
    expect(describeFilter({ column: 'c-gone', condition: 'contains' }, columns)).toBe('Column contains…');
  });
});

describe('Table-FILTERUI-013 reordering default filters', () => {
  const list = ['a', 'b', 'c', 'd'];

  test('Table-FILTERUI-013 moves one filter to its new place and keeps the others in order', () => {
    // Break this catches: a drag that swaps instead of moving, or drops a filter.
    expect(moveFilter(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveFilter(list, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  test('Table-FILTERUI-013 the list given is not changed', () => {
    // Break this catches: mutating the saved list in place.
    moveFilter(list, 0, 2);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
  });

  test('Table-FILTERUI-013 a move to the same place, or outside the list, changes nothing', () => {
    // Break this catches: a drop outside the list losing the filter.
    expect(moveFilter(list, 1, 1)).toEqual(list);
    expect(moveFilter(list, 1, 9)).toEqual(list);
    expect(moveFilter(list, -1, 2)).toEqual(list);
  });
});
