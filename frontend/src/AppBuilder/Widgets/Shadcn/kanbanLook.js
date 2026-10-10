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
 *  classes read: the colour for the text and a 14% tint of it behind. Null when the map does not name the value. */
export const badgeLook = (value, badgeColors) => {
  if (!badgeColors || typeof badgeColors !== 'object' || !isSet(value)) return null;
  const text = String(value);
  const key =
    Object.keys(badgeColors).find((k) => k === text) ??
    Object.keys(badgeColors).find((k) => k.toLowerCase() === text.toLowerCase());
  const colour = key === undefined ? undefined : badgeColors[key];
  if (!isSet(colour)) return null;
  return { '--kb-badge-fg': String(colour), '--kb-badge-bg': `color-mix(in srgb, ${colour} 14%, transparent)` };
};
