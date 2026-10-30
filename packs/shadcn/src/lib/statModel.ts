// The Stat's pure logic, ported from UI 2.0 (Ui2/Stat/statModel.ts and the format helpers it calls): its figure, its
// change chip, its trend line and its progress bar. Every function takes whatever the author bound and never throws.

import { currencyCode, localeFor, moneyDigits, moneyStyle, numberFormat } from './locale';

const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isSet = (v: unknown): boolean => v !== undefined && v !== null && String(v).trim() !== '';

/** A number from a number or numeric text ('1,250' too); null otherwise. */
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

// ---- Number formats ------------------------------------------------------------------------------------------------

type NumberFormat = 'number' | 'currency' | 'percent' | 'compact';
const FORMATS: readonly string[] = ['number', 'currency', 'percent', 'compact'];
const isFormat = (format: unknown): format is NumberFormat => typeof format === 'string' && FORMATS.includes(format);


/** A number in the format; percent takes values already in percent (42 shows 42%). Money with cents shows both digits. */
const formatNumber = (n: number, format: NumberFormat, currency: unknown, locale: string): string => {
  if (format === 'currency') return numberFormat(locale, moneyStyle(currencyCode(currency), moneyDigits(n, locale))).format(n);
  if (format === 'compact') return numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  if (format === 'percent') return `${numberFormat(locale, { maximumFractionDigits: 1 }).format(n)}%`;
  return numberFormat(locale, { maximumFractionDigits: 2 }).format(n);
};

/** A figure written as text, as a number: plain ("1250", "-12.5") or grouped the way the viewer's locale writes numbers
 *  ("1,250.5" in English, "1.250,5" in German). null for other text, and for text the two readings disagree on. */
const figureOf = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const plain = /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : null;
  let parts: Intl.NumberFormatPart[] = [];
  try {
    parts = new Intl.NumberFormat().formatToParts(12345.6);
  } catch {
    return plain;
  }
  const group = parts.find((p) => p.type === 'group')?.value ?? ',';
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
  const esc = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const grouped = new RegExp(`^-?(\\d{1,3}(${esc(group)}\\d{3})+|\\d+)(${esc(decimal)}\\d+)?$`);
  const local = grouped.test(text) ? Number(text.split(group).join('').replace(decimal, '.')) : null;
  if (plain !== null && local !== null && plain !== local) return null;
  return plain ?? local;
};

const CHANGE_FORMATS: readonly string[] = ['percent', 'number', 'currency'];

/** A change as shown: signed (+12.4%, −3.2, no sign at zero) and rounded, never a raw float: a percent to one decimal,
 *  a number to at most one, money in the currency's own decimals. direction is the sign of the figure as shown. */
const formatChange = (n: number, format: unknown, currency?: unknown, locale?: unknown): { text: string; direction: number } => {
  const kind = typeof format === 'string' && CHANGE_FORMATS.includes(format) ? format : 'number';
  const where = localeFor(currency, locale);
  const f =
    kind === 'currency'
      ? numberFormat(where, moneyStyle(currencyCode(currency)))
      : numberFormat(where, { minimumFractionDigits: kind === 'percent' ? 1 : 0, maximumFractionDigits: 1 });
  const digits = f.resolvedOptions().maximumFractionDigits ?? 1;
  const shown = Math.round(Math.abs(n) * 10 ** digits) / 10 ** digits;
  const direction = shown === 0 ? 0 : Math.sign(n);
  const sign = direction > 0 ? '+' : direction < 0 ? '−' : '';
  return { text: `${sign}${f.format(shown)}${kind === 'percent' ? '%' : ''}`, direction };
};

/** A long money or number figure shortened for a small space: "+$190,800.00" as "+$190.8K", keeping its sign and
 *  currency. Under 10,000, percentages and anything with words are left as written. */
const FIGURE = /^([+\-−±]?)\s?([$€£¥₹]?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?$/;
export const compactFigure = (text: unknown): string => {
  const s = String(text ?? '').trim();
  const m = s.match(FIGURE);
  if (!m) return s;
  const n = Number(m[3].replace(/,/g, '') + (m[4] ?? ''));
  if (!Number.isFinite(n) || n < 10000) return s;
  const [unit, letter]: [number, string] = n >= 1e9 ? [1e9, 'B'] : n >= 1e6 ? [1e6, 'M'] : [1e3, 'K'];
  const v = n / unit;
  const shown = v.toFixed(v < 10 ? 2 : 1).replace(/\.?0+$/, '');
  return `${m[1]}${m[2]}${shown}${letter}`;
};

// ---- Stat ----------------------------------------------------------------------------------------------------------

/** The figure a Stat shows. A bare number groups its digits ('auto'); valueFormat 'number', 'currency', 'percent'
 *  (42.5 shows 42.5%, a ratio below 1 is scaled) or 'compact' formats numbers and numeric text. Other text
 *  ("$1,250.00", "12 open") shows as written. */
export const statValue = (
  value: unknown,
  { valueFormat = 'auto', currency, locale }: { valueFormat?: unknown; currency?: unknown; locale?: unknown } = {}
): string => {
  if (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))) return '';
  if (typeof value === 'object') return '';
  const where = localeFor(currency, locale);
  if (!isFormat(valueFormat)) return typeof value === 'number' ? formatNumber(value, 'number', currency, where) : String(value);
  const n = figureOf(value);
  if (n === null) return String(value);
  const shown = valueFormat === 'percent' && n !== 0 && Math.abs(n) < 1 ? n * 100 : n;
  return formatNumber(shown, valueFormat, currency, where);
};

