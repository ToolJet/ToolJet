import { flattenSelectOptions } from '../utils';

describe('flattenSelectOptions', () => {
  it('exposes group children as leaves so selection matching can find them', () => {
    const grouped = [
      {
        label: 'Fruits',
        options: [
          { value: 'apple', label: 'Apple' },
          { value: 'orange', label: 'Orange' },
        ],
      },
      {
        label: 'Dairy',
        options: [{ value: 'milk', label: 'Milk' }],
      },
    ];

    const leaves = flattenSelectOptions(grouped);
    expect(leaves.map((leaf) => leaf.value)).toEqual(['apple', 'orange', 'milk']);
    // The selected value lookup the component performs:
    expect(leaves.find((leaf) => leaf.value === 'orange')?.label).toBe('Orange');
  });

  it('passes flat option arrays through unchanged', () => {
    const flat = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];
    expect(flattenSelectOptions(flat)).toBe(flat);
  });

  it('tolerates non-array and mixed input', () => {
    expect(flattenSelectOptions(undefined)).toEqual([]);
    expect(flattenSelectOptions(null)).toEqual([]);
    expect(
      flattenSelectOptions([{ value: 'top', label: 'Top' }, { label: 'Group', options: [{ value: 'child', label: 'Child' }] }])
    ).toEqual([
      { value: 'top', label: 'Top' },
      { value: 'child', label: 'Child' },
    ]);
  });
});
