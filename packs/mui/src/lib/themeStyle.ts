import { ToolJet } from '@tooljet/custom-component-sdk';

// A colour style's default is the ToolJet theme token the pack's theme mapping reads for it (theme.ts readAppTheme:
// --tj-brand is var(--cc-primary-brand), and so on), so the inspector shows it as that theme swatch instead of a blank
// field. Left at that default, or cleared, the style adds nothing: the app theme draws it when one is applied, MUI's
// stock look otherwise (themeMode "own" in .tooljet/config.json). Any other value, a theme swatch included, is the component's own.
export const THEME_TOKEN = {
  brand: 'var(--cc-primary-brand)',
  text: 'var(--cc-primary-text)',
  surface: 'var(--cc-surface1-surface)',
  borderWeak: 'var(--cc-weak-border)',
} as const;

const squash = (v: string) => v.replace(/\s+/g, '').toLowerCase();

/** A colour style's own value: undefined when it is empty or still its theme default. */
export const ownColor = (value: unknown, token: string): string | undefined => {
  if (value === undefined || value === null || typeof value === 'object') return undefined;
  const v = String(value).trim();
  return v === '' || squash(v) === squash(token) ? undefined : v;
};

type ColorStyle = {
  name: string;
  label: string;
  /** The THEME_TOKEN it draws when left alone. */
  token: string;
  section?: string;
  visibleWhen?: { key: string; value: string | number | boolean | null };
};

/** A colour style defaulting to the theme token it draws; its own value, or undefined to follow the theme. */
export const useColorStyle = ({ token, ...rest }: ColorStyle): string | undefined =>
  ownColor(ToolJet.useStyleString({ ...rest, inspector: 'color', initialValue: token }), token);
