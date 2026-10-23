// A copy of UI 2.0's Ui2/_inputs/inputsModel.ts (the pack cannot import ToolJet's frontend), with the pure logic of
// the other inputs below it: tags and rating (Ui2/_pickers/pickersModel.ts), slider (Ui2/Slider/sliderModel.ts),
// colour (Ui2/_pickers/colorModel.ts) and files (Ui2/_pickers/fileModel.ts). Every function takes junk (null, objects,
// NaN, huge numbers) without throwing.

export const isBlank = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** A whole number within [min, max]; `fallback` when the value is blank or not a number. */
export const clampInt = <F>(v: unknown, min: number, max: number, fallback: F): number | F => {
  if (isBlank(v) || typeof v === 'object' || typeof v === 'boolean') return fallback;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

// ---- Numbers -------------------------------------------------------------------------------------------------------

// Every numbering system Intl knows, read once from its own formatting: each digit ('٣' and '৩' are 3), its
// separators and minus sign, and the marks it writes around a number (the direction mark before an Arabic minus). Digits read in any field;
// which of '.' and ',' is the decimal separator is the field's locale's choice.
interface NumberingSystems {
  digits: Map<string, string>;
  separators: Set<string>;
  marks: Set<string>;
}
let numbering: NumberingSystems | null = null;
const numberingSystems = (): NumberingSystems => {
  if (numbering) return numbering;
  const known: NumberingSystems = { digits: new Map(), separators: new Set(), marks: new Set() };
  const intl = Intl as { supportedValuesOf?: (key: string) => string[] };
  let systems = ['latn', 'arab', 'arabext'];
  try {
    systems = intl.supportedValuesOf?.('numberingSystem') ?? systems;
  } catch {
    // An older browser: the systems above.
  }
  for (const system of systems) {
    try {
      const parts = new Intl.NumberFormat(`en-u-nu-${system}`).formatToParts(-9876543210.5);
      const digits = Array.from(
        parts
          .filter((p) => p.type === 'integer')
          .map((p) => p.value)
          .join('')
      );
      if (digits.length === 10) digits.forEach((d, i) => known.digits.set(d, String(9 - i)));
      for (const p of parts) {
        const into =
          p.type === 'literal' ? known.marks : p.type === 'fraction' || p.type === 'integer' ? null : known.separators;
        for (const c of p.value) into?.add(c);
      }
    } catch {
      // A system Intl names but cannot format with: its digits stay unread.
    }
  }
  numbering = known;
  return known;
};

/** The group and decimal separators and the minus sign of a locale ('' or an unknown locale: en-US). */
export const separators = (locale: unknown): { group: string; decimal: string; minus: string } => {
  try {
    const parts = new Intl.NumberFormat(isBlank(locale) ? 'en-US' : String(locale)).formatToParts(-12345.6);
    return {
      group: parts.find((p) => p.type === 'group')?.value ?? ',',
      decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
      minus: parts.find((p) => p.type === 'minusSign')?.value ?? '-',
    };
  } catch {
    return { group: ',', decimal: '.', minus: '-' };
  }
};

// U+2212, the minus sign many locales write (Swedish, Finnish, Persian), is a minus in any field, as the hyphen is.
const MINUS_SIGN = '\u2212';

/** Text in ASCII digits with '-' for its minus sign: any numbering system's digits, the locale's minus sign as Intl
 *  writes it, and the direction marks around them dropped. Separators are left as typed. */
const asciiNumber = (text: string, minus: string): string => {
  const { digits, marks } = numberingSystems();
  const s = Array.from(text, (c) => (marks.has(c) ? '' : digits.get(c) ?? c)).join('');
  return (minus && minus !== '-' ? s.split(minus).join('-') : s).split(MINUS_SIGN).join('-');
};

/** A number from a number or from text typed in a locale's format ('1,234.5', '1.234,5', '$ 12', '−1 234,5',
 *  '١٬٢٣٤٫٥'); null when there is no number. */
export const parseNumber = (v: unknown, locale?: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (isBlank(v) || (typeof v !== 'string' && typeof v !== 'bigint')) return null;
  const { group, decimal, minus } = separators(locale);
  let s = asciiNumber(String(v).trim(), minus);
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
export const roundTo = (n: unknown, decimals: unknown): number | null => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  const d = clampInt(decimals, 0, 10, 2);
  const rounded = Number(`${Math.round(Number(`${n}e${d}`))}e-${d}`);
  return Number.isFinite(rounded) ? rounded : Number(n.toFixed(d));
};

/** A number as text for a field: grouped by the locale when `grouping`, up to (or, with `fixed`, exactly) `decimals`
 *  places. */
export interface NumberFormat {
  decimals?: unknown;
  grouping?: unknown;
  locale?: unknown;
  fixed?: boolean;
}

export const formatNumber = (
  n: unknown,
  { decimals = 2, grouping = true, locale = 'en-US', fixed = false }: NumberFormat = {}
): string => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  const d = clampInt(decimals, 0, 10, 2);
  const options: Intl.NumberFormatOptions = {
    useGrouping: !!grouping,
    maximumFractionDigits: d,
    minimumFractionDigits: fixed ? d : 0,
  };
  try {
    return new Intl.NumberFormat(isBlank(locale) ? 'en-US' : String(locale), options).format(n);
  } catch {
    return new Intl.NumberFormat('en-US', options).format(n);
  }
};

