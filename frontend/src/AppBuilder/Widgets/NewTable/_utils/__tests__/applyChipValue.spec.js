import { applyChipValue } from '../applyChipValue';

const chip = (overrides = {}) => ({
  id: 'f1',
  columnId: 'c-name',
  column: 'Name',
  condition: 'contains',
  needsValue: true,
  appliedIndex: -1,
  ...overrides,
});
const applied = (id, condition, value) => ({ id, value: { column: id, condition, value } });

describe('Table-FILTERUI-019 changing the value of a chip', () => {
  test('Table-FILTERUI-019 a value on a chip that is not applied adds the filter', () => {
    // Break this catches: typing into an empty chip doing nothing.
    expect(applyChipValue([], chip(), 'Ja')).toEqual([
      { id: 'c-name', value: { column: 'Name', condition: 'contains', value: 'Ja' } },
    ]);
  });

  test('Table-FILTERUI-019 a new value replaces the applied one, in place', () => {
    // Break this catches: the edited filter moving to the end, or the other filters being touched.
    const filters = [applied('c-name', 'contains', 'a'), applied('c-age', 'gt', '3')];

    expect(applyChipValue(filters, chip({ appliedIndex: 0 }), 'b')).toEqual([
      { id: 'c-name', value: { column: 'c-name', condition: 'contains', value: 'b' } },
      applied('c-age', 'gt', '3'),
    ]);
  });

  test('Table-FILTERUI-021 an empty value takes the filter off, leaving the others', () => {
    // Break this catches: an emptied chip still filtering on "" and hiding every row.
    const filters = [applied('c-name', 'contains', 'a'), applied('c-age', 'gt', '3')];

    expect(applyChipValue(filters, chip({ appliedIndex: 0 }), '')).toEqual([applied('c-age', 'gt', '3')]);
  });

  test('Table-FILTERUI-019 an empty value on a chip that is not applied changes nothing', () => {
    // Break this catches: an empty filter being added by a blur or a cleared input.
    const filters = [applied('c-age', 'gt', '3')];

    expect(applyChipValue(filters, chip(), '')).toEqual(filters);
  });

  test('Table-FILTERUI-019 the list given is not changed', () => {
    // Break this catches: mutating the table's filter state in place.
    const filters = [applied('c-name', 'contains', 'a')];
    applyChipValue(filters, chip({ appliedIndex: 0 }), 'b');

    expect(filters[0].value.value).toBe('a');
  });

  test('Table-FILTERUI-021 a chip with no value box is applied or taken off as a whole', () => {
    // Break this catches: is empty / is not empty chips that can never be switched on or off.
    const emptyChip = chip({ condition: 'isEmpty', needsValue: false });

    expect(applyChipValue([], emptyChip, true)).toEqual([
      { id: 'c-name', value: { column: 'Name', condition: 'isEmpty', value: '' } },
    ]);
    expect(applyChipValue([applied('c-name', 'isEmpty', '')], { ...emptyChip, appliedIndex: 0 }, false)).toEqual([]);
  });
});
