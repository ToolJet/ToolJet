import { getQuickFilters, getUserFilters } from '../quickFilters';

const columns = [
  { id: 'c-name', header: 'Name', columnType: 'string' },
  { id: 'c-status', header: 'Status', columnType: 'select' },
  { id: 'c-email', header: 'Email', columnType: 'string' },
];

const applied = (id, column, condition, value) => ({ id, value: { column, condition, value } });

describe('Table-FILTERUI-069 the filters a user adds, shown as chips in the header', () => {
  test('Table-FILTERUI-069 an applied filter that is no builder filter becomes a chip that can be edited and removed', () => {
    // Break this catches: the user's own filters staying out of the header, so they cannot be seen or edited there.
    const columnFilters = [applied('c-email', 'Email', 'contains', 'x.com')];

    expect(getUserFilters([], columnFilters, columns)).toEqual([
      expect.objectContaining({
        id: 'user-0',
        columnId: 'c-email',
        column: 'Email',
        condition: 'contains',
        operator: 'contains',
        value: 'x.com',
        needsValue: true,
        applied: true,
        appliedIndex: 0,
      }),
    ]);
  });

  test('Table-FILTERUI-069 a filter a builder chip already shows is not shown twice', () => {
    // Break this catches: one filter drawn as two chips, a builder one and a user one.
    const defaultFilters = [{ id: 'f1', column: 'c-name', condition: 'contains', value: '' }];
    const columnFilters = [applied('c-name', 'Name', 'contains', 'Ja'), applied('c-email', 'Email', 'equals', 'a')];

    expect(getUserFilters(defaultFilters, columnFilters, columns).map(({ id }) => id)).toEqual(['user-1']);
    expect(getQuickFilters(defaultFilters, columnFilters, columns)).toHaveLength(1);
  });

  test("Table-FILTERUI-069 a second filter on the same column and operator as a builder chip is the user's", () => {
    // Break this catches: the extra filter vanishing from the header because a chip has the same column and operator.
    const defaultFilters = [{ id: 'f1', column: 'c-name', condition: 'contains', value: '' }];
    const columnFilters = [applied('c-name', 'Name', 'contains', 'Ja'), applied('c-name', 'Name', 'contains', 'm')];

    expect(getUserFilters(defaultFilters, columnFilters, columns).map(({ id, value }) => [id, value])).toEqual([
      ['user-1', 'm'],
    ]);
  });

  test('Table-FILTERUI-069 a filter that takes no value is a chip without a value box', () => {
    // Break this catches: "is empty" asking for a value in the header.
    const [chip] = getUserFilters([], [applied('c-email', 'Email', 'isEmpty', '')], columns);

    expect(chip).toEqual(expect.objectContaining({ needsValue: false, operator: 'is empty', applied: true }));
  });

  test('Table-FILTERUI-069 option columns ask to "Select", and a filter on a column that is gone has no chip', () => {
    // Break this catches: a crash, or a stray chip, for a filter whose column was deleted.
    const columnFilters = [applied('c-status', 'Status', 'equals', 'a'), applied('c-gone', 'Gone', 'equals', 'a')];

    expect(getUserFilters([], columnFilters, columns)).toEqual([
      expect.objectContaining({ id: 'user-0', columnType: 'select', placeholder: 'Select' }),
    ]);
  });

  test('Table-FILTERUI-069 without a builder list, or filters, nothing breaks', () => {
    // Break this catches: a table with no saved filters (undefined list) crashing the header.
    expect(getUserFilters(undefined, [applied('c-name', 'Name', 'contains', 'a')], columns)).toHaveLength(1);
    expect(getUserFilters([], undefined, columns)).toEqual([]);
  });
});