/** Characters a number field accepts while typing: digits of any numbering system, the separators, minus signs and
 *  direction marks a locale writes, spaces and apostrophes. */
export const numericText = (text: unknown): string => {
  const { digits, separators: kept, marks } = numberingSystems();
  return Array.from(String(text ?? ''))
    .filter(
      (c) => digits.has(c) || kept.has(c) || marks.has(c) || c === MINUS_SIGN || /[\d.,\-\s'\u00a0\u202f]/.test(c)
    )
    .join('');
};

/** One step up (dir 1) or down (dir -1) from `value`, kept within min and max when they are numbers. */
export interface StepBounds {
  min?: unknown;
  max?: unknown;
  decimals?: unknown;
}

export const stepValue = (
  value: unknown,
  step: unknown,
  dir: number,
  { min, max, decimals }: StepBounds = {}
): number | null => {
  const s = Math.abs(Number(step)) || 1;
  const lo = parseNumber(min);
  const hi = parseNumber(max);
  const base = typeof value === 'number' && Number.isFinite(value) ? value : lo !== null && dir > 0 ? lo - s : 0;
  let next = roundTo(base + s * (dir < 0 ? -1 : 1), decimals ?? 10);
  // next is null only past the largest number; it compares as 0 there, as it always did.
  if (lo !== null && Number(next) < lo) next = lo;
  if (hi !== null && Number(next) > hi) next = hi;
  return next;
};

// ---- Currency ------------------------------------------------------------------------------------------------------

/** A currency code Intl knows ('usd' -> 'USD'); `fallback` for anything else. */
export const toCurrency = <F = string>(code: unknown, fallback: string | F = 'USD'): string | F => {
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

type CurrencyDisplay = NonNullable<Intl.NumberFormatOptions['currencyDisplay']>;
const CURRENCY_DISPLAYS: readonly unknown[] = ['symbol', 'narrowSymbol', 'code', 'name'];
const isCurrencyDisplay = (display: unknown): display is CurrencyDisplay => CURRENCY_DISPLAYS.includes(display);
const currencyFormat = (locale: unknown, currency: unknown, display: unknown, decimals?: number) => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: toCurrency(currency),
    currencyDisplay: isCurrencyDisplay(display) ? display : 'symbol',
    ...(decimals === undefined ? {} : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
  };
  try {
    return new Intl.NumberFormat(isBlank(locale) ? 'en-US' : String(locale), options);
  } catch {
    return new Intl.NumberFormat('en-US', options);
  }
};

/** The currency's own number of decimal places (USD 2, JPY 0), or the author's decimalPlaces when set. */
export const currencyDecimals = (currency: unknown, decimalPlaces: unknown): number | undefined =>
  isBlank(decimalPlaces)
    ? currencyFormat('en-US', currency, 'code').resolvedOptions().maximumFractionDigits
    : clampInt(decimalPlaces, 0, 10, 2);

/** The sign shown in the box ('$', 'CA$', '€', 'USD') and whether the locale writes it after the number. */
export const currencySign = (
  currency: unknown,
  locale: unknown,
  display: unknown = 'symbol'
): { sign: string; after: boolean } => {
  const parts = currencyFormat(locale, currency, display === 'name' ? 'code' : display).formatToParts(1);
  const index = parts.findIndex((p) => p.type === 'currency');
  const numberIndex = parts.findIndex((p) => p.type === 'integer');
  return { sign: index === -1 ? toCurrency(currency) : parts[index].value, after: index > numberIndex };
};

/** An amount as the locale writes it with its currency ('$1,250.00', '1.250,00 €'); '' for no amount. */
export interface CurrencyFormat {
  currency?: unknown;
  locale?: unknown;
  decimals?: unknown;
  display?: unknown;
}

export const formatCurrency = (
  n: unknown,
  { currency = 'USD', locale = 'en-US', decimals, display = 'symbol' }: CurrencyFormat = {}
): string => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  return currencyFormat(locale, currency, display, currencyDecimals(currency, decimals)).format(n);
};

