// eslint-disable-next-line import/no-unresolved
import { getCountryCallingCode } from 'react-phone-number-input/input';

export const getCountryCallingCodeSafe = (country) => {
  try {
    return getCountryCallingCode(country);
  } catch (error) {
    return '';
  }
};

/**
 * Normalize anything a builder or a query can supply into the E.164 value the phone
 * library expects: `+<targetCallingCode><nationalNumber>`, or '' when no digits remain.
 *
 * A dial code is stripped only when BOTH hold:
 *   - the input is explicitly international, i.e. it starts with '+', and
 *   - the code it carries is `strippableCallingCode` — the country we already know the
 *     value belongs to (the current country, or the previous one on a country change).
 *
 * Bare digits are therefore always a national number, so a US number beginning `1` or an
 * Indian one beginning `91` keeps every digit. And a value carrying some OTHER country's
 * code is left alone rather than guessed at: if a builder pairs `+91...` with country US,
 * that mismatch is theirs to resolve, and we simply apply the selected country.
 */
export const toE164 = (rawValue, targetCallingCode, strippableCallingCode = targetCallingCode) => {
  const text = `${rawValue ?? ''}`.trim();
  if (!text) return '';

  let nationalNumber;
  if (text.startsWith('+')) {
    const digits = text.slice(1).replace(/\D/g, '');
    const knownCode = `${strippableCallingCode ?? ''}`;
    nationalNumber = knownCode && digits.startsWith(knownCode) ? digits.slice(knownCode.length) : digits;
  } else {
    nationalNumber = text.replace(/\D/g, '');
  }

  return nationalNumber ? `+${targetCallingCode}${nationalNumber}` : '';
};
