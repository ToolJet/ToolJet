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

  test('[UB-05] unselected segmented-toggle options on the toggle track', () => {
    const fg = readToken(toggleGroup, '.ToggleGroupItem', 'color');
    const track = readToken(toggleGroup, '.ToggleGroup', 'background-color');
    expect(shortfalls({ fg, bg: [track, surface] })).toEqual([]);
  });

  test('[UB-06] selected environment tab in the version popover', () => {
    const fg = readToken(environmentToggle, '&.selected', 'color');
    const bg = readToken(environmentToggle, '&.selected', 'background-color');
    expect(shortfalls({ fg, bg: [bg, envBar] })).toEqual([]);
  });

  test('[UB-06] version tags (Draft, Released, source branch) in the version popover', () => {
    const tags = [
      ...read('AppBuilder/Header/VersionManager/VersionDropdownItem.jsx').matchAll(
        /backgroundColor: '([^']+)',\s*color: '([^']+)'/g
      ),
    ];
    expect(tags).toHaveLength(3);
    expect(tags.flatMap(([, bg, fg]) => shortfalls({ fg, bg: [bg, surface] }))).toEqual([]);
  });

  test('[UB-07] accent text is readable on panels in both themes', () => {
    expect(shortfalls({ fg: 'var(--text-accent, var(--indigo9))', bg: [surface] })).toEqual([]);
  });

  test('[UB-08] danger and success text on the panel surface', () => {
    expect([
      ...shortfalls({ fg: 'var(--text-danger)', bg: [surface] }),
      ...shortfalls({ fg: 'var(--text-success)', bg: [surface] }),
    ]).toEqual([]);
  });

  test('[UB-08] filter and sort popup labels', () => {
    const fg = filterLabelColour();
    expect(fg).toBeDefined();
    expect(shortfalls({ fg, bg: [surface] })).toEqual([]);
  });

  test.each(['is-error', 'is-warning', 'is-success'])('[UB-08] debugger %s badge on its tint', (state) => {
    const scss = read('AppBuilder/QueryPanel/RuntimeDebugger/styles.scss');
    const fg = readToken(scss, `&.${state}`, 'color');
    const bg = readToken(scss, `&.${state}`, 'background');
    expect(shortfalls({ fg, bg: [bg, surface] })).toEqual([]);
  });

  test('[UB-08] drawer Debugger toggle badge', () => {
    const scss = read('_styles/queryManager.scss');
    const fg = readToken(scss, '.runtime-panel-badge', 'color');
    const bg = readToken(scss, '.runtime-panel-badge', 'background');
    expect(shortfalls({ fg, bg: [bg] })).toEqual([]);
  });

  test('[UB-08] inspector and debugger JSON values', () => {
    const dir = 'AppBuilder/LeftSidebar/LeftSidebarInspector/CustomJSONViewer/Components';
    const colours = fs
      .readdirSync(path.join(__dirname, '../..', dir))
      .flatMap((file) => [...read(`${dir}/${file}`).matchAll(/color: '([^']+)'/g)].map((m) => [file, m[1]]));
    expect(colours.length).toBeGreaterThan(0);
    expect(colours.flatMap(([file, fg]) => shortfalls({ fg, bg: [surface] }).map((s) => `${file} ${s}`))).toEqual([]);
  });

  test('[UB-08] Share modal slug hint', () => {
    const fg = readToken(read('_styles/theme.scss'), '.label-info', 'color');
    expect(shortfalls({ fg, bg: [surface] })).toEqual([]);
  });

  test('[UB-08] ToolJet database select placeholder', () => {
    const select = read('AppBuilder/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect.jsx');
    const placeholder = select.match(/showPlaceHolder \? \(\s*<span\s+style=\{\{\s*color: 'var\(--([\w-]+)/)?.[1];
    expect(placeholder).toBeDefined();
    const fg = readToken(read('_styles/queryManager.scss'), '.tooljetdb-query-details', `--${placeholder}`);
    expect(shortfalls({ fg, bg: [surface] })).toEqual([]);
  });

  test('[UA-22] REST API dark icon letters on their cloud reach 3:1 for graphics', () => {
    const svg = fs.readFileSync(path.join(__dirname, '../../../../plugins/packages/restapi/lib/darkIcon.svg'), 'utf8');
    const [cloud, letters] = [...svg.matchAll(/<path[^>]*fill="([^"]+)"/g)].map((m) => m[1]);
    expect(contrastRatio(letters === 'white' ? '#fff' : letters, cloud)).toBeGreaterThanOrEqual(3);
  });
});
