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

// The width rule is !important, so it reads the dragged width from a variable the panel sets inline;
// a hard-coded width here would pin the panel at 496px whatever the drag does.
test('sizes the query panel from its dragged width variable', () => {
  expect(styles).toMatch(
    /\.right-panel-shell--query\s*\{[^}]*width:\s*var\(--query-right-panel-width,\s*min\(496px, calc\(100vw - 54px\)\)\)\s*!important;/
  );
});

// The left panel's popper wrapper is pinned at a low z-index (popover.scss) so the menus it opens stay
// above it; with a left panel open the right panel must sit below that, or a widened query panel
// covers the left panel.
test('stacks the right panel below an open left panel', () => {
  const popoverStyles = fs.readFileSync(path.join(__dirname, '../../../_styles/popover.scss'), 'utf8');
  const leftPanelZ = Number(
    popoverStyles.match(/:has\(\.PopoverContent\.drawer-height\)\s*\{[^}]*z-index:\s*(\d+)/)[1]
  );
  const belowLeft = styles.match(
    /\.editor \.right-panel-shell\.right-panel-shell--below-left-panel\s*\{[^}]*z-index:\s*(\d+)/
  );

  expect(belowLeft).not.toBeNull();
  expect(Number(belowLeft[1])).toBeLessThan(leftPanelZ);
});
