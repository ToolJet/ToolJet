// Ink: a colour as small text on a tint of itself (a status chip, badge or tag), readable at 4.5:1 in light and dark
// themes. The formula lives in styles/ui.css (--ui-ink-pole, --ui-ink-lch, and the tones' --ui-*-ink); this is the same
// expression for an inline style.
export const inkOf = (color: string) => `oklch(from color-mix(in oklab, ${color} 50%, var(--ui-ink-pole)) var(--ui-ink-lch))`;
