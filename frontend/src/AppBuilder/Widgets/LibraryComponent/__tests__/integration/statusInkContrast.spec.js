import fs from 'fs';
import path from 'path';
import { getContrastRatio } from '@mui/material/styles';
import { readableInk } from '../../../../../../../packs/mui/src/lib/ink';
import { buildTheme } from '../../../../../../../packs/mui/src/lib/theme';

// Small status text on a tint of its colour (badges, chips, tags) reads at 4.5:1 in light and dark, stock and themed
// (Codex 10-25 H25-02: the shadcn DataTable badges measured about 3.1:1, Ant Tags 2.3:1 and a MUI DataGrid chip 3.7:1
// in the stock dark theme). Each pack derives the ink in one place: the shadcn pack's --ui-ink-* (styles/ui.css), the
// Ant pack's status text tokens (scripts/extract-styles.mjs into styles/antd.css), the MUI pack's lib/ink.ts and its
// theme's contrastThreshold. jsdom computes no CSS colour, so the CSS formula is evaluated here as a browser does.

const PACKS = path.resolve(__dirname, '../../../../../../../packs');
const read = (p) => fs.readFileSync(path.join(PACKS, p), 'utf8');

// ---- Colour maths: sRGB, WCAG contrast, OKLab / OKLCH ----------------------------------------------------------------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const delin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const luminance = (c) => c.map(lin).reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const mix = (a, b, share) => a.map((v, i) => v * share + b[i] * (1 - share));
const toOklab = (c) => {
  const [r, g, b] = c.map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};
const fromOklab = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  // Out of the sRGB gamut each channel is clipped, as Chrome draws it.
  return rgb.map((v) => delin(Math.min(1, Math.max(0, v))));
};

// The ink formula both CSS packs ship:
//   oklch(from color-mix(in oklab, X 50%, pole) <L'> calc(c * 2) h)
// with pole white under light text, black under dark, and L' = max(2l - 1, DARK) in a dark theme (the mix is lighter
// than 0.5), min(2l, LIGHT) in a light one.
const inkConstants = (css) => {
  const dark = /max\(l \* 2 - 1, ([\d.]+)\)/.exec(css);
  const light = /min\(l \* 2, ([\d.]+)\)/.exec(css);
  return { dark: Number(dark?.[1]), light: Number(light?.[1]) };
};
const cssInk = (tone, text, k) => {
  const pole = luminance(text) > 0.18 ? [255, 255, 255] : [0, 0, 0];
  const [l, a, b] = toOklab(mix(tone, pole, 0.5));
  const darkTheme = l > 0.5;
  const L = darkTheme ? Math.max(l * 2 - 1, k.dark) : Math.min(l * 2, k.light);
  return fromOklab([L, a * 2, b * 2]);
};

// ToolJet's stock theme and a brand theme (the audit's studio theme), light and dark.
const THEMES = {
  'stock light': { text: '#1B1F24', surfaces: ['#FFFFFF', '#F6F8FA'], success: '#1E823B', warning: '#BF4F03', danger: '#D72D39' },
  'stock dark': { text: '#CFD3D8', surfaces: ['#1E2226', '#2B3036'], success: '#318344', warning: '#BA5722', danger: '#D03F43' },
  'brand light': { text: '#1E1B2E', surfaces: ['#FFFFFF', '#F6F2FD'], success: '#15803D', warning: '#B45309', danger: '#B91C1C' },
  'brand dark': { text: '#F5F3FF', surfaces: ['#1C1729', '#241D36'], success: '#4ADE80', warning: '#FBBF24', danger: '#F87171' },
};
const TONES = ['success', 'warning', 'danger'];
const TINTS = [0.1, 0.14];
const worst = (fn) => Math.min(...Object.values(THEMES).flatMap((t) => TONES.flatMap((tone) => t.surfaces.flatMap((s) => TINTS.map((a) => fn(t, tone, s, a))))));

