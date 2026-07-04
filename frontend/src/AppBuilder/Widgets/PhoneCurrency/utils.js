// eslint-disable-next-line import/no-unresolved
import { getCountryCallingCode } from 'react-phone-number-input/input';

export const getCountryCallingCodeSafe = (country) => {
  try {
    return getCountryCallingCode(country);
  } catch (error) {
    return '';
  }
};

// Truncates (not rounds) the decimal part to `digits` places; non-decimal
// values pass through as their string form (useInput.js formatNumber parity).
export const formatNumber = (value, digits) => {
  const num = value?.toString();
  if (num?.includes('.')) {
    const [int, dec] = num.split('.');
    return Number(int + '.' + dec.slice(0, digits));
  }
  return num;
};

// Parse value to number based on the number format ('us' | 'eu').
// Always returns a number for consistent exposed value.
export const parseValueToNumber = (val, numberFormat) => {
  if (val === undefined || val === null || val === '') return 0;

  const strVal = String(val);

  // Raw number (no group separators, '.' decimal) — e.g. after a format switch.
  if (/^-?\d+\.?\d*$/.test(strVal)) {
    return parseFloat(strVal) || 0;
  }

  let normalized;
  if (numberFormat === 'eu') {
    // European format: dot is group separator, comma is decimal — "1.234,56" → "1234.56"
    normalized = strVal.replace(/\./g, '').replace(',', '.');
  } else {
    // US/UK format: comma is group separator, dot is decimal — "1,234.56" → "1234.56"
    normalized = strVal.replace(/,/g, '');
  }
  return parseFloat(normalized) || 0;
};
