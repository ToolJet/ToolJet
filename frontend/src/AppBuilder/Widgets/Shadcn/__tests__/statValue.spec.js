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
