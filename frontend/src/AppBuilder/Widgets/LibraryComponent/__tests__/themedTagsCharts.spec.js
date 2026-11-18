import fs from 'fs';
import path from 'path';
import { themedTagColor, tagColor } from '../../../../../../packs/antd/src/lib/format';
import { G2_PALETTE, seriesPalette as antSeries } from '../../../../../../packs/antd/src/lib/chartTheme';
import { buildTheme, chipFamily, seriesPalette as muiSeries } from '../../../../../../packs/mui/src/lib/theme';

// 2026-10-25: under an applied (non-basic) app theme, Ant's status Tags with mapped colours and the Ant and MUI charts'
// categorical palettes drew their libraries' stock colours (blue and purple tags, a teal and lilac donut on a parchment
// theme). Under the basic theme the packs keep their stock look, so every unthemed path below must stay as it was.

const PACKS = path.resolve(__dirname, '../../../../../../packs');
const antCss = fs.readFileSync(path.join(PACKS, 'antd/src/styles/antd.css'), 'utf8');

// ---- Colour maths (as statusInkContrast.spec.js: sRGB, WCAG contrast, OKLab) ------------------------------------------
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
  return rgb.map((v) => delin(Math.min(1, Math.max(0, v))));
};
const okmix = (a, b, share) => fromOklab(mix(toOklab(a), toOklab(b), share));
const inkK = {
  dark: Number(/max\(l \* 2 - 1, ([\d.]+)\)/.exec(antCss)[1]),
  light: Number(/min\(l \* 2, ([\d.]+)\)/.exec(antCss)[1]),
};
const cssInk = (tone, text) => {
  const pole = luminance(text) > 0.18 ? [255, 255, 255] : [0, 0, 0];
  const [l, a, b] = toOklab(mix(tone, pole, 0.5));
  const L = l > 0.5 ? Math.max(l * 2 - 1, inkK.dark) : Math.min(l * 2, inkK.light);
  return fromOklab([L, a * 2, b * 2]);
};

// The example app's parchment theme, a violet brand theme and ToolJet's dark defaults: light and dark.
const THEMES = {
  'parchment light': {
    brand: '#A16207',
    text: '#2A241C',
    surface: '#FFFCF6',
    success: '#2F7D5D',
    warning: '#B45309',
    danger: '#A33A2B',
  },
  'parchment dark': {
    brand: '#D9A441',
    text: '#F3EDE3',
    surface: '#211D16',
    success: '#6FBF9B',
    warning: '#E0A45C',
    danger: '#E08A7B',
  },
  'violet light': {
    brand: '#4F46E5',
    text: '#1E1B2E',
    surface: '#FFFFFF',
    success: '#15803D',
    warning: '#B45309',
    danger: '#B91C1C',
  },
  'violet dark': {
    brand: '#818CF8',
    text: '#F5F3FF',
    surface: '#1C1729',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
  },
};
// scripts/extract-styles.mjs PRESET_THEMED, evaluated as a browser does.
const PRESETS = (t) => {
  const [B, T, S, W, D] = [t.brand, t.text, t.success, t.warning, t.danger].map(hex);
  return {
    blue: B,
    geekblue: okmix(B, T, 0.7),
    purple: okmix(B, T, 0.5),
    cyan: okmix(B, S, 0.5),
    magenta: okmix(D, B, 0.55),
    green: S,
    lime: okmix(S, W, 0.6),
    red: D,
    volcano: okmix(D, W, 0.65),
    orange: okmix(W, D, 0.7),
    gold: W,
  };
};

