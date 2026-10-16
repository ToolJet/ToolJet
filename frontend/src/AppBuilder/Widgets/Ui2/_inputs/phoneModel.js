// shadcn/ui pack (experiment): pure logic of the phone widget. Every function takes junk (null, objects, NaN, huge
// numbers) without throwing.
import {
  formatPhoneNumberIntl,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumber,
} from 'react-phone-number-input';
// eslint-disable-next-line import/no-unresolved
import countryNames from 'react-phone-number-input/locale/en';
import { isBlank } from './inputsModel';

/** A country's calling code without the plus ('44'); '' for an unknown country. */
export const callingCode = (country) => {
  try {
    return getCountryCallingCode(country);
  } catch {
    return '';
  }
};

export const countryName = (country) => countryNames?.[country] || String(country ?? '');

const ALL_COUNTRIES = getCountries();
// Where several countries share a calling code, the one a bare '+1' or '+44' means.
const MAIN_COUNTRY = {
  1: 'US',
  7: 'RU',
  39: 'IT',
  44: 'GB',
  47: 'NO',
  61: 'AU',
  212: 'MA',
  262: 'RE',
  290: 'SH',
  358: 'FI',
  590: 'GP',
  599: 'CW',
};

/** The countries offered: the author's list (ISO codes, any case; unknown ones dropped), else every country. */
export const phoneCountries = (only) => {
  const wanted = (Array.isArray(only) ? only : [])
    .map((c) =>
      String(c !== null && typeof c === 'object' ? c.value ?? c.code ?? '' : c ?? '')
        .trim()
        .toUpperCase()
    )
    .filter((c) => ALL_COUNTRIES.includes(c));
  return wanted.length ? [...new Set(wanted)] : ALL_COUNTRIES;
};

/** A country from an ISO code ('gb') or a calling code ('+44', 44), among `countries`; null when none matches. */
export const countryFromInput = (input, countries = ALL_COUNTRIES) => {
  if (isBlank(input) || typeof input === 'object') return null;
  const s = String(input).trim();
  const iso = s.toUpperCase();
  if (countries.includes(iso)) return iso;
  const digits = s.replace(/^\+/, '');
  if (!/^\d{1,4}$/.test(digits)) return null;
  const matching = countries.filter((c) => callingCode(c) === digits);
  return matching.includes(MAIN_COUNTRY[digits]) ? MAIN_COUNTRY[digits] : matching[0] ?? null;
};

const pickCountry = (c, countries) =>
  countryFromInput(c, countries) ?? (countries.includes('US') ? 'US' : countries[0] ?? 'US');

/** A phone number as E.164 ('+14155550123'): international text as is, a national number for `country`; '' for
 *  none. */
export const toPhoneValue = (v, country) => {
  if (isBlank(v) || (typeof v !== 'string' && typeof v !== 'number')) return '';
  const s = String(v).trim();
  const digits = s.replace(/\D/g, '').slice(0, 17);
  if (!digits) return '';
  if (s.startsWith('+')) return `+${digits}`;
  if (s.startsWith('00')) return digits.length > 2 ? `+${digits.slice(2)}` : '';
  try {
    const parsed = parsePhoneNumber(s, country);
    if (parsed?.number) return parsed.number;
  } catch {
    // not a number for that country: prefix its calling code below
  }
  const code = callingCode(country);
  return code ? `+${code}${digits.replace(/^0+/, '')}` : '';
};

/** The country a full number belongs to, if it is among `countries`. */
export const phoneCountry = (e164, countries = ALL_COUNTRIES) => {
  if (!e164) return null;
  try {
    const c = parsePhoneNumber(String(e164))?.country;
    return c && countries.includes(c) ? c : null;
  } catch {
    return null;
  }
};

/** A phone widget's starting number and country: the number's own country when it is offered; a number that
 *  belongs to no offered country is dropped. */
export const phoneStart = (defaultValue, defaultCountry, onlyCountries) => {
  const countries = phoneCountries(onlyCountries);
  const fallback = pickCountry(defaultCountry, countries);
  const value = toPhoneValue(defaultValue, fallback);
  if (!value) return { value: '', country: fallback, countries };
  const detected = phoneCountry(value, ALL_COUNTRIES);
  if (detected) {
    if (countries.includes(detected)) return { value, country: detected, countries };
    const sameCode = callingCode(detected) === callingCode(fallback);
    return { value: sameCode ? value : '', country: fallback, countries };
  }
  return { value: value.startsWith(`+${callingCode(fallback)}`) ? value : '', country: fallback, countries };
};

/** A number moved to another country: the old calling code is replaced by the new one. */
export const rebasePhone = (e164, from, to) => {
  if (!e164) return '';
  const old = callingCode(from);
  let digits = String(e164).replace(/\D/g, '');
  if (old && digits.startsWith(old)) digits = digits.slice(old.length);
  const code = callingCode(to);
  return digits && code ? `+${code}${digits}` : '';
};

/** What a phone widget exposes. */
export const phoneInfo = (e164, country) => {
  const value = typeof e164 === 'string' ? e164 : '';
  let formattedValue = '';
  let isValidNumber = false;
  try {
    formattedValue = value ? formatPhoneNumberIntl(value) || value : '';
    isValidNumber = value ? isValidPhoneNumber(value) : false;
  } catch {
    formattedValue = value;
  }
  return { value, country, countryCode: `+${callingCode(country)}`, formattedValue, isValidNumber };
};
