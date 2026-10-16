// ToolJet UI 2.0: pure logic of the phone widget. Every function takes junk (null, objects, NaN, huge
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
import type { Country } from 'react-phone-number-input';

/** A country's calling code without the plus ('44'); '' for an unknown country. */
export const callingCode = (country: Country): string => {
  try {
    return getCountryCallingCode(country);
  } catch {
    return '';
  }
};

export const countryName = (country: Country): string => countryNames?.[country] || String(country ?? '');

const ALL_COUNTRIES = getCountries();
/** Whether `c` is one of `countries`. */
const among = (countries: readonly Country[], c: string): c is Country => (countries as readonly string[]).includes(c);
// Where several countries share a calling code, the one a bare '+1' or '+44' means.
const MAIN_COUNTRY: Record<string, Country> = {
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
export const phoneCountries = (only: unknown): Country[] => {
  const wanted = (Array.isArray(only) ? only : [])
    .map((c) =>
      String(c !== null && typeof c === 'object' ? c.value ?? c.code ?? '' : c ?? '')
        .trim()
        .toUpperCase()
    )
    .filter((c): c is Country => among(ALL_COUNTRIES, c));
  return wanted.length ? [...new Set(wanted)] : ALL_COUNTRIES;
};

/** A country from an ISO code ('gb') or a calling code ('+44', 44), among `countries`; null when none matches. */
export const countryFromInput = (input: unknown, countries: readonly Country[] = ALL_COUNTRIES): Country | null => {
  if (isBlank(input) || typeof input === 'object') return null;
  const s = String(input).trim();
  const iso = s.toUpperCase();
  if (among(countries, iso)) return iso;
  const digits = s.replace(/^\+/, '');
  if (!/^\d{1,4}$/.test(digits)) return null;
  const matching = countries.filter((c) => callingCode(c) === digits);
  return matching.includes(MAIN_COUNTRY[digits]) ? MAIN_COUNTRY[digits] : matching[0] ?? null;
};

const pickCountry = (c: unknown, countries: readonly Country[]): Country =>
  countryFromInput(c, countries) ?? (countries.includes('US') ? 'US' : countries[0] ?? 'US');

/** A phone number as E.164 ('+14155550123'): international text as is, a national number for `country`; '' for
 *  none. */
export const toPhoneValue = (v: unknown, country: Country): string => {
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
export const phoneCountry = (e164: unknown, countries: readonly Country[] = ALL_COUNTRIES): Country | null => {
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
export interface PhoneStart {
  value: string;
  country: Country;
  countries: Country[];
}

export const phoneStart = (defaultValue: unknown, defaultCountry: unknown, onlyCountries: unknown): PhoneStart => {
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
export const rebasePhone = (e164: string, from: Country, to: Country): string => {
  if (!e164) return '';
  const old = callingCode(from);
  let digits = String(e164).replace(/\D/g, '');
  if (old && digits.startsWith(old)) digits = digits.slice(old.length);
  const code = callingCode(to);
  return digits && code ? `+${code}${digits}` : '';
};

/** What a phone widget exposes. */
// A type, not an interface: it is passed to setExposedVariables as a record.
export type PhoneInfo = {
  value: string;
  country: Country;
  countryCode: string;
  formattedValue: string;
  isValidNumber: boolean;
};

export const phoneInfo = (e164: unknown, country: Country): PhoneInfo => {
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
