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
 *  Where the text would read under 4.5:1 on its chip it is deepened just enough (inkOn, deepOf). Null when the map
 *  does not name the value. */
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
  return { '--kb-badge-fg': inkOn(colour), '--kb-badge-bg': `color-mix(in srgb, ${colour} 14%, transparent)` };
};

// WCAG 1.4.3 for normal-size text: badge labels are 12px.
const NORMAL_TEXT = 4.5;
// The tint behind it (the 14% in badgeLook).
const TINT = 0.14;

type Rgb = [number, number, number];
const rgbOf = (colour: string): Rgb => {
  const hex = tinycolor(colour).toHexString();
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
};
// WCAG relative luminance.
const luminance = (c: Rgb) =>
  c
    .map((v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: Rgb, b: Rgb) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
/** color-mix in srgb: `share` of a, the rest of b. */
const mix = (a: Rgb, b: Rgb, share: number): Rgb => [0, 1, 2].map((i) => a[i] * share + b[i] * (1 - share)) as Rgb;

// The card and text colours a label is checked on, one pair per mode. Each channel is the worst of ToolJet's shipped
// themes (the lightest light-mode text, the lightest dark-mode card, the dimmest dark-mode text), so a label that
// reads here reads on each of them (auditKanbanBadgeContrast checks every shipped theme). One value serves both modes,
// so a colour keeps its own text only where it reads on both.
const SURFACES: { card: Rgb; text: Rgb }[] = [
  { card: rgbOf('#ffffff'), text: rgbOf('#382f47') },
  { card: rgbOf('#2a2731'), text: rgbOf('#bbc1ca') },
];

const inks = new Map<string, string>();
/** A colour as 12px text on its 14% tint: the colour itself where it reads at 4.5:1 on light and dark cards, else the
 *  status ink (shadcn.scss), mixed toward the theme's text colour (darker on light themes, lighter on dark ones) only
 *  as far as it takes to read. A colour tinycolor cannot read (a CSS variable) gets the status ink's half mix. */
const inkOn = (colour: unknown): string => {
  const text = String(colour);
  const known = inks.get(text);
  if (known) return known;
  let ink = `color-mix(in srgb, ${text} 50%, var(--sc-foreground))`;
  if (tinycolor(text).isValid()) {
    const c = rgbOf(text);
    const reads = (share: number) =>
      SURFACES.every(({ card, text: fg }) => {
        const tint = mix(c, card, TINT);
        return contrast(mix(c, fg, share), tint) >= NORMAL_TEXT;
      });
    let share = 100;
    while (share > 0 && !reads(share / 100)) share -= 1;
    ink = share === 100 ? text : `color-mix(in srgb, ${text} ${share}%, var(--sc-foreground))`;
  }
  if (inks.size > 500) inks.clear();
  inks.set(text, ink);
  return ink;
};

/** A deep, readable text colour of the same hue as a (light) colour: tailwind's 800 step, roughly, and darker where
 *  that reads under 4.5:1 on the colour (a bright cyan or yellow): its lightness lowered just enough, as primaryStrong
 *  does for a brand fill. */
const deepOf = (colour: unknown): string => {
  const parsed = tinycolor(String(colour));
  if (!parsed.isValid()) return 'var(--sc-foreground)';
  const { h, s } = parsed.toHsl();
  const at = (l: number) => tinycolor({ h, s: Math.max(s, 0.55), l }).toHexString();
  const bg = rgbOf(parsed.toHexString());
  if (contrast(rgbOf(at(0.24)), bg) >= NORMAL_TEXT) return at(0.24);
  // Lightness bisected between black (which reads) and the 800 step (which does not), checked on the hex it becomes.
  let [pass, fail] = [0, 0.24];
  while (fail - pass > 0.001) {
    const mid = (pass + fail) / 2;
    if (contrast(rgbOf(at(mid)), bg) >= NORMAL_TEXT) pass = mid;
    else fail = mid;
  }
  return at(pass);
};
