/**
 * @jest-environment node
 */
// RP-11: with the query Preview open, the Settings tab must scroll from anywhere over its fields to reach
// Events → "New event handler". Every CodeMirror scroller sets overscroll-behavior: contain, so a wheel
// over a single-line field (Timeout, Disable query) stopped there and never scrolled the settings. In the
// query panel, single-line fields hand the wheel on; multi-line editors keep containing it.
const fs = require('fs');
const path = require('path');

const styles = fs.readFileSync(path.join(__dirname, '../../../_styles/queryManager.scss'), 'utf8');

test('single-line fields in the query panel let the wheel reach the settings scroller', () => {
  expect(styles).toMatch(
    /\.query-details--right \.single-line-codehinter-input \.cm-scroller \{\s*overscroll-behavior: auto !important;\s*\}/
  );
});
