import { ToolJet } from '@tooljet/custom-component-sdk';

// The ToolJet theme colour a colour style draws when it is left alone, named as the inspector's theme swatches name
// them (var(--cc-...)), so a fresh drop shows a swatch instead of a blank field. Colours only: radius and sizes take
// a placeholder (useThemeNumber), as the drawn number depends on whether an app theme is applied.
export const THEME_COLOR = {
  brand: 'var(--cc-primary-brand)',
  text: 'var(--cc-primary-text)',
  muted: 'var(--cc-placeholder-text)',
  surface: 'var(--cc-surface1-surface)',
  surfaceMuted: 'var(--cc-surface2-surface)',
  surfaceStrong: 'var(--cc-surface3-surface)',
  border: 'var(--cc-default-border)',
  borderWeak: 'var(--cc-weak-border)',
  success: 'var(--cc-success-systemStatus)',
  danger: 'var(--cc-error-systemStatus)',
} as const;

type Extra = { section?: string; description?: string; visibleWhen?: { key: string; value: unknown } };

/**
 * A colour style whose default is the theme colour it draws. Left at that default (or cleared, or a saved app's
 * blank) it reads as unset, so the component keeps its own look: stock Ant with no app theme, the theme with one.
 * Set as an override, the default would have replaced Ant's derived tints and drawn something else.
 */
export const useThemeColor = (name: string, label: string, initialValue: string, extra: Extra = {}): string => {
  const value = ToolJet.useStyleString({ name, label, inspector: 'color', initialValue, ...extra }) as unknown;
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  return text === initialValue ? '' : text;
};

/**
 * A number style (radius, a gap) left blank, with a placeholder naming what it draws when blank. No initialValue: a
 * blank one ('') reached the inspector as {{""}}, an invalid number in red that hid the placeholder.
 */
export const useThemeNumber = (name: string, label: string, placeholder: string, extra: Extra = {}) =>
  ToolJet.useStyleNumber({ name, label, placeholder, inspector: 'numberInput', ...extra }) as unknown as number | '' | undefined;

// Placeholders for the number styles, as drawn in stock Ant (no app theme) and under one.
export const RADIUS_HINT = 'Theme radius (6 in stock Ant)';
export const RADIUS_LG_HINT = 'Theme large radius (8 in stock Ant)';
