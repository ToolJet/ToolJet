import { isValueTaken, nextFreeOption, optionRowId } from '../Components/selectOptionUtils';

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Grapes', value: 'grapes' },
];

describe('isValueTaken', () => {
  it('[TagsInput-BUG-010] reports a value another option already uses', () => {
    // Break this catches: a second option sharing a value, which duplicates its row on reorder.
    expect(isValueTaken(options, 'grapes', 0)).toBe(true);
  });

  it('[TagsInput-BUG-010] does not count an option against itself', () => {
    // Break this catches: rejecting an unchanged value, making existing options uneditable.
    expect(isValueTaken(options, 'apple', 0)).toBe(false);
  });

  it('[TagsInput-BUG-010] treats a different case as a different value', () => {
    expect(isValueTaken(options, 'Apple', 1)).toBe(false);
  });

  it('[TagsInput-BUG-010] allows a free value', () => {
    expect(isValueTaken(options, 'mango', 1)).toBe(false);
  });
});

describe('nextFreeOption', () => {
  it('[TagsInput-BUG-010] skips a number whose value is already taken', () => {
    // Break this catches: checking only the label, so a new option collides on value.
    const taken = [
      { label: 'Apple', value: '3' },
      { label: 'Grapes', value: 'grapes' },
    ];

    expect(nextFreeOption(taken)).toEqual({ label: 'option4', value: '4' });
  });

  it('[TagsInput-BUG-010] skips a number whose label is already taken', () => {
    const taken = [
      { label: 'option3', value: 'x' },
      { label: 'Grapes', value: 'grapes' },
    ];

    expect(nextFreeOption(taken)).toEqual({ label: 'option4', value: '4' });
  });

  it('[TagsInput-BUG-010] uses the next index when nothing collides', () => {
    expect(nextFreeOption(options)).toEqual({ label: 'option3', value: '3' });
  });
});

describe('optionRowId', () => {
  it('[TagsInput-BUG-010] separates two options that share a value', () => {
    // Break this catches: keying by value alone, which renders duplicate rows as one.
    const duplicates = [{ value: 'apple' }, { value: 'apple' }];

    const ids = duplicates.map(optionRowId);

    expect(new Set(ids).size).toBe(2);
  });
});
