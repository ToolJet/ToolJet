/**
 * @jest-environment node
 */
// Resolves CSS custom properties the way the editor does (designtheme.scss, then componentdesign.scss, as theme.scss imports them; a
// `.dark-theme` region takes the last `.dark-theme` value) and Radix scales from @radix-ui/colors.
// It cannot see scoped overrides or real ancestors; the Cypress panel audit covers those.
import fs from 'fs';
import path from 'path';
const radix = require('@radix-ui/colors');
import { contrastRatio, readToken } from '../contrast';

const read = (file) => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
const TOKEN_FILES = ['_styles/designtheme.scss', '_styles/componentdesign.scss'].map(read);
const THEMES = ['light', 'dark'];

function token(name, theme) {
  for (const selector of theme === 'dark' ? ['.dark-theme', ':root'] : [':root']) {
    const value = TOKEN_FILES.map((file) => readToken(file, selector, `--${name}`))
      .filter(Boolean)
      .at(-1);
    if (value) return value;
  }
  const scale = name.match(/^([a-z]+?)(A?)(\d+)$/);
  if (!scale) return undefined;
  const [, family, alpha, step] = scale;
  return radix[`${family}${theme === 'dark' ? 'Dark' : ''}${alpha}`]?.[`${family}${alpha}${step}`];
}

function resolve(value, theme) {
  const ref = value?.match(/^var\(\s*--([\w-]+)\s*(?:,\s*(.+))?\)$/);
  if (!ref) return value;
  return resolve(token(ref[1], theme) ?? ref[2], theme);
}

// Ratios below `min`, as readable strings, so a failure names the theme and the number.
function shortfalls({ fg, bg, min = 4.5 }) {
  return THEMES.flatMap((theme) => {
    const colours = [fg, ...bg].map((value) => resolve(value, theme));
    if (colours.some((c) => !c)) return [`${theme}: unresolved ${JSON.stringify(colours)}`];
    const ratio = contrastRatio(...colours);
    return ratio < min ? [`${theme}: ${ratio.toFixed(2)}:1 < ${min}`] : [];
  });
}

const surface = 'var(--background-surface-layer-01)';
const toggleGroup = read('ToolJetUI/SwitchGroup/toggleGroup.scss');
const environmentToggle = read('AppBuilder/Header/VersionManager/environment-toggle.scss');
const envBar = readToken(environmentToggle, '.environment-toggle__bar', 'background-color');

function filterLabelColour() {
  const popup = read('AppBuilder/QueryPanel/FilterandSortPopup.jsx');
  const label = popup.match(/className="([^"]*)"[^>]*>\s*<span className="([^"]*)" data-cy="label-filter-by"/);
  const classes = label ? `${label[1]} ${label[2]}`.split(/\s+/) : [];
  const colours = classes.flatMap((name) => {
    const legacy = name.match(/^color-([\w-]+)$/);
    if (legacy) return [readToken(read('_styles/colors.scss'), `.${name}`, 'color')];
    const tw = name.match(/^tw-text-(?:text-)?([\w-]+)$/);
    return tw && token(`text-${tw[1]}`, 'light') ? [`var(--text-${tw[1]})`] : [];
  });
  return colours.at(-1);
}

describe('panel text tokens reach WCAG AA in both themes', () => {
  test.each([
    ['default text', 'var(--text-default)'],
    ['medium text', 'var(--text-medium)'],
    ['placeholder text', 'var(--text-placeholder)'],
  ])('%s on the panel surface', (_, fg) => {
    expect(shortfalls({ fg, bg: [surface] })).toEqual([]);
  });

  test('[UB-06] unselected environment tabs in the version popover', () => {
    const fg = readToken(environmentToggle, '.environment-toggle__btn', 'color');
    expect(shortfalls({ fg, bg: [envBar] })).toEqual([]);
  });

  test.failing('[UB-05] unselected segmented-toggle options on the toggle track', () => {
    // toggleGroup.scss `.ToggleGroupItem` text on the translucent `.ToggleGroup` track: 4.31:1 in light.
    const fg = readToken(toggleGroup, '.ToggleGroupItem', 'color');
    const track = readToken(toggleGroup, '.ToggleGroup', 'background-color');
    expect(shortfalls({ fg, bg: [track, surface] })).toEqual([]);
  });

  test.failing('[UB-06] selected environment tab in the version popover', () => {
    // environment-toggle.scss `&.selected` is --indigo9 on --indigo3: 3.03:1 in dark.
    const fg = readToken(environmentToggle, '&.selected', 'color');
    const bg = readToken(environmentToggle, '&.selected', 'background-color');
    expect(shortfalls({ fg, bg: [bg, envBar] })).toEqual([]);
  });

  test.failing('[UB-07] accent text token is defined for both themes and readable on panels', () => {
    // --text-accent exists only in .dark-theme (componentdesign.scss:209, 3.42:1); the editor fell back
    // to --editor-accent-text on .apploader, which the loaded editor never renders.
    expect(shortfalls({ fg: 'var(--text-accent)', bg: [surface] })).toEqual([]);
  });

  test.failing('[UB-08] danger and success text on the panel surface', () => {
    // Dark --text-danger #D03F43 and --text-success #318344 reach 3.41:1 and 3.40:1 on #1E2226.
    expect([
      ...shortfalls({ fg: 'var(--text-danger)', bg: [surface] }),
      ...shortfalls({ fg: 'var(--text-success)', bg: [surface] }),
    ]).toEqual([]);
  });

  test.failing('[UB-08] filter and sort popup labels', () => {
    // FilterandSortPopup.jsx:109,135 label rows use color-slate9: 3.24:1 in light.
    const fg = filterLabelColour();
    expect(fg).toBeDefined();
    expect(shortfalls({ fg, bg: [surface] })).toEqual([]);
  });

  test.failing('[UA-22] REST API dark icon letters on their cloud reach 3:1 for graphics', () => {
    // plugins/packages/restapi/lib/darkIcon.svg: white letters on a #CFD3D8 cloud.
    const svg = fs.readFileSync(path.join(__dirname, '../../../../plugins/packages/restapi/lib/darkIcon.svg'), 'utf8');
    const [cloud, letters] = [...svg.matchAll(/<path[^>]*fill="([^"]+)"/g)].map((m) => m[1]);
    expect(contrastRatio(letters === 'white' ? '#fff' : letters, cloud)).toBeGreaterThanOrEqual(3);
  });
});
