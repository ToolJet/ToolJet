import { affixNumber } from '../NumberRenderer';

describe('affixNumber', () => {
  it('puts the prefix and suffix around a number', () => {
    expect(affixNumber('19.50', '$', '')).toBe('$19.50');
    expect(affixNumber('12', '', ' kg')).toBe('12 kg');
    expect(affixNumber(40, '', '%')).toBe('40%');
  });
  it('puts a minus sign before the prefix', () => {
    expect(affixNumber('-4.25', '$', '')).toBe('-$4.25');
    expect(affixNumber(-3, '€', '')).toBe('-€3');
  });
  it('leaves empty values and missing affixes alone', () => {
    expect(affixNumber('', '$', '')).toBe('');
    expect(affixNumber(null, '$', '')).toBe(null);
    expect(affixNumber(7, undefined, null)).toBe(7);
  });
});
