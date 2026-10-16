// shadcn/ui pack (experiment): pure logic of the inputs widgets (number, password, currency and OTP); the phone widget's
// is in phoneModel.js, the time and date widgets' in dateModel.js. Every function takes junk (null, objects, NaN, huge
// numbers) without throwing.

export const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** A whole number within [min, max]; `fallback` when the value is blank or not a number. */
export const clampInt = (v, min, max, fallback) => {
  if (isBlank(v) || typeof v === 'object' || typeof v === 'boolean') return fallback;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

// ---- Numbers -------------------------------------------------------------------------------------------------------

/** The group and decimal separators of a locale ('' or an unknown locale: en-US). */
export const separators = (locale) => {
  try {
    const parts = new Intl.NumberFormat(isBlank(locale) ? 'en-US' : String(locale)).formatToParts(12345.6);
    return {
      group: parts.find((p) => p.type === 'group')?.value ?? ',',
      decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    };
  } catch {
    return { group: ',', decimal: '.' };
  }
};

/** A number from a number or from text typed in a locale's format ('1,234.5', '1.234,5', '$ 12'); null when there
 *  is no number. */
export const parseNumber = (v, locale) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (isBlank(v) || (typeof v !== 'string' && typeof v !== 'bigint')) return null;
  const { group, decimal } = separators(locale);
  let s = String(v).trim();
  const negative = /^\s*[(-]|^[^\d]*-/.test(s);
  // Spaces, no-break spaces and apostrophes are group separators in some locales.
  s = s.replace(/[\s\u00a0\u202f']/g, '');
  if (group && group.trim()) s = s.split(group).join('');
  if (decimal !== '.') s = s.split(decimal).join('.');
  s = s.replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
  if (!/\d/.test(s)) return null;
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
};

/** Rounds to `decimals` places (0 to 10) without float noise (1.005 -> 1.01). */
export const roundTo = (n, decimals) => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  const d = clampInt(decimals, 0, 10, 2);
  const rounded = Number(`${Math.round(Number(`${n}e${d}`))}e-${d}`);
  return Number.isFinite(rounded) ? rounded : Number(n.toFixed(d));
};

/** A number as text for a field: grouped by the locale when `grouping`, up to (or, with `fixed`, exactly) `decimals`
 *  places. */
export const formatNumber = (n, { decimals = 2, grouping = true, locale = 'en-US', fixed = false } = {}) => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  const d = clampInt(decimals, 0, 10, 2);
  const options = { useGrouping: !!grouping, maximumFractionDigits: d, minimumFractionDigits: fixed ? d : 0 };
  try {
    return new Intl.NumberFormat(isBlank(locale) ? 'en-US' : String(locale), options).format(n);
  } catch {
    return new Intl.NumberFormat('en-US', options).format(n);
  }
};

/** Characters a number field accepts while typing. */
export const numericText = (text) => String(text ?? '').replace(/[^\d.,\-\s'\u00a0\u202f]/g, '');

/** One step up (dir 1) or down (dir -1) from `value`, kept within min and max when they are numbers. */
export const stepValue = (value, step, dir, { min, max, decimals } = {}) => {
  const s = Math.abs(Number(step)) || 1;
  const lo = parseNumber(min);
  const hi = parseNumber(max);
  const base = typeof value === 'number' && Number.isFinite(value) ? value : lo !== null && dir > 0 ? lo - s : 0;
  let next = roundTo(base + s * (dir < 0 ? -1 : 1), decimals ?? 10);
  if (lo !== null && next < lo) next = lo;
  if (hi !== null && next > hi) next = hi;
  return next;
};

// ---- Currency ------------------------------------------------------------------------------------------------------

/** A currency code Intl knows ('usd' -> 'USD'); `fallback` for anything else. */
export const toCurrency = (code, fallback = 'USD') => {
  const c = String(code ?? '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) return fallback;
  try {
    new Intl.NumberFormat('en-US', { style: 'currency', currency: c });
    return c;
  } catch {
    return fallback;
  }
};

const CURRENCY_DISPLAYS = ['symbol', 'narrowSymbol', 'code', 'name'];
const currencyFormat = (locale, currency, display, decimals) => {
  const options = {
    style: 'currency',
    currency: toCurrency(currency),
    currencyDisplay: CURRENCY_DISPLAYS.includes(display) ? display : 'symbol',
    ...(decimals === undefined ? {} : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
  };
  try {
    return new Intl.NumberFormat(isBlank(locale) ? 'en-US' : String(locale), options);
  } catch {
    return new Intl.NumberFormat('en-US', options);
  }
};

/** The currency's own number of decimal places (USD 2, JPY 0), or the author's decimalPlaces when set. */
export const currencyDecimals = (currency, decimalPlaces) =>
  isBlank(decimalPlaces)
    ? currencyFormat('en-US', currency, 'code').resolvedOptions().maximumFractionDigits
    : clampInt(decimalPlaces, 0, 10, 2);

/** The sign shown in the box ('$', 'CA$', '€', 'USD') and whether the locale writes it after the number. */
export const currencySign = (currency, locale, display = 'symbol') => {
  const parts = currencyFormat(locale, currency, display === 'name' ? 'code' : display).formatToParts(1);
  const index = parts.findIndex((p) => p.type === 'currency');
  const numberIndex = parts.findIndex((p) => p.type === 'integer');
  return { sign: index === -1 ? toCurrency(currency) : parts[index].value, after: index > numberIndex };
};

/** An amount as the locale writes it with its currency ('$1,250.00', '1.250,00 €'); '' for no amount. */
export const formatCurrency = (n, { currency = 'USD', locale = 'en-US', decimals, display = 'symbol' } = {}) => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  return currencyFormat(locale, currency, display, currencyDecimals(currency, decimals)).format(n);
};

/** Currency codes from a list of codes or of { value, label } objects, valid and without repeats. */
export const toCurrencyList = (v) => {
  const out = [];
  for (const item of Array.isArray(v) ? v : []) {
    const raw = item !== null && typeof item === 'object' ? item.value ?? item.code ?? item.label : item;
    const code = toCurrency(raw, null);
    if (code && !out.includes(code)) out.push(code);
  }
  return out.slice(0, 200);
};

// ---- Password ------------------------------------------------------------------------------------------------------

/** How strong a password is: '' (empty), 'weak', 'fair' or 'strong', with the number of meter segments lit (0-3).
 *  Length counts most; mixing lower and upper case, digits and symbols adds to it. */
export const passwordStrength = (password) => {
  const pw = typeof password === 'string' ? password : isBlank(password) ? '' : String(password);
  if (!pw) return { level: '', label: '', segments: 0 };
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  let score = (pw.length >= 8 ? 1 : 0) + (pw.length >= 12 ? 1 : 0) + Math.max(0, classes - 1);
  if (pw.length < 6 || /^(.)\1+$/.test(pw)) score = 0;
  if (score <= 2) return { level: 'weak', label: 'Weak', segments: 1 };
  if (score === 3) return { level: 'fair', label: 'Fair', segments: 2 };
  return { level: 'strong', label: 'Strong', segments: 3 };
};

// ---- OTP -----------------------------------------------------------------------------------------------------------

export const otpLength = (v) => clampInt(v, 4, 8, 6);

/** The characters an OTP keeps from typed or pasted text: digits (numeric) or letters and digits, up to `length`.
 *  Pasting a formatted code ('123-456', '12 34 56') keeps its characters only. */
export const otpSanitize = (text, length, characters = 'numeric') => {
  const raw = isBlank(text) || typeof text === 'object' ? '' : String(text);
  const kept = characters === 'alphanumeric' ? raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : raw.replace(/\D/g, '');
  return kept.slice(0, otpLength(length));
};
