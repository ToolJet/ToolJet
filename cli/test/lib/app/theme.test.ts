import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { scaffoldApp } from '../../../src/lib/app/scaffold';

// A new app follows the ToolJet theme picked in the app's settings: its tokens read the --tj-* variables ToolJet sets
// on the code page, and Tailwind reads the tokens as whole colours.
describe('tooljet app init: the theme', () => {
  let dir: string;
  beforeEach(() => (dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-theme-'))));
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const scaffold = () => {
    const project = path.join(dir, 'app');
    scaffoldApp(project, 'App');
    const read = (file: string) => fs.readFileSync(path.join(project, 'frontend', file), 'utf8');
    return read;
  };

  it('maps every colour, the radius and the font in theme.css to a --tj-* variable with a fallback', () => {
    const theme = scaffold()('styles/theme.css');
    const tokens = [...theme.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim()]);
    expect(tokens.length).to.be.greaterThan(30);
    const fixed = ['--chart-5', '--destructive-foreground', '--success-foreground', '--warning-foreground'];
    for (const [name, value] of tokens) {
      if (fixed.includes(name)) continue;
      expect(value, name).to.match(/^var\(--tj-[\w-]+, .+\)$/);
    }
    expect(theme).not.to.match(/\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%/);
  });

  it('leaves no stock near-black primary to survive a build: without a theme the fallback is ToolJet\'s default brand', () => {
    const read = scaffold();
    const theme = read('styles/theme.css');
    const globals = read('src/styles/globals.css');
    expect([...theme.matchAll(/^\s*--primary: ([^;]+);/gm)].map((m) => m[1])).to.deep.equal([
      'var(--tj-brand, #4368e3)',
      'var(--tj-brand, #4368e3)',
    ]);
    expect(theme).to.match(/--primary-foreground: var\(--tj-on-brand, #ffffff\);/);
    expect(globals).not.to.contain('--primary: var(--tj-brand, #111827)');
    expect(theme).not.to.contain('220.9 39.3%');
  });

  it('stops animations and transitions under prefers-reduced-motion, in the CSS the app is built from', () => {
    const rule = /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration: 0\.01ms !important;[\s\S]*transition-duration: 0\.01ms !important;/;
    expect(scaffold()('src/styles/globals.css')).to.match(rule);
    // The component template carries it too, for a project that does not take the app overlay.
    const template = fs.readFileSync(path.join(__dirname, '../../../src/_templates/library/code-app/globals.ejs.t'), 'utf8');
    expect(template).to.match(rule);
  });

  it('reads the tokens in Tailwind directly, opacity modifiers through color-mix', () => {
    const read = scaffold();
    const config = read('tailwind.config.cjs');
    expect(config).not.to.contain('hsl(');
    const exported: any = { exports: {} };
    // eslint-disable-next-line no-new-func
    new Function('module', 'require', config)(exported, () => () => {});
    const colors = exported.exports.theme.extend.colors;
    expect(colors.primary.DEFAULT).to.equal('color-mix(in srgb, var(--primary) calc(<alpha-value> * 100%), transparent)');
    expect(colors.page).to.contain('var(--page)');
    const theme = read('styles/theme.css');
    const names = JSON.stringify(colors).match(/var\(--[\w-]+\)/g) ?? [];
    for (const v of names) expect(theme, v).to.contain(`${v.slice(4, -1)}:`);
  });
});
