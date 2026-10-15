import { Definition } from '../dto';
import { TJDefaultTheme } from './index';

/**
 * Colour themes ToolJet ships beside the basic "ToolJet" theme, so any workspace can restyle an app in one click from
 * the editor's theme picker. They are ordinary workspace themes: created for
 * every new workspace (createDefaultTheme) and backfilled for existing ones (data migration), editable and removable.
 * Each keeps the basic theme's text, borders and status colours and changes the brand colour, with the app background
 * and second surface tinted towards it.
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
  { name: 'ToolJet Ink', primary: ['#111827', '#6B7280'], appBackground: ['#F9FAFB', '#0F1115'], surface2: ['#F3F4F6', '#24272D'] },
  { name: 'ToolJet Slate', primary: ['#334155', '#64748B'], appBackground: ['#F8FAFC', '#0F1318'], surface2: ['#F1F5F9', '#252B33'] },
  { name: 'ToolJet Navy', primary: ['#1E3A8A', '#3B5FCC'], appBackground: ['#F5F7FB', '#0E121A'], surface2: ['#EEF2FA', '#232A38'] },
  { name: 'ToolJet Indigo', primary: ['#4F46E5', '#4F46E5'], appBackground: ['#F6F6FB', '#111218'], surface2: ['#F4F4FC', '#272A36'] },
  { name: 'ToolJet Emerald', primary: ['#047857', '#047857'], appBackground: ['#F4F8F6', '#0F1513'], surface2: ['#F1F7F4', '#24302B'] },
  { name: 'ToolJet Graphite', primary: ['#292524', '#78716C'], appBackground: ['#FAF9F7', '#14120F'], surface2: ['#F5F4F2', '#2C2825'] },
  { name: 'ToolJet Rose', primary: ['#BE123C', '#E11D48'], appBackground: ['#FAF6F7', '#161012'], surface2: ['#FBF1F3', '#33262A'] },
];

const pair = ([light, dark]: [string, string]) => ({ light, dark });

export const shippedThemes: Array<{ name: string; definition: Definition }> = PALETTES.map((palette) => ({
  name: palette.name,
  definition: {
    ...TJDefaultTheme,
    brand: { colors: { ...TJDefaultTheme.brand.colors, primary: pair(palette.primary) } },
    surface: {
      colors: {
        ...TJDefaultTheme.surface.colors,
        appBackground: pair(palette.appBackground),
        surface2: pair(palette.surface2),
      },
    },
  },
}));