/** Currency codes from a list of codes or of { value, label } objects, valid and without repeats. */
export const toCurrencyList = (v: unknown): string[] => {
  const out: string[] = [];
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
export interface PasswordStrength {
  level: '' | 'weak' | 'fair' | 'strong';
  label: string;
  segments: number;
}

export const passwordStrength = (password: unknown): PasswordStrength => {
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

export const otpLength = (v: unknown): number => clampInt(v, 4, 8, 6);

/** The characters an OTP keeps from typed or pasted text: digits (numeric) or letters and digits, up to `length`.
 *  Pasting a formatted code ('123-456', '12 34 56') keeps its characters only. */
export const otpSanitize = (text: unknown, length: unknown, characters: unknown = 'numeric'): string => {
  const raw = isBlank(text) || typeof text === 'object' ? '' : String(text);
  const kept = characters === 'alphanumeric' ? raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : raw.replace(/\D/g, '');
  return kept.slice(0, otpLength(length));
};

// ---- Shared --------------------------------------------------------------------------------------------------------

export const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

export const list = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Text of a bound value: '' for null, objects and the like. */
export const toText = (v: unknown): string => (isScalar(v) ? String(v) : '');

const clamp = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v.replace(/,/g, '')) : NaN;
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

// ---- Tags ----------------------------------------------------------------------------------------------------------

// A tags field past this many tags is a binding mistake; the rest are dropped.
export const MAX_TAGS = 1000;

/** A selection limit: 0 means none. */
export const clampLimit = (v: unknown): number => clampInt(v, 0, 10000, 0);

/** Tags from a list of values or a comma-separated text: trimmed text, empties dropped. */
export const toTags = (v: unknown): string[] => {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',', MAX_TAGS * 2) : [];
  return raw
    .slice(0, MAX_TAGS * 2)
    .filter(isScalar)
    .map((t) => String(t).trim())
    .filter(Boolean);
};

/** Typed or pasted text split on commas and new lines: { parts (complete entries), rest (what is still typed) }. */
export const splitTyped = (text: unknown): { parts: string[]; rest: string } => {
  const pieces = String(text ?? '').split(/[,\n\r]/);
  const rest = pieces.pop() ?? '';
  return { parts: pieces.map((p) => p.trim()).filter(Boolean), rest };
};

/** The author's pattern, or null when it is empty, invalid or too long to trust. */
export const safeRegex = (pattern: unknown): RegExp | null => {
  const source = pattern instanceof RegExp ? pattern.source : isScalar(pattern) ? String(pattern) : '';
  if (source.trim() === '' || source.length > 500) return null;
  try {
    return new RegExp(source, pattern instanceof RegExp ? pattern.flags.replace('g', '') : '');
  } catch {
    return null;
  }
};

export const sameTag = (a: unknown, b: unknown, caseSensitive?: unknown): boolean =>
  caseSensitive ? String(a) === String(b) : String(a).toLowerCase() === String(b).toLowerCase();

export interface TagRules {
  maxTags?: unknown;
  caseSensitive?: unknown;
  pattern?: unknown;
  patternError?: unknown;
}

