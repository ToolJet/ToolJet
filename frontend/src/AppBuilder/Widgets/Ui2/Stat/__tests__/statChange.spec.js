import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// A Stat's change chip (and a Summary strip's delta) is signed and rounded in its change format: an agent's bindings
// printed "-9.793980410868281", "-3.2440403047431796" and "266.66666666666663" whole, each under an up arrow.
import { statChange, textDirection } from '../statModel';
import { formatChange } from '@/AppBuilder/Widgets/Ui2/_shared/format';
import { summaryFigures } from '@/AppBuilder/Widgets/Ui2/_sections/summaryModel';

const RAW = [-9.793980410868281, -3.2440403047431796, 266.66666666666663];
const MINUS = '−';

describe('a change in its format', () => {
  test.each([
    ['percent', [`${MINUS}9.8%`, `${MINUS}3.2%`, '+266.7%']],
    ['number', [`${MINUS}9.8`, `${MINUS}3.2`, '+266.7']],
    ['currency', [`${MINUS}$9.79`, `${MINUS}$3.24`, '+$266.67']],
  ])('%s', (format, expected) => {
    expect(RAW.map((n) => statChange(n, format)?.text)).toEqual(expected);
    // The same values bound as text read the same.
    expect(RAW.map((n) => statChange(String(n), format)?.text)).toEqual(expected);
  });

  test('a number drops a trailing .0; a percent keeps one decimal; money keeps its currency decimals', () => {
    expect(formatChange(12, 'number').text).toBe('+12');
    expect(formatChange(12, 'percent').text).toBe('+12.0%');
    expect(formatChange(1234.5, 'number').text).toBe('+1,234.5');
    expect(formatChange(1500, 'currency', 'JPY').text).toBe('+¥1,500');
    expect(formatChange(-2.5, 'currency', 'EUR').text).toBe(`${MINUS}€2.50`);
  });

  test('the direction is the sign of the figure as shown: up, down, flat at zero', () => {
    expect(statChange(4.2, 'percent').direction).toBe(1);
    expect(statChange(-4.2, 'percent').direction).toBe(-1);
    expect(statChange(0, 'percent')).toEqual({ text: '0.0%', direction: 0 });
    // Rounds to zero: flat, with no sign.
    expect(statChange(-0.04, 'number')).toEqual({ text: '0', direction: 0 });
  });

  test('a written percent is a percent whatever the format; other text is not a figure', () => {
    expect(statChange('-3.24404%', 'number')?.text).toBe(`${MINUS}3.2%`);
    expect(statChange(`${MINUS}2`, 'number')?.text).toBe(`${MINUS}2`);
    expect(statChange('+$1,200', 'number')).toBeNull();
    expect(statChange('Flat', 'number')).toBeNull();
    expect(statChange(Number.NaN, 'number')).toBeNull();
    expect(textDirection('↓ 3 this week')).toBe(-1);
    expect(textDirection('Flat')).toBe(0);
  });

  test('a Summary strip delta is written the same way', () => {
    const [figure] = summaryFigures([{ label: 'Spend', value: 10, delta: -9.793980410868281 }], {
      deltaFormat: 'percent',
    });
    expect(figure.delta.text).toBe(`${MINUS}9.8%`);
  });
});
