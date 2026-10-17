import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';

const JUNK = [undefined, null, '', '  ', {}, [], [1, 'a', null], NaN, Infinity, -1e308, 1e308, true, 'zzz', () => 1];

describe('numbers', () => {
  it('parses numbers typed in a locale format, null when there is none', () => {
    expect(M.parseNumber('1,234.5')).toBe(1234.5);
    expect(M.parseNumber('1.234,5', 'de-DE')).toBe(1234.5);
    expect(M.parseNumber('1 234,5', 'fr-FR')).toBe(1234.5);
    expect(M.parseNumber('$ -12')).toBe(-12);
    expect(M.parseNumber(42)).toBe(42);
    expect(M.parseNumber('1.2.3')).toBe(1.23);
    ['', '-', 'abc', null, undefined, {}, [], NaN, Infinity].forEach((v) => expect(M.parseNumber(v)).toBeNull());
  });

  it('rounds without float noise and formats with or without grouping', () => {
    expect(M.roundTo(1.005, 2)).toBe(1.01);
    expect(M.roundTo(12.3456, 0)).toBe(12);
    expect(M.roundTo(null, 2)).toBeNull();
    expect(M.roundTo(1e308, 2)).toBe(1e308);
    expect(M.formatNumber(1234567.891, { decimals: 2 })).toBe('1,234,567.89');
    expect(M.formatNumber(1234.5, { decimals: 2, grouping: false })).toBe('1234.5');
    expect(M.formatNumber(1234.5, { decimals: 2, fixed: true, locale: 'de-DE' })).toBe('1.234,50');
    expect(M.formatNumber(5, { locale: 'not a locale' })).toBe('5');
    expect(M.formatNumber(null)).toBe('');
  });

  it('steps within min and max', () => {
    expect(M.stepValue(1, 1, 1)).toBe(2);
    expect(M.stepValue(0.1, 0.2, 1, { decimals: 2 })).toBe(0.3);
    expect(M.stepValue(5, 1, 1, { max: 5 })).toBe(5);
    expect(M.stepValue(null, 1, 1, { min: 3 })).toBe(3);
    expect(M.stepValue(null, 'junk', -1, { min: 0 })).toBe(0);
  });

  it('clamps whole numbers and takes junk', () => {
    expect(M.clampInt('7', 0, 5, 2)).toBe(5);
    JUNK.forEach((v) => expect(() => M.clampInt(v, 0, 10, 2)).not.toThrow());
    expect(M.clampInt({}, 0, 10, 2)).toBe(2);
  });
});

describe('currency', () => {
  it('knows currency codes, signs and decimals', () => {
    expect(M.toCurrency('eur')).toBe('EUR');
    expect(M.toCurrency('nope')).toBe('USD');
    expect(M.currencyDecimals('JPY', '')).toBe(0);
    expect(M.currencyDecimals('USD', 3)).toBe(3);
    expect(M.currencySign('USD', 'en-US')).toEqual({ sign: '$', after: false });
    expect(M.currencySign('EUR', 'de-DE').after).toBe(true);
    expect(M.currencySign('USD', 'en-US', 'code').sign).toBe('USD');
    expect(M.formatCurrency(1250, { currency: 'USD' })).toBe('$1,250.00');
    expect(M.formatCurrency(1250, { currency: 'JPY', locale: 'en-US' })).toBe('¥1,250');
    expect(M.formatCurrency(null)).toBe('');
    expect(M.toCurrencyList(['usd', 'EUR', 'usd', null, { value: 'GBP' }, 'XXXX', 5])).toEqual(['USD', 'EUR', 'GBP']);
    JUNK.forEach((v) => {
      expect(() => M.toCurrencyList(v)).not.toThrow();
      expect(() => M.formatCurrency(1, { currency: v, locale: v })).not.toThrow();
    });
  });
});

describe('password strength', () => {
  it('rates by length and character mix', () => {
    expect(M.passwordStrength('')).toEqual({ level: '', label: '', segments: 0 });
    expect(M.passwordStrength('abc').level).toBe('weak');
    expect(M.passwordStrength('password').level).toBe('weak');
    expect(M.passwordStrength('aaaaaaaaaaaaaaaa').level).toBe('weak');
    expect(M.passwordStrength('Password1').level).toBe('fair');
    expect(M.passwordStrength('Tr0ub4dor&3-horse').level).toBe('strong');
    JUNK.forEach((v) => expect(() => M.passwordStrength(v)).not.toThrow());
  });
});

describe('otp', () => {
  it('keeps the code characters up to the length', () => {
    expect(M.otpLength(12)).toBe(8);
    expect(M.otpLength('junk')).toBe(6);
    expect(M.otpSanitize('12-34 56', 6)).toBe('123456');
    expect(M.otpSanitize('1234567890', 4)).toBe('1234');
    expect(M.otpSanitize('ab-12c', 6, 'alphanumeric')).toBe('AB12C');
    expect(M.otpSanitize('ab12', 6)).toBe('12');
    JUNK.forEach((v) => expect(M.otpSanitize(v, v)).toEqual(expect.any(String)));
  });
});