/** Adds candidates to the tags: { tags, added, error }. Duplicates (ignoring case unless caseSensitive), tags that
 *  fail the pattern and tags past maxTags are refused, with the reason in `error`. */
export const addTags = (
  tags: unknown,
  candidates: unknown,
  { maxTags = 0, caseSensitive = false, pattern, patternError }: TagRules = {}
): { tags: string[]; added: string[]; error: string } => {
  const next = [...toTags(tags)].slice(0, MAX_TAGS);
  const added: string[] = [];
  let error = '';
  const max = clampInt(maxTags, 0, MAX_TAGS, 0) || MAX_TAGS;
  const re = safeRegex(pattern);
  const norm = (t: string) => (caseSensitive ? String(t) : String(t).toLowerCase());
  const seen = new Set(next.map(norm));
  for (const tag of toTags(candidates)) {
    if (seen.has(norm(tag))) {
      error = `"${tag}" is already added`;
      continue;
    }
    if (re && !re.test(tag)) {
      error = isScalar(patternError) && String(patternError).trim() ? String(patternError) : `"${tag}" is not valid`;
      continue;
    }
    if (next.length >= max) {
      error = `You can add up to ${max} tag${max === 1 ? '' : 's'}`;
      break;
    }
    seen.add(norm(tag));
    next.push(tag);
    added.push(tag);
  }
  return { tags: next, added, error };
};

/** Suggestions as { label, tag }: plain values or { label, value } objects. */
export const toSuggestions = (v: unknown): { label: string; tag: string }[] =>
  list(v)
    .map((o) => {
      if (isScalar(o)) return { label: String(o), tag: String(o) };
      if (o && typeof o === 'object') {
        const e = o as Record<string, unknown>;
        const value = isScalar(e.value) ? String(e.value) : isScalar(e.label) ? String(e.label) : '';
        return { label: isScalar(e.label) ? String(e.label) : value, tag: value };
      }
      return null;
    })
    .filter((s): s is { label: string; tag: string } => !!s && s.tag.trim() !== '');

// ---- Rating --------------------------------------------------------------------------------------------------------

/** The number of icons: 1 to 10, 5 when unset or junk. */
export const clampMax = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && v !== null && v !== '' ? Math.max(1, Math.min(10, n)) : 5;
};

/** A rating between 0 and max, in whole steps (or halves with allowHalf). */
export const normalizeRating = (v: unknown, max: unknown = 5, allowHalf: unknown = false): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const step = allowHalf ? Math.round(n * 2) / 2 : Math.round(n);
  return Math.max(0, Math.min(clampMax(max), step));
};

export const iconFill = (position: number, value: number): 'full' | 'half' | 'empty' => {
  if (value >= position) return 'full';
  if (value >= position - 0.5) return 'half';
  return 'empty';
};

/** The rating one keyboard step away (dir +1 or -1), kept between one step and max. */
export const stepRating = (value: unknown, dir: number, max: unknown = 5, allowHalf: unknown = false): number => {
  const step = allowHalf ? 0.5 : 1;
  const next = normalizeRating(value, max, allowHalf) + (dir > 0 ? step : -step);
  return Math.max(step, Math.min(clampMax(max), next));
};

// ---- Slider --------------------------------------------------------------------------------------------------------

// A range slider draws one thumb per value; past this, the rest of a bound list is ignored.
export const MAX_THUMBS = 10;

export interface SliderBounds {
  min: number;
  max: number;
  step: number;
}

