import { LOOKS, lookVars, seriesColor, whenSet } from '../shadcnLook';
import { shadcnConfigs } from '../../../WidgetManager/widgets/shadcn';

describe('lookVars', () => {
  it('adds nothing for unset styles, so the theme applies', () => {
    expect(lookVars('ShadTable', {})).toEqual({});
    expect(lookVars('ShadTable', { headerTextColor: '', textColor: null })).toEqual({});
    expect(lookVars('NotAPackWidget', { textColor: '#111' })).toEqual({});
  });

  it('turns set styles into the variables the widget reads, sizes in px', () => {
    expect(
      lookVars('ShadTable', { headerBackgroundColor: '#f8fafc', rowHoverColor: '#f1f5f9', borderRadius: 12 })
    ).toEqual({ '--lk-head-bg': '#f8fafc', '--lk-hover': '#f1f5f9', '--lk-radius': '12px' });
    expect(lookVars('ShadSeparator', { thickness: '2' })).toEqual({ '--lk-thick': '2px' });
    expect(lookVars('ShadButton', { borderRadius: '9999px' })).toEqual({ '--lk-radius': '9999px' });
  });

  it("overrides shadcn's own tokens for accent styles", () => {
    expect(lookVars('ShadInput', { accentColor: '#0f766e' })).toEqual({
      '--sc-primary': '#0f766e',
      '--sc-ring': '#0f766e',
    });
    expect(lookVars('ShadProgress', { barColor: '#16a34a' })).toEqual({ '--sc-primary': '#16a34a' });
    expect(lookVars('ShadBarChart', { chartColor: '#7c3aed' })).toEqual({ '--sc-chart-1': '#7c3aed' });
  });

  // Kanban, Tabs and List view map their styles in their own modules (kanbanLook, tabsModel, listModel); the Dialog
  // has ModalV2's styles.
  it('maps only styles each widget config declares, and every other pack widget has a map', () => {
    const configs = Object.fromEntries(shadcnConfigs.map((c) => [c.name, c]));
    Object.entries(LOOKS).forEach(([name, map]) => {
      map.forEach(([key]) =>
        expect([name, key, configs[name]?.styles?.[key]?.displayName]).toEqual([name, key, expect.any(String)])
      );
    });
    const ownModules = ['ShadKanban', 'ShadTabs', 'ShadListView', 'ShadDialog'];
    expect(shadcnConfigs.map((c) => c.name).filter((n) => !LOOKS[n] && !ownModules.includes(n))).toEqual([]);
  });
});

describe('seriesColor', () => {
  it("uses the author's colour where the list names one, else the theme palette", () => {
    expect(seriesColor(['#0f766e'], 0)).toBe('#0f766e');
    expect(seriesColor(['#0f766e'], 1)).toBe('var(--sc-chart-2)');
    expect(seriesColor(undefined, 6)).toBe('var(--sc-chart-2)');
  });
});

describe('whenSet', () => {
  it('returns the classes only when the style is set', () => {
    expect(whenSet({ textColor: '#fff' }, 'textColor', 'a')).toBe('a');
    expect(whenSet({ textColor: ' ' }, 'textColor', 'a')).toBeUndefined();
    expect(whenSet(undefined, 'textColor', 'a')).toBeUndefined();
  });
});

// Text in the theme's primary goes through --sc-primary-ink (shadcn.scss), its lightness clamped so it reads on the
// background: a bright green or gold brand primary gave links, eyebrows and file-upload links at 1.6:1 on white.
describe('primary-coloured text', () => {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '..');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsx'));
  it.each(files)('%s draws no text in the raw primary', (file) => {
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    const raw = source.match(/text-\[color:var\((?:--lk-[a-z-]+,)?var\(--sc-primary\)\)?\]/g) || [];
    expect(raw).toEqual([]);
  });
  it('maps the text-primary utility to the ink', () => {
    const config = require('../shadcn.tailwind.config.js');
    expect(config.theme.extend.textColor.primary.DEFAULT({})).toBe('var(--sc-primary-ink)');
  });
});

// Hairlines (dividers, separators, a card's details rule) draw in --sc-border. The theme's weak border is the card
// surface in dark themes (ToolJet Modern dark: both #1F2937), so in dark the pack takes the default border instead.
describe('hairlines in dark themes', () => {
  const fs = require('fs');
  const path = require('path');
  const scss = fs.readFileSync(path.join(__dirname, '..', 'shadcn.scss'), 'utf8');
  it('maps the border to the theme default border under the dark theme classes', () => {
    const darkBlocks = [...scss.matchAll(/\.dark-theme \.tj-shadcn,[^{]*\{([^}]*)\}/g)].map((m) => m[1]);
    expect(darkBlocks.some((body) => /--sc-border:\s*var\(--cc-default-border/.test(body))).toBe(true);
  });
  it('keeps the weak border in light themes', () => {
    expect(scss).toMatch(/\.tj-shadcn,\s*\.tj-shad-tokens\s*\{[^}]*--sc-border:\s*var\(--cc-weak-border/);
  });
});

// Chart series 2 to 4 are relative colours of the theme's primary. On a dark primary (ToolJet Navy, Ink, Slate,
// Graphite) small lightness steps left two lines near-identical (help desk dashboard, 2026-10-14). The lightness
// formulas are evaluated here as the browser does, for each shipped primary's oklch lightness.
describe('chart series on dark and mid-tone primaries', () => {
  const fs = require('fs');
  const path = require('path');
  const scss = fs.readFileSync(path.join(__dirname, '..', 'shadcn.scss'), 'utf8');
  // The light-mode rules come first in the file (the dark-mode ones follow, scoped to .dark-theme), so the first
  // relative-colour formula for each series is the light one. SCSS #{...} holds braces, so blocks are not split on them.
  const lightBlock = scss;
  const lightness = (n, l) => {
    const expr = lightBlock.match(
      new RegExp(`--sc-chart-${n}: #\\{'oklch\\(from var\\(--sc-chart-1\\) calc\\((.*?)\\) (?:c|calc)`)
    )[1];
    const clamp = (low, value, high) => Math.min(Math.max(value, low), high);
    return Function('clamp', `return ${expr.replace(/\bl\b/g, `(${l})`)}`)(clamp);
  };
  const series = (l) => [l, lightness(2, l), lightness(3, l), lightness(4, l)];
  const minGap = (values) => Math.min(...values.flatMap((a, i) => values.slice(i + 1).map((b) => Math.abs(a - b))));

  it('keeps every series of a dark primary at least 0.12 apart in lightness', () => {
    for (const l of [0.21, 0.27, 0.37, 0.4]) expect(+minGap(series(l)).toFixed(3)).toBeGreaterThanOrEqual(0.12);
  });

  it("leaves a mid-tone primary's series as they were", () => {
    const [, s2, s3, s4] = series(0.6);
    expect([s2, s3, s4].map((v) => +v.toFixed(2))).toEqual([0.72, 0.5, 0.82]);
  });
});
