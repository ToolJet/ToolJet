// ToolJet UI 2.0: typeface styles for text widgets (Heading, Text, Stat). Each set style becomes a CSS variable on the
// widget's root (see LOOKS in shadcnLook.ts) and a class from shadcn.scss that reads it; an unset style adds neither,
// so the theme's font and the tone's own weight and size apply.
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** Named stacks that need no download: system and ToolJet-bundled faces (Inter, IBM Plex Mono). */
export const FONT_STACKS: Record<string, string> = {
  sans: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  display: "Didot, 'Bodoni 72', 'Bodoni MT', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

/** The Font style's presets: [value, label]. */
export const FONT_OPTIONS: [value: string, label: string][] = [
  ['theme', 'Theme font'],
  ['sans', 'Sans serif'],
  ['serif', 'Serif'],
  ['display', 'Display serif'],
  ['mono', 'Monospace'],
];

const CASES = ['uppercase', 'lowercase', 'capitalize'];

/** A font-family value for the style: '' for the theme font, a preset's stack, or the author's own family names
 *  (only letters, digits, spaces, quotes, commas and hyphens survive) with a generic fallback. */
export const fontStack = (value: unknown): string => {
  if (!isSet(value) || typeof value === 'object') return '';
  const key = String(value).trim().toLowerCase();
  if (key === 'theme') return '';
  if (FONT_STACKS[key]) return FONT_STACKS[key];
  const own = String(value)
    .replace(/[^\w\s,'"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  if (!/[A-Za-z]/.test(own)) return '';
  return /(serif|monospace|cursive|fantasy|system-ui)\s*$/.test(own) ? own : `${own}, sans-serif`;
};

/** A text-transform value, or '' for none and anything unknown. */
export const textCase = (value: unknown): string =>
  CASES.includes(String(value ?? '').trim()) ? String(value).trim() : '';

/** A font-weight value (100 to 900, or a keyword), or ''. */
export const fontWeight = (value: unknown): string => {
  const v = String(value ?? '').trim();
  return /^[1-9]00$/.test(v) || ['normal', 'bold'].includes(v) ? v : '';
};

const CLASSES: [styleKey: string, className: string, resolve: (value: unknown) => string][] = [
  ['fontFamily', 'lk-font', fontStack],
  ['fontWeight', 'lk-weight', fontWeight],
  ['letterSpacing', 'lk-tracking', (v) => (isSet(v) ? String(v) : '')],
  ['textTransform', 'lk-case', textCase],
  ['fontSize', 'lk-size', (v) => (isSet(v) ? String(v) : '')],
];

/** The shadcn.scss classes for the typeface styles the author set (in a stable order). */
export const typeClasses = (styles: Resolved | undefined = {}): string[] =>
  CLASSES.filter(([key, , resolve]) => resolve(styles?.[key]) !== '').map(([, name]) => name);

/** How many whole lines of text fit in a box of `height` px at `lineHeight` px a line (at least one), or null when
 *  either is unknown. A fixed-height heading clamps to this many lines: a long recipe name in a 44px sheet title
 *  wrapped onto a second line that covered the description under it (2026-10-12). */
export const clampLines = (height: unknown, lineHeight: unknown): number | null => {
  const h = Number(height);
  const lh = Number(lineHeight);
  if (!Number.isFinite(h) || !Number.isFinite(lh) || lh <= 0 || h <= 0) return null;
  return Math.max(1, Math.floor((h + 2) / lh));
};
