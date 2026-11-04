/**
 * @jest-environment node
 */
/**
 * The filters panel is told apart by its shadow and the dimmed table behind it, not by an outline. The outline came
 * from stylesheet rules that reach every `.card` in the table (and a rule on `.table-filters` itself), which jsdom
 * cannot cascade, so the compiled stylesheet is read: no rule that applies to the panel may draw a border around it.
 */
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

const STYLESHEET = path.resolve(__dirname, '../../../../_styles/table-component.scss');

// the panel is `<div class="table-filters card ...">` inside `.jet-table.table-component`
const appliesToPanel = (selector) => {
  if (!selector.includes('.table-component')) return false;
  const last = selector.trim().split(/\s+/).pop();
  if (last.includes(':not(.table-filters)')) return false;
  return /(^|\.)(card|table-filters)(?![\w-])/.test(last);
};

const bordersOfPanel = () => {
  const { css } = sass.compile(STYLESHEET, { quietDeps: true, logger: sass.Logger.silent });
  const found = [];
  postcss.parse(css).walkRules((rule) => {
    if (!rule.selectors.some(appliesToPanel)) return;
    rule.walkDecls(/^border(-(top|right|bottom|left))?$/, (declaration) => {
      found.push(`${rule.selector} { ${declaration.prop}: ${declaration.value} }`);
    });
  });
  return found;
};

describe('Table-FILTERUI-068 the filters panel has no outline', () => {
  test('Table-FILTERUI-068 no stylesheet rule that applies to the panel draws a border around it', () => {
    // Break this catches: the grey outline round the panel coming back through a `.card` or `.table-filters` rule.
    const drawn = bordersOfPanel().filter((rule) => !/:\s*(0|none)(\s|!|\})/.test(rule.replace(/!important/, '')));

    expect(drawn).toEqual([]);
  });

  test('Table-FILTERUI-068 the rule that removes it wins over the generic card border', () => {
    // Break this catches: a "border: 0" that is there but loses to `.jet-table.table-component .card`.
    const rules = bordersOfPanel();

    expect(rules.some((rule) => /table-filters/.test(rule) && /:\s*0/.test(rule))).toBe(true);
  });
});
