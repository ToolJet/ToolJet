import { getQuickFilters } from '../quickFilters';

const columns = [
  { id: 'c-name', header: 'Name', columnType: 'string' },
  { id: 'c-status', header: 'Status', columnType: 'select' },
  { id: 'c-age', header: 'Age', columnType: 'number' },
];

const applied = (id, column, condition, value) => ({ id, value: { column, condition, value } });

describe('Table-FILTERUI-016 the quick filters shown as chips', () => {
  test('Table-FILTERUI-016 each saved filter becomes a chip with its column, operator and the applied value', () => {
    // Break this catches: chips that do not follow the builder's filters, or show the wrong value.
    const defaultFilters = [{ id: 'f1', column: 'c-name', condition: 'contains', value: 'a' }];
    const columnFilters = [applied('c-name', 'Name', 'contains', 'Ja')];

    expect(getQuickFilters(defaultFilters, columnFilters, columns)).toEqual([
      expect.objectContaining({
        id: 'f1',
        column: 'Name',
        operator: 'contains',
        value: 'Ja',
        applied: true,
        needsValue: true,
        placeholder: 'value',
      }),
    ]);
  });

  test('Table-FILTERUI-016 a filter that is not applied (no value, or cleared) keeps its chip, empty', () => {
    // Break this catches: a cleared builder filter losing its chip, so the user cannot fill it in again.
    const defaultFilters = [{ id: 'f1', column: 'c-status', condition: 'equals', value: '' }];

    expect(getQuickFilters(defaultFilters, [], columns)).toEqual([
      expect.objectContaining({ id: 'f1', column: 'Status', operator: 'equals', value: '', applied: false }),
    ]);
  });

  test('Table-FILTERUI-016 option columns ask to "Select", others for a "value"', () => {
    // Break this catches: a text placeholder on a column the user has to pick from.
    const defaultFilters = [
      { id: 'f1', column: 'c-status', condition: 'equals' },
      { id: 'f2', column: 'c-age', condition: 'gt' },
    ];

    expect(getQuickFilters(defaultFilters, [], columns).map((chip) => chip.placeholder)).toEqual(['Select', 'value']);
  });

  test('Table-FILTERUI-016 is empty and is not empty need no value', () => {
    // Break this catches: a value box on a chip whose operator ignores it.
    const defaultFilters = [
      { id: 'f1', column: 'c-name', condition: 'isEmpty' },
      { id: 'f2', column: 'c-age', condition: 'isNotEmpty' },
    ];

    expect(getQuickFilters(defaultFilters, [], columns).map((chip) => [chip.operator, chip.needsValue])).toEqual([
      ['is empty', false],
      ['is not empty', false],
    ]);
  });

  test('Table-FILTERUI-016 two filters on the same column and operator each claim their own applied value, in order', () => {
    // Break this catches: both chips showing the first value, or one of them losing its value.
    const defaultFilters = [
      { id: 'f1', column: 'c-name', condition: 'contains' },
      { id: 'f2', column: 'c-name', condition: 'contains' },
    ];
    const columnFilters = [applied('c-name', 'Name', 'contains', 'a'), applied('c-name', 'Name', 'contains', 'b')];

    expect(getQuickFilters(defaultFilters, columnFilters, columns).map((chip) => chip.value)).toEqual(['a', 'b']);
  });

  test('Table-FILTERUI-016 applied filters that do not belong to a saved filter are not chips', () => {
    // Break this catches: the user's own filters (made in the panel) turning up as builder chips.
    const columnFilters = [applied('c-age', 'Age', 'gt', '30')];

    expect(
      getQuickFilters([{ id: 'f1', column: 'c-name', condition: 'contains' }], columnFilters, columns)
    ).toHaveLength(1);
    expect(
      getQuickFilters([{ id: 'f1', column: 'c-name', condition: 'contains' }], columnFilters, columns)[0].applied
    ).toBe(false);
  });

  test('Table-FILTERUI-016 a column that no longer exists gets no chip, and nothing saved gives none', () => {
    // Break this catches: a deleted column crashing the header or leaving an "undefined" chip.
    expect(getQuickFilters([{ id: 'f1', column: 'c-gone', condition: 'contains' }], [], columns)).toEqual([]);
    expect(getQuickFilters(undefined, [], columns)).toEqual([]);
    expect(getQuickFilters('oops', [], columns)).toEqual([]);
  });
});

describe('Table-FILTERUI-048 chips with no applied filters list to read', () => {
  test('Table-FILTERUI-048 a missing list of applied filters means none are applied, not a crash', () => {
    // Break this catches: the header throwing (and taking the table with it) the moment a filter is saved.
    const defaultFilters = [{ id: 'f1', column: 'c-name', condition: 'contains' }];

    expect(() => getQuickFilters(defaultFilters, undefined, columns)).not.toThrow();
    expect(getQuickFilters(defaultFilters, undefined, columns)).toEqual([
      expect.objectContaining({ id: 'f1', applied: false, value: '' }),
    ]);
    expect(getQuickFilters(defaultFilters, null, columns)).toHaveLength(1);
  });

  test('Table-FILTERUI-048 a filter entry without a value object is ignored, not a crash', () => {
    // Break this catches: an odd entry set through setFilters breaking the header.
    const defaultFilters = [{ id: 'f1', column: 'c-name', condition: 'contains' }];

    expect(getQuickFilters(defaultFilters, [{ id: 'c-name' }, null], columns)[0].applied).toBe(false);
  });
});
