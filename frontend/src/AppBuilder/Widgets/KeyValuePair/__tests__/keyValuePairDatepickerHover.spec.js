const fs = require('fs');
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

/**
 * [KeyValuePair-DATE-001] Hovering the selected day in a datepicker field's calendar must keep
 * the selected (brand) background.
 *
 * react-datepicker also gives the hovered day the `--keyboard-selected` class, so the selected day
 * under the mouse carries `--selected --keyboard-selected` and matches the `:hover` rule too. The
 * neutral-grey `!important` rules for those states out-ranked the selected day's brand background,
 * which turned the cell grey and hid its white number. The brand rule has to win that cascade.
 */
describe('KeyValuePair datepicker selected day hover', () => {
  const DAY_CLASSES = [
    'react-datepicker__day',
    'react-datepicker__day--selected',
    'react-datepicker__day--keyboard-selected',
  ];
  const ANCESTOR_CLASSES = ['tj-table-datepicker', 'tj-datepicker-widget'];

  // Specificity (ids, classes/attrs/pseudo-classes) of the simple selectors used in the stylesheet.
  const specificity = (selector) => (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!not)[\w-]+/g) || []).length;

  const matchesHoveredSelectedDay = (selector) => {
    const [dayToken, ...ancestors] = selector.trim().split(/\s+/).reverse();
    const classes = dayToken.match(/\.[\w-]+/g)?.map((c) => c.slice(1)) ?? [];
    return (
      classes.length > 0 &&
      classes.every((c) => DAY_CLASSES.includes(c)) &&
      ancestors.every((a) => ANCESTOR_CLASSES.includes(a.slice(1)))
    );
  };

  it('[KeyValuePair-DATE-001] brand background wins on a hovered selected day', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../Date/styles.scss'), 'utf8');
    const root = postcss.parse(sass.compileString(source).css);

    // The selected-day brand rule from the base datepicker stylesheet, for the cascade comparison.
    const base = fs.readFileSync(path.resolve(__dirname, '../../../../_styles/widgets/datepicker.scss'), 'utf8');
    const baseRoot = postcss.parse(sass.compileString(base).css);

    const candidates = [];
    let order = 0;
    [baseRoot, root].forEach((tree) =>
      tree.walkRules((rule) => {
        rule.selectors.filter(matchesHoveredSelectedDay).forEach((selector) => {
          rule.walkDecls('background-color', (decl) => {
            if (decl.important) {
              candidates.push({ value: decl.value, specificity: specificity(selector), order: order++ });
            }
          });
        });
      })
    );

    const winner = candidates.sort((a, b) => b.specificity - a.specificity || b.order - a.order)[0];
    expect(winner.value).toBe('var(--cc-primary-brand)');
  });
});
