import { createTheme, darken, decomposeColor, getLuminance, lighten } from '@mui/material/styles';
import type { Theme, ThemeOptions } from '@mui/material/styles';

// The pack is drawn in Material UI's own look (themeMode "own" in .tooljet/config.json): the host defines ToolJet's --tj-* theme
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

// A colour style holding a theme swatch's var(--cc-...) (or any var()) reads as the colour it resolves to at `el`:
// MUI derives hover, focus and contrast from the palette in JavaScript, so it needs the colour itself.
const VAR = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/;
export const resolveColor = (value: string | undefined, el: Element | null, depth = 0): string | undefined => {
  const v = value?.trim();
  if (!v) return undefined;
  const m = VAR.exec(v);
  if (!m) return normalizeColor(v);
  if (depth > 4) return undefined;
  const own = el ? getComputedStyle(el).getPropertyValue(m[1]).trim() : '';
  return resolveColor(own || m[2], el, depth + 1);
};

/** The component's colour styles as colours MUI can parse (a var() resolved at `el`); unparsable ones drop out. */
export const resolveOverrides = (o: ThemeOverrides, el: Element | null): ThemeOverrides => ({
  primary: resolveColor(o.primary, el),
  textPrimary: resolveColor(o.textPrimary, el),
  backgroundPaper: resolveColor(o.backgroundPaper, el),
  divider: resolveColor(o.divider, el),
  borderRadius: o.borderRadius,
});

// The charts' series colours when a chart sets no colors list: led by the brand (the Primary style, else the app
// theme's), then tints and a deeper shade of it. In a themed app the rest comes from the theme too: its system colours,
// then the brand mixed with them and a deeper shade (as the Ant pack's charts); with only a Primary style (no app
// theme), a palette that sits well beside it (as the shadcn pack's seriesColors). Computed colours, not color-mix():
// MUI X fades and highlights series by parsing them.
const SERIES_TAIL = ['#2a9d90', '#e76e50', '#274754', '#e8c468', '#f4a462', '#8b5cf6', '#06b6d4', '#ec4899'];
type SystemColours = Pick<AppTheme, 'success' | 'warning' | 'danger'>;
export const seriesPalette = (brand: string, system?: SystemColours): string[] => {
  const lead = [brand, lighten(brand, 0.38), lighten(brand, 0.66), darken(brand, 0.3)];
  if (!system?.success || !system.warning || !system.danger) return [...lead, ...SERIES_TAIL];
  return [
    ...lead,
    system.success,
    system.warning,
    system.danger,
    emphasize(brand, system.success),
    emphasize(brand, system.danger),
    darken(brand, 0.55),
  ];
};
// Half of each of two colours, as rgb().
const emphasize = (a: string, b: string) => {
  const x = decomposeColor(a).values;
  const y = decomposeColor(b).values;
  return `rgb(${[0, 1, 2].map((i) => Math.round((x[i] + y[i]) / 2)).join(', ')})`;
};

