import { Definition } from '../dto';
import { TJDefaultTheme } from './index';

/**
 * Colour themes ToolJet ships beside the basic "ToolJet" theme, so any workspace can restyle an app in one click from
 * the editor's theme picker. They are ordinary workspace themes: created for
 * every new workspace (createDefaultTheme) and backfilled for existing ones (data migration), editable and removable.
 * Each changes the brand colour and tints the basic theme's neutrals towards it (app background, surfaces, borders,
 * text); status colours stay the basic theme's.
 */
interface Palette {
  name: string;
  primary: [string, string];
  appBackground: [string, string];
  surface2: [string, string];
}

// The palette menu approved for AI-built apps on 2026-09-12 (ToolJet's own blue stands in for its Blue), plus Rose as
// the one expressive choice. Every primary carries white button text at 4.5:1 or better in both modes, so the dark
// primaries are mid tones, not the pale 400s a dark canvas tempts. ToolJet themes have no accent widgets use, so
// Graphite is the warm near-black (stone canvas) beside Ink's cool one.
const PALETTES: Palette[] = [
  {
    name: 'ToolJet Ink',
    primary: ['#111827', '#6B7280'],
    appBackground: ['#F9FAFB', '#0F1115'],
    surface2: ['#F3F4F6', '#24272D'],
  },
  {
    name: 'ToolJet Slate',
    primary: ['#334155', '#64748B'],
    appBackground: ['#F8FAFC', '#0F1318'],
    surface2: ['#F1F5F9', '#252B33'],
  },
  {
    name: 'ToolJet Navy',
    primary: ['#1E3A8A', '#3B5FCC'],
    appBackground: ['#F5F7FB', '#0E121A'],
    surface2: ['#EEF2FA', '#232A38'],
  },
  {
    name: 'ToolJet Indigo',
    primary: ['#4F46E5', '#4F46E5'],
    appBackground: ['#F6F6FB', '#111218'],
    surface2: ['#F4F4FC', '#272A36'],
  },
  {
    name: 'ToolJet Emerald',
    primary: ['#047857', '#047857'],
    appBackground: ['#F4F8F6', '#0F1513'],
    surface2: ['#F1F7F4', '#24302B'],
  },
  {
    name: 'ToolJet Graphite',
    primary: ['#292524', '#78716C'],
    appBackground: ['#FAF9F7', '#14120F'],
    surface2: ['#F5F4F2', '#2C2825'],
  },
  {
    name: 'ToolJet Rose',
    primary: ['#BE123C', '#E11D48'],
    appBackground: ['#FAF6F7', '#161012'],
    surface2: ['#FBF1F3', '#33262A'],
  },
];

const pair = ([light, dark]: [string, string]) => ({ light, dark });

/** `base` moved `share` (0 to 1) of the way to `tint`, both #RRGGBB. */
const mix = (base: string, tint: string, share: number): string => {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const value = (i: number) => Math.round(channel(base, i) * (1 - share) + channel(tint, i) * share);
  return `#${[0, 1, 2].map((i) => value(i).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** `text`, moved towards white (on a dark background) or black (on a light one) until it reads at `min`:1 on every
 *  background given. A tint towards a grey primary can otherwise take secondary text just under 4.5:1. */
const readable = (text: string, backgrounds: string[], min: number, towards: string): string => {
  let value = text;
  for (let share = 0.04; backgrounds.some((bg) => contrast(value, bg) < min) && share <= 1; share += 0.04) {
    value = mix(text, towards, share);
  }
  return value;
};

/**
 * The neutrals of a palette: the basic theme's, each tinted a little towards the palette's primary, so switching
 * themes changes an app built only from neutrals (card borders, muted surfaces, secondary text, headings), not just
 * its buttons. Light cards stay white. Shares are small enough that text keeps its contrast (spec checks 4.5:1).
 */
const neutrals = ({ primary: [light, dark] }: Palette) => {
  const base = TJDefaultTheme;
  const tinted = (key: { light: string; dark: string }, lightShare: number, darkShare: number) => ({
    light: mix(key.light, light, lightShare),
    dark: mix(key.dark, dark, darkShare),
  });
  return {
    surface1: { light: base.surface.colors.surface1.light, dark: mix(base.surface.colors.surface1.dark, dark, 0.06) },
    surface3: tinted(base.surface.colors.surface3, 0.1, 0.12),
    borderWeak: tinted(base.border.colors.weak, 0.1, 0.1),
    borderDefault: tinted(base.border.colors.default, 0.12, 0.12),
    text: tinted(base.text.colors.primary, 0.18, 0.1),
    placeholder: tinted(base.text.colors.placeholder, 0.15, 0.12),
  };
};

/** The palette's neutrals with text kept readable on its own card and page backgrounds. */
const readableNeutrals = (palette: Palette) => {
  const n = neutrals(palette);
  const backgrounds = (mode: 'light' | 'dark') =>
    mode === 'light' ? [n.surface1.light, palette.appBackground[0]] : [n.surface1.dark, palette.appBackground[1]];
  const fix = (key: { light: string; dark: string }, min: number) => ({
    light: readable(key.light, backgrounds('light'), min, '#000000'),
    dark: readable(key.dark, backgrounds('dark'), min, '#FFFFFF'),
  });
  return { ...n, text: fix(n.text, 7), placeholder: fix(n.placeholder, 4.5) };
};

export const shippedThemes: Array<{ name: string; definition: Definition }> = PALETTES.map((palette) => {
  const n = readableNeutrals(palette);
  return {
    name: palette.name,
    definition: {
      ...TJDefaultTheme,
      brand: { colors: { ...TJDefaultTheme.brand.colors, primary: pair(palette.primary) } },
      text: {
        ...TJDefaultTheme.text,
        colors: { ...TJDefaultTheme.text.colors, primary: n.text, placeholder: n.placeholder },
      },
      border: {
        ...TJDefaultTheme.border,
        colors: { ...TJDefaultTheme.border.colors, default: n.borderDefault, weak: n.borderWeak },
      },
      surface: {
        colors: {
          ...TJDefaultTheme.surface.colors,
          appBackground: pair(palette.appBackground),
          surface1: n.surface1,
          surface2: pair(palette.surface2),
          surface3: n.surface3,
        },
      },
    },
  };
});
