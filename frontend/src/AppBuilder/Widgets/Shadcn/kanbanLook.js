import tinycolor from 'tinycolor2';
// shadcn/ui pack Kanban (experiment): its styles as CSS. Each style falls back to the app theme when unset.
// Background, border, radius and shadow go inline on the column or card. Colours of text, the count badge and the
// accent go in CSS variables the board's utility classes read (the pack's utilities are !important, so inline colours
// would lose to them); the accent overrides the pack's primary colour for the board, so the selection outline,
// progress bars, drop line and hover borders all follow it.

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 10px -2px rgb(0 0 0 / 0.08)',
  lg: '0 12px 24px -6px rgb(0 0 0 / 0.16)',
};

export const isSet = (value) => value !== undefined && value !== null && String(value).trim() !== '';
export const px = (value) => (/^\d+(\.\d+)?$/.test(String(value).trim()) ? `${value}px` : String(value));

const VARIABLES = [
  ['accentColor', '--sc-primary'],
  ['columnTitleColor', '--kb-col-title'],
  ['columnCountBackgroundColor', '--kb-count-bg'],
  ['columnCountTextColor', '--kb-count-fg'],
  ['cardTitleColor', '--kb-card-title'],
  ['cardTextColor', '--kb-card-text'],
  ['columnGap', '--kb-col-gap', px],
];

export const kanbanLook = (styles = {}) => ({
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
    ...(isSet(styles.columnBorderColor) ? { border: `1px solid ${styles.columnBorderColor}` } : {}),
  },
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
export const badgeLook = (value, badgeColors) => {
  if (!badgeColors || typeof badgeColors !== 'object' || !isSet(value)) return null;
  const text = String(value);
  const key =
    Object.keys(badgeColors).find((k) => k === text) ??
    Object.keys(badgeColors).find((k) => k.toLowerCase() === text.toLowerCase());
  const colour = key === undefined ? undefined : badgeColors[key];
  if (colour && typeof colour === 'object') {
    const fg = colour.text ?? colour.color ?? colour.textColor;
    const bg = colour.background ?? colour.bg ?? colour.backgroundColor;
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
const deepOf = (colour) => {
  const parsed = tinycolor(String(colour));
  if (!parsed.isValid()) return 'var(--sc-foreground)';
  const { h, s } = parsed.toHsl();
  return tinycolor({ h, s: Math.max(s, 0.55), l: 0.24 }).toHexString();
};