describe('Ant preset palettes follow an applied theme', () => {
  test('every preset step reads the theme first and keeps antd’s own value without one', () => {
    for (const name of [
      'blue',
      'purple',
      'cyan',
      'green',
      'magenta',
      'red',
      'orange',
      'gold',
      'geekblue',
      'volcano',
      'lime',
      'yellow',
      'pink',
    ])
      for (const step of ['', '-1', '-3', '-6', '-7'])
        expect(antCss).toMatch(new RegExp(`--ant-${name}${step}:var\\(--tjt-${name}${step}, #[0-9a-fA-F]{6}\\)`));
    expect(antCss).toContain('--ant-blue-1:var(--tjt-blue-1, #e6f4ff)');
    expect(antCss).toContain('--tjt-blue-6: var(--tj-brand);');
    expect(antCss).toContain('--tjt-green-6: var(--tj-success);');
    expect(antCss).toContain('--tjt-orange-6: color-mix(in oklab, var(--tj-warning) 70%, var(--tj-danger));');
    expect(antCss).toContain('--tjt-red-6: var(--tj-danger);');
    // A preset Tag: tint background, ink text.
    expect(antCss).toContain(
      '.ant-tag.ant-tag-blue{color:var(--ant-blue-7);background:var(--ant-blue-1);border-color:var(--ant-blue-3);}'
    );
    expect(antCss).toMatch(
      /--tjt-blue-7: oklch\(from color-mix\(in oklab, var\(--tj-brand\) 50%, lch\(from var\(--ant-color-text\)/
    );
    expect(antCss).toContain('--tjt-blue-1: color-mix(in srgb, var(--tj-brand) 10%, var(--tj-surface));');
  });

  test('a themed preset Tag’s text clears 4.5:1 on its tint, light and dark', () => {
    let worst = Infinity;
    for (const t of Object.values(THEMES))
      for (const c of Object.values(PRESETS(t)))
        worst = Math.min(worst, ratio(cssInk(c, hex(t.text)), mix(c, hex(t.surface), 0.1)));
    expect(worst).toBeGreaterThanOrEqual(4.5);
  });

  test('themedTagColor: a CSS colour becomes the preset of its hue under a theme, and stays as given without one', () => {
    // The example app's badgeColors.
    const given = { Active: '#2576CE', 'Under Contract': '#7C3AED', Closed: '#1A9C6D', 'Coming Soon': '#F19119' };
    expect(Object.values(given).map((c) => themedTagColor(tagColor(c), true))).toEqual([
      'blue',
      'purple',
      'green',
      'orange',
    ]);
    expect(Object.values(given).map((c) => themedTagColor(tagColor(c), false))).toEqual(Object.values(given));
    expect(themedTagColor('#ef4444', true)).toBe('red');
    expect(themedTagColor('rgb(234, 179, 8)', true)).toBe('gold');
    expect(themedTagColor('hsl(330, 80%, 50%)', true)).toBe('magenta');
    // Greys are the neutral tag; presets, statuses and colour words pass through (the theme redraws them).
    expect(themedTagColor('#94a3b8', true)).toBeUndefined();
    expect(themedTagColor('success', true)).toBe('success');
    expect(themedTagColor('green', true)).toBe('green');
    expect(themedTagColor('teal', true)).toBe('cyan');
    expect(themedTagColor('green', false)).toBe('green');
    expect(themedTagColor(undefined, true)).toBeUndefined();
  });
});

describe('chart palettes lead with an applied theme', () => {
  const stockAnt = G2_PALETTE.map((c) => c.toLowerCase());
  const rgb = (s) => (s.startsWith('#') ? hex(s.toLowerCase()) : s.match(/\d+/g).slice(0, 3).map(Number));

  test('Ant without a theme: antd’s primary, then G2’s own palette (unchanged)', () => {
    expect(
      antSeries({ brand: '#1677ff', success: '#52c41a', warning: '#faad14', error: '#ff4d4f', themed: false })
    ).toEqual(['#1677ff', ...G2_PALETTE]);
  });

  test.each(Object.entries(THEMES))(
    'Ant and MUI under %s: brand first, every colour from the theme, distinct',
    (_n, t) => {
      const ant = antSeries({ brand: t.brand, success: t.success, warning: t.warning, error: t.danger, themed: true });
      const mui = muiSeries(t.brand, { success: t.success, warning: t.warning, danger: t.danger });
      for (const p of [ant, mui]) {
        expect(p[0].toLowerCase()).toBe(t.brand.toLowerCase());
        expect(p.length).toBeGreaterThanOrEqual(8);
        expect(new Set(p.map((c) => rgb(c).join())).size).toBe(p.length);
        expect(p.some((c) => stockAnt.includes(c.toLowerCase()))).toBe(false);
        expect(p.some((c) => ['#2a9d90', '#8b5cf6', '#06b6d4', '#ec4899'].includes(c.toLowerCase()))).toBe(false);
        for (const sys of [t.success, t.warning, t.danger])
          expect(p.map((c) => rgb(c).join())).toContain(hex(sys).join());
      }
      // The two packs draw the same palette from the same theme (within rounding).
      ant.forEach((c, i) => rgb(c).forEach((v, k) => expect(Math.abs(v - rgb(mui[i])[k])).toBeLessThanOrEqual(2)));
    }
  );

  test('MUI with only a Primary style (no app theme) keeps its brand-led palette and stock tail', () => {
    expect(muiSeries('#4f46e5').slice(4, 6)).toEqual(['#2a9d90', '#e76e50']);
  });
});

describe('MUI status chips under an applied theme', () => {
  test('chipFamily: a CSS colour or colour word reads as the theme palette colour of its hue', () => {
    expect(['#2576CE', '#7C3AED', '#1A9C6D', '#F19119', '#dc2626'].map(chipFamily)).toEqual([
      'primary',
      'secondary',
      'success',
      'warning',
      'error',
    ]);
    expect(['green', 'blue', 'purple', 'amber', 'red-500'].map(chipFamily)).toEqual([
      'success',
      'primary',
      'secondary',
      'warning',
      'error',
    ]);
    expect(chipFamily('#94a3b8')).toBeNull();
    expect(chipFamily('gray')).toBeNull();
    expect(chipFamily('not a colour')).toBeUndefined();
  });

  test('secondary is a deeper shade of the brand under a theme, MUI’s own without one', () => {
    expect(buildTheme({ mode: 'light' }, {}, null).palette.secondary.main).toBe('#9c27b0');
    const themed = buildTheme({ mode: 'light', brand: '#a16207' }, {}, null).palette.secondary.main;
    expect(themed).not.toBe('#9c27b0');
    expect(luminance(rgbOf(themed))).toBeLessThan(luminance(hex('#a16207')));
  });
});

const rgbOf = (s) => (s.startsWith('#') ? hex(s) : s.match(/\d+/g).slice(0, 3).map(Number));