// A status chip's colour under an applied theme: a CSS colour or colour word an author gave (a DataGrid's badgeColors
// '#2576CE', 'green') reads as the theme palette colour of its hue, as the Ant pack's tags do: green success, amber and
// orange warning, red error, blue and cyan primary, purple and magenta secondary (a deeper shade of the brand). A grey
// gives no family (the neutral chip).
export type ChipFamily = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
const WORD_FAMILY: Record<string, ChipFamily | null> = {
  red: 'error', rose: 'error', crimson: 'error', danger: 'error', destructive: 'error', negative: 'error', volcano: 'error',
  orange: 'warning', amber: 'warning', yellow: 'warning', gold: 'warning',
  green: 'success', emerald: 'success', lime: 'success', positive: 'success',
  blue: 'primary', sky: 'primary', cyan: 'primary', teal: 'primary', indigo: 'primary', navy: 'primary', geekblue: 'primary',
  purple: 'secondary', violet: 'secondary', magenta: 'secondary', pink: 'secondary', fuchsia: 'secondary',
  gray: null, grey: null, slate: null, neutral: null, default: null,
};
export const chipFamily = (color: string): ChipFamily | null | undefined => {
  const t = color.trim().toLowerCase();
  const word = t.replace(/[-_\s]?\d{2,3}$/, '');
  if (word in WORD_FAMILY) return WORD_FAMILY[word];
  if (!/^(#|rgb|hsl)/.test(t)) return undefined;
  let hsl: number[];
  try {
    const d = decomposeColor(t.startsWith('hsl') ? t : rgbToHsl(t));
    hsl = d.values as number[];
  } catch {
    return undefined;
  }
  const [h, s, l] = hsl;
  if (s < 25 || l < 8 || l > 96) return null;
  if (h < 15 || h >= 345) return 'error';
  if (h < 62) return 'warning';
  if (h < 165) return 'success';
  if (h < 250) return 'primary';
  return 'secondary';
};
const rgbToHsl = (color: string) => {
  const [r, g, b] = decomposeColor(color).values.slice(0, 3).map((v: number) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  const h = !d ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return `hsl(${Math.round((h * 60 + 360) % 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
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
  const surface = o.backgroundPaper ?? app.surface;
  const options: ThemeOptions = {
    palette: {
      mode: app.mode,
      // A filled palette colour (a Chip, a contained Button) takes white text only where white reads at 4.5:1, else
      // MUI's dark text: at MUI's default 3, white on the dark theme's error red measured 3.7:1 (a DataGrid status chip).
      contrastThreshold: 4.5,
      ...(primary ? { primary: defined({ main: primary, contrastText: o.primary ? undefined : app.onBrand }) as { main: string } } : {}),
      ...(app.danger ? { error: { main: app.danger } } : {}),
      ...(app.success ? { success: { main: app.success } } : {}),
      ...(app.warning ? { warning: { main: app.warning } } : {}),
      // Info is the brand in a themed app, as the Ant pack maps it (MUI's stock info is a light blue of its own), and
      // secondary a deeper shade of it (MUI's stock secondary is its own purple).
      ...(app.brand ? { info: defined({ main: app.brand, contrastText: app.onBrand }) as { main: string } } : {}),
      ...(app.brand ? { secondary: { main: darken(app.brand, 0.3) } } : {}),
      ...(surface ? { background: { paper: surface, default: surface } } : {}),
      ...(o.textPrimary ?? app.text ? { text: defined({ primary: o.textPrimary ?? app.text, secondary: app.textMuted }) } : {}),
      ...(o.divider ?? app.borderWeak ? { divider: (o.divider ?? app.borderWeak)! } : {}),
      // MUI X's DataGrid mixes white into the paper colour in dark mode: a themed (or styled) surface is drawn as is.
      ...(surface ? { DataGrid: { bg: surface, headerBg: surface, pinnedBg: surface } } : {}),
    } as ThemeOptions['palette'],
    ...(radius !== undefined ? { shape: { borderRadius: radius } } : {}),
    typography: { fontFamily: app.font ?? MUI_FONT },
    components: {
      MuiPopper: { defaultProps: portal },
      MuiModal: { defaultProps: portal },
      MuiPopover: { defaultProps: portal },
      // A Switch, Checkbox or Radio is an invisible <input> over the control. The ToolJet host stops a press that starts
      // on an <input> at the widget (a text field's press must not drag it), so in the editor a click on the control
      // toggled it and never selected the widget. Inside a FormControlLabel (a <label>) the press starts on the
      // control's span instead: the label still toggles the input on the click, as before, and the editor sees the
      // press. A bare control (the DataGrid's row checkbox) keeps its input clickable.
      MuiFormControlLabel: { styleOverrides: { root: { '& .PrivateSwitchBase-input': { pointerEvents: 'none' } } } },
      // A themed app's border colour on fields, and its surface on dark Paper (MUI otherwise tints it by elevation).
      // MUI X v8+ pickers draw their own outlined field (PickersOutlinedInput), which MuiOutlinedInput does not reach.
      ...(border
        ? {
            MuiOutlinedInput: { styleOverrides: { notchedOutline: { borderColor: border } } },
            MuiPickersOutlinedInput: { styleOverrides: { notchedOutline: { borderColor: border } } },
          }
        : {}),
      // The Slider's value label keeps a fixed 2px in MUI: it takes the theme radius once one is set.
      ...(radius !== undefined ? { MuiSlider: { styleOverrides: { valueLabel: { borderRadius: radius } } } } : {}),
      ...(app.surface ? { MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } } } : {}),
    } as ThemeOptions['components'],
  };
  return createTheme(options);
};
