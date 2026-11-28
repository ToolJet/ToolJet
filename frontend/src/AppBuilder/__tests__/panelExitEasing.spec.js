/**
 * @jest-environment node
 */
// Panels leave with an ease-in curve: they start slowly and speed up as they go. The enter curve
// (fast start) used on exit makes a closing panel all but vanish in its first few frames.
const fs = require('fs');
const path = require('path');
const { PANEL_MOTION } = require('../panelLayout');

const styles = (relativePath) => fs.readFileSync(path.join(__dirname, relativePath), 'utf8');

test.each([
  ['left', '../../_styles/left-sidebar.scss', 'app-builder-panel-exit'],
  ['right', '../RightSideBar/rightSidebar.scss', 'app-builder-right-panel-exit'],
])('closes the %s panel with the shared exit easing', (_side, file, keyframes) => {
  expect(styles(file)).toContain(`animation: ${keyframes} 180ms ${PANEL_MOTION.exitEasing} forwards;`);
});
