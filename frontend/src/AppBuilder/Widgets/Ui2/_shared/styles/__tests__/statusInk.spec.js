// Release audit 16 (17 Oct): a Badge's success, warning and destructive tones drew the status colour as 12px text on
// a 10% tint of the same colour, which fell under WCAG's 4.5:1 for small text in every shipped theme (4.2:1 on the
// light card, 3.1:1 on the dark one). Their text now uses a status ink: the status colour mixed half toward the theme's
// text colour (darker on light themes, lighter on dark ones). The fills keep the status colour.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import fs from 'fs';
import path from 'path';
import { shippedThemes } from '../../../../../../../../server/src/modules/organization-themes/constants/shipped-themes';
import { TJDefaultTheme } from '../../../../../../../../server/src/modules/organization-themes/constants';
import ui2Theme from '../ui2.tailwind';

const SCSS = fs.readFileSync(path.join(__dirname, '../shadcn.scss'), 'utf8');
const TONES = { success: 'success', warning: 'warning', destructive: 'error' };

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

describe('[UI2-STATUS-016] status inks', () => {
  it.each(Object.keys(TONES))('--sc-%s-ink is the status colour mixed half toward the text colour', (tone) => {
    expect(SCSS).toContain(`--sc-${tone}-ink: color-mix(in srgb, var(--sc-${tone}) 50%, var(--sc-foreground));`);
  });

  it.each(Object.keys(TONES))('text in ui2-%s reads the ink, fills keep the status colour', (tone) => {
    expect(ui2Theme.textColor.ui2[tone].DEFAULT({})).toBe(`var(--sc-${tone}-ink)`);
    expect(ui2Theme.colors.ui2[tone].DEFAULT({})).toBe(`var(--sc-${tone})`);
  });

  const themes = [{ name: 'ToolJet', definition: TJDefaultTheme }, ...shippedThemes];
  it.each(themes.flatMap(({ name, definition }) => ['light', 'dark'].map((mode) => [name, mode, definition])))(
    '%s %s: badge text reads at 4.5:1 or more on its tint',
    (_name, mode, definition) => {
      const card = rgb(definition.surface.colors.surface1[mode]);
      const text = rgb(definition.text.colors.primary[mode]);
      const low = Object.values(TONES)
        .map((tone) => {
          const status = rgb(definition.systemStatus.colors[tone][mode]);
          const tint = mix(status, card, 0.1);
          return [tone, +contrast(mix(status, text, 0.5), tint).toFixed(2)];
        })
        .filter(([, ratio]) => ratio < 4.5);
      expect(low).toEqual([]);
    }
  );
});