const finite = (v: unknown, fallback: number): number => {
  if (v === null || v === undefined || v === '' || typeof v === 'object' || typeof v === 'boolean') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** min, max and step as Radix needs them: finite, min below max, a positive step no wider than the track. */
export const sliderBounds = ({ min, max, step }: { min?: unknown; max?: unknown; step?: unknown } = {}): SliderBounds => {
  let lo = finite(min, 0);
  let hi = finite(max, 100);
  if (hi < lo) [lo, hi] = [hi, lo];
  if (hi === lo) hi = lo + 1;
  let s = finite(step, 1);
  if (s <= 0 || s > hi - lo) s = Math.min(1, hi - lo);
  return { min: lo, max: hi, step: s };
};

/** The thumbs' values: a list is a range (at most MAX_THUMBS, in order), anything else one thumb; each value is a
 *  number within the bounds (junk reads as the minimum). */
export const sliderValues = (raw: unknown, bounds: SliderBounds): number[] => {
  const fit = (v: unknown) => Math.min(bounds.max, Math.max(bounds.min, finite(v, bounds.min)));
  if (!Array.isArray(raw)) return [fit(raw)];
  const values = raw.slice(0, MAX_THUMBS).map(fit);
  return values.length ? values.sort((a, b) => a - b) : [bounds.min];
};

// ---- Colour --------------------------------------------------------------------------------------------------------

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

export type Hsva = Hsv & { a: number };

const hex2 = (n: number | undefined): string => Math.round(clamp(n, 0, 255, 0)).toString(16).padStart(2, '0');

/** Colour text as '#rrggbb' (or '#rrggbbaa' with allowAlpha and some transparency); null when it is not a colour.
 *  Reads #rgb, #rgba, #rrggbb, #rrggbbaa (with or without '#'), rgb() and rgba(). */
export const normalizeHex = (input: unknown, allowAlpha = false): string | null => {
  if (!isScalar(input)) return null;
  const text = String(input).trim().toLowerCase();
  let r: number, g: number, b: number, a: number;
  const rgb = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (rgb) {
    [r, g, b] = [rgb[1], rgb[2], rgb[3]].map(Number);
    if ([r, g, b].some((n) => !Number.isFinite(n) || n > 255)) return null;
    a = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : Number(rgb[4]);
    a = Math.round(clamp(a, 0, 1, 0) * 255);
  } else {
    let h = text.replace(/^#/, '');
    if (!/^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(h)) return null;
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    a = h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255;
  }
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  return allowAlpha && a < 255 ? `${base}${hex2(a)}` : base;
};

export const hexToRgba = (input: unknown): Rgba | null => {
  const hex = normalizeHex(input, true);
  if (!hex) return null;
  const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
  return { r: n(1), g: n(3), b: n(5), a: hex.length === 9 ? Math.round((n(7) / 255) * 100) / 100 : 1 };
};

export const rgbaToHex = ({ r, g, b, a = 1 }: Partial<Rgba> = {}, allowAlpha = false): string => {
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  const alpha = Math.round(clamp(Number(a), 0, 1, 0) * 255);
  return allowAlpha && alpha < 255 ? `${base}${hex2(alpha)}` : base;
};

/** The exposed forms of a colour: 'rgb(r, g, b)' and 'rgba(r, g, b, a)' ('' for no colour). */
export const colorForms = (hex: unknown): { rgb: string; rgba: string } => {
  const c = hexToRgba(hex);
  if (!c) return { rgb: '', rgba: '' };
  return { rgb: `rgb(${c.r}, ${c.g}, ${c.b})`, rgba: `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})` };
};

export const rgbToHsv = ({ r, g, b }: Pick<Rgba, 'r' | 'g' | 'b'>): Hsv => {
  const [rr, gg, bb] = [r, g, b].map((n) => clamp(Number(n), 0, 255, 0) / 255);
  const max = Math.max(rr, gg, bb);
  const d = max - Math.min(rr, gg, bb);
  let h = 0;
  if (d) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
};

export const hsvToRgb = ({ h, s, v }: Hsv): Pick<Rgba, 'r' | 'g' | 'b'> => {
  const hh = (((Number(h) || 0) % 360) + 360) % 360;
  const ss = clamp(Number(s), 0, 1, 0);
  const vv = clamp(Number(v), 0, 1, 0);
  const c = vv * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;
  const [r, g, b] =
    hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
};

export const toHsva = (hex: unknown, keepHue?: number): Hsva => {
  const c = hexToRgba(hex);
  if (!c) return { h: keepHue ?? 0, s: 0, v: 1, a: 1 };
  const hsv = rgbToHsv(c);
  return { ...hsv, h: (hsv.s === 0 || hsv.v === 0) && keepHue !== undefined ? keepHue : hsv.h, a: c.a };
};

/** Black or white, whichever reads better on the colour (for a check mark on a swatch). */
export const contrastOn = (hex: unknown): string => {
  const c = hexToRgba(hex);
  if (!c) return '#000000';
  const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  return lum > 0.6 || c.a < 0.5 ? '#000000' : '#ffffff';
};

/** The preset swatches: valid colours only, duplicates dropped, at most 64. */
export const toSwatches = (v: unknown): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of list(v)) {
    const hex = normalizeHex(entry, true);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    out.push(hex);
    if (out.length >= 64) break;
  }
  return out;
};

