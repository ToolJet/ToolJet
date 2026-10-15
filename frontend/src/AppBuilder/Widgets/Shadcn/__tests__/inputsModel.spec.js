import dayjs from 'dayjs';
import * as M from '../inputsModel';

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

describe('phone', () => {
  it('normalises numbers to E.164 and finds their country', () => {
    expect(M.toPhoneValue('(415) 555-0123', 'US')).toBe('+14155550123');
    expect(M.toPhoneValue('+44 20 7946 0958', 'US')).toBe('+442079460958');
    expect(M.toPhoneValue('0044 20 7946 0958', 'US')).toBe('+442079460958');
    expect(M.phoneCountry('+442079460958')).toBe('GB');
    expect(M.countryFromInput('+44')).toBe('GB');
    expect(M.countryFromInput('1')).toBe('US');
    expect(M.countryFromInput('de')).toBe('DE');
    expect(M.countryFromInput('+1', ['CA', 'MX'])).toBe('CA');
    expect(M.countryFromInput('nowhere')).toBeNull();
    expect(M.rebasePhone('+14155550123', 'US', 'GB')).toBe('+444155550123');
    expect(M.phoneCountries(['us', 'zz', 'CA', 'US'])).toEqual(['US', 'CA']);
    expect(M.phoneCountries('junk').length).toBeGreaterThan(200);
  });

  it('starts in the number’s own country, dropping numbers of countries not offered', () => {
    expect(M.phoneStart('+442079460958', 'US').country).toBe('GB');
    expect(M.phoneStart('+442079460958', 'US', ['US', 'CA'])).toMatchObject({ value: '', country: 'US' });
    expect(M.phoneStart('', 'zz', ['IN'])).toMatchObject({ value: '', country: 'IN' });
    expect(M.phoneInfo('+14155550123', 'US')).toEqual({
      value: '+14155550123',
      country: 'US',
      countryCode: '+1',
      formattedValue: '+1 415 555 0123',
      isValidNumber: true,
    });
    JUNK.forEach((v) => {
      expect(() => M.phoneStart(v, v, v)).not.toThrow();
      expect(() => M.phoneInfo(v, v)).not.toThrow();
    });
  });
});

describe('time', () => {
  it('parses and formats times', () => {
    expect(M.parseTime('14:30')).toBe(870);
    expect(M.parseTime('2:30 pm')).toBe(870);
    expect(M.parseTime('12am')).toBe(0);
    expect(M.parseTime('12:15 PM')).toBe(735);
    expect(M.parseTime('2026-10-09T08:05:00Z')).toBe(485);
    ['25:00', '13pm', '10:75', 'noon', null, {}, -5, NaN].forEach((v) => expect(M.parseTime(v)).toBeNull());
    expect(M.toHHmm(870)).toBe('14:30');
    expect(M.formatTime(870)).toBe('2:30 PM');
    expect(M.formatTime(0)).toBe('12:00 AM');
    expect(M.formatTime(870, true)).toBe('14:30');
    expect(M.is24h('24h')).toBe(true);
    expect(M.is24h('HH:mm')).toBe(true);
    expect(M.is24h('hh:mm a')).toBe(false);
    expect(M.is24h(undefined)).toBe(false);
  });

  it('lists slots within bounds', () => {
    expect(M.timeSlots(30, '09:00', '10:30').map(M.toHHmm)).toEqual(['09:00', '09:30', '10:00', '10:30']);
    expect(M.timeSlots(15, '11:00', '09:00')[0]).toBe(540);
    expect(M.timeSlots('junk')).toHaveLength(96);
    expect(M.minuteOptions(20)).toEqual([0, 20, 40]);
    expect(M.clampTime(100, M.timeBounds('09:00', '17:00'))).toBe(540);
  });
});

describe('date and time', () => {
  it('parses many shapes', () => {
    expect(M.parseDateTime('2026-10-09 14:30').format('YYYY-MM-DDTHH:mm')).toBe('2026-10-09T14:30');
    expect(M.parseDateTime('2026-10-09T14:30').hour()).toBe(14);
    expect(M.parseDateTime('09 Oct 2026 2:30 PM', 'DD MMM YYYY h:mm A').format('HH:mm')).toBe('14:30');
    const ms = dayjs('2026-10-09T14:30').valueOf();
    expect(M.parseDateTime(ms).valueOf()).toBe(ms);
    expect(M.parseDateTime(ms / 1000).valueOf()).toBe(ms);
    ['nope', {}, [], true, NaN, '2026-13-45'].forEach((v) => expect(M.parseDateTime(v)).toBeNull());
  });

  it('exposes value, date, time and timestamp', () => {
    const d = M.parseDateTime('2026-10-09 14:30');
    expect(M.dateTimeExposed(d, 'DD MMM YYYY h:mm A')).toEqual({
      value: '2026-10-09T14:30',
      selectedDate: '2026-10-09',
      selectedTime: '14:30',
      unixTimestamp: d.valueOf(),
      displayValue: '09 Oct 2026 2:30 PM',
    });
    expect(M.dateTimeExposed(null).value).toBe('');
    expect(M.safeFormat(d, {})).toBe('09 Oct 2026 2:30 PM');
  });

  it('checks dates against min, max and disabled dates', () => {
    const rules = M.dateRules({ minDate: '2026-10-05', maxDate: '2026-10-20', disabledDates: ['2026-10-10', 'junk'] });
    expect(M.dateProblem(M.parseDateTime('2026-10-09 23:00'), rules)).toBe('');
    expect(M.dateProblem(M.parseDateTime('2026-10-01'), rules)).toMatch(/on or after/);
    expect(M.dateProblem(M.parseDateTime('2026-10-21'), rules)).toMatch(/on or before/);
    expect(M.dateProblem(M.parseDateTime('2026-10-10 12:00'), rules)).toMatch(/not available/);
    JUNK.forEach((v) =>
      expect(() => M.dateRules({ minDate: v, maxDate: v, disabledDates: v, format: v })).not.toThrow()
    );
    expect(M.atTime(dayjs('2026-10-09'), 870).format('YYYY-MM-DD HH:mm')).toBe('2026-10-09 14:30');
  });
});
