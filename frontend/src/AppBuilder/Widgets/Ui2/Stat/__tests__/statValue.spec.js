import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { statValue } from '@/AppBuilder/Widgets/Ui2/Stat/statModel';

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

describe('statValue with a value bound as text', () => {
  // The Value format did nothing to a figure bound as text unless it was a bare "1250"; grouped text ("1,250") showed as
  // written whatever the format.
  it('formats numeric text, plain or grouped, in the chosen format', () => {
    expect(statValue('1250', { valueFormat: 'currency' })).toBe('$1,250');
    expect(statValue('1,250', { valueFormat: 'currency' })).toBe('$1,250');
    expect(statValue('1,250.5', { valueFormat: 'number' })).toBe('1,250.5');
    expect(statValue('-12.5', { valueFormat: 'percent' })).toBe('-12.5%');
  });

  it('leaves other text as written, and text in auto', () => {
    expect(statValue('$1,250.00', { valueFormat: 'currency' })).toBe('$1,250.00');
    expect(statValue('12 open', { valueFormat: 'number' })).toBe('12 open');
    expect(statValue('2026')).toBe('2026');
  });

  it('a new Stat starts with a number its format applies to; one saved with the old text keeps it', () => {
    const { shadStatConfig } = require('@/AppBuilder/WidgetManager/widgets/shadStat');
    expect(shadStatConfig.definition.properties.value.value).toBe('{{1250}}');
    expect(statValue(1250, { valueFormat: 'currency' })).toBe('$1,250');
    expect(statValue('$1,250.00', { valueFormat: 'auto' })).toBe('$1,250.00');
  });
});

describe('figureOf', () => {
  const { figureOf } = require('@/AppBuilder/Widgets/Ui2/_shared/format');
  it('reads plain and locale-grouped numbers, and refuses text the two readings disagree on', () => {
    expect(figureOf('1250.5', 'en')).toBe(1250.5);
    expect(figureOf('1,250', 'en')).toBe(1250);
    expect(figureOf('1.250,5', 'de')).toBe(1250.5);
    expect(figureOf('1250.5', 'de')).toBe(1250.5);
    expect(figureOf('1.250', 'de')).toBeNull();
    expect(figureOf('12,50,000', 'en')).toBeNull();
    expect(figureOf('$5', 'en')).toBeNull();
  });
});