export const CHECKERBOARD = 'repeating-conic-gradient(#d4d4d4 0% 25%, #ffffff 0% 50%) 50% / 8px 8px';

/** A swatch's fill: the colour over a checkerboard when it is see-through. */
export const swatchStyle = (hex: string): { background: string } | undefined => {
  if (!hex) return undefined;
  return hex.length === 9 ? { background: `linear-gradient(${hex}, ${hex}), ${CHECKERBOARD}` } : { background: hex };
};

// ---- Files ---------------------------------------------------------------------------------------------------------

export type FileKind = 'image' | 'pdf' | 'sheet' | 'text' | 'archive' | 'audio' | 'video' | 'other';

/** A byte count as text: '0 B', '512 B', '1.5 KB', '5 MB'. */
export const formatBytes = (n: unknown): string => {
  const bytes = Number(n);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${i === 0 ? value : Math.round(value * 10) / 10} ${units[i]}`;
};

/** The accepted types as a list: from 'image/*, .pdf' or ['image/*', '.pdf']. */
export const acceptList = (accept: unknown): string[] =>
  (Array.isArray(accept) ? accept : typeof accept === 'string' ? accept.split(',') : [])
    .filter(isScalar)
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => /^\.[a-z0-9]+$/.test(t) || /^[a-z]+\/[a-z0-9.+*-]+$/.test(t));

/** Whether a file is one of the accepted types (any file when none are given). */
export const accepts = (file: { name: string; type: string }, accept: unknown): boolean => {
  const types = acceptList(accept);
  if (!types.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return types.some((t) =>
    t.startsWith('.') ? name.endsWith(t) : t.endsWith('/*') ? type.startsWith(t.slice(0, -1)) : type === t
  );
};

const MIME_NAME: Record<string, string> = {
  'image/*': 'Images',
  'video/*': 'Videos',
  'audio/*': 'Audio',
  'text/*': 'Text files',
  'application/pdf': 'PDF',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
  'application/json': 'JSON',
  'image/svg+xml': 'SVG',
  'image/jpeg': 'JPG',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

/** The accepted types in words: 'Images, PDF, CSV' ('' for any file). */
export const acceptHint = (accept: unknown): string => {
  const names = acceptList(accept).map(
    (t) => MIME_NAME[t] || (t.startsWith('.') ? t.slice(1).toUpperCase() : t.split('/')[1].toUpperCase())
  );
  return [...new Set(names)].join(', ');
};

/** What kind of file it is, for its icon. */
export const fileKind = (type: unknown, name: unknown): FileKind => {
  const t = String(type ?? '').toLowerCase();
  const ext = (String(name ?? '').match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (t === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (/sheet|excel|csv|tab-separated/.test(t) || ['csv', 'tsv', 'xls', 'xlsx'].includes(ext)) return 'sheet';
  if (t.startsWith('audio/')) return 'audio';
  if (t.startsWith('video/')) return 'video';
  if (/zip|compressed|tar|rar|7z/.test(t) || ['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return 'archive';
  if (t.startsWith('text/') || /json|xml|word|document/.test(t) || ['txt', 'md', 'json', 'doc', 'docx'].includes(ext))
    return 'text';
  return 'other';
};

/** A file count limit: 1 to 100 (default 10). */
export const clampFiles = (v: unknown): number => clampInt(v, 1, 100, 10);

/** A size limit in bytes: 0 means none. */
export const clampBytes = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** Delimited text (CSV, TSV) as rows keyed by the first row, with quoted fields ("a, b" and "" for a quote). */
export const parseDelimited = (text: string, delimiter: string): Record<string, string>[] => {
  const sep = delimiter || ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (text.startsWith(sep, i)) {
      row.push(cell);
      cell = '';
      i += sep.length - 1;
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  const [head, ...body] = rows;
  if (!head) return [];
  const keys = head.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
};
