import tinycolor from 'tinycolor2';
import type { CSSProperties } from 'react';
import type { CssVars, Resolved, StyleWithVars } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isSet, px } from '@/AppBuilder/Widgets/Ui2/_shared/values';
// ToolJet UI 2.0 Kanban: its styles as CSS. Each style falls back to the app theme when unset.
// Background, border, radius and shadow go inline on the column or card. Colours of text, the count badge and the
// accent go in CSS variables the board's utility classes read; the accent overrides the pack's primary colour for the board, so the selection outline,
// progress bars, drop line and hover borders all follow it.

export const SHADOWS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 10px -2px rgb(0 0 0 / 0.08)',
  lg: '0 12px 24px -6px rgb(0 0 0 / 0.16)',
};

const VARIABLES: [styleKey: string, cssVar: string, toCss?: (value: unknown) => string][] = [
  ['accentColor', '--sc-primary'],
  ['columnTitleColor', '--kb-col-title'],
  ['columnCountBackgroundColor', '--kb-count-bg'],
  ['columnCountTextColor', '--kb-count-fg'],
  ['cardTitleColor', '--kb-card-title'],
  ['cardTextColor', '--kb-card-text'],
  ['columnGap', '--kb-col-gap', px],
];

/** The board's look: variables for the board root, the progress bar's colour, and the column and card styles. */
export interface KanbanLook {
  vars: CssVars;
  progress: CssVars | undefined;
  column: StyleWithVars;
  /** The column has a border colour: it draws through the border class (an inline border loses to the reset). */
  columnFramed: boolean;
  card: CSSProperties & { background: string };
}

export const kanbanLook = (styles: Resolved = {}): KanbanLook => ({
  vars: Object.fromEntries(
    VARIABLES.filter(([key]) => isSet(styles[key])).map(([key, name, toCss = String]) => [name, toCss(styles[key])])
  ),
  // Progress bars draw in the pack's primary colour: overriding it on the bar alone gives them their own colour.
  progress: isSet(styles.progressColor) ? { '--sc-primary': String(styles.progressColor) } : undefined,
  column: {
    background: isSet(styles.columnBackgroundColor)
      ? styles.columnBackgroundColor
      : 'color-mix(in srgb, var(--sc-muted) 60%, transparent)',
    borderRadius: isSet(styles.columnBorderRadius) ? px(styles.columnBorderRadius) : 'calc(var(--sc-radius) + 4px)',
    // The pack's border reset beats an inline border, so the column border drew only through the class (ShadKanban).
    ...(isSet(styles.columnBorderColor) ? { '--kb-column-border': String(styles.columnBorderColor) } : {}),
  },
  columnFramed: isSet(styles.columnBorderColor),
  card: {
    background: isSet(styles.cardBackgroundColor) ? styles.cardBackgroundColor : 'var(--sc-card)',
    borderColor: isSet(styles.cardBorderColor) ? styles.cardBorderColor : 'var(--sc-border)',
    borderRadius: isSet(styles.cardBorderRadius) ? px(styles.cardBorderRadius) : 'var(--sc-radius)',
    boxShadow: SHADOWS[styles.cardShadow] ?? (isSet(styles.cardShadow) ? styles.cardShadow : SHADOWS.sm),
  },
});

/** A badge's colours from the author's map (value -> colour, matched exactly or ignoring case), as the variables its
 *  classes read. A colour is the text, on a 14% tint of it; a light colour (a tint such as #DCFCE7, which models often
 *  mean as the chip) is the background instead, with a deep text of the same hue; { text, background } sets both.
 *  Null when the map does not name the value. */
export const badgeLook = (value: unknown, badgeColors: unknown): CssVars | null => {
  if (!badgeColors || typeof badgeColors !== 'object' || !isSet(value)) return null;
  const text = String(value);
  const key =
    Object.keys(badgeColors).find((k) => k === text) ??
    Object.keys(badgeColors).find((k) => k.toLowerCase() === text.toLowerCase());
  const colour: unknown = key === undefined ? undefined : (badgeColors as Record<string, unknown>)[key];
  if (colour && typeof colour === 'object') {
    const pair = colour as Record<string, unknown>;
    const fg = pair.text ?? pair.color ?? pair.textColor;
    const bg = pair.background ?? pair.bg ?? pair.backgroundColor;
    if (!isSet(fg) && !isSet(bg)) return null;
    return {
      '--kb-badge-fg': String(isSet(fg) ? fg : deepOf(bg)),
      '--kb-badge-bg': String(isSet(bg) ? bg : `color-mix(in srgb, ${fg} 14%, transparent)`),
    };
  }
  if (!isSet(colour)) return null;
  const parsed = tinycolor(String(colour));
  if (parsed.isValid() && parsed.getLuminance() > 0.6) {
    return { '--kb-badge-fg': deepOf(colour), '--kb-badge-bg': String(colour) };
  }
  return { '--kb-badge-fg': String(colour), '--kb-badge-bg': `color-mix(in srgb, ${colour} 14%, transparent)` };
};

/** A deep, readable text colour of the same hue as a (light) colour: tailwind's 800 step, roughly. */
const deepOf = (colour: unknown): string => {
  const parsed = tinycolor(String(colour));
  if (!parsed.isValid()) return 'var(--sc-foreground)';
  const { h, s } = parsed.toHsl();
  return tinycolor({ h, s: Math.max(s, 0.55), l: 0.24 }).toHexString();
};
