// shadcn/ui pack: typeface styles for text widgets (Heading, Text, Stat). Each set style becomes a CSS variable on the
// widget's root (see LOOKS in shadcnLook.js) and a class from shadcn.scss that reads it; an unset style adds neither,
// so the theme's font and the tone's own weight and size apply.
import { isSet } from './kanbanLook';

/** Named stacks that need no download: system and ToolJet-bundled faces (Inter, IBM Plex Mono). */
export const FONT_STACKS = {
  sans: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  display: "Didot, 'Bodoni 72', 'Bodoni MT', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

export const FONT_OPTIONS = [
  ['theme', 'Theme font'],
  ['sans', 'Sans serif'],
  ['serif', 'Serif'],
  ['display', 'Display serif'],
  ['mono', 'Monospace'],
];

const CASES = ['uppercase', 'lowercase', 'capitalize'];

/** A font-family value for the style: '' for the theme font, a preset's stack, or the author's own family names
 *  (only letters, digits, spaces, quotes, commas and hyphens survive) with a generic fallback. */
export const fontStack = (value) => {
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
export const textCase = (value) => (CASES.includes(String(value ?? '').trim()) ? String(value).trim() : '');

/** A font-weight value (100 to 900, or a keyword), or ''. */
export const fontWeight = (value) => {
  const v = String(value ?? '').trim();
  return /^[1-9]00$/.test(v) || ['normal', 'bold'].includes(v) ? v : '';
};

const CLASSES = [
  ['fontFamily', 'lk-font', fontStack],
  ['fontWeight', 'lk-weight', fontWeight],
  ['letterSpacing', 'lk-tracking', (v) => (isSet(v) ? String(v) : '')],
  ['textTransform', 'lk-case', textCase],
  ['fontSize', 'lk-size', (v) => (isSet(v) ? String(v) : '')],
];

/** The shadcn.scss classes for the typeface styles the author set (in a stable order). */
export const typeClasses = (styles = {}) =>
  CLASSES.filter(([key, , resolve]) => resolve(styles?.[key]) !== '').map(([, name]) => name);
