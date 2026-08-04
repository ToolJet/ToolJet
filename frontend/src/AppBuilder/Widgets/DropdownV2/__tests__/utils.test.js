import { flattenSelectOptions } from '../utils';

describe('flattenSelectOptions', () => {
  it('returns a flat list unchanged', () => {
    const flat = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];
    expect(flattenSelectOptions(flat)).toEqual(flat);
  });

  it('flattens grouped options ([{ label, options: [...] }]) into their leaf options', () => {
    const grouped = [
      {
        label: 'Fruits',
        options: [
          { value: 'apple', label: 'Apple' },
          { value: 'orange', label: 'Orange' },
        ],
      },
      {
        label: 'Vegetables',
        options: [{ value: 'carrot', label: 'Carrot' }],
      },
    ];

    expect(flattenSelectOptions(grouped)).toEqual([
      { value: 'apple', label: 'Apple' },
      { value: 'orange', label: 'Orange' },
      { value: 'carrot', label: 'Carrot' },
    ]);
  });

  it('lets a selected value be resolved from grouped options', () => {
    const grouped = [{ label: 'Fruits', options: [{ value: 'orange', label: 'Orange' }] }];
    const selected = flattenSelectOptions(grouped).find((option) => option.value === 'orange');
    expect(selected).toEqual({ value: 'orange', label: 'Orange' });
  });

  it('handles mixed flat and grouped entries', () => {
    const mixed = [
      { value: 'a', label: 'A' },
      { label: 'Group', options: [{ value: 'b', label: 'B' }] },
    ];
    expect(flattenSelectOptions(mixed)).toEqual([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
  });

  it('returns an empty array for non-array input', () => {
    expect(flattenSelectOptions(undefined)).toEqual([]);
    expect(flattenSelectOptions(null)).toEqual([]);
    expect(flattenSelectOptions()).toEqual([]);
  });
});