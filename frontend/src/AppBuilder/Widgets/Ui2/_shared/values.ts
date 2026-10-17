// ToolJet UI 2.0: the small readers every widget uses on bound values. A binding can be anything (undefined, NaN, an
// object, text for a number), so each takes `unknown` and never throws. Where two widgets read a value differently,
// both readers are here under their own names, so neither changes behaviour.
import type { Bound } from './types';

/** Text, a number or a flag: a value an author can type. */
export const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
/** Text or a number (a flag is not a label). */
export const isStringOrNumber = (v: unknown): v is string | number => typeof v === 'string' || typeof v === 'number';
/** Text with something in it besides spaces. */
export const isNonBlankString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
/** A plain object (not null, not an array); T names the shape the caller reads it as. */
export const isRecord = <T extends object = Record<string, unknown>>(v: unknown): v is T =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
/** Set to something other than blank text. */
export const isSet = (v: unknown): boolean => v !== undefined && v !== null && String(v).trim() !== '';
/** A field holds a value: anything but undefined, null, '' and an empty list. 0 and false are values. */
export const isFilled = (v: unknown): boolean =>
  v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);

/** What ToolJet's validation engine should judge for a field: '' when it holds nothing, else a value its mandatory
 *  check reads as filled. The engine's check is `!value`, so a picked false, a typed 0 or a chosen '' option would
 *  read as empty: those go as text ('false', '0', ' '), which its number checks still compare as numbers. */
export const validationInput = (present: boolean, value: unknown): unknown => {
  if (!present) return '';
  if (Array.isArray(value)) return value.length ? value : '';
  return value === 0 || value === false || value === '' ? String(value) || ' ' : value;
};

/** Nothing to show: unset, blank text or NaN. */
export const isEmptyValue = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || Number.isNaN(v);

/** A value as text; '' for unset or an object, so junk never renders [object Object]. */
export const toText = (v: unknown): string => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));
// The URL schemes a bound link may use; anything else (javascript:, vbscript:, data:, file:) could run script or read
// local files. A URL without a scheme (a path, an anchor, //host, www.) is relative and kept.
const LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel', 'sms']);
// Spaces and control characters, which browsers ignore inside a scheme ('java\tscript:'), so they are ignored here too.
// eslint-disable-next-line no-control-regex
const IGNORED_IN_SCHEME = /[\s\u0000-\u001f]/g;
const schemeOf = (url: string): string | null =>
  url
    .replace(IGNORED_IN_SCHEME, '')
    .match(/^([a-z][a-z0-9+.-]*):/i)?.[1]
    .toLowerCase() ?? null;
/** A bound value as a URL a link or window.open may take; '' when it is not text or could run script. */
export const safeUrl = (v: unknown): string => {
  const url = toText(v).trim();
  const scheme = schemeOf(url);
  return scheme === null || LINK_SCHEMES.has(scheme) ? url : '';
};
/** safeUrl for an image's src, which may also be data:image or a blob: (an image never runs script). */
export const safeImageUrl = (v: unknown): string => {
  const url = toText(v).trim();
  return /^data:image\//i.test(url) || schemeOf(url) === 'blob' ? url : safeUrl(url);
};
/** A CSS length from a bound value: a bare number in px, or a number with a unit; undefined for anything else, so
 *  text that is not a length never reaches a style. */
export const cssLength = (v: unknown): string | undefined => {
  const s = toText(v).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return `${s}px`;
  return /^\d+(\.\d+)?(px|%|r?em|vw|vh|ch)$/.test(s) ? s : undefined;
};
/** A CSS length: a bare number in px ('12' reads 12px), anything else as written. */
export const px = (v: unknown): string => (/^\d+(\.\d+)?$/.test(String(v).trim()) ? `${v}px` : String(v));
/** A CSS length that may be negative (letter spacing): a bare number, signed or not, in px; anything else as written.
 *  Sizes that cannot be negative (radius, font size) use px. */
export const signedPx = (v: unknown): string =>
  /^-?\d+(\.\d+)?$/.test(String(v).trim()) ? `${String(v).trim()}px` : String(v);
/** A number padded to two digits (clock parts). */
export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** A bound list as it is (its items untyped, as bound); anything else (unset, an object, a string) as []. T names what
 *  the caller's list holds. */
export const list = <T = Bound>(v: unknown): T[] => (Array.isArray(v) ? v : []);
/** A map entry for a value, never an inherited key (a "constructor" from junk data). */
export const own = <T>(map: Record<string, T>, key: unknown): T | undefined =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;

// ---- Numbers ---------------------------------------------------------------------------------------------------------

/** A finite number, or null: numbers, numeric strings ("1,200", " 42 "); never booleans, objects or NaN. */
export const num = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const t = v.trim().replace(/,/g, '');
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/** n within [lo, hi]. */
export const clampNumber = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** A number (as `num` reads it) within [lo, hi]; `fallback` for anything else. */
export const clamp = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = num(v);
  return n === null ? fallback : clampNumber(n, lo, hi);
};

/** clamp for values read with Number(): a flag counts (true is 1), grouped text ("1,200") does not, blank text is not a
 *  number. The display widgets have always read their sizes this way. */
export const clampCoerce = (value: unknown, min: number, max: number, fallback: number = min): number => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim() === '' ? NaN : value);
  return Number.isFinite(n) ? clampNumber(n, min, max) : fallback;
};

/** A whole number within [min, max] read with Number() (null reads 0), or the fallback when it is not a number. */
export const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? clampNumber(n, min, max) : fallback;
};
