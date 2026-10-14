import { Definition } from '../dto';
import { TJDefaultTheme } from './index';

/**
 * Colour themes ToolJet ships beside the basic "ToolJet" theme, so any workspace can restyle an app in one click (the
 * editor's theme picker, and the AI chat's theme card after a build). They are ordinary workspace themes: created for
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

const PALETTES: Palette[] = [
  { name: 'ToolJet Indigo', primary: ['#4F46E5', '#818CF8'], appBackground: ['#F6F6FB', '#111218'], surface2: ['#F4F4FC', '#272A36'] },
  { name: 'ToolJet Emerald', primary: ['#047857', '#34D399'], appBackground: ['#F4F8F6', '#0F1513'], surface2: ['#F1F7F4', '#24302B'] },
  { name: 'ToolJet Terracotta', primary: ['#C2410C', '#FB923C'], appBackground: ['#FAF7F5', '#16110F'], surface2: ['#FBF4F0', '#332A26'] },
  { name: 'ToolJet Plum', primary: ['#86198F', '#E879F9'], appBackground: ['#F9F6F9', '#151016'], surface2: ['#FAF2FA', '#302633'] },
  { name: 'ToolJet Ocean', primary: ['#0369A1', '#38BDF8'], appBackground: ['#F4F7FA', '#0F1418'], surface2: ['#F0F6FB', '#25303A'] },
  { name: 'ToolJet Rose', primary: ['#BE123C', '#FB7185'], appBackground: ['#FAF6F7', '#161012'], surface2: ['#FBF1F3', '#33262A'] },
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
