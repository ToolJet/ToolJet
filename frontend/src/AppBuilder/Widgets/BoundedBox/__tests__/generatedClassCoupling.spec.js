/** @jest-environment node */
const fs = require('fs');
const path = require('path');

// BoundedBox renders react-image-annotation, the only styled-components consumer
// in the app. styled-components v3 derives BOTH halves of a class name
// (`sc-<componentId>` and the evaluated-CSS hash) from a bundle-wide creation
// counter, so every one of those names shifts when module evaluation order
// changes — a dependency bump, an import reshuffle, a new lazy chunk.
//
// The widget's styles and its DOM lookups had those names hardcoded. They drifted:
// theme.scss targeted `.sc-dxgOiQ.jcdOkx` while the container rendered as
// `sc-ckVGcZ cjwZLx`, so the whole `.bounded-box` block — including the
// `img { height: 100% }` that stopped the preset image from overflowing — went
// dead silently. `sc-dxgOiQ` had even been reassigned to a different component.
//
// Nothing about that failure is observable from unit tests of behaviour, and
// pixel layout belongs to Cypress (src/test/README.md). Asserting that the
// coupling does not exist is what actually locks the bug out.
const frontendRoot = path.resolve(__dirname, '../../../../..');
const widgetDir = path.resolve(__dirname, '..');
const themeScss = path.join(frontendRoot, 'src/_styles/theme.scss');

const read = (file) => fs.readFileSync(file, 'utf8');

// Pulls one top-level `selector { ... }` block out of a stylesheet by matching braces.
function extractBlock(css, selector) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return '';
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  return css.slice(start);
}

// styled-components names are mixed-case with no separator (jcdOkx, hIIYQM,
// gVmiLs). Every class this codebase authors is kebab-case or all-lowercase.
const looksGenerated = (className) => /[a-z]/.test(className) && /[A-Z]/.test(className) && !className.includes('-');

const widgetSources = fs
  .readdirSync(widgetDir)
  .filter((entry) => /\.jsx?$/.test(entry))
  .map((entry) => ({ name: entry, source: read(path.join(widgetDir, entry)) }));

describe('BoundedBox is not coupled to styled-components generated class names', () => {
  it('has widget sources to check', () => {
    expect(widgetSources.map(({ name }) => name)).toContain('BoundedBox.jsx');
  });

  it('does not look up DOM nodes by a generated class name', () => {
    const offenders = [];

    widgetSources.forEach(({ name, source }) => {
      // Capture the whole argument list: the real lookups are template literals
      // containing quotes (`[widgetid="${id}"] .jcdOkx`), so a quote-delimited
      // scan stops short and silently finds nothing.
      const calls = source.matchAll(/querySelector(?:All)?\(([^)]*)\)/g);
      for (const [, args] of calls) {
        for (const [, className] of args.matchAll(/\.([A-Za-z0-9_-]+)/g)) {
          if (looksGenerated(className)) offenders.push(`${name}: .${className}`);
        }
      }
    });

    expect(offenders).toEqual([]);
  });

  it('does not reference a styled-components componentId anywhere in the widget', () => {
    const offenders = widgetSources.filter(({ source }) => /\bsc-[A-Za-z]{4,}\b/.test(source)).map(({ name }) => name);

    expect(offenders).toEqual([]);
  });

  it('styles the widget with structural selectors, not generated ones', () => {
    const block = extractBlock(read(themeScss), '.bounded-box');
    expect(block).not.toBe('');

    // Comments are allowed to name the stale selectors — explaining why they
    // must not come back is the point of documenting this at all.
    const css = block.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

    const selectors = [...css.matchAll(/\.([A-Za-z0-9_-]+)/g)].map(([, className]) => className);
    const offenders = selectors.filter((className) => looksGenerated(className) || /^sc-/.test(className));

    expect([...new Set(offenders)]).toEqual([]);
  });
});
