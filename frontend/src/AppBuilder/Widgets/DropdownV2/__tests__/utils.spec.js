import { sortArray } from '../utils';

describe('sortArray', () => {
  const options = () => [{ label: 'Mango' }, { label: 'Apple' }, { label: 'Grapes' }];

  it('[TagsInput-BUG-010] sorts ascending by label', () => {
    expect(sortArray(options(), 'asc').map((o) => o.label)).toEqual(['Apple', 'Grapes', 'Mango']);
  });

  it('[TagsInput-BUG-010] sorts descending by label', () => {
    expect(sortArray(options(), 'desc').map((o) => o.label)).toEqual(['Mango', 'Grapes', 'Apple']);
  });

  it('[TagsInput-BUG-010] leaves the caller array untouched', () => {
    // Break this catches: sorting in place, reordering the caller's own options.
    const original = options();

    sortArray(original, 'asc');

    expect(original.map((o) => o.label)).toEqual(['Mango', 'Apple', 'Grapes']);
  });

  it('[TagsInput-BUG-010] returns the array as-is for any other sort', () => {
    expect(sortArray(options(), 'none').map((o) => o.label)).toEqual(['Mango', 'Apple', 'Grapes']);
  });
});
