// shadcn/ui pack (experiment): pure logic of the inputs widgets (number, password, phone, currency, OTP, time and
// date-time). Every function takes junk (null, objects, NaN, huge numbers) without throwing.
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  formatPhoneNumberIntl,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumber,
} from 'react-phone-number-input';
// eslint-disable-next-line import/no-unresolved
import countryNames from 'react-phone-number-input/locale/en';

dayjs.extend(customParseFormat);

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

// ---- Phone -------------------------------------------------------------------------------------------------------

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

// ---- Time ----------------------------------------------------------------------------------------------------------

/** True for a 24-hour display: '24h', '24', 'HH:mm' (a format with H). */
export const is24h = (format) => {
  const f = String(format ?? '').trim();
  return f === '24' || /^24/.test(f) || (/H/.test(f) && !/h/.test(f));
};

/** Minutes since midnight from '14:30', '2:30 pm', '2pm', '14:30:00', an ISO date-time or a Date; null otherwise. */
export const parseTime = (v) => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getHours() * 60 + v.getMinutes();
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 && v < 1440 ? Math.floor(v) : null;
  if (isBlank(v) || typeof v !== 'string') return null;
  const s = v.trim();
  const iso = s.match(/T(\d{1,2}):(\d{2})/);
  const m = iso || s.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2}(?:\.\d+)?)?\s*([ap]\.?m\.?)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const meridiem = iso ? null : m[3]?.[0]?.toLowerCase();
  if (min > 59) return null;
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (meridiem === 'p' ? 12 : 0);
  }
  if (h > 23) return null;
  return h * 60 + min;
};

const pad = (n) => String(n).padStart(2, '0');

/** Minutes since midnight as 'HH:mm'; '' for none. */
export const toHHmm = (minutes) =>
  typeof minutes === 'number' && Number.isFinite(minutes)
    ? `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`
    : '';

/** Minutes since midnight as shown: '2:30 PM' (12-hour) or '14:30'. */
export const formatTime = (minutes, use24h = false) => {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) return '';
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return use24h ? `${pad(h)}:${pad(m)}` : `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
};

export const minuteStep = (v, fallback = 15) => clampInt(v, 1, 60, fallback);

/** The time bounds as minutes: min defaults to 00:00, max to 23:59; swapped when given the wrong way round. */
export const timeBounds = (minTime, maxTime) => {
  let lo = parseTime(minTime) ?? 0;
  let hi = parseTime(maxTime) ?? 1439;
  if (lo > hi) [lo, hi] = [hi, lo];
  return { lo, hi };
};

export const inTimeRange = (minutes, bounds) => minutes >= bounds.lo && minutes <= bounds.hi;

/** Every pickable time of a list: from the minimum, every `step` minutes, up to the maximum (at most 1440). */
export const timeSlots = (step, minTime, maxTime) => {
  const s = minuteStep(step);
  const { lo, hi } = timeBounds(minTime, maxTime);
  const out = [];
  for (let t = Math.ceil(lo / s) * s; t <= hi && out.length < 1440; t += s) out.push(t);
  return out;
};

/** The minutes of an hour column: 0, step, 2*step ... below 60. */
export const minuteOptions = (step) => {
  const s = minuteStep(step);
  const out = [];
  for (let m = 0; m < 60; m += s) out.push(m);
  return out;
};

/** The nearest time within the bounds. */
export const clampTime = (minutes, bounds) => Math.min(bounds.hi, Math.max(bounds.lo, minutes));

// ---- Date and time -------------------------------------------------------------------------------------------------

const DATE_INPUT_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mm',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DD h:mm A',
  'YYYY-MM-DD',
  'DD/MM/YYYY HH:mm',
  'DD/MM/YYYY',
  'MM/DD/YYYY HH:mm',
  'MM/DD/YYYY',
];

/** A date (dayjs) from ISO text, 'YYYY-MM-DD HH:mm', text in the display `format`, a unix timestamp (seconds or
 *  milliseconds) or a Date; null otherwise. */
export const parseDateTime = (v, format) => {
  if (v === undefined || v === null || v === '' || typeof v === 'boolean') return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : dayjs(v);
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return null;
    const d = dayjs(Math.abs(v) < 1e11 ? v * 1000 : v);
    return d.isValid() ? d : null;
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (/^\d{9,13}$/.test(s)) return parseDateTime(Number(s));
  const formats = isBlank(format) ? DATE_INPUT_FORMATS : [String(format), ...DATE_INPUT_FORMATS];
  for (const f of formats) {
    const d = dayjs(s, f, true);
    if (d.isValid()) return d;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = dayjs(s);
    if (d.isValid()) return d;
  }
  return null;
};

/** What a date-time picker exposes for a date (local time). */
export const dateTimeExposed = (d, displayFormat) =>
  d && d.isValid()
    ? {
        value: d.format('YYYY-MM-DDTHH:mm'),
        selectedDate: d.format('YYYY-MM-DD'),
        selectedTime: d.format('HH:mm'),
        unixTimestamp: d.valueOf(),
        displayValue: safeFormat(d, displayFormat),
      }
    : { value: '', selectedDate: '', selectedTime: '', unixTimestamp: null, displayValue: '' };

/** A date in an author's format, falling back to 'DD MMM YYYY h:mm A' when the format is not text. */
export const safeFormat = (d, format) => {
  if (!d || !d.isValid()) return '';
  try {
    return d.format(isBlank(format) || typeof format !== 'string' ? 'DD MMM YYYY h:mm A' : format);
  } catch {
    return d.format('DD MMM YYYY h:mm A');
  }
};

/** The day bounds (start of day) and disabled days for the calendar, from author input of any shape. */
export const dateRules = ({ minDate, maxDate, disabledDates, format } = {}) => {
  const min = parseDateTime(minDate, format)?.startOf('day') ?? null;
  const max = parseDateTime(maxDate, format)?.startOf('day') ?? null;
  const disabled = (Array.isArray(disabledDates) ? disabledDates : [])
    .slice(0, 1000)
    .map((d) => parseDateTime(d, format))
    .filter(Boolean)
    .map((d) => d.format('YYYY-MM-DD'));
  return { min, max, disabled };
};

/** Why a date cannot be picked under the rules ('' when it can). */
export const dateProblem = (d, rules) => {
  if (!d || !rules) return '';
  const day = d.startOf('day');
  if (rules.min && day.isBefore(rules.min)) return `Pick a date on or after ${rules.min.format('DD MMM YYYY')}`;
  if (rules.max && day.isAfter(rules.max)) return `Pick a date on or before ${rules.max.format('DD MMM YYYY')}`;
  if (rules.disabled.includes(day.format('YYYY-MM-DD'))) return 'This date is not available';
  return '';
};

/** `date` (a dayjs day) at `minutes` past midnight. */
export const atTime = (date, minutes) =>
  date
    .startOf('day')
    .hour(Math.floor(minutes / 60))
    .minute(minutes % 60);
