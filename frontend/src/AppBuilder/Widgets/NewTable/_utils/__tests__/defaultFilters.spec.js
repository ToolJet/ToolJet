import { getDefaultColumnFilters } from '../defaultFilters';

const columns = [
  { id: 'c-name', header: 'Name' },
  { id: 'c-role', header: 'Role' },
];

describe('Table-FILTERUI-003 builder filters become applied column filters', () => {
  test('Table-FILTERUI-003 a complete builder filter maps to the shape the table applies', () => {
    // Break this catches: the wrong id or a missing header, which breaks the `filters` exposed variable and the match.
    const filters = [{ id: 'f1', column: 'c-name', condition: 'contains', value: 'a' }];

    expect(getDefaultColumnFilters(filters, columns)).toEqual([
      { id: 'c-name', value: { column: 'Name', condition: 'contains', value: 'a' } },
    ]);
  });

  test('Table-FILTERUI-003 several filters keep their order, also on the same column', () => {
    // Break this catches: filters being merged per column or reordered.
    const filters = [
      { id: 'f1', column: 'c-role', condition: 'equals', value: 'Admin' },
      { id: 'f2', column: 'c-name', condition: 'contains', value: 'a' },
      { id: 'f3', column: 'c-name', condition: 'doesNotContains', value: 'z' },
    ];

    expect(getDefaultColumnFilters(filters, columns).map(({ id, value }) => [id, value.condition])).toEqual([
      ['c-role', 'equals'],
      ['c-name', 'contains'],
      ['c-name', 'doesNotContains'],
    ]);
  });

  test('Table-FILTERUI-003 nothing saved, or something that is not a list, gives no filters', () => {
    // Break this catches: a saved app without the property throwing on undefined.
    expect(getDefaultColumnFilters(undefined, columns)).toEqual([]);
    expect(getDefaultColumnFilters(null, columns)).toEqual([]);
    expect(getDefaultColumnFilters('oops', columns)).toEqual([]);
  });
});

describe('Table-FILTERUI-005 builder filters without a value are not applied', () => {
  test.each([
    ['empty text', ''],
    ['undefined', undefined],
  ])('Table-FILTERUI-005 a %s value is kept out, like an incomplete row in the filter panel', (_label, value) => {
    // Break this catches: an empty builder filter being applied and hiding every row.
    const filters = [{ id: 'f1', column: 'c-name', condition: 'contains', value }];

    expect(getDefaultColumnFilters(filters, columns)).toEqual([]);
  });

  test('Table-FILTERUI-005 is empty and is not empty need no value', () => {
    // Break this catches: the no-value operators being dropped for lacking a value.
    const filters = [
      { id: 'f1', column: 'c-name', condition: 'isEmpty' },
      { id: 'f2', column: 'c-role', condition: 'isNotEmpty', value: '' },
    ];

    expect(getDefaultColumnFilters(filters, columns).map(({ value }) => value.condition)).toEqual([
      'isEmpty',
      'isNotEmpty',
    ]);
  });

  test('Table-FILTERUI-005 a filter with no operator is not applied', () => {
    // Break this catches: a half-built filter reaching the filter function with an undefined condition.
    expect(getDefaultColumnFilters([{ id: 'f1', column: 'c-name', value: 'a' }], columns)).toEqual([]);
  });
});

describe('Table-FILTERUI-006 builder filters on a missing column', () => {
  test('Table-FILTERUI-006 a filter whose column no longer exists is skipped and the rest still apply', () => {
    // Break this catches: a deleted column making the whole table crash or drop every filter.
    const filters = [
      { id: 'f1', column: 'c-gone', condition: 'contains', value: 'a' },
      { id: 'f2', column: 'c-role', condition: 'equals', value: 'Admin' },
    ];

    expect(getDefaultColumnFilters(filters, columns)).toEqual([
      { id: 'c-role', value: { column: 'Role', condition: 'equals', value: 'Admin' } },
    ]);
  });
});
