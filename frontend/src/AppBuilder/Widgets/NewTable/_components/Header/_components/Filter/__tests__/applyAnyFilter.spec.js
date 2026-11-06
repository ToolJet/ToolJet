import { applyAnyFilter, applyFilters } from '../filterUtils';

const rowOf = (values) => ({ getValue: (columnId) => values[columnId] });

const nameIsAda = { id: 'name', value: { column: 'Name', condition: 'equals', value: 'Ada' } };
const ageOver30 = { id: 'age', value: { column: 'Age', condition: 'gt', value: 30 } };

describe('Table-FILTERUI-042 matching any filter', () => {
  test('Table-FILTERUI-042 a row passes when one filter matches, on any column', () => {
    // Break this catches: any behaving like all.
    expect(applyAnyFilter(rowOf({ name: 'Ada', age: 20 }), [nameIsAda, ageOver30])).toBe(true);
    expect(applyAnyFilter(rowOf({ name: 'Bob', age: 40 }), [nameIsAda, ageOver30])).toBe(true);
  });

  test('Table-FILTERUI-042 a row passes when every filter matches', () => {
    // Break this catches: a row that matches everything being dropped.
    expect(applyAnyFilter(rowOf({ name: 'Ada', age: 40 }), [nameIsAda, ageOver30])).toBe(true);
  });

  test('Table-FILTERUI-042 a row that matches none is dropped', () => {
    // Break this catches: any letting everything through.
    expect(applyAnyFilter(rowOf({ name: 'Bob', age: 20 }), [nameIsAda, ageOver30])).toBe(false);
  });

  test('Table-FILTERUI-042 several filters on one column also match any', () => {
    // Break this catches: filters on the same column being merged back into all.
    const filters = [nameIsAda, { id: 'name', value: { column: 'Name', condition: 'equals', value: 'Bob' } }];

    expect(applyAnyFilter(rowOf({ name: 'Bob' }), filters)).toBe(true);
    expect(applyAnyFilter(rowOf({ name: 'Cy' }), filters)).toBe(false);
  });

  test('Table-FILTERUI-042 matching all is unchanged', () => {
    // Characterization: passes on arrival. Break this catches: the all rule being touched by the any one.
    expect(applyFilters(rowOf({ name: 'Ada', age: 20 }), 'name', [nameIsAda])).toBe(true);
    expect(applyFilters(rowOf({ name: 'Bob', age: 20 }), 'name', [nameIsAda])).toBe(false);
  });
});
