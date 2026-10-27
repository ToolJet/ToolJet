/**
 * No stylesheet may select `legend + *`: tested on every element, it makes every insertion of an element before others
 * restyle all the elements after it. Tabler's copy is written `:where(fieldset)>legend+*` (see _styles/tabler.scss), and
 * Bootstrap's is rewritten the same way when it is built (scripts/legend-selector-loader.js).
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import rewriteLegendSelector from '../../../scripts/legend-selector-loader';

const BARE = /(^|[{};,\s])legend\s*\+\s*\*/;
const frontend = path.resolve(__dirname, '../../..');
const stylesheetsIn = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return name === 'node_modules' ? [] : stylesheetsIn(file);
    return /\.s?css$/.test(name) ? [file] : [];
  });

describe('legend + * selector', () => {
  test('no stylesheet of the app selects it', () => {
    const found = stylesheetsIn(path.join(frontend, 'src')).filter((file) => BARE.test(readFileSync(file, 'utf8')));
    expect(found).toEqual([]);
    expect(readFileSync(path.join(frontend, 'src/_styles/tabler.scss'), 'utf8')).toContain(':where(fieldset)>legend+*');
  });

  test.each(['bootstrap.css', 'bootstrap.min.css'])("Bootstrap's %s is rewritten, and nothing else in it", (name) => {
    const source = readFileSync(path.join(frontend, 'node_modules/bootstrap/dist/css', name), 'utf8');
    const built = rewriteLegendSelector(source);
    expect(BARE.test(source)).toBe(true);
    expect(BARE.test(built)).toBe(false);
    expect(built.replace(':where(fieldset)>legend+*', '')).toBe(source.replace(/legend\s*\+\s*\*/, ''));
  });

  test('a selector list keeps its other selectors', () => {
    expect(rewriteLegendSelector('a,legend + * {clear:left}')).toBe('a,:where(fieldset)>legend+* {clear:left}');
    expect(rewriteLegendSelector('.x legend+*.y{}')).toBe('.x legend+*.y{}');
  });
});