describe('shadcn status ink', () => {
  const ui = read('shadcn/src/styles/ui.css');
  const k = inkConstants(ui);

  test('ui.css defines the ink and an ink per tone', () => {
    expect(k.dark).toBeGreaterThan(0.5);
    expect(k.light).toBeLessThan(0.5);
    expect(ui).toMatch(/--ui-ink-pole: lch\(from var\(--ui-fg\) clamp\(0, \(l - 50\) \* 1000, 100\) 0 0 \/ 1\);/);
    for (const tone of ['primary', 'success', 'warning', 'destructive', 'info'])
      expect(ui).toContain(`--ui-${tone}-ink: oklch(from color-mix(in oklab, var(--ui-${tone}) 50%, var(--ui-ink-pole)) var(--ui-ink-lch));`);
  });

  test.each([
    ['ui2-table.css', ['success', 'warning', 'destructive', 'info'], 't2-badge'],
    ['ui2-display-kanban.css', ['success', 'warning', 'destructive'], 'ui2-kb-badge'],
  ])('%s status badges draw the tone ink, not the raw tone', (file, tones, cls) => {
    const css = read(`shadcn/src/styles/${file}`);
    for (const tone of tones) {
      const rule = new RegExp(`\\.${cls}--${tone} \\{[^}]*\\}`).exec(css)?.[0] ?? '';
      expect(rule).toContain(`color: var(--ui-${tone}-ink);`);
    }
  });

  test('the raw tones missed 4.5:1 on their tints in the stock dark theme', () => {
    const t = THEMES['stock dark'];
    expect(Math.max(...TONES.map((tone) => ratio(hex(t[tone]), mix(hex(t[tone]), hex(t.surfaces[0]), 0.1))))).toBeLessThan(3.5);
  });

  test('every tone ink clears 4.5:1 on its tint, light and dark, stock and brand', () => {
    expect(worst((t, tone, s, a) => ratio(cssInk(hex(t[tone]), hex(t.text), k), mix(hex(t[tone]), hex(s), a)))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Ant status ink', () => {
  const css = read('antd/src/styles/antd.css');
  const k = inkConstants(css);

  test('status Tags draw the status text tokens, which are the ink of their colour', () => {
    for (const [status, family] of [
      ['success', 'success'],
      ['processing', 'info'],
      ['error', 'error'],
      ['warning', 'warning'],
    ])
      expect(css).toContain(`.ant-tag.ant-tag-${status}{color:var(--ant-color-${family}-text);`);
    for (const family of ['success', 'info', 'error', 'warning'])
      expect(css).toContain(`--ant-color-${family}-text: var(--tj-ant-color-${family}-text, oklch(from color-mix(in oklab, var(--ant-color-${family}) 50%, lch(from var(--ant-color-text)`);
    expect(k).toEqual(inkConstants(read('shadcn/src/styles/ui.css')));
  });

  // Stock Ant (no app theme): antd's own tokens; a Tag sits on colorXBg.
  test.each([
    ['light', '#000000', [['#52c41a', '#f6ffed'], ['#faad14', '#fffbe6'], ['#ff4d4f', '#fff2f0'], ['#1677ff', '#e6f4ff']]],
    ['dark', '#ffffff', [['#49aa19', '#162312'], ['#d89614', '#2b2111'], ['#dc4446', '#2c1618'], ['#1668dc', '#111a2c']]],
  ])('stock Ant %s: every status Tag clears 4.5:1', (_mode, text, pairs) => {
    for (const [tone, bg] of pairs) expect(ratio(cssInk(hex(tone), hex(text), k), hex(bg))).toBeGreaterThanOrEqual(4.5);
  });

  // An applied ToolJet theme: the tag's background is the colour at 10% on the surface (THEMED in extract-styles).
  test('themed Ant: every status Tag clears 4.5:1, light and dark, stock and brand', () => {
    expect(worst((t, tone, s, a) => ratio(cssInk(hex(t[tone]), hex(t.text), k), mix(hex(t[tone]), hex(s), a)))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('MUI status ink', () => {
  const css = (c) => c.map((v) => Math.round(v));
  const rgb = (s) => s.match(/\d+/g).slice(0, 3).map(Number);

  test.each(['#dc2626', '#16a34a', '#d97706', '#2563eb', '#318344', '#f87171', '#4ade80'])('a CSS-coloured chip in %s reads at 4.5:1', (color) => {
    for (const [paper, dark] of [
      ['#ffffff', false],
      ['#121212', true],
      ['#1E2226', true],
      ['#1C1729', true],
    ]) {
      const ink = readableInk(color, paper, dark);
      expect(ratio(rgb(ink), css(mix(hex(color), hex(paper), 0.14)))).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('a colour that already reads is drawn as is', () => {
    expect(readableInk('#4ade80', '#121212', true)).toBe('rgb(74, 222, 128)');
  });

  test.each(['light', 'dark'])('palette chips take text that reads at 4.5:1 (%s, stock MUI)', (mode) => {
    const { palette } = buildTheme({ mode }, {}, null);
    for (const tone of ['error', 'success', 'warning', 'info'])
      expect(getContrastRatio(palette[tone].contrastText, palette[tone].main)).toBeGreaterThanOrEqual(4.5);
    // The audit's chip: the dark theme's error red under white measured 3.7:1.
    if (mode === 'dark') expect(palette.error.contrastText).not.toBe('#fff');
  });
});