/** A change written with its context ("+8 vs last week") as { chip: '+8', context: 'vs last week' }: the chip holds the
 *  figure and the words go to the context line. A bare figure or words without one stay whole. */
const LEADING_FIGURE = /^\s*([+\-−±]?\s?[$€£¥₹]?\d[\d.,]*\s?%?[kKmMbB]?)\s+(\S.*?)\s*$/;
export const splitChange = (change: unknown): { chip: string; context: string } => {
  const text = change === null || change === undefined || typeof change === 'object' ? '' : String(change).trim();
  const match = text.match(LEADING_FIGURE);
  return match ? { chip: match[1].replace(/\s+/g, ''), context: match[2] } : { chip: text, context: '' };
};

/** The change chip's figure: a bare number or numeric text ("12.4", "-9.79", "−3%") in the change format (a written %
 *  makes it a percent), with its direction from its sign. null for anything else ("+$1,200", "Flat"). */
const BARE_CHANGE = /^([+\-−])?\s*(\d+(?:\.\d+)?|\.\d+)\s*(%)?$/;
export const statChange = (chip: unknown, format: unknown, currency?: unknown, locale?: unknown): { text: string; direction: number } | null => {
  if (typeof chip === 'number') return Number.isFinite(chip) ? formatChange(chip, format, currency, locale) : null;
  const match = typeof chip === 'string' ? chip.trim().match(BARE_CHANGE) : null;
  if (!match) return null;
  const n = Number(match[2]) * (match[1] && match[1] !== '+' ? -1 : 1);
  return formatChange(n, match[3] ? 'percent' : format, currency, locale);
};

/** The direction a written change reads: a leading +, - or arrow; 0 when it has none. */
export const textDirection = (text: string): number => (/^[+↑▲]/.test(text) ? 1 : /^[-−↓▼]/.test(text) ? -1 : 0);

/** A progress value clamped to 0 to 100, or null when unset or not a number. */
export const progressPercent = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) return null;
  const n = num(value);
  if (n === null) return null;
  return Math.min(100, Math.max(0, n));
};

// ---- Trend line ----------------------------------------------------------------------------------------------------

const MAX_POINTS = 2000;

/** The trend line's numbers from [3, 5, 4], '3,5,4' or [{ x, y }] (also { label, value }); the last 2000 are kept. */
const sparkValues = (data: unknown): number[] => {
  const raw: unknown[] = Array.isArray(data) ? data : typeof data === 'string' ? data.split(',') : [];
  return raw
    .slice(-MAX_POINTS)
    .map((d) => (isRecord(d) ? num(d.y !== undefined ? d.y : d.value) : isScalar(d) ? num(d) : null))
    .filter((y): y is number => y !== null);
};

/** SVG paths for a small trend line across a width x height box: `line` (the stroke) and `area` (the same line closed
 *  down to the bottom, for a soft fill). null when there are fewer than two numbers or the box has no size. */
export const sparkPaths = (data: unknown, width: number, height: number): { line: string; area: string } | null => {
  if (!(width > 0) || !(height > 0)) return null;
  const ys = sparkValues(data);
  if (ys.length < 2) return null;
  const pad = 2;
  const min = Math.min(...ys);
  const span = Math.max(...ys) - min;
  const step = (width - pad * 2) / (ys.length - 1);
  // Equal values draw a flat line through the middle rather than along an edge.
  const xy = ys.map((y, i) => ({ x: pad + i * step, y: span === 0 ? height / 2 : pad + (1 - (y - min) / span) * (height - pad * 2) }));
  const line = xy.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${line} L${xy[xy.length - 1].x.toFixed(2)},${height} L${xy[0].x.toFixed(2)},${height} Z`;
  return { line, area };
};

// ---- Typeface styles -----------------------------------------------------------------------------------------------

const FONT_STACKS: Record<string, string> = {
  sans: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  display: "Didot, 'Bodoni 72', 'Bodoni MT', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

/** A font-family value: '' for the theme font, a preset's stack, or the author's own family names with a fallback. */
export const fontStack = (value: unknown): string => {
  if (!isSet(value) || typeof value === 'object') return '';
  const key = String(value).trim().toLowerCase();
  if (key === 'theme') return '';
  if (FONT_STACKS[key]) return FONT_STACKS[key];
  const own = String(value).replace(/[^\w\s,'"-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!/[A-Za-z]/.test(own)) return '';
  return /(serif|monospace|cursive|fantasy|system-ui)\s*$/.test(own) ? own : `${own}, sans-serif`;
};

/** A text-transform value, or '' for none and anything unknown. */
export const textCase = (value: unknown): string =>
  ['uppercase', 'lowercase', 'capitalize'].includes(String(value ?? '').trim()) ? String(value).trim() : '';

/** A length: a bare number as px, a CSS length (0.12em) as written; '' for anything else. */
export const signedPx = (value: unknown): string => {
  if (!isSet(value) || typeof value === 'object') return '';
  const text = String(value).trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) return `${text}px`;
  return /^-?\d*\.?\d+(px|em|rem|%)$/.test(text) ? text : '';
};
