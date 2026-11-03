// UI 2.0's typeface styles for the text widgets (Ui2/_shared/looks/typeLook.ts), as inline CSS: an unset style adds
// nothing, so the tone's or level's own font, weight and size apply.
import type { CSSProperties } from 'react';
import { FONT_LABELS, FONT_VALUES, fontStack, isSet } from './lists/model';

export { FONT_LABELS, FONT_VALUES, fontStack };

export const WEIGHT_VALUES = ['', '400', '500', '600', '700', '800'];
export const WEIGHT_LABELS = { '': 'Default', '400': 'Regular', '500': 'Medium', '600': 'Semibold', '700': 'Bold', '800': 'Extra bold' };
export const CASE_VALUES = ['none', 'uppercase', 'lowercase', 'capitalize'];
export const CASE_LABELS = { none: 'As typed', uppercase: 'UPPERCASE', lowercase: 'lowercase', capitalize: 'Capitalize' };

// The pack's older weight names, read as UI 2.0's numbers.
const OLD_WEIGHTS: Record<string, string> = { normal: '400', medium: '500', semibold: '600', bold: '700' };

/** A font-weight (100 to 900, or a keyword), or ''. */
export const fontWeight = (value: unknown): string => {
  const v = String(value ?? '').trim();
  if (OLD_WEIGHTS[v]) return OLD_WEIGHTS[v];
  return /^[1-9]00$/.test(v) || v === 'bold' ? v : '';
};

/** A text-transform, or '' for none and anything unknown. */
export const textCase = (value: unknown): string => {
  const v = String(value ?? '').trim();
  return ['uppercase', 'lowercase', 'capitalize'].includes(v) ? v : '';
};

/** A CSS length that may be negative: a bare number in px, anything else as written. */
export const signedPx = (v: unknown): string => {
  const t = String(v ?? '').trim();
  return /^-?\d+(\.\d+)?$/.test(t) ? `${t}px` : t;
};

/** A font size in px from a number or '24px'; 0 and junk read as unset. */
export const fontSizePx = (v: unknown): number | undefined => {
  const n = parseFloat(String(v ?? ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** The set typeface styles as inline CSS; a custom size takes a proportional line height. */
export const typeStyle = (
  s: { fontFamily?: unknown; fontWeight?: unknown; letterSpacing?: unknown; textTransform?: unknown; fontSize?: unknown },
  lineHeight: number
): CSSProperties => {
  const out: CSSProperties = {};
  const family = fontStack(s.fontFamily);
  if (family) out.fontFamily = family;
  const weight = fontWeight(s.fontWeight);
  if (weight) out.fontWeight = weight as CSSProperties['fontWeight'];
  if (isSet(s.letterSpacing) && signedPx(s.letterSpacing) && signedPx(s.letterSpacing) !== '0px') out.letterSpacing = signedPx(s.letterSpacing);
  const casing = textCase(s.textTransform);
  if (casing) out.textTransform = casing as CSSProperties['textTransform'];
  const size = fontSizePx(s.fontSize);
  if (size) {
    out.fontSize = size;
    out.lineHeight = `${lineHeight}px`;
  }
  return out;
};
