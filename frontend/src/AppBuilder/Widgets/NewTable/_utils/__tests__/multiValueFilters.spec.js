import { filterFunctions, isFilterComplete } from '../../_components/Header/_components/Filter/filterUtils';
import { applyChipValue } from '../applyChipValue';
import { isMultiPick, toValueList } from '../multiValue';

const row = (cell) => ({ getValue: () => cell });
const run = (condition, cell, value) => filterFunctions[condition](row(cell), 'c', { value });

describe('Table-FILTERUI-076 a filter on several options', () => {
  test('Table-FILTERUI-076 "contains" with a list passes a row that has any of the options', () => {
    // Break this catches: "contains" needing every option, or only the first one counting.
    expect(run('contains', 'sales', ['design', 'sales'])).toBe(true);
    expect(run('contains', 'ops', ['design', 'sales'])).toBe(false);
  });

  test('Table-FILTERUI-076 a multi-select cell passes when any item is one of the options', () => {
    // Break this catches: a cell that holds a list never matching a list of options.
    expect(run('contains', ['ops', 'sales'], ['design', 'sales'])).toBe(true);
    expect(run('contains', ['ops', 'hr'], ['design', 'sales'])).toBe(false);
  });

  test('Table-FILTERUI-076 a list matches whole options, not parts of them', () => {
    // Break this catches: "design" picked and a row with "redesign" shown.
    expect(run('contains', 'redesign', ['design'])).toBe(false);
    expect(run('contains', ['redesign'], ['design'])).toBe(false);
  });

  test('Table-FILTERUI-076 "does not contain" with a list passes a row that has none of the options', () => {
    // Break this catches: "does not contain" passing a row that still has one of the options.
    expect(run('doesNotContains', 'ops', ['design', 'sales'])).toBe(true);
    expect(run('doesNotContains', ['ops', 'sales'], ['design', 'sales'])).toBe(false);
  });

  test('Table-FILTERUI-076 "equals" and "does not equal" with a list are any of / none of', () => {
    // Break this catches: a list handed to "equals" by setFilters being compared as one text.
    expect(run('equals', 'sales', ['design', 'sales'])).toBe(true);
    expect(run('ne', 'sales', ['design', 'sales'])).toBe(false);
    expect(run('ne', 'ops', ['design', 'sales'])).toBe(true);
  });

  test('Table-FILTERUI-076 a single text keeps matching the way it did', () => {
    // Break this catches: saved apps and typed filters changing behaviour.
    expect(run('contains', 'Designer', 'sign')).toBe(true);
    expect(run('equals', 'sales', 'sales')).toBe(true);
    expect(run('doesNotContains', 'Designer', 'sign')).toBe(false);
  });

  test('Table-FILTERUI-076 an empty list is not a filter yet', () => {
    // Break this catches: unticking the last option leaving a filter that hides every row.
    expect(isFilterComplete({ id: 'c', value: { condition: 'contains', value: [] } })).toBe(false);
    expect(isFilterComplete({ id: 'c', value: { condition: 'contains', value: ['a'] } })).toBe(true);
  });

  test('Table-FILTERUI-076 a chip given an empty list takes its filter off, a list sets it', () => {
    // Break this catches: an empty list kept as an applied filter, or a list not stored as given.
    const chip = { id: 'f1', columnId: 'c', column: 'Team', condition: 'contains', needsValue: true, appliedIndex: 0 };
    const applied = [{ id: 'c', value: { column: 'Team', condition: 'contains', value: ['a'] } }];

    expect(applyChipValue(applied, chip, [])).toEqual([]);
    expect(applyChipValue(applied, chip, ['a', 'b'])[0].value.value).toEqual(['a', 'b']);
    expect(applyChipValue([], { ...chip, appliedIndex: -1 }, [])).toEqual([]);
  });

  test('Table-FILTERUI-076 only "contains" / "does not contain" on an option column take several options', () => {
    // Break this catches: a list picker on "greater than", or a single pick where several make sense.
    expect(isMultiPick('select', 'contains')).toBe(true);
    expect(isMultiPick('newMultiSelect', 'doesNotContains')).toBe(true);
    expect(isMultiPick('tagsV2', 'contains')).toBe(true);
    expect(isMultiPick('select', 'equals')).toBe(false);
    expect(isMultiPick('boolean', 'contains')).toBe(false);
    expect(isMultiPick('string', 'contains')).toBe(false);
  });

  test('Table-FILTERUI-076 a saved single value reads as a list of one', () => {
    // Break this catches: a builder default or an old filter showing nothing ticked.
    expect(toValueList('design')).toEqual(['design']);
    expect(toValueList(['a', 'b'])).toEqual(['a', 'b']);
    expect(toValueList('')).toEqual([]);
    expect(toValueList(undefined)).toEqual([]);
  });
});
