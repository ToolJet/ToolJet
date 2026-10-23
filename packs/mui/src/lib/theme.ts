import { createTheme, getLuminance } from '@mui/material/styles';
import type { Theme, ThemeOptions } from '@mui/material/styles';

// The pack is drawn in Material UI's own look (pack.json themeMode "own"): the host defines ToolJet's --tj-* theme
// tokens on the component only once the app applies a theme. Each token, when present, replaces MUI's stock value;
// when absent, MUI's default theme stands (palette, Roboto, 4px shape). MUI computes hover, focus and contrast colours
// from the palette in JavaScript, so the tokens are read as computed colours, not passed as var(--tj-*).

/** A component's Styles, by MUI theme path. Empty values leave the app theme or MUI's default. */
export type ThemeOverrides = {
  primary?: string;
  textPrimary?: string;
  backgroundPaper?: string;
  divider?: string;
  borderRadius?: number;
};

/** The app theme's values as read at the component: each undefined when the app has no theme applied. */
export type AppTheme = {
  mode: 'light' | 'dark';
  brand?: string;
  onBrand?: string;
  surface?: string;
  text?: string;
  textMuted?: string;
  border?: string;
  borderWeak?: string;
  danger?: string;
  success?: string;
  warning?: string;
  radius?: number;
  font?: string;
};

// MUI's default typography stack, also the font when the app theme sets none.
export const MUI_FONT = '"Roboto", "Helvetica", "Arial", sans-serif';

// A canvas normalises any CSS colour (named, hsl, oklch, color-mix) to #rrggbb or rgba(), which MUI can parse.
let probe: CanvasRenderingContext2D | null | undefined;
export const normalizeColor = (value: string): string | undefined => {
  if (!value) return undefined;
  if (probe === undefined) probe = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  if (!probe) return undefined;
  probe.fillStyle = '#010203';
  probe.fillStyle = value;
  const out = String(probe.fillStyle);
  // An unparsable value leaves the sentinel in place.
  return out === '#010203' && !/^#010203$/i.test(value.trim()) ? undefined : out;
};

/** The app theme at `el`. Light or dark always follows the app (its surface colour); the rest only when themed. */
export const readAppTheme = (el: Element): AppTheme => {
  const cs = getComputedStyle(el);
  const cssVar = (name: string) => normalizeColor(cs.getPropertyValue(name).trim());
  const surface = cssVar('--tj-surface');
  const appSurface = surface ?? cssVar('--cc-surface1-surface');
  const mode = appSurface && getLuminance(appSurface) < 0.4 ? 'dark' : 'light';
  const brand = cssVar('--tj-brand');
  if (!brand) return { mode };
  const radius = parseFloat(cs.getPropertyValue('--tj-radius'));
  const font = cs.getPropertyValue('--cc-font-family').trim();
  return {
    mode,
    brand,
    onBrand: cssVar('--tj-on-brand'),
    surface,
    text: cssVar('--tj-text'),
    textMuted: cssVar('--tj-text-muted'),
    border: cssVar('--tj-border'),
    borderWeak: cssVar('--tj-border-weak'),
    danger: cssVar('--tj-danger'),
    success: cssVar('--tj-success'),
    warning: cssVar('--tj-warning'),
    radius: Number.isFinite(radius) ? radius : undefined,
    font: font || undefined,
  };
};

export const sameAppTheme = (a: AppTheme, b: AppTheme) => JSON.stringify(a) === JSON.stringify(b);

const defined = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

/**
 * MUI's theme: its defaults, then the app theme's tokens where the app applies a theme, then the component's own
 * Styles. Every portalled popup (Popper, Modal and what builds on them) goes to `container`.
 */
export const buildTheme = (app: AppTheme, o: ThemeOverrides, container: HTMLElement | null): Theme => {
  const portal = container ? { container } : {};
  const primary = o.primary ?? app.brand;
  const radius = o.borderRadius ?? app.radius;
  const border = app.border;
  const options: ThemeOptions = {
    palette: {
      mode: app.mode,
      ...(primary ? { primary: defined({ main: primary, contrastText: o.primary ? undefined : app.onBrand }) as { main: string } } : {}),
      ...(app.danger ? { error: { main: app.danger } } : {}),
      ...(app.success ? { success: { main: app.success } } : {}),
      ...(app.warning ? { warning: { main: app.warning } } : {}),
      ...(o.backgroundPaper ?? app.surface ? { background: { paper: (o.backgroundPaper ?? app.surface)!, default: (o.backgroundPaper ?? app.surface)! } } : {}),
      ...(o.textPrimary ?? app.text ? { text: defined({ primary: o.textPrimary ?? app.text, secondary: app.textMuted }) } : {}),
      ...(o.divider ?? app.borderWeak ? { divider: (o.divider ?? app.borderWeak)! } : {}),
    },
    ...(radius !== undefined ? { shape: { borderRadius: radius } } : {}),
    typography: { fontFamily: app.font ?? MUI_FONT },
    components: {
      MuiPopper: { defaultProps: portal },
      MuiModal: { defaultProps: portal },
      MuiPopover: { defaultProps: portal },
      // A themed app's border colour on fields, and its surface on dark Paper (MUI otherwise tints it by elevation).
      ...(border ? { MuiOutlinedInput: { styleOverrides: { notchedOutline: { borderColor: border } } } } : {}),
      ...(app.surface ? { MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } } } : {}),
    },
  };
  return createTheme(options);
};
