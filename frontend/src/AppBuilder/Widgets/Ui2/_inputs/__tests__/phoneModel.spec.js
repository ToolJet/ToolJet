import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/phoneModel';

const JUNK = [undefined, null, '', '  ', {}, [], [1, 'a', null], NaN, Infinity, -1e308, 1e308, true, 'zzz', () => 1];

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
