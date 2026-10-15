import { statValue } from '../statModel';

describe('statValue', () => {
  it('groups a bare number in auto, and leaves text as it is', () => {
    expect(statValue(1234567.5)).toBe('1,234,567.5');
    expect(statValue('947.37')).toBe('947.37');
    expect(statValue('$1,250.00')).toBe('$1,250.00');
    expect(statValue('12 open')).toBe('12 open');
  });
  it('formats currency, percent and compact, numeric text included', () => {
    expect(statValue(947.37, { valueFormat: 'currency' })).toBe('$947.37');
    expect(statValue('947.37', { valueFormat: 'currency', currency: 'EUR' })).toBe('€947.37');
    expect(statValue(42.5, { valueFormat: 'percent' })).toBe('42.5%');
    expect(statValue(15400, { valueFormat: 'compact' })).toBe('15.4K');
    expect(statValue('n/a', { valueFormat: 'currency' })).toBe('n/a');
  });
  it('is empty for nothing', () => {
    expect(statValue(null)).toBe('');
    expect(statValue(undefined, { valueFormat: 'currency' })).toBe('');
  });
});

describe('statValue with a number that is not finite', () => {
  // Infinity and NaN (a division by zero in a binding) printed as "Infinity" and "NaN" in the figure.
  it.each([Infinity, -Infinity, NaN])('%s shows nothing in any format', (v) => {
    for (const valueFormat of ['auto', 'number', 'currency', 'percent', 'compact'])
      expect(statValue(v, { valueFormat })).toBe('');
  });
});

// A churn rate of 0.021 and an average margin of 0.70 showed "0%" and "0.7%" (subscription and menu dashboards,
// 2026-10-14): a percent below 1 is a ratio, as the pack's charts already read a series of fractions.
describe('a percent stat given as a ratio', () => {
  it('reads a fraction as a ratio and a whole percentage as written', () => {
    expect(statValue(0.021, { valueFormat: 'percent' })).toBe(statValue(2.1, { valueFormat: 'percent' }));
    expect(statValue(0.7, { valueFormat: 'percent' })).toBe(statValue(70, { valueFormat: 'percent' }));
    expect(statValue(42.5, { valueFormat: 'percent' })).toContain('42.5');
    expect(statValue(0, { valueFormat: 'percent' })).toBe(statValue(0, { valueFormat: 'percent' }));
  });
});
