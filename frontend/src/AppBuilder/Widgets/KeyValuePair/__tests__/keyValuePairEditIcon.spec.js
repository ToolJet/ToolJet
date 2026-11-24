const fs = require('fs');
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

/**
 * The edit icon must stay inside the value cell however narrow it gets (label width 67%+), and long
 * single-line values must truncate with an ellipsis instead of pushing the icon out of view.
 */
describe('KeyValuePair edit icon stays visible', () => {
  const root = postcss.parse(
    sass.compileString(fs.readFileSync(path.resolve(__dirname, '../keyValuePair.scss'), 'utf8')).css
  );

  const declsFor = (selectorIncludes, prop) => {
    const values = [];
    root.walkRules((rule) => {
      if (!rule.selector.includes(selectorIncludes)) return;
      rule.walkDecls(prop, (decl) => values.push(decl.value.replace(' !important', '')));
    });
    return values;
  };

  it('pins the edit icon to the right edge of the value cell', () => {
    expect(declsFor('.kv-edit-icon', 'position')).toContain('absolute');
    expect(declsFor('.kv-edit-icon', 'right').length).toBeGreaterThan(0);
  });

  it('reserves room for the icon on editable cells', () => {
    expect(declsFor('.kv-editable', 'padding-right').length).toBeGreaterThan(0);
  });

  it('truncates overflowing string and number values with an ellipsis', () => {
    expect(declsFor('.kv-string', 'text-overflow')).toContain('ellipsis');
    expect(declsFor('.kv-number', 'text-overflow')).toContain('ellipsis');
  });

  it('gives side-aligned value cells the remaining row width so every row ends at the same edge', () => {
    expect(declsFor('.kv-row-side .key-value-render-value', 'flex')).toContain('1 1 0%');
  });
});
