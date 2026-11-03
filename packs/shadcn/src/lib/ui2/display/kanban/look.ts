import type { CSSProperties } from 'react';

// UI 2.0's Kanban look (Ui2/_shared/looks/kanbanLook.ts) as the pack's CSS variables. Each style falls back to the
// theme when unset (ui2-display-kanban.css holds the fallbacks).

export const SHADOWS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 10px -2px rgb(0 0 0 / 0.08)',
  lg: '0 12px 24px -6px rgb(0 0 0 / 0.16)',
};

export const isSet = (v: unknown) => v !== undefined && v !== null && v !== '';
/** A CSS length: a bare number in px, anything else as written. */
export const px = (v: unknown): string => (/^\d+(\.\d+)?$/.test(String(v).trim()) ? `${String(v).trim()}px` : String(v));
/** A width the author typed: a number (px) or a length with a unit; anything else is unset. */
export const cssLength = (v: unknown): string | undefined => {
  const s = isSet(v) ? String(v).trim() : '';
  if (/^\d+(\.\d+)?$/.test(s)) return `${s}px`;
  return /^\d+(\.\d+)?(px|%|r?em|vw|vh|ch)$/.test(s) ? s : undefined;
};

/** A field name is text (or a number): anything else bound there (a list of rows) falls back. */
export const fieldName = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value : typeof value === 'number' ? String(value) : fallback;

/** Two initials, of the first and the last word with a letter. */
export const initials = (name: unknown): string => {
  const words = String(name ?? '')
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w));
  if (!words.length) return String(name ?? '').slice(0, 2).toUpperCase();
  const first = words[0].match(/\p{L}/u)?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1].match(/\p{L}/u)?.[0] ?? '' : '';
  return (first + last).toUpperCase();
};

/** The narrowest a column gets before the board scrolls: 200px, 160px on a board of six or more stages, and down to
 *  140px when that lets every stage fit the board. */
export const columnMinimum = (count: number, boardWidth: number, gap = 16): number => {
  const base = count >= 6 ? 160 : 200;
  if (!(boardWidth > 0) || count < 1) return base;
  const share = Math.floor((boardWidth - gap * (count - 1)) / count);
  return Math.max(140, Math.min(base, share));
};

const VARIABLES: [styleKey: string, cssVar: string, toCss?: (value: unknown) => string][] = [
  ['accentColor', '--ui-primary'],
  ['columnBackgroundColor', '--kb-col-bg'],
  ['columnBorderColor', '--kb-col-border'],
  ['columnTitleColor', '--kb-col-title'],
  ['columnCountBackgroundColor', '--kb-count-bg'],
  ['columnCountTextColor', '--kb-count-fg'],
  ['columnGap', '--kb-col-gap', px],
  ['columnBorderRadius', '--kb-col-radius', px],
  ['cardBackgroundColor', '--kb-card-bg'],
  ['cardBorderColor', '--kb-card-border'],
  ['cardTitleColor', '--kb-card-title'],
  ['cardTextColor', '--kb-card-text'],
  ['progressColor', '--kb-progress'],
  ['cardBorderRadius', '--kb-card-radius', px],
];

/** The board's CSS variables from its styles. */
export const kanbanVars = (styles: Record<string, unknown>): CSSProperties => {
  const vars: Record<string, string> = {};
  for (const [key, name, toCss = String] of VARIABLES) if (isSet(styles[key])) vars[name] = toCss(styles[key]);
  if (isSet(styles.accentColor)) vars['--ui-ring'] = `color-mix(in srgb, ${styles.accentColor} 35%, transparent)`;
  const shadow = String(styles.cardShadow ?? '');
  vars['--kb-card-shadow'] = SHADOWS[shadow] ?? (isSet(shadow) ? shadow : SHADOWS.sm);
  return vars as CSSProperties;
};

const hexRgb = (colour: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(colour.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};
const luminance = ([r, g, b]: [number, number, number]) =>
  [r, g, b]
    .map((v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);

/** A badge's colours from the author's map (value -> colour, matched exactly or ignoring case). A colour is the text,
 *  on a 14% tint of it; a light colour (a tint such as #DCFCE7) is the background instead, with a deep text of the same
 *  hue; { text, background } sets both. Null when the map does not name the value. */
export const badgeLook = (value: unknown, badgeColors: unknown): CSSProperties | null => {
  if (!badgeColors || typeof badgeColors !== 'object' || !isSet(value)) return null;
  const text = String(value);
  const map = badgeColors as Record<string, unknown>;
  const key = Object.keys(map).find((k) => k === text) ?? Object.keys(map).find((k) => k.toLowerCase() === text.toLowerCase());
  const colour = key === undefined ? undefined : map[key];
  const deep = (c: unknown) => `color-mix(in srgb, ${c} 35%, #111)`;
  const ink = (c: unknown) => `color-mix(in srgb, ${c} 75%, var(--ui-fg))`;
  if (colour && typeof colour === 'object') {
    const pair = colour as Record<string, unknown>;
    const fg = pair.text ?? pair.color ?? pair.textColor;
    const bg = pair.background ?? pair.bg ?? pair.backgroundColor;
    if (!isSet(fg) && !isSet(bg)) return null;
    return {
      ['--kb-badge-fg' as string]: String(isSet(fg) ? fg : deep(bg)),
      ['--kb-badge-bg' as string]: String(isSet(bg) ? bg : `color-mix(in srgb, ${fg} 14%, transparent)`),
    } as CSSProperties;
  }
  if (!isSet(colour)) return null;
  const rgb = hexRgb(String(colour));
  if (rgb && luminance(rgb) > 0.6) return { ['--kb-badge-fg' as string]: deep(colour), ['--kb-badge-bg' as string]: String(colour) } as CSSProperties;
  return { ['--kb-badge-fg' as string]: ink(colour), ['--kb-badge-bg' as string]: `color-mix(in srgb, ${colour} 14%, transparent)` } as CSSProperties;
};

/** A badge's variant from its word when no colour is mapped (priority, severity). */
export const BADGE_BY_WORD: Record<string, string> = {
  critical: 'destructive',
  urgent: 'destructive',
  high: 'destructive',
  blocked: 'destructive',
  medium: 'warning',
  normal: 'secondary',
  low: 'secondary',
  done: 'success',
};
