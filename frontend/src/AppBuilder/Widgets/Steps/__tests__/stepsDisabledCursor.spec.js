const fs = require('fs');
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

describe('Steps disabled step cursor', () => {
  const root = postcss.parse(
    sass.compileString(fs.readFileSync(path.resolve(__dirname, '../../Steps.scss'), 'utf8')).css
  );

  const declsFor = (selector, prop) => {
    const values = [];
    root.walkRules((rule) => {
      if (!rule.selectors.includes(selector)) return;
      rule.walkDecls(prop, (decl) => values.push(decl.value));
    });
    return values;
  };

  // Break this catches: the global `.disabled { pointer-events: none }` rule also matches a disabled step, so the
  // pointer passes through it and the not-allowed cursor never shows.
  test('[Steps-STY-002] a disabled step takes the pointer so it shows the not-allowed cursor', () => {
    expect(declsFor('.steps-container .milestone.disabled', 'cursor')).toContain('not-allowed');
    expect(declsFor('.steps-container .milestone.disabled', 'pointer-events')).toContain('auto');
  });
});
