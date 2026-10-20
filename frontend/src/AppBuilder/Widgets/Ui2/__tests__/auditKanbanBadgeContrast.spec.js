import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixture badge-contrast-cases-016, KANBAN-BADGE-CONTRAST-016c13d): a badge colour from
// badgeColors was drawn as the 12px label itself on a 14% tint of it, so mid and deep colours, the catalog's own
// example ({ High: '#dc2626', Low: '#16a34a' }) among them, read under WCAG's 4.5:1 for small text (2.8:1 to 4.0:1),
// by how much depending on the card below. The colour is now an opaque chip under the label primary buttons use on
// the brand colour (onBrandText), deepened just enough where white reads under 4.5:1 (primaryStrong), so it reads the
// same on every theme. The pack's status ink (the colour mixed half toward the theme's text) was tried first and left
// #dc2626 at 4.49:1 on two dark themes. A light colour keeps its tint with a deep text of its hue, now near-black
// where that deep text falls short (bright cyan or yellow). The controls (a light tint, an explicit { text,
// background } pair) already passed, and the explicit pair stays the author's.
import tinycolor from 'tinycolor2';
import { badgeLook } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { shippedThemes } from '../../../../../../server/src/modules/organization-themes/constants/shipped-themes';
import { TJDefaultTheme } from '../../../../../../server/src/modules/organization-themes/constants';

const CASES = [
  ['catalog High', '#dc2626'],
  ['catalog Low', '#16a34a'],
  ['blue', '#3b82f6'],
  ['bright green', '#22c55e'],
  ['amber', '#f59e0b'],
  ['teal', '#0f766e'],
  ['light tint (control)', '#DCFCE7'],
  ['explicit pair (control)', { text: '#1e40af', background: '#dbeafe' }],
];

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luminance = (c) =>
  c
    .map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const mix = (a, b, share) => a.map((c, i) => c * share + b[i] * (1 - share));

// The colour a badge variable paints with, on a card with this text colour: a hex, or the two color-mix forms
// badgeLook writes (toward the theme's text colour, or a tint over whatever is under it).
const paint = (value, { card, text }) => {
  const toText = /^color-mix\(in srgb, (#[0-9a-f]{6}) (\d+)%, var\(--sc-foreground\)\)$/i.exec(value);
  if (toText) return mix(rgb(toText[1]), text, toText[2] / 100);
  const tint = /^color-mix\(in srgb, (#[0-9a-f]{6}) (\d+)%, transparent\)$/i.exec(value);
  if (tint) return mix(rgb(tint[1]), card, tint[2] / 100);
  if (/^#[0-9a-f]{6}$/i.test(value)) return rgb(value);
  throw new Error(`unexpected badge colour ${value}`);
};

const themes = [{ name: 'ToolJet', definition: TJDefaultTheme }, ...shippedThemes];
const surfaces = themes.flatMap(({ name, definition }) =>
  ['light', 'dark'].map((mode) => ({
    surface: `${name} ${mode}`,
    card: rgb(definition.surface.colors.surface1[mode]),
    text: rgb(definition.text.colors.primary[mode]),
  }))
);

describe('Kanban badge labels read at 4.5:1 or more', () => {
  it.each(CASES)('%s on every shipped theme, light and dark', (label, colour) => {
    const look = badgeLook('Value', { Value: colour });
    const low = surfaces
      .map((surface) => {
        const bg = paint(look['--kb-badge-bg'], surface);
        const fg = paint(look['--kb-badge-fg'], { ...surface, card: bg });
        return [surface.surface, +contrast(fg, bg).toFixed(3)];
      })
      .filter(([, ratio]) => ratio < 4.5);
    expect(low).toEqual([]);
  });

  // Not a proof for every colour, but a sweep of hues and lightnesses the catalog's examples sit among.
  const sweep = [0, 30, 60, 120, 180, 210, 240, 280, 330].flatMap((h) =>
    [0.25, 0.35, 0.45, 0.55, 0.65].map((l) => tinycolor({ h, s: 0.75, l }).toHexString())
  );
  it.each(sweep)('%s on every shipped theme, light and dark', (colour) => {
    const look = badgeLook('Value', { Value: colour });
    const low = surfaces.filter((surface) => {
      const bg = paint(look['--kb-badge-bg'], surface);
      return contrast(paint(look['--kb-badge-fg'], { ...surface, card: bg }), bg) < 4.5;
    });
    expect(low.map((s) => s.surface)).toEqual([]);
  });

  it('an explicit { text, background } pair stays the author’s', () => {
    expect(badgeLook('New', { New: { text: '#1e40af', background: '#dbeafe' } })).toEqual({
      '--kb-badge-fg': '#1e40af',
      '--kb-badge-bg': '#dbeafe',
    });
  });
});
