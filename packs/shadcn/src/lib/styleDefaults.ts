import { ToolJet } from '@tooljet/custom-component-sdk';

// Style defaults that name what a style draws while unset, so the inspector shows the theme swatch (or the drawn
// number) instead of a blank field. The value a component reads back is still '' while the style sits at that
// default (or is cleared, which the runtime turns back into the default): the component then draws exactly what it
// drew with a blank default, its CSS fallbacks, derived hovers and per-variant colours included. Only a value the
// builder picks reaches the component.

/** The ToolJet theme tokens the colour swatches list (ColorSwatches' Theme tab), by what the pack draws with them. */
export const TOKEN = {
  brand: 'var(--cc-primary-brand)', // --ui-primary: fills, accents, focus ring, selection
  text: 'var(--cc-primary-text)', // --ui-fg
  mutedText: 'var(--cc-placeholder-text)', // --ui-muted-fg: help text, placeholders, captions
  surface: 'var(--cc-surface1-surface)', // --ui-bg; also the text on a brand fill, as native widgets name it
  muted: 'var(--cc-surface3-surface)', // --ui-muted (the host's --tj-surface-muted): tracks, tab lists, hover rows
  surface2: 'var(--cc-surface2-surface)',
  page: 'var(--cc-appBackground-surface)',
  border: 'var(--cc-default-border)', // --ui-border
  weakBorder: 'var(--cc-weak-border)',
  error: 'var(--cc-error-systemStatus)', // --ui-destructive
  success: 'var(--cc-success-systemStatus)', // --ui-success
  warning: 'var(--cc-warning-systemStatus)', // --ui-warning
} as const;

// A token, or the literal colour a style draws when the pack draws a fixed one (#0369a1 info, transparent).
export type Token = (typeof TOKEN)[keyof typeof TOKEN] | (string & {});

// A number style can arrive as text ('16'), and a token with other spacing or case.
const plain = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).replace(/\s+/g, '').toLowerCase() : v);
const same = (value: unknown, drawn: unknown) => plain(value) === plain(drawn);

/** '' while `value` is the declared default, so the component keeps its unset look. */
export const unlessDefault = <V>(value: V, drawn: unknown): V | '' => (same(value, drawn) ? '' : value);

// The other options the style hooks take (section, description, visibleWhen, ...), passed through.
type StyleOptions = Record<string, unknown>;

/** A colour style whose default is the theme token it draws. */
export const useThemeColor = (name: string, label: string, token: Token, options: StyleOptions = {}): string =>
  unlessDefault(ToolJet.useStyleString({ name, label, inspector: 'color', initialValue: token, ...options }), token) as string;

/** A number style (px) with the value it draws as its default. */
export const useDrawnNumber = (name: string, label: string, drawn: number, options: StyleOptions = {}) =>
  unlessDefault(ToolJet.useStyleNumber({ name, label, initialValue: drawn, ...options }), drawn) as number | '';

/** A radius that follows the theme radius while unset: no fixed number to show, so the field says so. */
export const useThemeRadius = (name: string, label: string, options: StyleOptions = {}) =>
  ToolJet.useStyleNumber({ name, label, initialValue: '', placeholder: 'Theme radius', ...options });
