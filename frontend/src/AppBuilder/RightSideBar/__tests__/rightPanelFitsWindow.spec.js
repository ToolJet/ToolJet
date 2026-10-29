/**
 * @jest-environment node
 */
// The right panel starts below the 48px app header, so it must be 48px shorter than the window.
// At full window height its bottom edge, where query preview docks, fell below the screen.
const fs = require('fs');
const path = require('path');

const styles = fs.readFileSync(path.join(__dirname, '../rightSidebar.scss'), 'utf8');

test('sizes the right panel to the space below the app header', () => {
  expect(styles).toMatch(/\.editor \.right-panel-shell\.editor-sidebar\s*\{\s*height:\s*calc\(100vh - 48px\);/);
});
