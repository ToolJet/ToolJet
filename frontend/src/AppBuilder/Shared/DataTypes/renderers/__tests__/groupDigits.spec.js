import { groupDigits } from '../NumberRenderer';

describe('groupDigits', () => {
  it('groups thousands and keeps the decimals a value has', () => {
    expect(groupDigits(1234567)).toBe('1,234,567');
    expect(groupDigits('23833.33')).toBe('23,833.33');
    expect(groupDigits(-98000)).toBe('-98,000');
  });
  it('shows exactly the decimal places asked for', () => {
    expect(groupDigits(1234.5, 2)).toBe('1,234.50');
    expect(groupDigits(1234.567, 0)).toBe('1,235');
  });
  it('leaves anything that is not a number as it is', () => {
    ['', null, undefined, 'n/a', true].forEach((v) => expect(groupDigits(v)).toBe(v));
  });
});
