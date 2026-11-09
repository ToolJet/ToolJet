const fs = require('fs');
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

/**
 * [KeyValuePair-EDIT-013] The changeset (Save/Cancel) popover must stay visually on top of an
 * actively-edited field's content.
 *
 * Both share the single stacking context rooted at `.key-value-pair-container` (none of the
 * intermediate row/value wrappers set their own z-index), so whichever has the higher value wins
 * regardless of DOM order. `.long-text-input` previously carried a z-index of 99999 copied from
 * Table's expanding cell-editor overlay, which outranks the popover's 10 and let an editing field
 * (e.g. an HTML field with unbreakable long text) paint over the Save/Cancel buttons whenever the
 * row happened to sit where the popover floats.
 */
describe('KeyValuePair changeset popover stacking', () => {
  const findZIndex = (root, selectorIncludes) => {
    let found;
    root.walkRules((rule) => {
      if (!rule.selector.includes(selectorIncludes)) return;
      rule.walkDecls('z-index', (decl) => {
        found = Number(decl.value);
      });
    });
    return found;
  };

  it('[KeyValuePair-EDIT-013] keeps the changeset popover above an editing field', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../keyValuePair.scss'), 'utf8');
    const compiled = sass.compileString(source);
    const root = postcss.parse(compiled.css);

    const popoverZIndex = findZIndex(root, 'kv-changeset-popover');
    const editingFieldZIndex = findZIndex(root, 'long-text-input');

    expect(popoverZIndex).toBeDefined();
    expect(editingFieldZIndex).toBeDefined();
    expect(editingFieldZIndex).toBeLessThan(popoverZIndex);
  });
});
