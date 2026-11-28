/**
 * @jest-environment node
 */
// QM-64: the query editor's dropdown options paint their hover, focus and selected states with
// translucent tokens (QE-51). Dark mode's select style gives every plain option a solid #2b3547, which
// is as light as the hover tint, so nothing looked highlighted. Plain options must be transparent (the
// menu shows through) and come before the state rules, so each tint is lighter than its neighbours.
const fs = require('fs');
const path = require('path');

const styles = fs.readFileSync(path.join(__dirname, '../../../_styles/queryManager.scss'), 'utf8');

test('plain options are transparent, so the hover and focus tints show in dark mode', () => {
  const plain = styles.search(
    /\[class\*='query-select-motion__option'\] \{\s*background:\s*transparent !important;\s*\}/
  );
  const states = styles.indexOf("[class*='query-select-motion__option--is-selected']");

  expect(plain).toBeGreaterThan(-1);
  expect(states).toBeGreaterThan(plain);
});
